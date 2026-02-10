# Widget Add/Remove MVP

## Behavior

### Adding Widgets
1. Click **+** icon in the dashboard header (between theme toggle and reset)
2. Popover lists all widgets not currently visible
3. Each row shows widget name + tier badge (e.g. "Demo")
4. Click **Add** → widget appears in the grid immediately
5. Popover stays open for adding multiple widgets

### Removing Widgets
1. Hover over any widget card → **⋮** kebab menu appears (top-right, next to drag handle)
2. Click **⋮** → dropdown with "Remove from dashboard"
3. Click "Remove from dashboard" → widget disappears from grid
4. Widget becomes available in the Add popover

### Persistence
- Visible widget set stored in `localStorage` key: `openclaw-dashboard-visible-widgets-v1`
- Survives page reloads and browser restarts
- Independent from grid layout persistence (`openclaw-dashboard-layouts-v2`)

### Reset Layout
- Clicking the **🔄 Reset Layout** button restores:
  - Grid positions → default layout
  - Visible widgets → all widgets visible (default set)

### Edge Cases
- If all widgets are visible, Add popover shows "All widgets are visible"
- Removing all widgets leaves an empty grid (Reset restores them)
- Adding a widget back doesn't restore its previous position — it flows to the next available slot

## Files
- `src/screens/dashboard/hooks/use-visible-widgets.ts` — state + persistence
- `src/screens/dashboard/components/add-widget-popover.tsx` — Add Widget UI
- `src/screens/dashboard/components/dashboard-glass-card.tsx` — kebab menu (onRemove prop)
- `src/screens/dashboard/constants/widget-meta.ts` — widget labels + tiers
