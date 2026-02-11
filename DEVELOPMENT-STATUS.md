# ClawSuite — Development Status
**Date:** 2026-02-07 00:00 EST
**Repo:** github.com/outsourc-e/openclaw-studio

## Vision
"VSCode for AI Agents" — a desktop app (Tauri) that replaces the OpenClaw Gateway web UI (http://127.0.0.1:18789/) with a full-featured local tool for AI builders. Everything in one place, no extra setup.

---

## Architecture

```
┌─────────────────────────────────────────┐
│  ClawSuite (Tauri Desktop App)    │
│  React + TanStack Router + Tailwind     │
│  Vite dev server on localhost:3000      │
│                                         │
│  ┌─────────┐  ┌──────────┐  ┌────────┐ │
│  │ UI Pages│  │ API Layer│  │ Server │ │
│  │ (React) │→ │ /api/*   │→ │gateway │ │
│  └─────────┘  └──────────┘  │  .ts   │ │
│                              └───┬────┘ │
└──────────────────────────────────┼──────┘
                                   │ WebSocket
                    ┌──────────────▼──────────┐
                    │  OpenClaw Gateway       │
                    │  ws://127.0.0.1:18789   │
                    │  (always running)       │
                    └─────────────────────────┘
```

**Key:** Studio's server layer (`src/server/gateway.ts`) maintains a persistent singleton WebSocket to the Gateway. All UI data flows through `/api/*` routes that proxy Gateway RPC calls.

---

## Git History (Tonight's Session)

| Commit | Description |
|--------|------------|
| `cf2b302` | ChatGPT-style composer (model switcher, voice btn, utility bar) |
| `326f83b` | Dashboard redesign (8 widgets, command center layout) |
| `e8a0805` | Repo cleanup (webclaw→ClawSuite, license, remove sensitive docs) |
| `8069cf9` | Persistent WebSocket, chat UX fixes, 4 dashboard widgets, back nav |
| `87aa0be` | Ship report for v1.0.0 |
| `dd319e0` | README with install instructions |
| Earlier | Phase 1-3: all routes, lint cleanup, Tauri init, data gap fixes |

---

## Feature Status: What's REAL vs What's VISUAL

### ✅ FULLY FUNCTIONAL (real Gateway data)

| Feature | Route | API | Notes |
|---------|-------|-----|-------|
| **Chat** | `/chat/$sessionKey` | `/api/history`, `/api/send-stream` | Real messages, streaming responses, session switching |
| **Session List** | Sidebar | `/api/sessions` | Real sessions with titles, timestamps. UUIDs now filtered. |
| **Session Titles** | Sidebar | `/api/session-title` | Label → derivedTitle → "Session abc123" fallback |
| **Chat Send** | Composer | `/api/send-stream` | Real streaming chat with Gateway agent |
| **Terminal** | `/terminal` | `/api/terminal-*` | Real PTY terminal via Gateway WebSocket |
| **File Explorer** | `/files` | `/api/files`, `/api/paths` | Real file read/write with Monaco editor |
| **Skills Browser** | `/skills` | `/api/skills` | 2,070+ skills from local ClawdHub registry |
| **Cron Manager** | `/cron` | `/api/cron/*` | Real cron job list, toggle, run, view runs |
| **Gateway Ping** | Status indicator | `/api/ping` | Green/red dot in sidebar footer |
| **Gateway Connection** | All pages | `src/server/gateway.ts` | Persistent singleton WebSocket with reconnect + heartbeat |

### ⚠️ PARTIALLY FUNCTIONAL (real data + demo fallback)

| Feature | Route | What's Real | What's Demo |
|---------|-------|-------------|-------------|
| **Dashboard - System Status** | `/dashboard` | Gateway connected status, session count | Uptime (Gateway doesn't expose), current model |
| **Dashboard - Recent Sessions** | `/dashboard` | Session list from `/api/sessions` | Falls back to 2 placeholder sessions if empty |
| **Dashboard - Weather** | `/dashboard` | Live wttr.in API | Location auto-detected (no user config) |
| **Dashboard - Agent Status** | `/dashboard` | Session data from `/api/sessions` | Falls back to 3 demo agents if no sessions |
| **Dashboard - Notifications** | `/dashboard` | Session-derived activity | No real event stream (Gateway doesn't expose) |
| **Memory Viewer** | `/memory` | Reads real memory files | Some mock structure if files don't exist |
| **Agent View Panel** | Right sidebar | Sessions from `/api/sessions` | Falls back to demo swarm agents |
| **Provider Usage** | `/api/provider-usage` | API exists and tries real providers | Requires `OPENROUTER_API_KEY` / `ANTHROPIC_API_KEY` env vars |

### 🎨 VISUAL ONLY (demo/placeholder — needs wiring)

| Feature | Route | What It Shows | What It Needs |
|---------|-------|---------------|---------------|
| **Dashboard - Usage Meter** | `/dashboard` | Donut chart with 79% + model bars | Wire to real provider token usage API |
| **Dashboard - Tasks (Kanban)** | `/dashboard` | 4-column board with sample tasks | Wire to a real task store (Gateway or Supabase) |
| **Dashboard - Cost Tracker** | `/dashboard` | $143.82 daily, sparkline chart | Gateway doesn't expose cost API yet |
| **Dashboard - Time & Date** | `/dashboard` | ✅ Actually works (live clock) | — |
| **Composer - Model Switcher** | `/chat/*` | Dropdown with 5 models | Needs to actually send model override to Gateway RPC |
| **Composer - Voice/TTS** | `/chat/*` | Mic icon button | No voice input/output implemented |
| **Composer - Utility Buttons** | `/chat/*` | +, globe, flash, code icons | No actions wired (web search, quick commands, etc.) |
| **Browser View** | `/browser` | Demo mode placeholder | Gateway needs browser plugin configured |
| **Activity Logs** | `/logs` | "No activity logs yet" | Gateway doesn't expose event stream API |
| **Settings** | `/settings` | 4 sections of UI | Settings don't persist or apply to Gateway |
| **Dashboard - Reset Layout** | `/dashboard` | Button visible | No drag-and-drop grid (react-grid-layout needed) |
| **Dashboard - Add Widget** | `/dashboard` | Button visible | No widget picker modal |

### ❌ NOT BUILT YET

| Feature | Priority | Notes |
|---------|----------|-------|
| **Workflow Builder** | Phase 4 | THE differentiator — visual agent pipeline editor |
| **Multi-Agent Dashboard** | Phase 4 | Real-time view of all running agents across sessions |
| **Plugin System** | Phase 4 | Install/manage Gateway plugins from Studio |
| **Collaboration** | Phase 5 | Multi-user, shared workspaces |
| **Auto-Update** | Pre-ship | Tauri auto-update from GitHub Releases |

---

## Comparison: Gateway Web UI vs Studio

| Capability | Gateway Web UI (:18789) | Studio (:3000) | Gap |
|-----------|------------------------|----------------|-----|
| Chat with agent | ✅ Full | ✅ Full | None |
| Session switching | ✅ | ✅ | None |
| Message streaming | ✅ | ✅ | None |
| File explorer | ❌ | ✅ | Studio advantage |
| Terminal | ❌ | ✅ | Studio advantage |
| Skills browser | ❌ | ✅ | Studio advantage |
| Cron manager | ❌ | ✅ | Studio advantage |
| Memory viewer | ❌ | ✅ | Studio advantage |
| Dashboard/widgets | ❌ | ✅ (partial) | Studio advantage |
| Agent swarm view | ❌ | ✅ (demo mode) | Studio advantage |
| Model switching | ✅ (via /model command) | 🎨 Visual only | **Need to wire** |
| Voice input | ❌ | 🎨 Visual only | Need to implement |
| TTS output | ❌ | ❌ | Need to implement |
| Settings/config | ✅ (via config files) | 🎨 Visual only | **Need to wire** |
| Search | ❌ | ✅ (Cmd+K modal) | Studio advantage |
| Keyboard shortcuts | ❌ | ✅ (? modal) | Studio advantage |

---

## What Needs Wiring (Priority Order)

### P0 — Must Work Before Ship
1. **Model Switcher → Gateway RPC** — Send `session.setModel` or equivalent when user picks a model
2. **Settings → Gateway Config** — At minimum: read current config, allow model/agent changes
3. **Chat composer Send** — Verify streaming works end-to-end in Tauri (no CORS issues)
4. **Token auto-discovery** — Desktop app reads `~/.openclaw/openclaw.json` for Gateway token instead of requiring .env

### P1 — Should Work Before Ship
5. **Provider Usage → Real data** — Wire Usage Meter widget to actual token counts from Gateway
6. **Activity Logs → Event stream** — Subscribe to Gateway events for real-time log feed
7. **Agent View → Real agents** — Replace demo swarm with actual session/agent data
8. **Notifications → Real events** — Session start/end, errors, cron completions

### P2 — Nice to Have
9. **Voice input** — Browser SpeechRecognition API → text → send
10. **TTS output** — Use OpenClaw's TTS tool or Web Speech API for responses
11. **Kanban tasks** — Wire to localStorage at minimum, optionally Gateway/Supabase
12. **Cost tracking** — When Gateway exposes cost API, wire the sparkline
13. **Drag-and-drop dashboard** — react-grid-layout for widget repositioning

---

## Security Audit Status

| Item | Status | Notes |
|------|--------|-------|
| Gateway token in .env | ✅ Gitignored | Never committed to git |
| API keys in source | ✅ Clean | No hardcoded keys |
| License | ✅ Fixed | MIT © Eric (outsourc-e) |
| Webclaw references | ✅ Removed | All renamed to ClawSuite |
| Sensitive docs | ✅ Removed | SHIP-REPORT, BUG-REPORT, etc. gitignored |
| Git history | ⚠️ | Old commits have removed docs (no actual secrets) |
| PAT in remote URL | ⚠️ Local only | Not in repo, but visible in `git remote -v` |
| CORS/auth | ⚠️ | Studio server proxies all requests — no direct browser→Gateway |

---

## Build Artifacts

| Artifact | Location | Size |
|----------|----------|------|
| macOS Universal .app | `releases/v1.0.0/` | 20 MB |
| macOS .zip | `releases/v1.0.0/` | 9.6 MB |
| macOS .dmg | `releases/v1.0.0/` | 45 MB |
| GitHub Actions workflow | `.github/workflows/release.yml` | Local only (can't push, PAT lacks workflow scope) |

---

## Tech Stack
- **Frontend:** React 19, TanStack Router, TanStack Query, Tailwind CSS v4, Framer Motion, Monaco Editor
- **Server:** Vite SSR, Node.js API routes, WebSocket (ws library)
- **Desktop:** Tauri v2 (Rust), universal binary (aarch64 + x86_64)
- **Icons:** @hugeicons/core-free-icons
- **Data:** OpenClaw Gateway RPC over WebSocket
