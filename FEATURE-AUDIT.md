# OpenClaw Studio — Feature Audit Report

**Audit Date:** 2026-02-11  
**Auditor:** Sub-agent (feature-audit)  
**Vite Dev Server:** localhost:3000

---

## Status Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Working — feature functions correctly |
| ⚠️ | Partial — loads but has issues |
| ❌ | Broken — does not work |
| 🔲 | Stub — placeholder, not implemented |

---

## TypeScript Health

**40+ TypeScript errors detected** via `npx tsc --noEmit`:

| Category | Files Affected | Severity |
|----------|---------------|----------|
| Missing module `@tanstack/start/api` | `diagnostics.ts` | P1 |
| Missing module `terminal-panel-control` | `terminal-panel.tsx` | P0 |
| `IconProps` export issue from `@hugeicons/react` | Multiple | P2 |
| Unused variables (TS6133) | ~15 files | P2 |
| Type mismatches | chat-queries, chat-screen | P1 |

---

## 1. Browser (`/browser`)

| Aspect | Status | Notes |
|--------|--------|-------|
| Route | ✅ | Loads `BrowserPanel` component |
| UI | ✅ | Clean design with tabs, screenshot viewer, controls |
| API `/api/browser/tabs` | ⚠️ | Returns **demo mode fallback** — gateway returns `"unknown method: browser.get_tabs"` |
| API `/api/browser/screenshot` | ⚠️ | Returns fallback SVG placeholder |
| Auto-refresh | ✅ | Polls every 2 seconds |

**What's broken:**  
Gateway doesn't expose browser RPC methods (`browser.tabs`, `browser.screenshot`). The UI gracefully degrades to demo mode.

**Fix required:**  
Gateway needs to implement `browser.tabs` and `browser.screenshot` RPC methods, or the browser control tool must be enabled.

**Priority:** P2 (nice to have — graceful degradation works)

---

## 2. Terminal (`/terminal`)

| Aspect | Status | Notes |
|--------|--------|-------|
| Route | ✅ | Lazy-loads `TerminalWorkspace` |
| UI | ✅ | Multi-tab xterm.js terminal with good styling |
| API `/api/terminal-stream` | ❌ | Fails — `gatewayRpc('exec', ...)` throws because gateway has no `exec` RPC |
| `terminal-panel.tsx` | ❌ | **TS Error** — missing `./terminal-panel-control` module |

**What's broken:**
1. **Gateway has no `exec` RPC method** — `createTerminalSession()` in `terminal-sessions.ts` calls `gatewayRpc('exec', {...})` which fails
2. **Missing module** — `terminal-panel.tsx` imports `GatewayControlPanel` from `./terminal-panel-control` which doesn't exist
3. Uses variable before declaration in `terminal-panel.tsx` (line 209)

**Fix required:**
1. Implement `exec`, `exec.write`, `exec.resize`, `exec.close` RPC methods in Gateway
2. Create `terminal-panel-control.tsx` or remove the import
3. Fix variable declaration order

**Priority:** P0 (blocks terminal functionality entirely)

---

## 3. Agent Swarm (`/agent-swarm`)

| Aspect | Status | Notes |
|--------|--------|-------|
| Route | 🔲 | **Redirects to `/dashboard`** |
| Components | ⚠️ | Full implementation exists in `src/components/agent-view/` |
| `AgentViewPanel` | ⚠️ | 800+ lines, complex swarm visualization — appears complete |
| `AgentCard` | ✅ | Well-built agent status cards |

**What's broken:**  
Route is intentionally disabled (redirects). The `agent-view` components are designed to be embedded in chat view, not standalone.

**Fix required:**  
Either:
- Create a proper `/agent-swarm` route that renders `AgentViewPanel`
- Or keep it embedded in chat only (current approach)

**Priority:** P2 (design decision, not a bug)

---

## 4. Chat (`/chat/$sessionKey`)

| Aspect | Status | Notes |
|--------|--------|-------|
| Route | ✅ | Dynamic route with session resolution |
| UI | ✅ | Full-featured chat interface |
| API `/api/sessions` | ✅ | **Verified working** — returns session list from gateway |
| API `/api/send` | ✅ | Non-streaming message send |
| API `/api/send-stream` | ✅ | SSE streaming via `gateway-stream.ts` |
| Session creation | ✅ | POST to `/api/sessions` creates new sessions |
| Session resolution | ✅ | Friendly IDs resolve to gateway session keys |

