# Primacy Web Agent — Handover Documentation

**A comprehensive guide to the Agentforce-powered web chat implementation**

---

## ⚠️ DISCLAIMER & LEGAL TERMS

### GOVERNING AGREEMENT

**These materials are governed under the existing Master Service Agreement (MSA) between Primacy, Digital United, and Salesforce.** All terms and conditions of that agreement apply to the use of these materials.

---

### CREATIVE REFERENCE ONLY

> **IMPORTANT**: This repository and all associated materials are provided **solely as creative reference and inspiration**. This is **NOT**:
> - Official Salesforce guidance or documentation
> - A production-ready implementation
> - A recommendation for how to implement Agentforce
> - A supported Salesforce product or solution

---

### RECOMMENDATION TO REBUILD

**Salesforce strongly recommends that you rebuild this solution using your own:**
- System architecture and design patterns
- Security frameworks and authentication mechanisms
- Error handling and logging strategies
- Deployment and infrastructure configurations
- Code organization and development practices

This reference implementation reflects decisions made for a specific demonstration context. Your production requirements will differ significantly.

---

### COMPLETE DISCLAIMER OF LIABILITY

**BY USING THESE MATERIALS, YOU ACKNOWLEDGE AND AGREE THAT:**

1. **NO WARRANTY**: These materials are provided **"AS IS"** without warranty of any kind, express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, and non-infringement.

2. **NO LIABILITY**: Salesforce, its employees, contractors, and affiliates shall have **ABSOLUTELY NO LIABILITY** for any:
   - Direct, indirect, incidental, special, consequential, or punitive damages
   - Data loss, corruption, or unauthorized access
   - Security breaches, vulnerabilities, or exploits
   - Business interruption or financial losses
   - System failures or performance issues
   - Any other damages arising from the use or inability to use these materials

3. **SECURITY RESPONSIBILITY**: You are **solely responsible** for:
   - Conducting thorough security reviews and penetration testing
   - Implementing appropriate authentication and authorization
   - Protecting sensitive data and API credentials
   - Compliance with all applicable regulations (GDPR, CCPA, HIPAA, etc.)
   - Monitoring and incident response

4. **NO SUPPORT**: Salesforce provides **no support, maintenance, or updates** for these materials. You assume full responsibility for any modifications, bug fixes, or enhancements.

---

### NO LICENSING INCLUDED

**This repository does NOT include licensing for:**
- Salesforce Platform or any Salesforce products
- Agentforce or Einstein AI services
- Salesforce APIs (REST, Streaming, etc.)
- Any third-party services, libraries, or components

**You must obtain appropriate licensing separately** through your Salesforce account team before using Agentforce or any Salesforce APIs in production.

---

### DEMONSTRATION PURPOSES ONLY

These materials represent the **personal work of an individual Salesforce employee**, created for demonstration purposes at a specific event. They do not represent official Salesforce engineering practices, security standards, or recommended implementations.

---

### ACKNOWLEDGMENT

