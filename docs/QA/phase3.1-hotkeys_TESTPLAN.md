# Phase 3.1 — Hotkeys Test Plan

## Prerequisites
- App running on localhost
- Gateway connected

## Test Cases

### T1: Cmd/Ctrl+K — Open Search
1. Press Cmd+K (Mac) or Ctrl+K (Windows)
2. **Expected:** Search modal opens
3. Press Escape
4. **Expected:** Search modal closes

### T2: Cmd/Ctrl+P — Quick Open File
1. Press Cmd+P (Mac) or Ctrl+P (Windows)
2. **Expected:** Search modal opens with "Files" scope selected
3. **Expected:** Browser print dialog does NOT open

### T3: Cmd/Ctrl+B — Toggle Sidebar
1. Navigate to a chat session
2. Press Cmd+B (Mac) or Ctrl+B (Windows)
3. **Expected:** Sidebar collapses
4. Press again
5. **Expected:** Sidebar expands

### T4: Cmd/Ctrl+Shift+L — Activity Log
1. Be on any page (e.g., /chat/main)
2. Press Cmd+Shift+L (Mac) or Ctrl+Shift+L (Windows)
3. **Expected:** Navigates to /activity page

### T5: ? — Help Modal
1. Click outside any input field
2. Press ?
3. **Expected:** Shortcuts modal appears with all shortcuts listed
4. Verify new shortcuts appear: Cmd+P, Cmd+Shift+L
5. Press Escape
6. **Expected:** Modal closes

### T6: No Interference with Input Fields
1. Click into the chat input textbox
2. Press Cmd+P
3. **Expected:** Search modal opens (not print dialog) — Cmd shortcuts work in inputs
4. Type "?" in the input
5. **Expected:** "?" appears in input, help modal does NOT open

### T7: Ctrl+` — Terminal Toggle (regression)
1. Press Ctrl+`
2. **Expected:** Terminal panel toggles (still works)
