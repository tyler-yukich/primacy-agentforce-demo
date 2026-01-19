# Primacy Web Agent

**An Agentforce-powered conversational chat interface for web applications.**

---

## ⚠️ IMPORTANT DISCLAIMER

> **GOVERNING AGREEMENT**: These materials are governed under the existing Master Service Agreement (MSA) between Primacy, Digital United, and Salesforce.
>
> **CREATIVE REFERENCE ONLY**: This repository is provided as **inspiration and educational reference only**. It is **not** official Salesforce guidance, a production-ready solution, or a recommendation for implementing Agentforce.
>
> Salesforce recommends that you rebuild this solution using your own logic, systems, and architecture appropriate for your specific use case.
>
> **See [HANDOVER.md](./HANDOVER.md) for complete terms, disclaimers, and integration guidance.**

---

## Overview

This project demonstrates a custom web-based chat interface that connects to Salesforce Agentforce. It was built by an individual Salesforce employee for **demonstration purposes only**.

### Key Features

- Real-time streaming responses from Agentforce
- Session management and conversation persistence
- Markdown rendering with syntax highlighting
- Pre-engagement form for user context collection
- Responsive design optimized for various screen sizes

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS |
| **UI Components** | shadcn/ui, Radix UI, Lucide Icons |
| **Backend Proxy** | Deno Edge Function (see notes on porting) |
| **External API** | Salesforce Agentforce Runtime API |

---

## Project Structure

```
├── src/
│   ├── components/
│   │   ├── AgentforceChat.tsx    # Main chat interface
│   │   ├── ChatMessage.tsx       # Message rendering with Markdown
│   │   ├── PreEngagement.tsx     # Pre-chat user form
│   │   ├── Header.tsx            # Application header
│   │   └── Footer.tsx            # Application footer
│   ├── hooks/
│   │   └── useAgentforce.ts      # Core hook for Agentforce integration
│   ├── lib/
│   │   └── salesforce-config.ts  # Salesforce configuration values
│   └── pages/
│       └── Index.tsx             # Main application page
├── supabase/
│   └── functions/
│       └── agentforce-proxy/     # Backend proxy for Agentforce API
│           └── index.ts
├── HANDOVER.md                   # Complete integration guide & disclaimers
└── README.md                     # This file
```

---

## Quick Start (Reference Only)

> **Note**: These instructions are for exploring the codebase. This is **not** intended for production deployment.

```bash
# Clone the repository
git clone <repository-url>

# Install dependencies
npm install

# Set up environment variables (see below)

# Run development server
npm run dev
```

---

## Environment Variables

The following secrets must be configured for the backend proxy:

| Variable | Description |
|----------|-------------|
| `SALESFORCE_CLIENT_ID` | OAuth 2.0 Client ID from your Connected App |
| `SALESFORCE_CLIENT_SECRET` | OAuth 2.0 Client Secret from your Connected App |

Configuration values in `src/lib/salesforce-config.ts`:

| Value | Description |
|-------|-------------|
| `SF_DOMAIN` | Your Salesforce org domain |
| `SF_API_HOST` | Salesforce API host (typically `https://api.salesforce.com`) |
| `AGENT_ID` | Your Agentforce Agent ID |
| `TOKEN_ENDPOINT` | OAuth token endpoint for your org |

---

## Documentation

- **[HANDOVER.md](./HANDOVER.md)** - Comprehensive integration guide including:
  - Complete architecture overview
  - Authentication flow details
  - Agentforce API integration patterns
  - Node.js/Express proxy example
  - Full disclaimer and legal terms

---

## Important Notes

1. **Rebuild for Production**: This code is reference material. Salesforce recommends implementing your own solution tailored to your architecture and security requirements.

2. **No Licensing Included**: This repository does not include licensing for any Salesforce products, APIs, or services. Appropriate licensing must be obtained separately.

3. **No Warranty**: This code is provided "as-is" without warranty of any kind. See HANDOVER.md for complete disclaimer.

4. **Security Considerations**: The authentication patterns shown are for demonstration. Implement proper security measures appropriate for your environment.

---

## Disclaimer

This repository represents the personal work of an individual Salesforce employee, created for demonstration purposes. It is **not** official Salesforce documentation, guidance, or a supported product.

Salesforce disclaims all liability for any damages, data loss, security breaches, or other issues arising from the use of these materials.

**For complete terms, see [HANDOVER.md](./HANDOVER.md).**
