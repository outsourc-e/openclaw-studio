# ClawSuite — Architecture

## Mandatory Data Flow

```
UI → Local API Layer (`/api/*`)
  → Persistent Gateway Client (`server/gateway.ts`)
  → OpenClaw Gateway (`ws://127.0.0.1:18789`)
```

## Non-Negotiable Rules

- The browser UI MUST NOT talk directly to the Gateway
- All Gateway access goes through the singleton WS client
- Gateway reconnects must be automatic
- Gateway restarts must not require Studio restart

## Why This Matters

This architecture:
- Centralizes security
- Prevents auth sprawl
- Makes reconnects predictable
- Enables consistent logging and permissions
