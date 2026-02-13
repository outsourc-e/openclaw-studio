# ClawSuite Browser System — Strategy & Architecture

**Date:** February 12, 2026  
**Status:** Analysis & Recommendations

---

## Executive Summary

ClawSuite implements a **dual-mode browser system** that bridges human browsing and agent automation:

1. **User-controlled headed browser** (Playwright + stealth, persistent sessions)
2. **Agent-controlled headless browser** (Playwright, ephemeral sessions)
3. **WebSocket stream server** (port 9223) for real-time state/screenshots
4. **HTTP proxy** (port 9222) for iframe embedding with header stripping

The current architecture is **functional but fragmented**. This document analyzes the system and provides concrete recommendations for workflow design, reliability improvements, security hardening, and integration with OpenClaw's native browser tool.

---

## 1. Current Architecture Analysis

### 1.1 Browser Implementations

ClawSuite has **three browser implementations**:

#### A. `browser-stream.ts` — User-Controlled Headed Browser
- **Purpose:** User logs in manually, then hands control to agent
- **Tech:** Playwright-extra + puppeteer-extra-plugin-stealth
- **Mode:** Headed (visible Chromium window)
- **Profile:** Persistent at `~/.clawsuite/browser-profile/`
- **Communication:** WebSocket + HTTP server on port 9223
- **Streaming:** CDP screencast (push-based, efficient)
- **UI:** `LocalBrowser.tsx` + `browser-sidebar-preview.tsx`

**Strengths:**
- ✅ Real browser window — user can see exactly what's happening
- ✅ Persistent profile preserves login sessions (cookies, localStorage)
- ✅ Stealth plugin bypasses basic bot detection
- ✅ CDP screencast streams frames only when pixels change (efficient)
- ✅ WebSocket architecture supports live updates

**Weaknesses:**
- ⚠️ Single global browser — no multi-session support
- ⚠️ Requires manual launch (barrier for non-technical users)
- ⚠️ No graceful recovery when browser window is closed by user
- ⚠️ Security: persistent profile exposes all sessions to any agent with handoff access
- ⚠️ Page recovery (`recoverPage`) is reactive, not proactive

#### B. `browser-session.ts` — Agent-Controlled Headless Browser
- **Purpose:** Agent automation without user interaction
- **Tech:** Standard Playwright (headless)
- **Mode:** Headless (no visible window)
- **Profile:** Ephemeral (no persistence)
- **Communication:** HTTP API via `/api/browser`
- **Streaming:** CDP screencast or manual screenshots
- **UI:** Not directly exposed to user

**Strengths:**
- ✅ Programmatic control from the start
- ✅ Isolated from user's browsing state
- ✅ CDP mouse/keyboard dispatch is more reliable than Playwright's higher-level API

**Weaknesses:**
- ⚠️ No session persistence — agents can't leverage logged-in state
- ⚠️ Not used in current UI flow (why have it?)
- ⚠️ Overlaps with `browser-stream.ts` functionality

#### C. `browser-proxy.ts` — Iframe Proxy Server
- **Purpose:** Embed any website in ClawSuite by stripping X-Frame-Options headers
- **Tech:** HTTP proxy with header manipulation
- **Mode:** Proxy (rewrites responses)
- **Communication:** HTTP on port 9222
- **UI:** Not actively used in current build

**Strengths:**
- ✅ Allows iframe embedding of sites that normally block it
- ✅ JavaScript injection for link/form interception

**Weaknesses:**
- ⚠️ Not integrated into main flow
- ⚠️ Security risk if exposed beyond localhost
- ⚠️ CSP/CORS rewriting can break complex web apps

### 1.2 Agent Handoff Flow

**Current Implementation:**
1. User manually launches headed browser via `LocalBrowser.tsx`
2. Browser opens in a desktop window (not embedded in ClawSuite UI)
3. User navigates to a page, logs in if needed
4. User types a task prompt: *"Extract my last 10 orders"*
5. User clicks **"Hand to Agent"**
6. System extracts page content (URL, title, first 3000 chars of text)
7. Creates a new chat session with:
   - Visible context: URL, title, task, page excerpt
   - Hidden context: Browser API instructions (POST localhost:9223)
8. Agent receives full page text + instructions to control browser via HTTP API
9. Agent sends actions (`navigate`, `click`, `type`, `screenshot`, etc.)

