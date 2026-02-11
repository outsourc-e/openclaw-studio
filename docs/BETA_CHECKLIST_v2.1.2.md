# Beta Test Checklist — ClawSuite v2.1.2

**Version:** v2.1.2  
**Purpose:** External beta testing validation  
**Estimated Time:** 30-45 minutes (fresh user) + 15-20 minutes (power user)

---

## ⚠️ Golden Path (REQUIRED FIRST TEST)

**WARNING:** Complete this section FIRST before any other testing. If ANY step fails, STOP and report immediately. Do not continue to other tests until Golden Path passes.

**Estimated Time:** 10-15 minutes

---

### Golden Path: Step 1 — Fresh Install / Reset State

**Action:**
```bash
# If fresh install
git clone https://github.com/outsourc-e/openclaw-studio.git
cd openclaw-studio
git checkout v2.1.2
npm install

# If existing install
npm run beta:reset-state
```

**Expected:**
- ✅ Repository cloned successfully (or state reset complete)
- ✅ Dependencies installed without errors
- ✅ No build errors during install

**If this fails:** Report installation errors before proceeding.

**Pass/Fail:** ___________

---

### Golden Path: Step 2 — Start Studio + Gateway

**Action:**
```bash
# Terminal 1: Start OpenClaw Gateway
openclaw gateway start
openclaw gateway status

# Terminal 2: Start Studio
npm run dev
```

**Expected:**
- ✅ Gateway shows "Running" status
- ✅ Studio dev server starts on http://localhost:3000
- ✅ Browser loads Dashboard within 3 seconds
- ✅ No console errors (press F12 → Console)

**If this fails:** Report startup errors. Check gateway logs: `openclaw gateway logs`

**Pass/Fail:** ___________

---

### Golden Path: Step 3 — Add Provider Credentials

**Action:**
1. Navigate to **Providers** screen
2. Click "Add Provider" or configure existing provider
3. Select provider (e.g., Anthropic, OpenAI)
4. Enter API key
5. Click "Test Connection"
6. Save provider

**Expected:**
- ✅ Provider form loads correctly
- ✅ Connection test succeeds
- ✅ Provider appears in provider list
- ✅ API key NOT visible in UI after save (should be masked: `sk-***`)

**If this fails:** Report provider configuration errors. Check API key validity.

**Pass/Fail:** ___________

---

### Golden Path: Step 4 — Open Chat

**Action:**
1. Navigate to **Chat** screen
2. Observe model switcher dropdown
3. Verify models appear in dropdown

**Expected:**
- ✅ Chat screen loads with empty conversation
- ✅ Model switcher shows current model or "Select model"
- ✅ Dropdown shows at least 1 model from configured provider
- ✅ Models grouped by provider name

**If this fails:** Report chat screen or model catalog errors.

**Pass/Fail:** ___________

---

### Golden Path: Step 5 — Send Simple Message

**Action:**
1. Type message: "Hello, what is 2+2?"
2. Press Enter or click send button
3. Wait for response

**Expected:**
- ✅ Message appears in chat history
- ✅ Assistant responds within 5-10 seconds
- ✅ Response is accurate ("4" or equivalent)
- ✅ No console errors during send/receive

**If this fails:** Report message sending errors. Check gateway logs for API errors.

**Pass/Fail:** ___________

---

### Golden Path: Step 6 — Switch Model (Idle)

**Action:**
1. Click model switcher dropdown
2. Select a DIFFERENT model (e.g., if on Sonnet, switch to Haiku)
3. Wait for confirmation
4. Observe new model name in switcher

**Expected:**
- ✅ Model switch confirmation appears (or immediate if no streaming)
- ✅ New model name shown in switcher
- ✅ No duplicate messages
- ✅ No console errors

**If this fails:** Report model switching errors. Check if models available.

**Pass/Fail:** ___________

---

### Golden Path: Step 7 — Enable Smart Suggestions

**Action:**
1. Navigate to **Settings** screen
2. Find "Smart Suggestions" toggle
3. Toggle ON
4. Observe toggle state (should show ON)

**Expected:**
- ✅ Settings screen loads correctly
- ✅ Toggle changes state (OFF → ON)
- ✅ Setting persists (visible as ON after clicking)
- ✅ No console errors

**If this fails:** Report settings persistence errors. Check localStorage in DevTools.

**Pass/Fail:** ___________

---

### Golden Path: Step 8 — Trigger Downgrade Suggestion

