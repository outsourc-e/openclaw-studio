# Model Switcher Test Plan

**Branch:** `phase1.2-model-switcher-fix`  
**Last Updated:** 2026-02-07  

---

## Automated Test Script

### Run Test Suite
```bash
cd /Users/aurora/.openclaw/workspace/webclaw-ui
node test-model-switch.js
```

**What it tests:**
1. Fetches `/api/models` and verifies response structure
2. Groups models by provider
3. Attempts to switch to one model per configured provider
4. Reports success/failure with detailed error messages

**Expected output:**
```
🧪 Model Switcher Test

1️⃣  Fetching models...
✅ Got 3-10 models across 4 providers
   Configured providers: anthropic, google-antigravity, minimax, openrouter

2️⃣  Testing model switch (one per provider)...

   Testing: anthropic → Claude Opus 4.6
   ✅ Success

   Testing: minimax → MiniMax-M2.1
   [status depends on fix]

📊 Summary:
   ✅ Successes: X
   ❌ Failures: Y
```

---

## Manual Test Steps

### Prerequisites
1. Gateway running: `openclaw gateway status`
2. Dev server running: `npx vite dev --port 3000`

### Test 1: Model List Filtering

**Goal:** Verify only configured models appear in dropdown

1. Open `http://localhost:3000/chat`
2. Click model switcher button (bottom-left of composer)
3. **✅ Verify:**
   - Dropdown shows 3-10 models (not 261)
   - Models are grouped by provider with section headers
   - Only shows models configured in `~/.openclaw/openclaw.json`
4. **❌ Fail if:**
   - Dropdown shows hundreds of models
   - No provider headers
   - Models from unconfigured providers appear

### Test 2: Model Switching (Success Case)

**Goal:** Verify switching to a configured model works

1. Open dropdown
2. Select `anthropic/claude-opus-4-6` (or whatever Anthropic model is configured)
3. **✅ Verify:**
   - Green notice appears: "Model switched to anthropic/claude-opus-4-6"
   - Button label updates to new model name
   - Checkmark (✓) moves to selected model
   - Dropdown closes
4. **❌ Fail if:**
   - Red error notice
   - Button label doesn't update
   - Console errors

### Test 3: Gateway Disconnected State

**Goal:** Verify graceful handling when Gateway is down

1. Stop Gateway: `openclaw gateway stop`
2. Reload page (or wait 60s for query to refetch)
3. Click model button
4. **✅ Verify:**
   - Button disabled
   - Label shows "Gateway disconnected"
   - No crash
5. Restart Gateway: `openclaw gateway start`
6. **✅ Verify:**
   - Within 60s, dropdown re-enables and populates

### Test 4: Empty State

**Goal:** Verify behavior when no models are configured

*(Requires temporarily emptying model config — skip for now)*

Expected:
- Dropdown shows: "No models available. [Configure providers →](link)"
- Link points to docs

### Test 5: Provider Grouping

**Goal:** Verify dropdown is organized by provider

1. Open dropdown
2. **✅ Verify:**
   - Each provider has an uppercase header (e.g., "ANTHROPIC", "MINIMAX")
   - Models under each header belong to that provider
   - Providers are alphabetically sorted
3. **❌ Fail if:**
   - Flat list with no grouping
   - Wrong models under wrong providers

### Test 6: Current Model Indication

**Goal:** Verify active model is marked

1. Note current model in button label
2. Open dropdown
3. **✅ Verify:**
   - Model matching button label has a ✓ checkmark
   - That option has `bg-primary-100` background (slightly highlighted)
4. Switch to different model
5. **✅ Verify:**
   - Checkmark moves to newly selected model

### Test 7: Scroll Behavior

**Goal:** Verify dropdown is scrollable for long lists

1. If you have >10 models configured, open dropdown
2. **✅ Verify:**
   - Dropdown has fixed max height (~20rem / 320px)
   - Scroll bar appears
   - All models are accessible via scroll
3. **❌ Fail if:**
   - Dropdown expands off-screen
   - Models cut off

---

## Security Checks

### Check 1: No Secrets in API Responses

```bash
curl http://localhost:3000/api/models | grep -iE '(token|secret|password|apiKey|api_key)'
```

**✅ Expected:** No output (grep finds nothing)  
**❌ Fail if:** Any secrets/tokens appear

### Check 2: No Auth Profiles Exposed

```bash
curl http://localhost:3000/api/models | jq '.configuredProviders'
```

**✅ Expected:** Array of provider names only: `["anthropic", "minimax", ...]`  
**❌ Fail if:** Profile keys like `"anthropic:default"` or token strings appear

### Check 3: No Console Errors

1. Open DevTools Console
2. Trigger model list fetch + switch
3. **✅ Verify:** No red errors
4. **❌ Fail if:** Uncaught exceptions or 500 errors

---

## Regression Tests

### After Future Changes

Run this checklist before merging any PR that touches model switching:

- [ ] `npm run build` passes with 0 errors
- [ ] `node test-model-switch.js` passes (or expected failures are documented)
- [ ] Manual Test 1-6 pass
- [ ] Security Checks 1-3 pass
- [ ] No secrets logged to browser console
- [ ] Dropdown shows correct provider headers
- [ ] Current model has checkmark (✓)

---

## Known Issues

| Issue | Status | Notes |
|-------|--------|-------|
| MiniMax switch fails | 🔴 Open | "model not allowed: minimax/MiniMax-M2.1" — investigating |
| OpenRouter switch fails | 🔴 Open | ID already has `/` — may need special handling |
| google-antigravity: 0 models | 🟡 Investigating | Configured IDs don't match catalog IDs |
| Anthropic switch works | ✅ Fixed | `anthropic/claude-opus-4-6` switches successfully |