**Evaluation:**
- ✅ Clean separation between human and agent control
- ✅ User sees exactly what the agent sees (same browser instance)
- ✅ Persistent sessions = agent inherits logged-in state
- ⚠️ API is HTTP-based, not tool-based (agent must construct raw JSON POSTs)
- ⚠️ No visual feedback during agent control (sidebar preview polls screenshots, but no live streaming in chat UI)
- ⚠️ Error handling is minimal — if browser crashes, agent gets cryptic 500 errors

---

## 2. Workflow Design Recommendations

### 2.1 Ideal User Flow (Revised)

**Persona:** Non-technical user who wants AI to browse for them

**Flow A: User-First (Current Model — Enhanced)**
1. User clicks **"Browse"** in ClawSuite sidebar
2. Headed browser launches automatically (no manual "Launch" button)
3. User browses, logs in to any sites
4. When ready, user describes task: *"Find my order history and summarize it"*
5. Agent takes control, navigating/clicking/extracting data
6. Agent streams back findings in chat
7. User can reclaim control at any time: *"Let me take over"*

**Flow B: Agent-First (Recommended for Power Users)**
1. User asks in chat: *"Search for flights to Tokyo next month"*
2. System detects browsing intent (keyword: "search", "find", "book", "look up")
3. Auto-launches headed browser **in background** (visible desktop window)
4. Agent navigates, searches, extracts results
5. **Sidebar preview** shows live browser state
6. Agent reports findings: *"Found 3 flights, here are prices..."*
7. If login required: Agent asks user to authenticate → switches to user control

**Flow C: Headless Background (For Simple Tasks)**
1. User asks: *"What's the weather in Paris?"*
2. System uses **headless browser** (no window, no persistence needed)
3. Agent fetches data, returns answer
4. Browser closes automatically

**Key Design Principle:** 
- **Progressive disclosure**: Simple tasks = invisible automation. Complex tasks = visible browser window.
- **User always in control**: Clear handoff boundaries, instant takeover on demand.

### 2.2 Auto-Launch vs Manual Launch

**Recommendation: Hybrid Approach**

| Scenario | Launch Mode | Reason |
|----------|-------------|--------|
| User navigates to `/browser` view | **Manual** | User explicitly wants to browse |
| User clicks "Hand to Agent" | **Already running** | N/A |
| Agent needs to browse (from chat) | **Auto-launch** | Seamless experience |
| Agent needs login/auth | **Prompt user first** | Security/consent |
| Simple data fetch (weather, stock price) | **Headless (ephemeral)** | No UI clutter |

**Implementation:**
- Add a `browserPolicy` user preference:
  - `manual` — Always require manual launch (power users)
  - `auto` — Auto-launch when agent requests it (default)
  - `headless-only` — Never show windows, always use headless mode

---

## 3. Browser Sidebar Preview — Fixes & Enhancements

### 3.1 Current Implementation (`browser-sidebar-preview.tsx`)

**What it does:**
- Polls `localhost:9223` every 2-10 seconds (faster when browser active)
- Fetches screenshot via POST `{ action: 'screenshot' }`
- Displays URL, screenshot thumbnail

**Problems:**
1. **Polling is wasteful** — CDP screencast already pushes frames via WebSocket
2. **No live connection** — Preview can lag behind actual browser state
3. **Error handling is silent** — If browser crashes, preview just shows stale data
4. **No interaction** — User can't click on preview to focus browser window

### 3.2 Recommended Fixes

#### Fix 1: WebSocket Live Streaming
Replace polling with WebSocket subscription:

```typescript
// browser-sidebar-preview.tsx
const [ws, setWs] = useState<WebSocket | null>(null)

useEffect(() => {
  const socket = new WebSocket('ws://localhost:9223')
  socket.onmessage = (event) => {
    const msg = JSON.parse(event.data)
    if (msg.type === 'frame') {
      setScreenshot(msg.data) // Instant update
    }
    if (msg.type === 'state') {
      setUrl(msg.url)
      setTitle(msg.title)
    }
  }
  setWs(socket)
  return () => socket.close()
}, [])
```

**Benefits:**
- Zero latency — frames arrive immediately
- Lower CPU usage — no polling loops
- Real-time status — know when browser crashes

#### Fix 2: Click-to-Focus
Make preview clickable to bring browser window to foreground:

```typescript
<div onClick={() => fetch('http://localhost:9223', {
  method: 'POST',
  body: JSON.stringify({ action: 'focus' })
})}>
  {/* preview content */}
</div>
```