**Action:**
1. Return to **Chat** screen
2. Ensure you're on a CHEAP model (e.g., Haiku)
3. Send message: "Explain quantum entanglement with mathematical formulas and derivations"
4. Wait 5-10 seconds after sending
5. Observe suggestion toast (may appear during or after response)

**Expected:**
- ✅ Message sent successfully
- ✅ Suggestion toast appears (if heuristics detect complexity mismatch)
- ✅ Toast shows "Try [model] for better results?" with Switch/Dismiss buttons
- ✅ Can dismiss toast

**Note:** Suggestion may NOT appear if heuristics don't detect need (this is OK). Try different model tiers if needed.

**If Smart Suggestions enabled but NEVER appear:** Report as potential issue (but not blocking).

**Pass/Fail:** ___________

---

### Golden Path: Step 9 — Save Current State as Mode

**Action:**
1. Configure your ideal state:
   - Select model: claude-sonnet-4-5 (or any mid-tier model)
   - Smart Suggestions: ON (from Step 7)
   - "Only Suggest Cheaper": OFF (default)
2. Click **"Mode"** button (next to model switcher)
3. Click "Save Current as New Mode..."
4. Enter name: "Golden Path Test Mode"
5. Check "Include current model"
6. Click "Save Mode"

**Expected:**
- ✅ Save dialog appears
- ✅ Can enter mode name
- ✅ Toast: "Mode saved: Golden Path Test Mode"
- ✅ Mode appears in Mode dropdown
- ✅ Mode selector shows "Golden Path Test Mode" as applied

**If this fails:** Report mode save errors. Check console and localStorage.

**Pass/Fail:** ___________

---

### Golden Path: Step 10 — Apply Mode