By using, copying, modifying, or distributing these materials, you acknowledge that you have read, understood, and agreed to all terms in this disclaimer.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Authentication Flow](#authentication-flow)
3. [Agentforce API Integration](#agentforce-api-integration)
4. [Frontend Implementation](#frontend-implementation)
5. [Backend Proxy (Deno)](#backend-proxy-deno)
6. [Node.js/Express Alternative](#nodejs-express-alternative)
7. [Configuration Reference](#configuration-reference)
8. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                             │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    React Frontend                            │ │
│  │  ┌──────────────┐  ┌───────────────┐  ┌──────────────────┐  │ │
│  │  │ PreEngagement│  │AgentforceChat │  │   ChatMessage    │  │ │
│  │  │    Form      │──▶│   Component   │──▶│    Renderer     │  │ │
│  │  └──────────────┘  └───────────────┘  └──────────────────┘  │ │
│  │                           │                                   │ │
│  │                    useAgentforce()                            │ │
│  │                      Custom Hook                              │ │
│  └───────────────────────────┼───────────────────────────────────┘ │
└──────────────────────────────┼──────────────────────────────────────┘
                               │ HTTPS
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND PROXY                               │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              Edge Function (Deno/Node.js)                    │ │
│  │  • OAuth 2.0 Client Credentials Flow                        │ │
│  │  • Token Caching (90 minutes)                               │ │
│  │  • Session Management                                        │ │
│  │  • SSE Stream Processing                                     │ │
│  └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────────┼──────────────────────────────────────┘
                               │ HTTPS
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SALESFORCE PLATFORM                           │
│  ┌───────────────────┐  ┌──────────────────────────────────────┐ │
│  │  OAuth 2.0        │  │         Agentforce API               │ │
│  │  Token Endpoint   │  │  • POST /sessions (init)             │ │
│  │                   │  │  • POST /sessions/{id}/messages/stream│ │
│  │                   │  │  • POST /sessions/{id}/end           │ │
│  └───────────────────┘  └──────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

1. **Backend Proxy Required**: The Salesforce OAuth credentials must never be exposed to the browser. All Agentforce API calls are proxied through a backend service.

2. **Streaming Responses**: Agentforce returns responses via Server-Sent Events (SSE). The proxy forwards these events to the frontend for real-time display.

3. **Session-Based Conversations**: Each conversation requires an Agentforce session. Sessions are initialized once and reused for the conversation duration.

4. **Token Caching**: OAuth tokens are cached for 90 minutes to minimize authentication overhead.

---

## Authentication Flow

### OAuth 2.0 Client Credentials

This implementation uses the OAuth 2.0 **Client Credentials** flow, which is appropriate for server-to-server communication where no user context is required.

```
┌──────────┐                              ┌─────────────────┐
│  Proxy   │                              │   Salesforce    │
│  Server  │                              │  OAuth Endpoint │
└────┬─────┘                              └────────┬────────┘
     │                                             │
     │  POST /services/oauth2/token                │
     │  Content-Type: application/x-www-form-urlencoded
     │  Body: grant_type=client_credentials        │
     │        &client_id=<CLIENT_ID>               │
     │        &client_secret=<CLIENT_SECRET>       │
     │─────────────────────────────────────────────▶
     │                                             │
     │  200 OK                                     │
     │  { "access_token": "...", "token_type": "Bearer" }
     │◀─────────────────────────────────────────────
     │                                             │
```

### Token Caching Strategy

```javascript
// Cache structure
let cachedToken = {
  token: string,      // The access token
  expiresAt: number   // Timestamp when token expires
};

// Cache duration: 90 minutes (conservative; Salesforce tokens typically last 2 hours)
const CACHE_DURATION_MS = 90 * 60 * 1000;

// Token retrieval logic
async function getAccessToken() {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token; // Use cached token
  }
  return await refreshAccessToken(); // Fetch new token
}
```

### Connected App Requirements

To use this integration, you need a Salesforce Connected App with:

1. **OAuth Settings Enabled**
2. **Client Credentials Flow Enabled**
3. **Appropriate Scopes** (consult Agentforce documentation)
4. **Run As User** configured (for client credentials flow)

---

## Agentforce API Integration

### API Endpoints

| Action | Method | Endpoint |
|--------|--------|----------|
| Initialize Session | POST | `https://api.salesforce.com/einstein/ai-agent/v1/agents/{AGENT_ID}/sessions` |
| Send Message (Stream) | POST | `https://api.salesforce.com/einstein/ai-agent/v1/sessions/{SESSION_ID}/messages/stream` |
| End Session | POST | `https://api.salesforce.com/einstein/ai-agent/v1/sessions/{SESSION_ID}/end` |

### Session Initialization

```javascript
const response = await fetch(
  `https://api.salesforce.com/einstein/ai-agent/v1/agents/${AGENT_ID}/sessions`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      externalSessionKey: `unique-session-${crypto.randomUUID()}`,
      instanceConfig: {
        endpoint: 'https://your-org.my.salesforce.com'
      },
      streamingCapabilities: {
        chunkTypes: ['Text']
      },
      bypassUser: true
    }),
  }
);

const { sessionId } = await response.json();
```

### Sending Messages (Streaming)

```javascript
const response = await fetch(
  `https://api.salesforce.com/einstein/ai-agent/v1/sessions/${sessionId}/messages/stream`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream'
    },
    body: JSON.stringify({
      message: {
        sequenceId: nextSequenceNumber,
        type: 'Text',
        text: userMessage
      }
    })
  }
);

