# Phase 3.4 — Performance & Responsiveness

**Priority:** P1  
**Branch:** phase3.4-performance  
**Base:** v2.0.5

## Goal

Targeted performance optimizations to avoid unnecessary re-renders and improve responsiveness.

## Constraints

- **No premature optimization** — Only optimize proven hot spots
- **Measure before and after** — Use React DevTools Profiler
- **No breaking changes** — Pure optimization, no behavior changes

## Identified Hot Spots

### 1. Activity Event List (200+ events)
**Issue:** Re-renders all events on stream update  
**Fix:** Memoize `ActivityEventRow` with `React.memo()`

### 2. Chat Message List
**Issue:** May re-render on unrelated state changes  
**Fix:** Memoize individual message components

### 3. File Explorer Tree
**Issue:** Entire tree re-renders on expand/collapse  
**Fix:** Memoize `FileEntry` components

### 4. Search Results (100+ items)
**Issue:** Re-renders all results on every keystroke  
**Fix:** Already uses `debouncedQuery`, verify memoization

### 5. Sessions Sidebar
**Issue:** Re-renders all sessions on selection change  
**Fix:** Memoize `SessionItem` components

## Optimizations to Apply

### React.memo()
Wrap components that receive stable props:
- `ActivityEventRow`
- `SessionItem` (if not already memoized)
- File tree entry components

### useMemo() / useCallback()
Add only where profiling shows benefit:
- Expensive filters (already have most)
- Event handlers passed to lists

### Scroll Virtualization
**Defer** — Only add if activity log becomes slow with 1000+ events  
(Current max: 200 events, acceptable)

## Files to Change

- `src/screens/activity/components/activity-event-row.tsx` — Add React.memo
- `src/screens/chat/components/sidebar/sidebar-sessions.tsx` — Check/add memo
- `src/components/file-explorer/file-explorer-sidebar.tsx` — Add memo if needed
- `docs/QA/phase3.4-performance_TESTPLAN.md` — Test steps
- `docs/QA/phase3.4-performance_RESULTS.md` — Test results

## Manual Test Plan

### T1: Activity Log Streaming
1. Open /activity with 50+ events
2. Let new events stream in
3. **Expected:** Smooth updates, no janky scrolling

### T2: File Explorer Expand/Collapse
1. Open chat with file explorer
2. Rapidly expand/collapse folders
3. **Expected:** Instant response, no lag

### T3: Search Typing
1. Open search (Cmd+K)
2. Type rapidly
3. **Expected:** No dropped keystrokes, smooth filtering

### T4: Sessions Selection
1. Sidebar with 10+ sessions
2. Rapidly click between sessions
3. **Expected:** Instant switch, no flicker

### T5: Build Size (Regression)
1. Run build
2. Compare bundle sizes
3. **Expected:** No significant increase (React.memo has minimal overhead)

## Security

No security concerns — optimization only, no data handling.

## Risks

- **Low:** React.memo() is safe and standard
- **Regression:** Verify no broken functionality after memoization
- **Over-optimization:** Avoid adding memo everywhere — only hot spots

## Deferred

- Virtual scrolling (not needed yet)
- Code splitting (bundle size is acceptable)
- Service workers (out of scope)