**Action:**
1. Manually change model to Haiku (or different from mode's model)
2. Manually toggle Smart Suggestions OFF
3. Open Mode dropdown
4. Select "Golden Path Test Mode"
5. Observe confirmation dialog (if model differs)
6. Click "Switch Now" (if prompted)

**Expected:**
- ✅ Confirmation dialog appears (if model switch needed)
- ✅ Settings restored: Smart Suggestions ON
- ✅ Model switches to claude-sonnet-4-5 (or mode's model)
- ✅ Mode selector shows "Golden Path Test Mode"

**If this fails:** Report mode application errors. Check console.

**Pass/Fail:** ___________

---

### Golden Path: Step 11 — Restart Studio

**Action:**
1. In terminal running `npm run dev`, press `Ctrl+C` to stop
2. Wait 2 seconds
3. Run `npm run dev` again
4. Wait for server to start
5. Refresh browser (Cmd/Ctrl+R)

**Expected:**
- ✅ Dev server restarts successfully
- ✅ Dashboard loads correctly
- ✅ No console errors on startup

**If this fails:** Report restart errors. Check for port conflicts.

**Pass/Fail:** ___________

---

### Golden Path: Step 12 — Verify State Restored

**Action:**
1. Navigate to **Settings** screen → verify Smart Suggestions is ON
2. Navigate to **Chat** screen → verify Mode dropdown shows "Golden Path Test Mode"
3. Verify model switcher shows correct model (from mode)
4. Open Mode dropdown → verify "Golden Path Test Mode" exists in list

**Expected:**
- ✅ Smart Suggestions setting persisted (ON)
- ✅ Mode still exists in dropdown
- ✅ Mode selector shows "Golden Path Test Mode" if settings still match
- ✅ Model selection persisted

**If this fails:** Report state persistence errors. Critical bug if modes disappear.

**Pass/Fail:** ___________

---

## Golden Path Results

**All 12 steps passed?**
- [ ] ✅ YES — Proceed to full test suite (Parts 1-3)
- [ ] ❌ NO — STOP. Report failed steps immediately. Do NOT continue testing.

**Failed Steps (if any):**

---

## Pre-Test Setup

### Environment Check
- [ ] **Node.js:** v18+ installed (`node --version`)
- [ ] **npm:** v8+ installed (`npm --version`)
- [ ] **OpenClaw Gateway:** Running (`openclaw gateway status`)
- [ ] **Browser:** Chrome, Firefox, or Safari (latest version)
- [ ] **OS:** macOS, Linux, or Windows

### Fresh Install Prep
```bash
# Clone repository
git clone https://github.com/outsourc-e/openclaw-studio.git
cd openclaw-studio
git checkout v2.1.2

# Install dependencies
npm install

# Verify build
npm run build
```

**Expected Output:**
```
✓ Client build: 4-6s
✓ Server build: 1-2s
✓ Exit code: 0
```

**Common Issues:**
- ❌ `EACCES` permission errors → Run `sudo chown -R $USER ~/.npm`
- ❌ Node version mismatch → Use `nvm use 22` or upgrade Node
- ❌ Port 3000 in use → Kill process on port 3000 or change port in package.json

---

## Part 1: Fresh User Flow (30-45 min)

### 1.1 First Launch

**Steps:**
1. Run `npm run dev`
2. Wait for "Local: http://localhost:3000/" message
3. Open http://localhost:3000 in browser
4. Observe initial screen

**Expected Results:**
- ✅ Dashboard loads within 2-3 seconds
- ✅ Navigation sidebar visible (Dashboard, Chat, Activity, Memory, etc.)
- ✅ No console errors (press F12 → Console tab)
- ✅ Dashboard shows "Connect to OpenClaw Gateway" message (if gateway not configured)

**Common Issues:**
- ❌ Blank screen → Check console for errors, verify gateway is running
- ❌ "Failed to fetch" → Gateway not running or wrong port (see docs/EMBEDDINGS-QUOTA-P1.md)
- ❌ Port conflict → Dev server failed to start, check terminal output

**Pass/Fail:** ___________  
**Notes:**

---

### 1.2 Gateway Connection

**Steps:**
1. Ensure OpenClaw Gateway is running (`openclaw gateway start`)
2. Refresh browser (Cmd/Ctrl+R)
3. Check Dashboard widgets (Sessions, Activity, Skills)

**Expected Results:**
- ✅ Dashboard widgets populate with data
- ✅ Session count shows (0 or more)
- ✅ Activity log shows recent events
- ✅ Skills list loads (may be empty)

**Common Issues:**
- ❌ Gateway not found → Run `openclaw gateway status`, check if running
- ❌ Connection refused → Gateway port mismatch (default: 9080)
- ❌ Empty widgets → This is OK if fresh install with no history

**Pass/Fail:** ___________  
**Notes:**

---

### 1.3 Navigation Test

**Steps:**
1. Click each sidebar item:
   - Dashboard → Activity → Memory → Chat → Providers → Skills → Cron → Files → Terminal → Debug → Settings
2. Verify each screen loads without errors

**Expected Results:**
- ✅ All screens load within 1-2 seconds
- ✅ No "404 Not Found" errors
- ✅ No console errors
- ✅ Back button works (browser history)

**Common Issues:**
- ❌ 404 on any screen → Router misconfiguration, rebuild and restart
- ❌ Infinite loading → API endpoint not responding, check gateway logs

**Pass/Fail:** ___________  
**Notes:**

---

### 1.4 Chat Screen Basics

**Steps:**
1. Navigate to **Chat** screen
2. Observe model switcher (dropdown near bottom)
3. Click model switcher dropdown
4. Observe available models

**Expected Results:**
- ✅ Chat screen loads with empty conversation
- ✅ Model switcher shows current model or "Select model"
- ✅ Dropdown shows at least 1 model (if providers configured)
- ✅ Models grouped by provider (Anthropic, OpenAI, etc.)

**Common Issues:**
- ❌ "No models available" → Providers not configured (go to Providers screen)
- ❌ "Gateway disconnected" → Gateway not running or unreachable
- ❌ Dropdown empty → Check provider API keys in Settings → Providers

**Pass/Fail:** ___________  
**Notes:**

---

### 1.5 Send First Message

**Steps:**
1. Type a test message: "Hello, can you see this?"
2. Press Enter or click send button (arrow up icon)
3. Wait for response

**Expected Results:**
- ✅ Message appears in chat history
- ✅ Assistant responds within 5-10 seconds
- ✅ Response is coherent and relevant
- ✅ Message history persists on refresh

**Common Issues:**
- ❌ No response → Model not selected or provider key invalid
- ❌ Error message → Check console, verify API key has credits
- ❌ Timeout → Network issue or model overloaded, retry

**Pass/Fail:** ___________  
**Notes:**

---

### 1.6 Model Switching

**Steps:**
1. Click model switcher dropdown
2. Select a different model (e.g., Haiku if on Sonnet)
3. Wait for confirmation
4. Send another message: "What model are you?"

**Expected Results:**
- ✅ Model switch confirmation appears
- ✅ New model name shown in switcher
- ✅ Response uses new model (check response style/length)
- ✅ No duplicate messages

**Common Issues:**
- ❌ Switch fails → Model unavailable or API key issue
- ❌ Duplicate messages → Known issue, refresh page
- ❌ No confirmation → Streaming in progress, wait and retry

**Pass/Fail:** ___________  
**Notes:**

---

### 1.7 Image Attachments

**Steps:**
1. Click attachment button (plus icon)
2. Select an image file (PNG, JPG, or paste from clipboard)
3. Verify thumbnail appears
4. Send message: "Describe this image"

**Expected Results:**
- ✅ Image thumbnail shows in composer
- ✅ File name and size displayed
- ✅ Can remove attachment (X button)
- ✅ Assistant describes image accurately

**Common Issues:**
- ❌ Image not showing → Only image files supported (not PDFs/docs)
- ❌ "File too large" → Max size depends on model (usually 20MB)
- ❌ Model can't see image → Vision model required (e.g., Sonnet, GPT-4o)

**Pass/Fail:** ___________  
**Notes:**

---

### 1.8 Settings Screen

**Steps:**
1. Navigate to **Settings** screen
2. Scroll through all sections:
   - Smart Suggestions
   - Preferred Models (Budget/Premium)
   - Only Suggest Cheaper toggle
3. Toggle Smart Suggestions ON/OFF
4. Select a Preferred Budget Model

**Expected Results:**
- ✅ Settings load without errors
- ✅ Toggles work (ON/OFF states persist)
- ✅ Dropdown shows available models
- ✅ Settings save automatically (no save button needed)

**Common Issues:**
- ❌ Settings don't persist → localStorage disabled in browser
- ❌ Dropdowns empty → No models available, configure providers first

**Pass/Fail:** ___________  
**Notes:**

---

### 1.9 Activity Log

**Steps:**
1. Navigate to **Activity** screen
2. Scroll through event list
3. Observe event types (message, model switch, error, etc.)
4. Check timestamps

**Expected Results:**
- ✅ Activity log shows recent events
- ✅ Events grouped by session
- ✅ Timestamps are accurate (local timezone)
- ✅ Can scroll to load more events

**Common Issues:**
- ❌ Empty log → Fresh install, no history yet (this is OK)
- ❌ Timestamps wrong → Timezone mismatch, check system time
- ❌ Errors in log → Check details, may indicate config issues

**Pass/Fail:** ___________  
**Notes:**

---

### 1.10 Global Search (Cmd+P)

**Steps:**
1. Press `Cmd+P` (Mac) or `Ctrl+P` (Windows/Linux)
2. Type "chat" in search box
3. Observe results
4. Press Escape to close

**Expected Results:**
- ✅ Search modal opens instantly
- ✅ Results show matching screens/files/sessions
- ✅ Can navigate with arrow keys
- ✅ Escape closes modal

**Common Issues:**
- ❌ Hotkey doesn't work → Check if browser/OS intercepting
- ❌ No results → Fresh install, limited data
- ❌ Modal won't close → Press Escape or click backdrop

**Pass/Fail:** ___________  
**Notes:**

---

## Part 2: Power User Flow (15-20 min)

### 2.1 Pinned Models

**Steps:**
1. Go to Chat screen
2. Open model switcher dropdown
3. Find a model you use frequently
4. Click the ☆ (star) icon to pin it
5. Observe pinned section appears at top

**Expected Results:**
- ✅ ☆ changes to ⭐ (pinned)
- ✅ "📌 Pinned" section appears at dropdown top
- ✅ Pinned model stays at top across sessions
- ✅ Can unpin by clicking ⭐ again

**Common Issues:**
- ❌ Pin doesn't persist → localStorage cleared or browser issue
- ❌ Star icon missing → Check if model available in catalog

**Pass/Fail:** ___________  
**Notes:**

---

### 2.2 Session Presets (Modes)

**Steps:**
1. Go to Chat screen
2. Configure ideal settings:
   - Select model: claude-sonnet-4-5
   - Enable Smart Suggestions (Settings)
   - Disable "Only Suggest Cheaper"
3. Click **"Mode"** button (next to model switcher)
4. Click **"Save Current as New Mode..."**
5. Name it "Test Mode", check "Include current model"
6. Click "Save Mode"

**Expected Results:**
- ✅ Toast: "Mode saved: Test Mode"
- ✅ Mode appears in Mode dropdown
- ✅ Mode selector shows "Test Mode" as applied

**Common Issues:**
- ❌ Save button disabled → Name field empty
- ❌ "Mode already exists" → Choose different name
- ❌ Mode not showing → Refresh page, check localStorage

**Pass/Fail:** ___________  
**Notes:**

---

### 2.3 Apply Mode (Model Switch)

**Steps:**
1. Manually change model to Haiku (or different from mode's model)
2. Open Mode dropdown
3. Select "Test Mode"
4. Observe confirmation dialog: "Switch to claude-sonnet-4-5?"
5. Click "Switch Now"

**Expected Results:**
- ✅ Confirmation dialog appears
- ✅ Settings updated (Smart Suggestions, etc.)
- ✅ Model switches to claude-sonnet-4-5
- ✅ Mode selector shows "Test Mode"

**Common Issues:**
- ❌ No confirmation → Mode has no preferred model, or streaming active
- ❌ Model switch fails → Model unavailable or API key issue

**Pass/Fail:** ___________  
**Notes:**

---

### 2.4 Manage Modes (Rename/Delete)

**Steps:**
1. Open Mode dropdown
2. Click "Manage Modes..."
3. Find "Test Mode" → click "Rename"
4. Rename to "Renamed Mode"
5. Click "Delete" on "Renamed Mode"
6. Confirm deletion

**Expected Results:**
- ✅ Manage Modes modal opens
- ✅ Rename dialog pre-fills current name
- ✅ Name updates in list
- ✅ Delete confirmation prevents accidents
- ✅ Mode removed from list

**Common Issues:**
- ❌ Duplicate name error → Choose unique name
- ❌ Delete doesn't work → Check console for errors

**Pass/Fail:** ___________  
**Notes:**

---

### 2.5 Settings Drift Detection

**Steps:**
1. Apply "Test Mode" (create one if deleted)
2. Manually toggle Smart Suggestions (opposite of mode's setting)
3. Observe Mode selector

**Expected Results:**
- ✅ Mode selector shows ⚠️ (drift indicator)
- ✅ Tooltip: "Settings changed"
- ✅ Mode no longer highlighted in dropdown

**Common Issues:**
- ❌ No drift indicator → Check if mode tracks that setting
- ❌ Drift persists after reapplying → Refresh page

**Pass/Fail:** ___________  
**Notes:**

---

### 2.6 Smart Suggestions (if enabled)

**Steps:**
1. Go to Settings → Enable Smart Suggestions
2. Go to Chat screen
3. Use a cheap model (e.g., Haiku)
4. Ask a complex question: "Explain quantum entanglement in detail with mathematical formulas"
5. Observe suggestion toast (may take 5-10s)

**Expected Results:**
- ✅ Toast appears: "Try [model] for better results?"
- ✅ "Switch" button works
- ✅ "Dismiss" hides toast
- ✅ "Not for this session" persists dismissal

**Common Issues:**
- ❌ No suggestion → Heuristics didn't detect need (this is OK)
- ❌ Suggestion for expensive task on cheap model → Working as intended
- ❌ Switch fails → Model unavailable

**Pass/Fail:** ___________  
**Notes:**

---

### 2.7 Keyboard Navigation

**Steps:**
1. Press `Tab` repeatedly to navigate UI
2. Press `Cmd+B` (Mac) or `Ctrl+B` (Windows/Linux) to toggle sidebar
3. Press `Cmd+P` to open search
4. Press `Escape` to close search
5. Navigate to Chat → press `Tab` to reach composer → type message

**Expected Results:**
- ✅ Focus indicators visible on all interactive elements
- ✅ Sidebar toggle hotkey works
- ✅ Search hotkey works
- ✅ Can navigate entire UI without mouse

**Common Issues:**
- ❌ Focus not visible → Browser CSS issue, try different browser
- ❌ Hotkeys don't work → OS/browser intercepting (check for conflicts)

**Pass/Fail:** ___________  
**Notes:**

---

### 2.8 Providers Configuration

**Steps:**
1. Navigate to **Providers** screen
2. Click "Add Provider" (or configure existing)
3. Select a provider (e.g., Anthropic)
4. Observe configuration form
5. DO NOT save real API keys (security test)

**Expected Results:**
- ✅ Provider list shows configured providers
- ✅ Add/Edit forms load correctly
- ✅ Can test connection (if provider configured)
- ✅ No API keys visible in UI after save

**Common Issues:**
- ❌ Connection test fails → Invalid API key or network issue
- ❌ API key visible → SECURITY BUG, report immediately

**Pass/Fail:** ___________  
**Notes:**

---

### 2.9 Diagnostics Export

**Steps:**
1. Navigate to **Debug** screen
2. Click "Export Diagnostics"
3. Wait for download
4. Open downloaded JSON file
5. Search for "api" or "key" (case-insensitive)

**Expected Results:**
- ✅ JSON file downloads instantly
- ✅ File contains: logs, config, session info, build info
- ✅ NO API keys, tokens, or secrets in file
- ✅ Keys are redacted: "sk-ant-***REDACTED***"

**Common Issues:**
- ❌ Download fails → Browser blocking, allow download
- ❌ API key exposed → CRITICAL BUG, report immediately
- ❌ File empty → Check gateway connection

**Pass/Fail:** ___________  
**Notes:**

---

### 2.10 File Explorer (if workspace detected)

**Steps:**
1. Navigate to **Files** screen
2. Observe file tree
3. Click a file to open
4. Verify read-only display (no edit mode)

**Expected Results:**
- ✅ File tree loads from detected workspace
- ✅ Can expand/collapse folders
- ✅ File content displays in viewer
- ✅ Syntax highlighting works

**Common Issues:**
- ❌ Empty state → No workspace detected (this is OK)
- ❌ Files won't open → Permission issue or gateway connection
- ❌ Syntax highlighting broken → Unknown file type (this is OK)

**Pass/Fail:** ___________  
**Notes:**

---

## Part 3: Stress Tests (Optional, 5-10 min)

### 3.1 Rapid Model Switching

**Steps:**
1. Open model dropdown
2. Switch models 5 times rapidly (click, switch, wait 1s, repeat)
3. Observe behavior

**Expected Results:**
- ✅ All switches succeed
- ✅ No duplicate messages
- ✅ No console errors
- ✅ Final model is correct

**Common Issues:**
- ❌ Switch fails after 3-4 → Rate limit or queue backlog
- ❌ Duplicate messages → Known issue, refresh page

**Pass/Fail:** ___________  
**Notes:**

---

### 3.2 Long Conversation

**Steps:**
1. Send 10+ messages in a row
2. Scroll up and down conversation
3. Refresh page
4. Verify history persists

**Expected Results:**
- ✅ All messages display correctly
- ✅ Scroll performance smooth
- ✅ Conversation persists after refresh
- ✅ Timestamps accurate

**Common Issues:**
- ❌ Slow scrolling → Large conversation, expected
- ❌ Messages missing → Gateway session issue, check logs

**Pass/Fail:** ___________  
**Notes:**

---

### 3.3 Browser Compatibility

**Steps:**
1. Open in Chrome → run quick smoke test
2. Open in Firefox → run quick smoke test
3. Open in Safari (Mac only) → run quick smoke test

**Expected Results:**
- ✅ All browsers render correctly
- ✅ No layout issues
- ✅ All features work
- ✅ No browser-specific console errors

**Common Issues:**
- ❌ Layout broken in X browser → CSS compatibility issue, report
- ❌ Feature not working → Check if browser feature available (e.g., clipboard API)

**Pass/Fail (Chrome):** ___________  
**Pass/Fail (Firefox):** ___________  
**Pass/Fail (Safari):** ___________  
**Notes:**

---

## Final Checklist

### Critical Issues (Block Release)
- [ ] ❌ API keys exposed in UI, diagnostics, or logs
- [ ] ❌ App crashes on launch
- [ ] ❌ Cannot send messages
- [ ] ❌ Data loss (messages disappear)
- [ ] ❌ Security vulnerability (XSS, CSRF, etc.)

### Major Issues (Fix Before Release)
- [ ] ⚠️ Model switching broken
- [ ] ⚠️ Settings don't persist
- [ ] ⚠️ Console errors on normal use
- [ ] ⚠️ Navigation broken (404s)

### Minor Issues (Document as Known Issues)
- [ ] 🐛 UI glitches (cosmetic)
- [ ] 🐛 Slow performance (non-blocking)
- [ ] 🐛 Edge case bugs (rare scenarios)

---

## Submission

**Tester Name:** ___________________________  
**Date:** ___________________________  
**OS:** ___________________________  
**Browser:** ___________________________  
**Node Version:** ___________________________

**Overall Assessment:**
- [ ] ✅ Ready for beta release
- [ ] ⚠️ Ready with documented known issues
- [ ] ❌ Not ready (critical issues found)

**Additional Notes:**