// Response is a Server-Sent Events stream
```

### SSE Response Format

Agentforce returns responses as Server-Sent Events:

```
data: {\"message\":{\"type\":\"TextChunk\",\"message\":\"Hello\"}}

data: {\"message\":{\"type\":\"TextChunk\",\"message\":\", how\"}}

data: {\"message\":{\"type\":\"TextChunk\",\"message\":\" can I help?\"}}

data: {\"message\":{\"type\":\"EndOfTurn\"}}
```

### Processing SSE in the Proxy

The proxy transforms Salesforce's SSE format into a simplified format for the frontend:

```javascript
// Salesforce sends:
// data: {\"message\":{\"type\":\"TextChunk\",\"message\":\"Hello\"}}

// Proxy transforms to:
// data: {\"content\":\"Hello\"}

// On stream completion, proxy sends:
// data: [DONE]
```

---

## Frontend Implementation

### useAgentforce Hook

The custom React hook manages:
- Session initialization
- Message sending/receiving
- Streaming state
- Error handling

```typescript
interface UseAgentforceReturn {
  messages: Message[];           // Conversation history
  sendMessage: (text: string) => Promise<void>;
  sessionId: string | null;      // Current session ID
  isInitializing: boolean;       // True during session init
  isStreaming: boolean;          // True while receiving response
  isChunking: boolean;           // True during chunk animation
  error: string | null;          // Error message if any
}

// Usage
const { 
  messages, 
  sendMessage, 
  isStreaming, 
  error 
} = useAgentforce();
```

### Message Flow

1. **User sends message** → Added to UI immediately (optimistic)
2. **Request sent to proxy** → Proxy forwards to Agentforce
3. **SSE stream received** → Chunks accumulated in memory
4. **Stream completes** → Full message rendered to UI
5. **Typing indicator** → Shown while streaming

### Chunk Animation (Optional Feature)

Messages containing `[[BREAK]]` delimiters are split and rendered sequentially with animation delays:

```javascript
// Agent response: \"Hello![[BREAK]]How can I help?[[BREAK]]Let me know!\"
// Renders as 3 separate messages with delays between each
```

---

## Backend Proxy (Deno)

The reference implementation uses a Deno Edge Function. Here's the complete structure:

### Actions

| Action | Description | Request Body |
|--------|-------------|--------------|
| `?action=init` | Initialize new session | None |
| `?action=message` | Send message | `{ sessionId, message }` |
| `?action=end` | End session | `{ sessionId }` |

### Environment Variables

```
SALESFORCE_CLIENT_ID=your_connected_app_client_id
SALESFORCE_CLIENT_SECRET=your_connected_app_client_secret
```

### Key Implementation Details

```typescript
// Token caching
let cachedToken: { token: string; expiresAt: number } | null = null;

// Per-session sequence tracking
const sequenceBySession = new Map<string, number>();

// CORS headers for browser access
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
};
```

---

## Node.js/Express Alternative

If you prefer Node.js over Deno, here's a complete Express implementation:

### Installation

```bash
npm install express cors node-fetch
```

### Complete Implementation

```javascript
// agentforce-proxy.js
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.json());

// Configuration
const SF_CONFIG = {
  DOMAIN: 'https://your-org.my.salesforce.com',
  API_HOST: 'https://api.salesforce.com',
  AGENT_ID: 'your_agent_id',
  get TOKEN_ENDPOINT() {
    return `${this.DOMAIN}/services/oauth2/token`;
  }
};

// Token cache
let cachedToken = null;

// Session sequence tracking
const sequenceBySession = new Map();

// Get or refresh access token
async function getAccessToken() {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    console.log('[oauth] Using cached token');
    return cachedToken.token;
  }

  console.log('[oauth] Fetching new token');
  
  const params = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: process.env.SALESFORCE_CLIENT_ID,
    client_secret: process.env.SALESFORCE_CLIENT_SECRET,
  });

  const response = await fetch(SF_CONFIG.TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!response.ok) {
    throw new Error('Failed to obtain access token');
  }

  const data = await response.json();
  
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (90 * 60 * 1000), // 90 minutes
  };

  return cachedToken.token;
}

