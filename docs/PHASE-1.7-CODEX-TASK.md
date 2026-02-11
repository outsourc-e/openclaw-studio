# Phase 1.7 Codex Task — Provider Setup Wizard (Foundation)

## Context
ClawSuite at `~/.openclaw/workspace/webclaw-ui/` (Vite + React + TanStack Router).
Providers are configured in `~/.openclaw/openclaw.json` under `auth.profiles`. Studio reads provider names via `src/server/providers.ts`.
This is a FOUNDATION phase — UI shell and flow only. No actual config writing.

## Task
Create a "Provider Setup Wizard" UI that guides users through adding a new AI provider. This phase builds the UX shell with stub/no-op handlers. Nothing writes to config yet.

## Requirements

### 1. Settings/Providers Screen
Create `src/screens/settings/providers-screen.tsx`:
- Accessible at `/settings/providers` route
- Shows list of currently configured providers (read from `/api/models` endpoint which already returns provider info)
- Each configured provider shows: name, icon, number of available models, status badge (active/configured)
- "Add Provider" button at the top

### 2. Provider Wizard Modal/Flow
Create `src/screens/settings/components/provider-wizard.tsx`:
- Multi-step wizard (modal or full-page, whichever fits better with existing UI patterns):

**Step 1: Choose Provider**
- Grid of provider cards with logos/icons:
  - Anthropic (Claude)
  - OpenAI
  - Google (Gemini)
  - OpenRouter
  - MiniMax
  - Ollama (local)
- Each card shows provider name, brief description, supported auth types
- Click to select and advance

**Step 2: Choose Auth Type**
- API Key: "Paste your API key in the OpenClaw config file"
- OAuth: "Authenticate via browser (Google only)"
- Local: "No auth needed (Ollama)"
- Show which auth types each provider supports
- Display the config file path: `~/.openclaw/openclaw.json`

**Step 3: Configuration Instructions**
- Show exactly what to add to `openclaw.json` (code block, copy-to-clipboard)
- Example config snippet for the selected provider + auth type
- Link to provider's API key page (e.g., console.anthropic.com)
- "I've updated my config" button

**Step 4: Verify (stub)**
- "Checking connection..." placeholder
- Stub handler that just shows "Verification not yet implemented — restart Gateway to apply changes"
- Button: "Done" → returns to providers list

### 3. Routes
Create `src/routes/settings/providers.tsx`:
- Route at `/settings/providers`
- `usePageTitle('Provider Setup')`

Also create `src/routes/settings/index.tsx` if it doesn't exist:
- Redirect to `/settings/providers` or show a settings landing page

### 4. Navigation
- Add "Settings" to the sidebar nav (check `src/screens/chat/components/chat-sidebar.tsx`)
- Settings icon with gear/cog icon
- Under settings, "Providers" sub-item

### 5. Provider Metadata
Create `src/lib/provider-catalog.ts`:
- Static catalog of known providers with metadata:
```ts
type ProviderInfo = {
  id: string           // e.g., "anthropic"
  name: string         // e.g., "Anthropic"
  description: string  // e.g., "Claude models — Haiku, Sonnet, Opus"
  authTypes: ('api-key' | 'oauth' | 'local')[]
  docsUrl: string      // Link to API key page
  configExample: string // JSON snippet for openclaw.json
}
```

### 6. Safety (CRITICAL)
- Wizard NEVER reads, writes, or displays actual API keys/secrets
- Config examples use placeholder values: `"sk-your-key-here"`
- The wizard explains WHERE to put keys but never handles them
- No config file writing — all handlers are stubs/no-ops
- Clear messaging: "API keys are stored locally in your OpenClaw config file, never sent to Studio"

### 7. Docs
Create `docs/PROVIDER_WIZARD.md`:
- Feature overview (foundation phase)
- Safety guarantees
- How to extend with new providers
- Future: what Phase 2+ would add (actual verification, config writing)

## Files to study first
- `src/screens/chat/components/chat-sidebar.tsx` — Sidebar nav (recently modified for debug)
- `src/routes/cron.tsx` — Route pattern
- `src/server/providers.ts` — How providers are read
- `src/routes/api/models.ts` — Models endpoint
- `src/lib/gateway-api.ts` — Gateway API types

## Styling
- Provider cards: use glass card style or bordered cards
- Wizard steps: clean stepper UI with progress indicator
- Code blocks: monospace with copy button
- Consistent with existing Studio design

## Final checks
1. `npm run build` must succeed
2. No real API keys or secrets anywhere
3. Config examples use only placeholder values
4. No `console.log` in production code
5. Git add all new files