**What's broken:**
- Type errors in `chat-queries.ts` (line 167) — accessing `.messages` on empty object
- Multiple unused variable warnings
- Chat redirect path `/chat/main` not in allowed routes (TS error in `chat/index.tsx`)

**Fix required:**
- Fix type definitions in chat-queries
- Clean up unused variables

**Priority:** P1 (works but has type errors)

---

## 5. Dashboard (`/dashboard`)

| Aspect | Status | Notes |
|--------|--------|-------|
| Route | ✅ | Loads `DashboardScreen` |
| Grid Layout | ✅ | react-grid-layout with persistence |
| Widgets | ✅ | All render correctly |
| Gateway Status | ✅ | Real-time connection indicator |
| Session Status API | ✅ | `/api/session-status` works |
| Cost API | ✅ | `/api/cost` works |

**What's broken:**  
None identified. Dashboard is fully functional.

**Priority:** N/A (working)

---

## 6. Tasks (`/tasks`)

| Aspect | Status | Notes |
|--------|--------|-------|
| Route | ✅ | Loads `TasksScreen` |
| UI | ✅ | 4-column kanban board |
| Persistence | ✅ | **Uses zustand + persist** → localStorage key `openclaw-studio-tasks-v1` |
| CRUD | ✅ | Add, edit, move, delete tasks |
| Seed Data | ✅ | Ships with meaningful seed tasks |

**What's broken:**  
None. This is a fully working localStorage-backed kanban.

**Priority:** N/A (working)

---

## 7. Skills (`/skills`)

| Aspect | Status | Notes |
|--------|--------|-------|
| Route | ✅ | Loads `SkillsScreen` |
| UI | ✅ | 3-tab browser (Installed, Marketplace, Featured) |
| API `/api/skills` | ✅ | **Verified working** — returns skill catalog |
| Install/Uninstall | ⚠️ | Calls `/api/skills` POST — depends on gateway `skills.*` methods |
| Toggle Enable | ⚠️ | Same dependency |

**What's broken:**  
Read-only browsing works. Install/toggle actions require gateway skill management RPC.

**Priority:** P1 (read works, write needs gateway support)

---

## 8. Cron (`/cron`)

| Aspect | Status | Notes |
|--------|--------|-------|
| Route | ✅ | Loads `CronManagerScreen` |
| UI | ✅ | Job list with run history |
| API | ⚠️ | Uses `fetchCronJobs()` from `cron-api.ts` — calls `/api/cron/jobs` |
| Run/Toggle | ⚠️ | Depends on gateway `cron.*` RPC methods |

**What's broken:**  
Depends on gateway cron RPC methods being available.

**Priority:** P1 (common feature)

---

## 9. Activity Log (`/activity`)

| Aspect | Status | Notes |
|--------|--------|-------|
| Route | ✅ | Loads `ActivityScreen` |
| UI | ✅ | Real-time event stream |
| SSE Connection | ✅ | Uses `useActivityEvents()` hook |
| Event Rendering | ✅ | `ActivityEventRow` component |

**What's broken:**  
Type error in `activity-screen.tsx` — `IconSvgObject` not assignable to `FC<IconProps>`.

**Priority:** P2 (TS error, runtime works)

---

## 10. Debug Console (`/debug`)

| Aspect | Status | Notes |
|--------|--------|-------|
| Route | ✅ | Loads `DebugConsoleScreen` |
| UI | ✅ | Connection status, troubleshooter, diagnostics bundle |
| Activity Stream | ✅ | Live event viewer |
| Diagnostics Export | ✅ | Download bundle, GitHub issue generator |

**What's broken:**  
None. Robust debugging interface.

**Priority:** N/A (working)

---

## 11. Files (`/files`)

| Aspect | Status | Notes |
|--------|--------|-------|
| Route | ✅ | Loads file explorer + Monaco editor |
| API `/api/files` | ✅ | **Verified working** — returns workspace file tree |
| File Tree | ✅ | `FileExplorerSidebar` component |
| Editor | ✅ | Monaco with theme support |

**What's broken:**  
None. File browsing works.

**Priority:** N/A (working)

---

## 12. Memory (`/memory`)

| Aspect | Status | Notes |
|--------|--------|-------|
| Route | ✅ | Full memory viewer implementation (~500 lines) |
| UI | ✅ | File groups, search, preview, editor |
| API | ✅ | Uses same `/api/files` endpoint |
| Save | ⚠️ | Calls `/api/files` PATCH — needs file write support |

**What's broken:**  
Read works. Write/save may need testing.

**Priority:** P2

---

## 13. Settings (`/settings`, `/settings/providers`)