Add to `browser-stream.ts`:
```typescript
case 'focus': {
  // Use native OS API to bring window to front
  if (page) {
    await page.bringToFront()
  }
  return { ok: true }
}
```

#### Fix 3: Error States
Show clear status when browser is:
- Not launched → *"Click to launch browser"*
- Launching → *"Starting browser..." (spinner)*
- Crashed → *"Browser stopped unexpectedly. [Restart]"*
- No screenshot → *"Waiting for first frame..."* (not just empty box)

---

## 4. Agent Browser Control — Robustness

### 4.1 Current API (`localhost:9223`)

**Actions:**
- `launch`, `close`, `navigate`, `click`, `type`, `press`, `scroll`, `back`, `forward`, `refresh`, `screenshot`, `content`

**Strengths:**
- ✅ Simple HTTP interface
- ✅ CDP fallback for better reliability
- ✅ Auto-recovery for stale page references

**Weaknesses:**
- ⚠️ No retry logic — agent gets raw errors
- ⚠️ No rate limiting — agent can spam requests and crash browser
- ⚠️ No action queue — concurrent requests can conflict
- ⚠️ No visual feedback in chat — agent's actions are invisible until completion
- ⚠️ Error messages are technical (`Target closed`, `Navigation timeout`) — agent can't interpret them

### 4.2 Recommended Enhancements

#### Enhancement 1: Action Queue & Locking
Prevent race conditions when agent sends multiple commands:

```typescript
// browser-stream.ts
const actionQueue: Array<() => Promise<any>> = []
let isProcessing = false

async function enqueueAction(fn: () => Promise<any>) {
  actionQueue.push(fn)
  if (!isProcessing) await processQueue()
}

async function processQueue() {
  isProcessing = true
  while (actionQueue.length > 0) {
    const action = actionQueue.shift()!
    try {
      await action()
    } catch (err) {
      // Log but continue
    }
  }
  isProcessing = false
}
```

#### Enhancement 2: Retry with Exponential Backoff
```typescript
async function executeActionWithRetry(action: string, params: any, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await executeAction(action, params)
    } catch (err) {
      if (i === maxRetries - 1) throw err
      // Exponential backoff: 500ms, 1s, 2s
      await new Promise(r => setTimeout(r, 500 * Math.pow(2, i)))
      // Try to recover page
      await recoverPage()
    }
  }
}
```

#### Enhancement 3: Human-Readable Errors
```typescript
function translateError(err: any): string {
  const msg = err.message || String(err)
  if (msg.includes('Target closed')) return 'Browser tab was closed. Please relaunch.'
  if (msg.includes('Navigation timeout')) return 'Page took too long to load. Try refreshing.'
  if (msg.includes('detached')) return 'Lost connection to browser. Reconnecting...'
  return `Browser error: ${msg}`
}
```

#### Enhancement 4: Live Action Stream
Broadcast agent actions to sidebar preview:

```typescript
// When agent sends action
broadcast({
  type: 'agent-action',
  action: 'navigate',
  params: { url: 'https://example.com' },
  timestamp: Date.now()
})

// Sidebar shows:
// "🤖 Agent is navigating to example.com..."
```

---

## 5. Session Persistence — Security & Isolation

### 5.1 Current Setup

**Persistent Profile Location:** `~/.clawsuite/browser-profile/`

**Contents:**
- Cookies (all logged-in sessions)
- localStorage / sessionStorage
- IndexedDB
- Service workers
- Extensions (if any)

**Security Concerns:**
1. **Any agent with handoff access can:**
   - Read cookies from all sites
   - Access stored credentials
   - Exfiltrate session tokens
   - Impersonate user on any logged-in site

2. **No isolation between tasks:**
   - If user hands off Amazon, agent could also access Gmail (same profile)

3. **No encryption:**
   - Profile is stored in plaintext
   - Anyone with filesystem access can steal sessions

### 5.2 Recommendations

#### Option A: Per-Site Profiles (High Security)
Each domain gets its own isolated profile:

```typescript
const profileDir = path.join(
  os.homedir(),
  '.clawsuite',
  'browser-profiles',
  btoa(new URL(url).hostname).replace(/=/g, '')
)
```

**Pros:** Complete isolation — agent can only access the site it was handed  
**Cons:** User must re-login for each domain

#### Option B: Profile Encryption (Medium Security)
Encrypt the persistent profile at rest:

