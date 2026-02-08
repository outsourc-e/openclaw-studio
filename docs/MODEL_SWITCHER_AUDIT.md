# Phase 1.1 Model Switcher — PR Audit & Optimization Spec

**Branch:** `phase1.1-model-switcher`  
**Commit:** `3531f67`  
**Base:** `main` at `450c670`  
**Date:** 2026-02-07  

---

## 1. AUDIT REPORT

### A1) PR Changes Overview

**6 files changed, 555 insertions, 38 deletions:**

| File | Purpose |
|------|---------|
| `src/routes/api/models.ts` **(NEW)** | GET `/api/models` — server route calling `gatewayRpc('models.list')` |
| `src/routes/api/model-switch.ts` **(NEW)** | POST `/api/model-switch` — server route calling `gatewayRpc('sessions.patch', { key, model })` |
| `src/lib/gateway-api.ts` **(MODIFIED)** | Added `fetchModels()`, `switchModel()` client functions + 3 new types |
| `src/screens/chat/components/chat-composer.tsx` **(MODIFIED)** | Major rewrite: live model list, mutation-based switching, inline notices |
| `src/screens/chat/chat-screen.tsx` **(MODIFIED)** | Pass `sessionKey` prop to `ChatComposer` |
| `src/routeTree.gen.ts` **(AUTO)** | TanStack Router auto-generated tree (new `/api/models` + `/api/model-switch` entries) |

**New endpoints:**
- `GET /api/models` → `gatewayRpc('models.list', {})`
- `POST /api/model-switch` → `gatewayRpc('sessions.patch', { key, model })`

**Changes to `server/gateway.ts`:** NONE. The existing `gatewayRpc()` function is used as-is. No new RPC methods were added to the gateway client — we call existing Gateway methods (`models.list`, `sessions.patch`).

---

## 2. MODEL LIST ORIGIN

### Where does the dropdown list come from?

**Source:** Live Gateway RPC, NOT hardcoded.

**Flow:**
```
ChatComposer useQuery → fetch('/api/models') → server/models.ts → gatewayRpc('models.list', {}) → Gateway WebSocket → response.models[]
```

**Before (Phase 0):**
```ts
// REMOVED — was hardcoded in chat-composer.tsx
const AVAILABLE_MODELS = ['sonnet 4.5', 'opus 4.6', 'gpt-5-codex', 'kimi k2.5', 'gemini 2.5 flash'] as const
```

**After (Phase 1.1):**
```ts
// chat-composer.tsx — live query
const modelsQuery = useQuery({
  queryKey: ['gateway', 'models'],
  queryFn: fetchModels,      // → GET /api/models
  refetchInterval: 60_000,   // refresh every 60s
  retry: false,
})
```

**Population function — `buildModelOptions()` in chat-composer.tsx:**
```ts
const modelOptions = useMemo(function buildModelOptions(): Array<ModelOption> {
  const rows = Array.isArray(modelsQuery.data?.models) ? modelsQuery.data.models : []
  const seen = new Set<string>()
  const options: Array<ModelOption> = []
  for (const row of rows) {
    const option = toModelOption(row)  // normalizes string | object entries
    if (!option) continue
    if (seen.has(option.value)) continue
    seen.add(option.value)
    options.push(option)
  }
  return options
}, [modelsQuery.data?.models])
```

**What `toModelOption()` handles:**
- String entries: `"claude-opus-4-6"` → `{ value: "claude-opus-4-6", label: "claude-opus-4-6" }`
- Object entries with `alias`, `provider`, `model`, `name`, `label`, `displayName`, `id` — picks best display label and value

### Is this "all known models" or "available models"?

It's **whatever `models.list` returns from the Gateway**. The Gateway returns all configured models across all providers in `openclaw.json`. This is "configured models" — not a universal registry.

**Example response shape from Gateway:**
```json
{
  "models": [
    { "alias": "opus46", "provider": "anthropic", "model": "claude-opus-4-6", "name": "Claude Opus 4.6" },
    { "alias": "sonnet", "provider": "anthropic", "model": "claude-sonnet-4-5", "name": "Claude Sonnet 4.5" },
    "openai/gpt-5.2-codex",
    { "provider": "google-antigravity", "model": "gemini-2.5-flash", "name": "Gemini 2.5 Flash" }
  ]
}
```

---

## 3. CLICK FLOW (UI → API → RPC)

### When user selects a model:

**Step 1 — UI handler (`handleModelSelect` in chat-composer.tsx):**
```ts
const handleModelSelect = useCallback(
  function handleModelSelect(nextModel: string) {
    const model = nextModel.trim()
    if (!model) return
    const normalizedSessionKey = typeof sessionKey === 'string' && sessionKey.trim().length > 0
      ? sessionKey.trim() : undefined
    setModelNotice(null)
    modelSwitchMutation.mutate({ model, sessionKey: normalizedSessionKey })
  },
  [modelSwitchMutation, sessionKey],
)
```

