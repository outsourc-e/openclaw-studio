# Dashboard Gateway Wiring — Test Plan

## Branch: `phase-dashboard-gateway-wiring`
## Date: 2026-02-10

---

### End-to-End Tests

| # | Scenario | Steps | Expected Result | Status |
|---|----------|-------|----------------|--------|
| 1 | **Gateway ON — System Status** | Load `/dashboard`, check System Status widget | Gateway: "● Connected", Uptime: real value (not "0m"), Model: formatted name (e.g. "Sonnet 4.5"), Session count: real number | ✅ Verified — shows "3m", "Sonnet 4.5", "7" |
| 2 | **Gateway ON — Active Agents** | Load `/dashboard`, check Active Agents widget | Shows real running sessions with model names, progress bars, runtimes | ✅ Verified — shows main session (claude-opus-4-6), cron jobs |
| 3 | **Gateway ON — Usage Meter** | Load `/dashboard`, check Usage Meter | Shows real token counts by provider with cost total | ⚠️ Shows "Loading usage data..." — may be timing issue on cold load |
| 4 | **Gateway ON — Cost Tracker** | Load `/dashboard`, check Cost Tracker | Shows "Period Spend: $82.96", daily/weekly/monthly breakdown, sparkline chart | ✅ Verified |
| 5 | **Gateway ON — Activity Log** | Load `/dashboard`, check Activity Log | Badge: "🟢 Live", shows real gateway events (health, presence, etc.) | ✅ Verified |
| 6 | **Gateway ON — Recent Sessions** | Load `/dashboard`, check Recent Sessions | Shows real sessions with titles and timestamps | ✅ Verified — 5 sessions shown |
| 7 | **Gateway ON — Notifications** | Load `/dashboard`, check Notifications | Shows session lifecycle events with relative timestamps | ✅ Verified |
| 8 | **Gateway OFF — System Status** | Stop gateway, reload `/dashboard` | Gateway: "Disconnected", Uptime: "—", Model: "—", Session count: 0 | ⏳ Not tested |
| 9 | **Gateway OFF — Activity Log** | Stop gateway, check Activity Log | "Gateway disconnected — Reconnect to see live events." + Retry button (gray, not red) | ⏳ Not tested |
| 10 | **Gateway OFF — All widgets** | Stop gateway, check all API widgets | Usage Meter: error state. Cost Tracker: error state. Agents: empty state. | ⏳ Not tested |
| 11 | **2+ sessions running** | Have main + cron sessions active | Active Agents shows both with correct models and runtimes | ✅ Verified — main (opus-4-6) + 3 cron jobs shown |
| 12 | **Model switch** | Change model via session, reload | System Status "Current model" updates to new model name | ⏳ Not tested |

### Build + Security

| Check | Result |
|-------|--------|
| `npm run build` | ✅ Zero errors (1.02s) |
| `grep -RIn "apiKey\|secret\|password" src/screens/dashboard/` | ✅ Clean — no secrets |
| No auth tokens in API responses to browser | ✅ Server routes sanitize via `usage-cost.ts` SENSITIVE_PATTERN |

### Data Source Verification

| Widget | Expected Source | Actual Source | Match? |
|--------|----------------|---------------|--------|
| System Status — model | `session.status` → `sessions.defaults.model` | `GET /api/session-status` → `payload.sessions.defaults.model` | ✅ |
| System Status — uptime | `session.status` → `sessions.recent[0].age` | `GET /api/session-status` → `payload.sessions.recent[0].age` (ms→s) | ✅ |
| System Status — count | `session.status` → `sessions.count` | `GET /api/session-status` → `payload.sessions.count` | ✅ |
| System Status — connected | `ping` → `ok` | `GET /api/ping` → `ok` | ✅ (unchanged) |
| Active Agents | `sessions.list` | `GET /api/sessions` | ✅ (unchanged) |
| Usage Meter | `sessions.usage` + `usage.status` | `GET /api/usage` | ✅ (unchanged) |
| Cost Tracker | `usage.cost` | `GET /api/cost` | ✅ (unchanged) |
| Notifications | `sessions.list` | `GET /api/sessions` | ✅ (unchanged) |
| Activity Log | SSE gateway events | `GET /api/events` (SSE) | ✅ (unchanged) |
