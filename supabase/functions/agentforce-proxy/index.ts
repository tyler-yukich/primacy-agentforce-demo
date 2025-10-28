import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// CORS headers for all responses
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
};

// Helper functions for consistent responses
function ok(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { 
    status, 
    headers: { ...CORS, 'Content-Type': 'application/json' } 
  });
}

function err(status: number, msg: string, detail?: unknown) {
  console.error('[edge error]', status, msg, detail ?? '');
  return new Response(JSON.stringify({ error: msg }), { 
    status, 
    headers: { ...CORS, 'Content-Type': 'application/json' } 
  });
}

// Token cache
let cachedToken: { token: string; expiresAt: number } | null = null;

const SF_CONFIG = {
  DOMAIN: 'https://storm-f6d3229baed283.my.salesforce.com',
  API_HOST: 'https://api.salesforce.com',
  AGENT_ID: '0XxKY000000Mjwj0AC',
  get TOKEN_ENDPOINT() {
    return `${this.DOMAIN}/services/oauth2/token`;
  }
};

// Per-session sequence counter (best-effort in-memory)
const sequenceBySession = new Map<string, number>();

// Metrics counters (per-instance; Deno edge can scale out)
const metrics = {
  init_success: 0,
  stream_error: 0,
  no_session_id: 0
};

async function getAccessToken(): Promise<string> {
  // Check if we have a valid cached token
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    console.log('[oauth] Using cached Salesforce token');
    return cachedToken.token;
  }

  console.log('[oauth] Fetching new Salesforce token');
  return await refreshAccessToken();
}

async function refreshAccessToken(): Promise<string> {
  const clientId = Deno.env.get('SALESFORCE_CLIENT_ID');
  const clientSecret = Deno.env.get('SALESFORCE_CLIENT_SECRET');

  if (!clientId || !clientSecret) {
    throw new Error('Salesforce credentials not configured');
  }

  const params = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
  });

  console.log('[oauth] POST', SF_CONFIG.TOKEN_ENDPOINT);
  const response = await fetch(SF_CONFIG.TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  const bodyText = await response.text();
  console.log('[oauth] status', response.status);

  if (!response.ok) {
    throw new Error('Failed to obtain Salesforce access token');
  }

  const data = JSON.parse(bodyText);
  const token = data.access_token;
  
  // Cache token for 90 minutes
  cachedToken = {
    token,
    expiresAt: Date.now() + (90 * 60 * 1000),
  };

  metrics.init_success++;
  console.log('[oauth] Token obtained');
  console.log('[metrics]', JSON.stringify(metrics));
  return token;
}

async function initSession(accessToken: string) {
  const externalSessionKey = `lovable-session-${crypto.randomUUID()}`;
  
  const url = `${SF_CONFIG.API_HOST}/einstein/ai-agent/v1/agents/${SF_CONFIG.AGENT_ID}/sessions`;
  console.log('[session] POST', url);
  
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      externalSessionKey,
      instanceConfig: {
        endpoint: SF_CONFIG.DOMAIN
      },
      streamingCapabilities: {
        chunkTypes: ['Text']
      },
      bypassUser: true
    }),
  });

  const raw = await resp.text();
  console.log('[session] status', resp.status, 'body[0..500]=', raw.slice(0, 500));

  if (!resp.ok) {
    return err(resp.status, 'Failed to initialize Agentforce session', raw.slice(0, 500));
  }

  let data: any = {};
  try {
    data = JSON.parse(raw);
  } catch (e) {
    return err(502, 'Failed to parse session response', raw.slice(0, 500));
  }

  const sessionId = data.sessionId || data.id || data?.session?.id || data?.sessionKey;
  const endUrl = data?._links?.end?.href || data?.links?.end?.href || null;
  
  console.log('[session] sessionId:', sessionId);
  
  if (!sessionId) {
    metrics.no_session_id++;
    console.log('[metrics]', JSON.stringify(metrics));
    return err(502, 'No sessionId from Salesforce', data);
  }

  sequenceBySession.set(sessionId, 1);
  console.log('[metrics]', JSON.stringify(metrics));
  return ok({ sessionId, endUrl });
}

