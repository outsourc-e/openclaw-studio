# Model Switcher Root Cause Analysis

**Issue:** Model switcher showing "model not allowed" errors + incorrect provider prefixes  
**Branch:** `phase1.2-model-switcher-fix`  
**Date:** 2026-02-07  

---

## Symptoms

1. Selecting any model → "model not allowed: X" error
2. Error messages showed "openai/" prefix even when selecting Anthropic/Google/OpenRouter models
3. Dropdown showed 261 models but most were unusable

---

## Root Causes

### Issue #1: Wrong Model Identifier Format

**Problem:** `toModelOption()` was constructing inconsistent model identifiers.

- Anthropic models: `id` = "claude-3-haiku-20240307" (no provider prefix)
- OpenRouter models: `id` = "ai21/jamba-large-1.7" (already had prefix)
- Our code tried to construct `provider/model` but fell back to bare `id` when `model` field was missing

**Gateway expectation:** `provider/model` format (e.g., `"anthropic/claude-opus-4-6"`)

**Evidence:**
```bash
curl -X POST /api/model-switch -d '{"model":"claude-opus-4-6"}'
# Error: "model not allowed: openai/claude-opus-4-6"
#                            ^^^^^^ defaulted to openai!

curl -X POST /api/model-switch -d '{"model":"anthropic/claude-opus-4-6"}'  
# ✅ Success
```

**Fix:** Always construct value as `${provider}/${id}`, except when `id` already contains `/`.

### Issue #2: Showing Unconfigured Models

**Problem:** `models.list` RPC returns ALL models from the Gateway catalog (711 total), but `sessions.patch` only allows models explicitly configured in `openclaw.json`.

**Eric's config:**
```json
{
  "anthropic": ["claude-opus-4-6"],
  "minimax": ["MiniMax-M2.1"],
  "openai": ["gpt-5-codex", "gpt-5.1-codex", "gpt-5.2-codex"],
  "openrouter": ["anthropic/claude-opus-4-5", "anthropic/claude-opus-4-6", "google/gemini-2.5-flash"],
  "google-antigravity": ["gemini-2.5-flash-thinking", "gemini-2.5-flash"]
}
```

**Before fix:** Showed 261 models from configured providers (all Anthropic models, all OpenRouter models, etc.)  
**After fix:** Show only 3-10 models (the ones actually configured)

**Fix:** Cross-reference `models.list` with configured model IDs from `openclaw.json`.

---

## Current Status

### ✅ Working
- Anthropic: `anthropic/claude-opus-4-6` switches successfully
- Filtering: 711 models → 3 shown (only configured ones)
- Build: passes clean, no secrets exposed

### ❌ Still Failing
- MiniMax: `minimax/MiniMax-M2.1` → "model not allowed"
- OpenRouter: `google/gemini-2.5-flash` → "model not allowed"  
  (Note: OpenRouter's configured ID already has a `/` — may need special handling)

### ⚠️ Edge Cases
- **google-antigravity:** Auth configured, models configured, but 0 models shown  
  **Likely cause:** Configured model IDs don't match catalog IDs from `models.list`  
  **Example:** Config has "gemini-2.5-flash", catalog might have "gemini-2.5-flash-20250X"

---

## Next Steps (for follow-up PR)

1. **Investigate MiniMax/OpenRouter failures:**  
   - Check if Gateway has additional restrictions (allowlists per session?)  
   - Test if provider name case matters ("minimax" vs "MiniMax")  
   - Check if OpenRouter needs special routing (meta-provider?)

2. **Fix google-antigravity mismatch:**  
   - Log what model IDs are in `models.list` for that provider  
   - Update config or adjust filtering logic

3. **Add fuzzy matching:**  
   - Match `claude-opus-4-6` to `claude-opus-4-6-20250514` if exact match fails  
   - Or show "Model configured but not in catalog" warning

4. **Improve error messages:**  
   - When Gateway rejects a model, parse the error and show actionable guidance  
   - e.g., "Model not allowed. Check your openclaw.json configuration."

---

## Files Changed

| File | Changes |
|------|---------|
| `src/server/providers.ts` | Added `getConfiguredModelIds()` to read allowed model IDs |
| `src/routes/api/models.ts` | Filter by both provider AND model ID |
| `src/screens/chat/components/chat-composer.tsx` | Fix `toModelOption()` to always use `provider/id` format |
| `test-model-switch.js` | Test script to verify switches across providers |

---

## Test Commands

```bash
# Get filtered model list
curl http://localhost:3000/api/models | jq '.models | length'
# Should return 3-10 (not 261)

# Test switch (Anthropic - should work)
curl -X POST http://localhost:3000/api/model-switch \
  -H 'content-type: application/json' \
  -d '{"model":"anthropic/claude-opus-4-6","sessionKey":"main"}'

# Run full test suite
node test-model-switch.js
```