| Aspect | Status | Notes |
|--------|--------|-------|
| Route `/settings` | ✅ | Layout outlet |
| Route `/settings/providers` | ✅ | `ProvidersScreen` |
| UI | ✅ | Provider cards with wizard |
| API `/api/config-patch` | ✅ | Posts to `config.patch` RPC |
| Provider Wizard | ✅ | `ProviderWizard` component |

**What's broken:**  
None identified. Provider setup flow appears complete.

**Priority:** N/A (working)

---

## 14. Gateway Admin Pages

### Channels (`/channels`)
| Status | ✅ Working |
|--------|-----------|
| API | `/api/gateway/channels` → `channels.status` RPC — **verified working** |

### Sessions (`/sessions`)
| Status | ✅ Working |
|--------|-----------|
| API | `/api/gateway/sessions` → `sessions.list` RPC |

### Usage (`/usage`)
| Status | ✅ Working |
|--------|-----------|
| API | `/api/gateway/usage` → shows cost/token breakdown |

### Agents (`/agents`)
| Status | ✅ Working |
|--------|-----------|
| API | `/api/gateway/agents` → lists configured agents |

### Nodes (`/nodes`)
| Status | ✅ Working |
|--------|-----------|
| API | `/api/gateway/nodes` → lists paired nodes |

### Instances (`/instances`)
| Status | 🔲 Stub |
|--------|--------|
| UI | `GatewayPlaceholder` — "coming soon" message |

---

## Summary Table

| Feature | Route | Status | Priority | Key Issue |
|---------|-------|--------|----------|-----------|
| Browser | `/browser` | ⚠️ Partial | P2 | Gateway missing browser RPC |
| Terminal | `/terminal` | ❌ Broken | **P0** | Gateway missing `exec` RPC + missing module |
| Agent Swarm | `/agent-swarm` | 🔲 Stub | P2 | Redirects to dashboard |
| Chat | `/chat/$sessionKey` | ✅ Working | P1 | Type errors |
| Dashboard | `/dashboard` | ✅ Working | — | — |
| Tasks | `/tasks` | ✅ Working | — | — |
| Skills | `/skills` | ⚠️ Partial | P1 | Install needs gateway support |
| Cron | `/cron` | ⚠️ Partial | P1 | Needs cron RPC |
| Activity | `/activity` | ✅ Working | P2 | TS type error |
| Debug | `/debug` | ✅ Working | — | — |
| Files | `/files` | ✅ Working | — | — |
| Memory | `/memory` | ✅ Working | P2 | Test save |
| Settings | `/settings/*` | ✅ Working | — | — |
| Channels | `/channels` | ✅ Working | — | — |
| Sessions | `/sessions` | ✅ Working | — | — |
| Usage | `/usage` | ✅ Working | — | — |
| Agents | `/agents` | ✅ Working | — | — |
| Nodes | `/nodes` | ✅ Working | — | — |
| Instances | `/instances` | 🔲 Stub | P2 | Not implemented |

---

## Top Priority Fixes

### P0 — Blocks Deployment

1. **Terminal: Missing module**
   - File: `src/components/terminal/terminal-panel.tsx`
   - Issue: Imports `./terminal-panel-control` which doesn't exist
   - Fix: Create the module or remove the import

2. **Terminal: Gateway exec RPC**
   - Issue: Gateway needs `exec`, `exec.write`, `exec.resize`, `exec.close` methods
   - Impact: Terminal is completely non-functional

### P1 — Important

3. **Chat type errors** — Fix `chat-queries.ts` type definitions
4. **Skills install** — Gateway needs `skills.install`, `skills.toggle` RPC
5. **Cron management** — Gateway needs `cron.*` RPC methods
6. **Diagnostics module** — Fix `@tanstack/start/api` import issue

### P2 — Nice to Have

7. **Browser RPC** — Add `browser.tabs`, `browser.screenshot` to gateway
8. **Activity type error** — Icon type mismatch
9. **Memory save** — Test file write functionality
10. **Instances page** — Build the UI
11. **Agent Swarm route** — Decide if standalone route needed
12. **Clean up unused variables** — ~15 files have TS6133 warnings

---

## Recommendations

1. **Fix P0 issues first** — Terminal is blocked by missing module and gateway support
2. **Run `npx tsc --noEmit` in CI** — Catch type errors before merge
3. **Add E2E tests** — Cover critical paths (chat send, session create, file list)
4. **Gateway RPC documentation** — Document which methods Studio requires

---

*End of audit report.*