// Initialize Agentforce session
async function initSession(accessToken) {
  const externalSessionKey = `session-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  
  const response = await fetch(
    `${SF_CONFIG.API_HOST}/einstein/ai-agent/v1/agents/${SF_CONFIG.AGENT_ID}/sessions`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        externalSessionKey,
        instanceConfig: { endpoint: SF_CONFIG.DOMAIN },
        streamingCapabilities: { chunkTypes: ['Text'] },
        bypassUser: true
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Session init failed: ${error}`);
  }

  const data = await response.json();
  const sessionId = data.sessionId || data.id;
  
  if (!sessionId) {
    throw new Error('No session ID received');
  }

  sequenceBySession.set(sessionId, 1);
  return { sessionId };
}

// Stream message to Agentforce
async function streamMessage(accessToken, sessionId, text, res) {
  const nextSeq = (sequenceBySession.get(sessionId) || 0) + 1;
  sequenceBySession.set(sessionId, nextSeq);

  const response = await fetch(
    `${SF_CONFIG.API_HOST}/einstein/ai-agent/v1/sessions/${sessionId}/messages/stream`,
    {
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
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Stream failed: ${error}`);
  }

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Process and forward stream
  let accumulated = '';
  
  response.body.on('data', (chunk) => {
    const text = chunk.toString();
    const lines = text.split('\\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data: ')) continue;
      
      const payload = trimmed.slice(6);
      try {
        const evt = JSON.parse(payload);
        const m = evt.message;
        const type = m?.type;
        const content = m?.message ?? m?.delta ?? m?.text ?? '';
        
        if (!content) continue;
        
        if (type === 'TextChunk' || type === 'TextDelta') {
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        } else if (content.startsWith(accumulated)) {
          const delta = content.slice(accumulated.length);
          if (delta) {
            res.write(`data: ${JSON.stringify({ content: delta })}\n\n`);
          }
          accumulated = content;
        } else {
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
          accumulated += content;
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
  });

  response.body.on('end', () => {
    res.write('data: [DONE]\n\n');
    res.end();
  });

  response.body.on('error', (err) => {
    console.error('Stream error:', err);
    res.end();
  });
}

// Routes
app.post('/api/agentforce', async (req, res) => {
  try {
    const action = req.query.action;
    const accessToken = await getAccessToken();

    if (action === 'init') {
      const result = await initSession(accessToken);
      return res.json(result);
    }

    if (action === 'message') {
      const { sessionId, message } = req.body;
      if (!sessionId || !message) {
        return res.status(400).json({ error: 'Missing sessionId or message' });
      }
      return await streamMessage(accessToken, sessionId, message, res);
    }

    if (action === 'end') {
      const { sessionId } = req.body;
      // Implement session end logic
      sequenceBySession.delete(sessionId);
      return res.json({ ended: true });
    }

    res.status(400).json({ error: 'Invalid action' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Agentforce proxy running on port ${PORT}`);
});
```

### Running the Node.js Proxy

```bash
# Set environment variables
export SALESFORCE_CLIENT_ID=your_client_id
export SALESFORCE_CLIENT_SECRET=your_client_secret

