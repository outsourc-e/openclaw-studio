# Model Switcher Optimization Spec

**Status:** Phase 1.1 wiring complete, optimization needed  
**Problem:** Gateway `models.list` returns **711 models across 22 providers** — dropdown is unusable  
**Date:** 2026-02-07  

---

## Current State

The model switcher calls `GET /api/models` → `gatewayRpc('models.list')` and renders a flat list of all returned models. The Gateway returns every model from every known provider (configured or not), resulting in 711 entries.

### Eric's Configured Providers (from `openclaw.json`):
| Provider | Auth | Models in catalog |
|----------|------|-------------------|
| `anthropic` | API token | 22 |
| `openai` | API key | 35 |
| `google-antigravity` | OAuth | 7 |
| `openrouter` | API key | 230 |
| `minimax` | API key | 2 |
| `xai` | API key | 22 |

**Total configured:** 6 providers, ~318 models  
**Not configured:** 16 providers, ~393 models (amazon-bedrock, azure, vertex, groq, huggingface, etc.)

---

## Optimization Plan

### P0 — Filter to Configured Providers (implement now)

**Signal:** Use a new server endpoint that reads the Gateway config to determine which providers have auth configured, then filter `models.list` to only those providers.

**Approach:**
1. New `GET /api/models` behavior: Call `gatewayRpc('models.list')` AND check which providers are configured
2. Return models grouped by provider, with `configured: true/false` flag
3. UI default: show only configured provider models
4. Add provider section headers in dropdown

**Data contract:**
```json
{
  "ok": true,
  "currentModel": "anthropic/claude-opus-4-6",
  "configuredProviders": ["anthropic", "openai", "google-antigravity", "openrouter", "minimax", "xai"],
  "models": [
    {
      "id": "claude-opus-4-6",
      "name": "Claude Opus 4.6",
      "provider": "anthropic",
      "configured": true,
      "reasoning": true,
      "contextWindow": 200000
    }
  ]
}
```

**UI states:**
- **Loading:** "Loading models…" button, disabled
- **Gateway disconnected:** "Gateway disconnected" label, disabled
- **No models:** "No models available" label, disabled
- **Success:** Grouped dropdown with provider headers, current model highlighted with ✓
- **Switching:** Button shows spinner, dropdown closes, mutation pending disables further clicks
- **Switch success:** Green inline notice "Switched to X", refetch current model
- **Switch error:** Red inline notice with error message, Retry button on timeout

### P1 — Enhanced UX (next PR)

1. **Quick search:** Text input at top of dropdown, client-side filter by model name/id/provider
2. **Recent models:** Last 3 switched models stored in localStorage, shown in "Recent" section at top
3. **Pinned models:** Star icon per model, pinned ones persist in localStorage, shown after Recent
4. **Aliases:** Show alias in parentheses if model has one (e.g., "Claude Opus 4.6 (opus46)")

### P2 — Advanced (spec only)

1. **Provider health:** Gateway could expose provider cooldown status; show 🟢/🟡/🔴 per provider header
2. **Cost indicators:** Show $/Mtok next to each model using cost data from catalog
3. **"All Models" toggle:** Reveal non-configured providers (grayed out, with "Not configured" label)
4. **Model comparison:** Side panel with context window, reasoning support, input types

---

## Implementation: P0

### Changes needed:

1. **`src/routes/api/models.ts`** — Filter models by configured providers
   - Read configured provider list from Gateway config (or maintain a static list derived from `openclaw.json`)
   - Best approach: Gateway already knows which providers have valid auth. Use `gatewayRpc('status')` or a config endpoint to get provider names, then filter `models.list` response.
   - Fallback: Hard-code the configured provider names server-side from env/config (less dynamic but simpler)

2. **`src/screens/chat/components/chat-composer.tsx`** — Group by provider
   - Group `modelOptions` by `provider` field
   - Render section headers (provider name) 
   - Show ✓ checkmark on active model
   - Cap visible models: show first ~50, add "Show all X models" button
   - Add `max-h-[20rem] overflow-y-auto` to dropdown

### Filtering decision:

**Use `gatewayRpc('status')`** — the Gateway status response includes provider/profile information that indicates which providers are actually available. This is the most reliable signal since it reflects runtime state (not just config).

If `status` doesn't expose provider list cleanly, fallback to parsing the `models.list` response and filtering by providers that match known auth profile provider names from the `openclaw.json` `auth.profiles` keys (e.g., `anthropic:default` → provider `anthropic`).

---

## Test Plan

1. `npm run build` — must pass clean
2. `npm run dev` → open Chat → click model button
3. Verify: dropdown shows only configured provider models (not 711)
4. Verify: provider section headers visible
5. Verify: current model has ✓ 
6. Verify: selecting a model triggers switch + success notice
7. Verify: killing Gateway shows "Gateway disconnected"
8. Verify: dropdown has scroll for long lists (`max-h-[20rem]`)
