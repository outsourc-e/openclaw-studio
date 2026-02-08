# Phase 0 — UI Honesty Pass (Complete)

**Date:** 2026-02-07
**Branch:** `phase0-trust-fixes` → merged to `main`
**Tag:** `v0.1.1-alpha`

## What Shipped

### P0-001: Demo Badges
- `DashboardGlassCard` gained optional `badge` prop (amber pill)
- Cost Tracker, Usage Meter, Active Agents, Tasks widgets show "Demo" when displaying non-live data
- Notifications widget unchanged (already derives from live session data)

### P0-005: Model Switcher
- Disabled with `opacity-50`, `cursor-not-allowed`
- Label: "Not wired yet" (Gateway is connected; model switching RPC is not)
- Dropdown cannot open via click or keyboard

### P0-006: Voice Input
- Button disabled with visual dimming
- Tooltip: "Coming Soon"

## What This Does NOT Include
- No Gateway RPC wiring
- No new features
- No backend changes
- No CI/CD changes
- No dependency updates

## Files Changed (6)
- `src/screens/dashboard/components/dashboard-glass-card.tsx`
- `src/screens/dashboard/components/cost-tracker-widget.tsx`
- `src/screens/dashboard/components/usage-meter-widget.tsx`
- `src/screens/dashboard/components/agent-status-widget.tsx`
- `src/screens/dashboard/components/tasks-widget.tsx`
- `src/screens/chat/components/chat-composer.tsx`
