# Phase 3.1 — Navigation + Hotkeys

**Priority:** P0 UX  
**Branch:** phase3.1-hotkeys  
**Base:** v2.0.2

## What Already Exists

| Shortcut | Feature | Status |
|----------|---------|--------|
| Cmd/Ctrl+K | Search modal | ✅ Working |
| Ctrl+` | Toggle terminal | ✅ Working |
| ? | Keyboard shortcuts modal | ✅ Working |
| Escape | Close modals/panels | ✅ Working |
| Cmd/Ctrl+P | Quick open file | ❌ Not wired |
| Cmd/Ctrl+B | Toggle sidebar | ❌ Not wired |
| Cmd/Ctrl+Shift+L | Focus activity log | ❌ Not wired |

## What We're Adding

### 1. Cmd/Ctrl+P — Quick Open File
- Opens search modal with `files` scope pre-selected
- Reuses existing SearchModal infrastructure

### 2. Cmd/Ctrl+B — Toggle Sidebar
- Toggles the main navigation sidebar
- Needs to emit event or call store action

### 3. Cmd/Ctrl+Shift+L — Focus Activity Log
- Navigates to /activity page
- If already on /activity, focuses the event list

### 4. Updated Help Modal
- Ensure all shortcuts are listed accurately
- Group by category

## Files Changed

- `src/components/search/search-modal.tsx` — Add Cmd+P handler
- `src/components/keyboard-shortcuts-modal.tsx` — Update shortcut list
- `src/hooks/use-global-shortcuts.ts` — NEW: centralized shortcut handler
- `src/routes/__root.tsx` — Mount global shortcuts hook

## Risks

- Low: All shortcuts use existing UI, no new components
- Browser default shortcuts: Cmd+P (print), Cmd+B (bold) need preventDefault
- Must not fire when typing in input/textarea