```typescript
import { createCipheriv, createDecipheriv } from 'crypto'

async function launchWithEncryptedProfile(key: Buffer) {
  // Decrypt profile directory before launch
  await decryptDirectory(PROFILE_DIR, key)
  // Launch browser
  // ...
  // Encrypt again on close
  await encryptDirectory(PROFILE_DIR, key)
}
```

**Pros:** Protects against filesystem snooping  
**Cons:** Key management complexity, performance overhead

#### Option C: Explicit Consent (Low Security, Best UX)
Before agent accesses any stored session, prompt user:

```
🔐 Agent wants to use your logged-in Amazon session.
   [Allow Once] [Allow for 1 hour] [Deny]
```

Store allowed domains in memory:
```typescript
const allowedDomains = new Set<string>()
// Clear on browser close or timeout
```

**Pros:** User control, simple implementation  
**Cons:** Can't prevent exfiltration after consent

#### Recommendation: **Option C + A** (Hybrid)
- Default: Single shared profile with explicit consent prompts
- Power users: Per-site profiles (opt-in setting)
- Enterprise: Encrypted profiles (environment variable key)

---

## 6. Integration with OpenClaw Browser Tool

### 6.1 OpenClaw Gateway Browser Tool

OpenClaw has a native `browser` tool that supports:
- OpenClaw-managed isolated browser instances
- Chrome extension relay (take over existing Chrome tabs)
- Playwright actions: `click`, `type`, `press`, `hover`, `drag`, `fill`, `wait`, `evaluate`
- ARIA-based element selection (more reliable than x/y coordinates)
- Screenshot/snapshot with refs
- PDF export

**Key Difference:**
- OpenClaw browser = **Element-based** (click on "Sign In" button by label)
- ClawSuite browser = **Coordinate-based** (click at x=340, y=120)

### 6.2 Recommended Integration Strategy

#### Strategy 1: Use OpenClaw Browser for Agent Tasks
When agent needs to browse:
1. Check if OpenClaw Gateway is running
2. Use Gateway's `browser` tool instead of ClawSuite's stream server
3. Benefits:
   - More reliable element selection (ARIA refs vs coordinates)
   - Built-in error handling and retries
   - Unified logging/observability
   - Browser actions appear in agent trace/timeline

**Implementation:**
```typescript
// In agent handoff
const gatewayAvailable = await checkGatewayStatus()
if (gatewayAvailable) {
  // Route to OpenClaw browser tool
  contextMsg += '\n\nUse the `browser` tool (OpenClaw) for automation.'
} else {
  // Fallback to ClawSuite stream server
  contextMsg += '\n\nBrowser API: POST http://localhost:9223'
}
```

#### Strategy 2: Keep ClawSuite Browser for User-Controlled Browsing
Headed browser with persistent profile = **user's browsing space**  
OpenClaw browser = **agent's automation space**

| Task | System | Reason |
|------|--------|--------|
| User browses manually | ClawSuite headed | Persistent sessions, visible window |
| User hands off to agent | ClawSuite stream | Agent inherits logged-in state |
| Agent browses from chat | OpenClaw browser | Reliable, element-based, isolated |
| Background data fetch | OpenClaw headless | Ephemeral, no profile pollution |

#### Strategy 3: Hybrid Mode
Detect element vs coordinate automation:
- If action has `selector` or `ref` → Use OpenClaw browser
- If action has `x`, `y` → Use ClawSuite stream server

**Example:**
```typescript
// Agent sends:
{ action: 'click', ref: 'button[name="Sign In"]' }
// → Route to OpenClaw browser.click(ref)

// Agent sends:
{ action: 'click', x: 450, y: 230 }
// → Route to ClawSuite stream server
```

---

## 7. Proposed Architecture

### 7.1 Unified Browser Service

Create `src/server/browser-service.ts`:

```typescript
export class BrowserService {
  private userBrowser: UserBrowser | null = null  // Headed, persistent
  private agentBrowser: AgentBrowser | null = null  // Headless, ephemeral
  private gatewayBrowser: GatewayClient | null = null

  async launchForUser(): Promise<UserBrowser> {
    // Launch headed browser with persistent profile
    // Start stream server on 9223
    // Return control handle
  }

  async launchForAgent(isolate = true): Promise<AgentBrowser> {
    // Check if OpenClaw Gateway available
    if (this.gatewayBrowser) return this.gatewayBrowser
    // Fallback: launch headless Playwright
    // No persistence, clean slate
  }

  async handoff(from: UserBrowser, to: AgentBrowser): Promise<void> {
    // Transfer session state (optional)
    // Migrate page to agent control
    // Lock user browser from further input
  }

  async reclaim(to: UserBrowser): Promise<void> {
    // Stop agent automation
    // Unlock user browser
    // Notify user: "You're back in control"
  }
}
```

