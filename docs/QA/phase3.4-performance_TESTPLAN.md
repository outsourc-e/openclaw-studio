# Phase 3.4 — Performance & Responsiveness Test Plan

## Prerequisites
- App running on localhost
- Gateway connected
- Activity log with 20+ events

## Test Cases

### T1: Activity Log Streaming
1. Navigate to `/activity` with many events
2. Observe event list rendering
3. Let new events stream in
4. **Expected:** 
   - Smooth rendering (no janky scrolling)
   - Only new events re-render (existing rows don't flicker)
   - No dropped events

### T2: File Explorer Expand/Collapse
1. Open chat with file explorer visible
2. Rapidly click folder expand/collapse
3. **Expected:**
   - Instant response (no lag)
   - Smooth animation
   - No full tree re-render

### T3: Search Typing Performance
1. Open search (Cmd+K)
2. Type rapidly (e.g., "testing searching performance")
3. **Expected:**
   - No dropped keystrokes
   - Smooth filtering (debounced)
   - No UI freeze

### T4: Sessions Selection
1. Sidebar with 5+ sessions
2. Rapidly click between sessions
3. **Expected:**
   - Instant switch
   - No flicker or lag
   - Sidebar sessions don't all re-render

### T5: Build Size (Regression)
1. Compare build output before/after
2. **Expected:**
   - Bundle sizes similar or smaller
   - React.memo adds minimal overhead (~0.1KB)

### T6: Functional Regression
1. Test all optimized components work correctly
2. **Expected:**
   - Activity events render correctly
   - Sessions list works
   - File explorer functions normally
   - Search shows results

## Performance Verification

Use browser DevTools Performance tab:
1. Record interaction (e.g., activity streaming)
2. Check for:
   - Long tasks (should be <50ms)
   - Unnecessary re-renders
   - Frame drops

## Notes

- **Optimization applied:** `React.memo()` on `ActivityEventRow`
- **Already optimized:** `SessionItem` (memo with custom comparator)
- **Already optimized:** File explorer `renderEntry` (useCallback)
- **No change needed:** Search (already uses debounced query)