**Step 2 — Client function (`switchModel` in gateway-api.ts):**
```ts
POST /api/model-switch
Body: { "model": "anthropic/claude-opus-4-6", "sessionKey": "main" }
Timeout: 12s (AbortController)
```

**Step 3 — Server route (`model-switch.ts`):**
```ts
gatewayRpc<SessionsPatchResponse>('sessions.patch', { key: sessionKey, model })
```

**Step 4 — Gateway RPC:** `sessions.patch` with `{ key: "main", model: "anthropic/claude-opus-4-6" }`

### Success response:
```json
{
  "ok": true,
  "resolved": {
    "modelProvider": "anthropic",
    "model": "claude-opus-4-6"
  }
}
```
**UI:** Green inline notice "Model switched to anthropic/claude-opus-4-6", dropdown closes, `currentModelQuery` refetches to update button label.

### Error response:
```json
{ "ok": false, "error": "Model not found: foo-bar" }
```
**UI:** Red inline notice with error message. If timeout: "Request timed out" + Retry button.

### Current model display:

Fetched separately via existing `/api/session-status` endpoint:
```ts
const currentModelQuery = useQuery({
  queryKey: ['gateway', 'session-status-model'],
  queryFn: fetchCurrentModelFromStatus,  // GET /api/session-status → parse model from payload
  refetchInterval: 30_000,
  retry: false,
})
```

The `readModelFromStatusPayload()` function tries multiple paths: `payload.model`, `payload.currentModel`, `payload.modelAlias`, `payload.resolved.modelProvider/model`, and nested variants.

---

## 4. SAFETY / CORRECTNESS

| Check | Status |
|-------|--------|
| No secrets in diff | ✅ Verified — `grep -iE '(token\|secret\|password\|apiKey)' diff` = empty |
| No tokens logged to console | ✅ No `console.log` in any changed file |
| No auth-profile contents exposed in UI | ✅ `/api/models` only returns model catalog (names/aliases), not auth profiles |
| Failures handled (no UI crash) | ✅ `modelsQuery.isError` → "Gateway disconnected" label, button disabled. `modelSwitchMutation.onError` → inline notice with message. Timeout → "Request timed out" + Retry button |
| Build clean | ✅ `npm run build` passes (0 errors, 890ms) |

---

## 5. OPTIMIZATION DECISION

### B1) Desired UX — "Configured Providers" grouping

**Signal choice: Option 2 — Ask Gateway for available models (`models.list`)**

**Why:**
- The Gateway already returns models grouped by provider. The `models.list` RPC response includes `provider` field on each entry.
- Option 1 (read auth profiles) would require a new server endpoint and risk leaking auth config to the UI.
- Option 3 (env/config) is static and wouldn't reflect runtime state.

**The data is already there.** We just need to:
1. Group `modelOptions` by `provider` field
2. Render sections with provider headers
3. Add search filter
4. Add "Recent 3" section (localStorage)

### B2) Implementation Plan

**P0 (implement now — small, no new endpoints):**
1. Group models by `provider` in dropdown (section headers)
2. Highlight current model with checkmark
3. Show alias in parentheses if different from model name

**P1 (implement next — medium):**
1. Quick search input in dropdown (client-side filter)
2. "Recent" section (last 3 switches stored in localStorage)
3. Pinned models (star icon, localStorage)

**P2 (spec only — needs new Gateway RPC):**
1. "All Models" tab showing a universal registry (would need `models.catalog` or similar)
2. Provider health indicators (green/yellow/red based on cooldown status)

### B3) Writing spec for P1/P2, implementing P0 now.

---

## 6. TEST PLAN

### Build verification:
```bash
cd ~/.openclaw/workspace/webclaw-ui
npm run build   # must pass with 0 errors
```

### Manual test (dev server):
```bash
nohup npx vite dev --port 3000 > /tmp/vite-dev.log 2>&1 &
```

1. Open `localhost:3000` → navigate to Chat
2. **Model button** should show current model name (from session-status), not "sonnet 4.5"
3. **Click model button** → dropdown should show live models from Gateway (not hardcoded list)
4. **Select a different model** → inline notice "Model switched to X", button label updates
5. **Kill Gateway** (`openclaw gateway stop`) → button should show "Gateway disconnected", dropdown disabled
6. **Restart Gateway** → within 60s, models should repopulate
7. **Select invalid model** (if possible) → error notice, no crash
8. **Rapid switching** → mutation pending state prevents double-clicks