### 7.2 Unified API Endpoint

Replace multiple browser endpoints with single handler:

```typescript
// /api/browser
POST /api/browser
{
  "mode": "user" | "agent" | "auto",
  "action": "launch" | "navigate" | "click" | ...,
  "params": { ... },
  "selector": "..." // Optional: element-based action
}

Response:
{
  "ok": true,
  "state": { running, url, title },
  "screenshot": "data:image/...",
  "recommendation": "Use OpenClaw browser tool for better reliability"
}
```

---

## 8. Implementation Roadmap

### Phase 1: Stabilization (1 week)
- [ ] Fix browser sidebar preview (WebSocket streaming, error states)
- [ ] Add action queue & retry logic to stream server
- [ ] Improve error messages (human-readable)
- [ ] Add click-to-focus for sidebar preview

### Phase 2: Workflow Enhancement (1 week)
- [ ] Implement auto-launch for agent-initiated browsing
- [ ] Add explicit consent prompts for session access
- [ ] Create unified `BrowserService` abstraction
- [ ] Add browser policy preferences (manual/auto/headless-only)

### Phase 3: Security Hardening (1 week)
- [ ] Implement per-site profile isolation (opt-in)
- [ ] Add profile encryption (environment variable key)
- [ ] Create session access audit log
- [ ] Add "browser sandbox" mode (no persistent state)

### Phase 4: OpenClaw Integration (2 weeks)
- [ ] Add Gateway detection & fallback logic
- [ ] Route element-based actions to OpenClaw browser tool
- [ ] Keep coordinate-based actions on stream server
- [ ] Unified browser API endpoint (`/api/browser`)
- [ ] Deprecate `browser-session.ts` (redundant)

### Phase 5: Advanced Features (Future)
- [ ] Multi-tab support (track multiple pages in stream server)
- [ ] Browser recording (save full session for replay/debugging)
- [ ] Agent "screenshare" mode (live stream in chat UI)
- [ ] Browser devtools proxy (inspect agent actions)

---

## 9. Key Decisions

### Decision 1: One Browser vs Two Browsers?

**Option A: Merge Everything into User Browser**
- Pro: Simpler codebase, single source of truth
- Con: Security risk (agent pollutes user profile), no isolation

**Option B: Keep Separate (User + Agent)**
- Pro: Security, isolation, different optimization strategies
- Con: More code to maintain, user confusion

**Recommendation: Keep Separate**
- User browser = persistent, visible, manual control
- Agent browser = ephemeral (or via OpenClaw), invisible, programmatic

### Decision 2: Stream Server vs OpenClaw Tool?

**Recommendation: Hybrid**
- Stream server for **handoff scenarios** (user → agent with session inheritance)
- OpenClaw tool for **agent-initiated browsing** (better reliability, element selection)
- Eventually migrate to 100% OpenClaw tool once it supports persistent profiles

### Decision 3: Auto-Launch or Manual?

**Recommendation: Auto-Launch with Preferences**
- Default: Auto-launch when agent needs browser
- Power users: Opt into manual mode
- Always prompt before accessing stored sessions (security)

---

## 10. Conclusion

The current ClawSuite browser system is **functional but needs refinement**:

**Strengths:**
- Clean handoff UX (user browses → agent automates)
- Persistent profiles preserve sessions
- CDP screencast is efficient

**Critical Issues:**
1. **Fragmentation:** Two overlapping browser implementations
2. **Reliability:** Polling-based preview, minimal error handling, no retries
3. **Security:** Unrestricted session access, no encryption
4. **Integration:** Duplicate effort vs OpenClaw's native browser tool

**Recommended Next Steps:**
1. **Short-term (1 week):** Fix sidebar preview (WebSocket), add error handling
2. **Medium-term (1 month):** Unified BrowserService, auto-launch, consent prompts
3. **Long-term (3 months):** Full OpenClaw integration, deprecate redundant code

By following this roadmap, ClawSuite will have a **best-in-class browser system** that balances automation power with user control and security.

---

**Document Prepared By:** Codex Subagent (Browser Strategy Analysis)  
**For Review By:** ClawSuite Core Team  
**Next Review:** After Phase 1 implementation
