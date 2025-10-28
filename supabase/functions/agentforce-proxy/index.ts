import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    console.log('Using cached Salesforce token');
    return cachedToken.token;
  }

  console.log('Fetching new Salesforce token');
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

  console.log('Requesting token from:', SF_CONFIG.TOKEN_ENDPOINT);
  const response = await fetch(SF_CONFIG.TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Token refresh failed:', response.status, errorText);
    throw new Error('Failed to obtain Salesforce access token');
  }

  const data = await response.json();
  const token = data.access_token;
  
  // Cache token for 1.5 hours (Salesforce tokens typically last 2 hours)
  cachedToken = {
    token,
    expiresAt: Date.now() + (90 * 60 * 1000), // 90 minutes
  };

  console.log('Successfully obtained new Salesforce token');
  return token;
}

async function initializeSession(accessToken: string): Promise<{ sessionId: string; streamUrl: string }> {
  const sessionKey = `lovable-session-${crypto.randomUUID()}`;
  
  const response = await fetch(
    `${SF_CONFIG.API_HOST}/einstein/ai-agent/v1/agents/${SF_CONFIG.AGENT_ID}/sessions`,
    {
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
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Session initialization failed:', response.status, errorText);
    throw new Error('Failed to initialize Agentforce session');
  }

  const data = await response.json();

  // Log full response to debug (redact sensitive fields)
  console.log('[session] Full Salesforce response keys:', Object.keys(data));

  // Try multiple possible sessionId locations
  const sessionId = data.sessionId || data.id || data?.session?.id || data?.sessionKey;

  if (!sessionId) {
    console.error('[session] ERROR: No session ID found in response:', JSON.stringify(data, null, 2));
    throw new Error('Salesforce did not return a valid session ID');
  }

  console.log('[session] Initialized session ID:', sessionId);

  return {
    sessionId,
    streamUrl: data.links?.messagesStream || data.streamUrl || ''
  };
}

async function sendMessageAndStream(
  accessToken: string,
  sessionId: string,
  message: string
): Promise<ReadableStream> {
  console.log('Sending message and streaming response:', message);
  
  // Use Salesforce's proper message format
  const salesforceMessage = {
    message: {
      sequenceId: 1,
      type: "Text",
      text: message
    }
  };

  const response = await fetch(
    `${SF_CONFIG.API_HOST}/einstein/ai-agent/v1/sessions/${sessionId}/messages/stream`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify(salesforceMessage),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Send message and stream failed:', response.status, errorText);
    
    if (response.status === 401) {
      throw new Error('TOKEN_EXPIRED');
    }
    
    throw new Error('Failed to send message to Agentforce');
  }

  if (!response.body) {
    throw new Error('No response body available');
  }

  // Transform Salesforce's SSE format to simpler format
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  
  return new ReadableStream({
    async start(controller) {
      let buffer = '';
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            console.log('Salesforce stream complete');
            controller.close();
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          
          // Process complete lines
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmedLine = line.trim();
            
            if (!trimmedLine || trimmedLine.startsWith(':')) continue;
            
            if (trimmedLine.startsWith('data: ')) {
              const data = trimmedLine.slice(6);
              
              try {
                const parsed = JSON.parse(data);
                
                // Extract text from various Salesforce event types
                const message = parsed.message;
                const content = 
                  message?.message ||      // TextChunk
                  message?.text ||         // TextResponseChunk
                  message?.delta ||        // TextDelta
                  message?.content ||      // Generic content
                  parsed.content;          // Direct content

                if (content && typeof content === 'string') {
                  console.log('[stream] Received chunk length:', content.length);
                  
                  // Send transformed event to frontend
                  const transformedEvent = `data: ${JSON.stringify({ content })}\n\n`;
                  controller.enqueue(new TextEncoder().encode(transformedEvent));
                } else if (message?.type) {
                  console.log('[stream] Non-text chunk type:', message.type);
                }
              } catch (e) {
                console.warn('Failed to parse Salesforce SSE data:', data);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error in stream transformation:', error);
        controller.error(error);
      }
    }
  });
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    // Get access token
    let accessToken: string;
    try {
      accessToken = await getAccessToken();
    } catch (error) {
      console.error('Failed to get access token:', error);
      return new Response(
        JSON.stringify({ error: 'Sorry, the agent is unavailable right now. Please try again shortly.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle different actions
    if (action === 'init') {
      console.log('Initializing new Agentforce session');
      const { sessionId, streamUrl } = await initializeSession(accessToken);
      
      return new Response(
        JSON.stringify({ sessionId, streamUrl }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'message') {
      const { sessionId, message } = await req.json();
      
      if (!sessionId || !message) {
        return new Response(
          JSON.stringify({ error: 'Missing sessionId or message' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Processing message request:', message);
      
      try {
        const transformedStream = await sendMessageAndStream(accessToken, sessionId, message);
        
        return new Response(transformedStream, {
          headers: {
            ...corsHeaders,
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        });
      } catch (error) {
        // If token expired, refresh and retry once
        if (error instanceof Error && error.message === 'TOKEN_EXPIRED') {
          console.log('Token expired, refreshing and retrying');
          accessToken = await refreshAccessToken();
          
          const transformedStream = await sendMessageAndStream(accessToken, sessionId, message);
          
          return new Response(transformedStream, {
            headers: {
              ...corsHeaders,
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              'Connection': 'keep-alive',
            },
          });
        }
        throw error;
      }
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in agentforce-proxy:', error);
    return new Response(
      JSON.stringify({ error: 'Sorry, the agent is unavailable right now. Please try again shortly.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
