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
  console.log('[oauth] status', response.status, 'body[0..500]=', bodyText.slice(0, 500));

  if (!response.ok) {
    throw new Error('Failed to obtain Salesforce access token');
  }

  const data = JSON.parse(bodyText);
  const token = data.access_token;
  const scope = data.scope || 'N/A';
  const issuedAt = data.issued_at || 'N/A';
  
  // Cache token for 90 minutes
  cachedToken = {
    token,
    expiresAt: Date.now() + (90 * 60 * 1000),
  };

  console.log('[oauth] Successfully obtained new Salesforce token; scope:', scope, 'issued_at:', issuedAt);
  return token;
}

async function initSession(accessToken: string) {
  const sessionKey = `lovable-session-${crypto.randomUUID()}`;
  
  const url = `${SF_CONFIG.API_HOST}/einstein/ai-agent/v1/agents/${SF_CONFIG.AGENT_ID}/sessions`;
  console.log('[session] POST', url);
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      externalSessionKey: sessionKey,
      instanceConfig: {
        endpoint: SF_CONFIG.DOMAIN
      },
      streamingCapabilities: {
        chunkTypes: ["Text"]
      },
      bypassUser: true
    }),
  });

  const bodyText = await response.text();
  console.log('[session] status', response.status, 'body[0..500]=', bodyText.slice(0, 500));

  if (!response.ok) {
    throw new Error('Failed to initialize Agentforce session');
  }

  const data = JSON.parse(bodyText);
  console.log('[session] keys', Object.keys(data));
  
  const sessionId = data.sessionId || data.id || data?.session?.id || data?.sessionKey;
  
  if (!sessionId) {
    console.error('[session] No sessionId found in response');
    throw new Error('No sessionId from Salesforce');
  }

  console.log('[session] Initialized session ID:', sessionId);
  return { sessionId };
}

async function streamMessage(accessToken: string, sessionId: string, text: string) {
  const url = `${SF_CONFIG.API_HOST}/einstein/ai-agent/v1/sessions/${sessionId}/messages/stream`;
  console.log('[stream] POST', url);
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream'
    },
    body: JSON.stringify({
      message: {
        sequenceId: 1,
        type: 'Text',
        text
      }
    })
  });

  console.log('[stream] status', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[stream] Failed:', errorText.slice(0, 500));
    throw new Error('Failed to send message to Agentforce');
  }

  if (!response.body) {
    throw new Error('No response body available');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  let chunkCount = 0;

  return new ReadableStream({
    async start(controller) {
      let buf = '';
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) {
            console.log('[stream] Complete');
            break;
          }
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split('\n');
          buf = lines.pop() || '';
          
          for (const line of lines) {
            const t = line.trim();
            if (!t || t.startsWith(':')) continue;
            if (!t.startsWith('data: ')) continue;
            
            const payload = t.slice(6);
            try {
              const parsed = JSON.parse(payload);
              const m = parsed.message;
              const content =
                (m && (m.message || m.text || m.delta || m.content)) ||
                parsed.content;
              
              if (typeof content === 'string' && content.length) {
                chunkCount++;
                if (chunkCount <= 10) {
                  console.log('[stream] Received chunk of length:', content.length);
                }
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
              }
            } catch {}
          }
        }
        controller.close();
      } catch (e) {
        console.error('[stream] Error:', e);
        controller.error(e);
      }
    }
  });
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
      try {
        const result = await initSession(accessToken);
        return ok(result);
      } catch (error) {
        return err(502, 'Failed to initialize session', error);
      }
    }

    // Handle message action
    if (action === 'message') {
      const { sessionId, message } = await req.json();
      
      if (!sessionId || !message) {
        return err(400, 'Missing sessionId or message');
      }

      console.log('[edge] Processing message request');
      
      try {
        const stream = await streamMessage(accessToken, sessionId, message);
        
        return new Response(stream, {
          headers: {
            ...CORS,
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
          }
        });
      } catch (error) {
        // Token expired - retry once
        if (error instanceof Error && error.message.includes('401')) {
          console.log('[edge] Token expired, refreshing and retrying');
          accessToken = await refreshAccessToken();
          const stream = await streamMessage(accessToken, sessionId, message);
          
          return new Response(stream, {
            headers: {
              ...CORS,
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              'Connection': 'keep-alive'
            }
          });
        }
        return err(502, 'Failed to process message', error);
      }
    }

    return err(400, 'Invalid action');

  } catch (error) {
    return err(500, 'Internal server error', error);
  }
});