# Run the server
node agentforce-proxy.js
```

### Frontend Configuration for Node.js

Update your frontend to point to the Node.js server:

```typescript
// Instead of edge function URL
const proxyUrl = 'http://localhost:3001/api/agentforce';

// Usage remains the same
const response = await fetch(`${proxyUrl}?action=init`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
});
```

---

## Configuration Reference

### Salesforce Configuration Values

```typescript
// src/lib/salesforce-config.ts (reference only)
export const SALESFORCE_CONFIG = {
  // Your Salesforce org domain
  SF_DOMAIN: 'https://your-org.my.salesforce.com',
  
  // Salesforce API host (usually constant)
  SF_API_HOST: 'https://api.salesforce.com',
  
  // Your Agentforce Agent ID (from Setup > Agents)
  AGENT_ID: '0XxXXXXXXXXXXXXXXX',
  
  // OAuth token endpoint (derived from SF_DOMAIN)
  TOKEN_ENDPOINT: 'https://your-org.my.salesforce.com/services/oauth2/token'
};
```

### Environment Variables

| Variable | Description | Where Used |
|----------|-------------|------------|
| `SALESFORCE_CLIENT_ID` | Connected App Client ID | Backend proxy |
| `SALESFORCE_CLIENT_SECRET` | Connected App Client Secret | Backend proxy |
| `VITE_SUPABASE_URL` | Backend URL (if using Supabase) | Frontend |

### Finding Your Agent ID

1. Go to **Setup** in Salesforce
2. Search for **"Agents"** or navigate to **Einstein > Agents**
3. Select your agent
4. The Agent ID is in the URL or shown in the agent details

---

## Troubleshooting

### Common Issues

#### "Failed to initialize session"

**Possible causes:**
- Invalid or expired OAuth credentials
- Agent ID incorrect or agent not published
- Connected App not properly configured
- Network/firewall blocking Salesforce API

**Debug steps:**
1. Check proxy logs for OAuth errors
2. Verify Connected App settings in Salesforce Setup
3. Confirm agent is published and active
4. Test OAuth flow independently

#### "No response from agent"

**Possible causes:**
- Agent topics not matching user input
- Agent instructions too restrictive
- Salesforce timeout

**Debug steps:**
1. Test agent in Salesforce Agent Builder
2. Check agent topics and instructions
3. Review proxy logs for SSE content

#### CORS Errors

**Possible causes:**
- Proxy not setting CORS headers
- Browser blocking cross-origin requests

**Solution:**
Ensure proxy returns appropriate CORS headers:
```javascript
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
};
```

#### Duplicate/Repeated Text in Responses

**Possible causes:**
- SSE deduplication not working properly
- Aggregate messages being forwarded as chunks

**Solution:**
The proxy implements deduplication logic for aggregate vs. incremental messages. Ensure this logic is preserved if modifying the proxy.

---

## Security Considerations

> ⚠️ **IMPORTANT**: The following are observations, not recommendations. Conduct your own security review.

1. **Never expose OAuth credentials** to the browser
2. **Implement rate limiting** on your proxy
3. **Add authentication** to your proxy endpoints
4. **Log and monitor** all API calls
5. **Rotate credentials** regularly
6. **Use HTTPS** for all communications
7. **Validate all inputs** before forwarding to Agentforce

---

## Support & Resources

- **Salesforce Agentforce Documentation**: Consult official Salesforce documentation
- **Salesforce Developer Forums**: Community support for API questions
- **Your Salesforce Account Team**: For licensing and enterprise support

---

## Final Notes

This handover documentation is intended to help you understand the implementation patterns used in this demonstration. **Remember:**

1. This is **reference material only**
2. **Rebuild for your own requirements**
3. **Conduct thorough security reviews**
4. **Obtain appropriate Salesforce licensing**
5. **Test extensively** before production deployment

For questions about the code in this repository, please refer to the inline comments and structure. For questions about Agentforce APIs, consult official Salesforce documentation.

---

*Document Version: 1.0*  
*Last Updated: January 2025*  
*Status: Reference Only — Not for Production Use*