async function streamMessage(accessToken: string, sessionId: string, text: string) {
  const nextSeq = (sequenceBySession.get(sessionId) ?? 0) + 1;
  sequenceBySession.set(sessionId, nextSeq);

  const url = `${SF_CONFIG.API_HOST}/einstein/ai-agent/v1/sessions/${sessionId}/messages/stream`;
  console.log('[stream] POST', url, 'sequenceId:', nextSeq);
  
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream'
    },
    body: JSON.stringify({
      message: {
        sequenceId: nextSeq,
        type: 'Text',
        text
      }
    })
  });

  console.log('[stream] status', resp.status);

  if (!resp.ok) {
    metrics.stream_error++;
    console.log('[metrics]', JSON.stringify(metrics));
    const upstream = await resp.text();
    return err(resp.status, 'Failed to send message to Agentforce', upstream.slice(0, 500));
  }

  if (!resp.body) {
    return err(502, 'No response body available');
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  console.log('[stream] start seq=', nextSeq);

  return new Response(new ReadableStream({
    async start(controller) {
      let accumulated = ''; // Track aggregated content for fallback deduplication
      try {
        let buf = '';
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split('\n');
          buf = lines.pop() || '';
          
          for (const line of lines) {
            const t = line.trim();
            if (!t || t.startsWith(':') || !t.startsWith('data: ')) continue;
            
            const payload = t.slice(6);
            try {
              const evt = JSON.parse(payload);
              const m = evt.message;
              const type = m?.type;  // Nested under message, not at root
              
              let content = 
                m?.message ??    // TextChunk field
                m?.delta   ??    // TextDelta field
                m?.text    ??    // fallback
                evt.content ?? '';
              
              if (typeof content !== 'string' || !content) continue;
              
              // Strategy 1: Use explicit type when present
              if (type) {
                // Only forward incremental chunk types
                if (type === 'TextChunk' || type === 'TextDelta') {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
                }
              } else {
                // Strategy 2: Fallback when type is undefined
                // Use accumulator to detect aggregates
                if (content.startsWith(accumulated)) {
                  // This looks like an aggregate containing what we've already sent
                  const delta = content.slice(accumulated.length);
                  
                  if (delta) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: delta })}\n\n`));
                  }
                  accumulated = content;
                } else {
                  // Fresh content, forward as-is
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
                  accumulated += content;
                }
              }
            } catch {}
          }
        }
        // Emit DONE sentinel for client finalization
        console.log('[stream] done');
        controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
        controller.close();
      } catch (e) {
        console.error('[stream] Error:', e);
        controller.error(e);
      }
    }
  }), {
    headers: {
      ...CORS,
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
}

async function endSession(accessToken: string, sessionId: string, endUrl?: string) {
  const url = endUrl || `${SF_CONFIG.API_HOST}/einstein/ai-agent/v1/sessions/${sessionId}/end`;
  console.log('[end] POST', url);
  
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({})
  });

  const body = await resp.text();
  console.log('[end] status', resp.status, 'body[0..500]=', body.slice(0, 500));

  if (!resp.ok) {
    return err(resp.status, 'Failed to end session', body.slice(0, 500));
  }

  sequenceBySession.delete(sessionId);
  return ok({ ended: true });
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    // Get access token
    let accessToken: string;
    try {
      accessToken = await getAccessToken();
    } catch (error) {
      return err(500, 'Agent unavailable - authentication failed', error);
    }

    // Handle init action
    if (action === 'init') {
      console.log('[edge] Initializing new Agentforce session');
      return await initSession(accessToken);
    }

    // Handle message action
    if (action === 'message') {
      const { sessionId, message } = await req.json().catch(() => ({}));
      
      if (!sessionId || !message) {
        return err(400, 'Missing sessionId or message');
      }

      console.log('[edge] Processing message request');
      return await streamMessage(accessToken, sessionId, message);
    }

    // Handle end action
    if (action === 'end') {
      const { sessionId, endUrl } = await req.json().catch(() => ({}));
      
      if (!sessionId) {
        return err(400, 'Missing sessionId');
      }

      console.log('[edge] Ending session');
      return await endSession(accessToken, sessionId, endUrl);
    }

    return err(400, 'Invalid action');

  } catch (error) {
    return err(500, 'Internal server error', error);
  }
});
