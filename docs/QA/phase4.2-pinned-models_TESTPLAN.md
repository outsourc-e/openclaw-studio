# Phase 4.2 — Pinned Models + Preferred Defaults Test Plan

## Prerequisites
- App running on localhost
- Gateway connected
- Multiple models configured
- Smart Suggestions enabled in Settings

## Test Cases

### Pinned Models

#### T1: Pin a Model
1. Open chat composer
2. Click model switcher dropdown
3. Hover over a model in the provider section
4. Click the ☆ (star) icon
5. **Expected:** Model moves to "📌 Pinned" section at top
6. **Expected:** Star icon changes to ⭐ (filled)

#### T2: Unpin a Model
1. Open model switcher dropdown
2. Click ⭐ icon on a pinned model
3. **Expected:** Model returns to its provider section
4. **Expected:** Star icon changes to ☆ (outline)

#### T3: Pinned Models Persistence
1. Pin 2-3 models
2. Refresh browser
3. Open model switcher dropdown
4. **Expected:** Pinned models still at top in same order

#### T4: Empty Pinned Section
1. Unpin all models
2. Open model switcher dropdown
3. **Expected:** "📌 Pinned" section not shown

#### T5: Pin Multiple Models
1. Pin 5+ models from different providers
2. Open model switcher dropdown
3. **Expected:** All pinned models shown at top
4. **Expected:** Provider sections show only unpinned models

### Preferred Models

#### T6: Set Preferred Budget Model
1. Open Settings → Smart Suggestions
2. Select a model from "Preferred budget model" dropdown
3. **Expected:** Selection saved
4. Refresh browser
5. **Expected:** Selection persists

#### T7: Set Preferred Premium Model
1. Open Settings → Smart Suggestions
2. Select a model from "Preferred premium model" dropdown
3. **Expected:** Selection saved
4. Refresh browser
5. **Expected:** Selection persists

#### T8: Preferred Budget Model Used in Suggestions
1. Set "Preferred budget model" to Gemini Flash
2. Enable Smart Suggestions
3. Start chat on Sonnet
4. Send 3 simple messages
5. **Expected:** Suggestion toast shows "Try Gemini Flash?" (your preferred model)

#### T9: Preferred Premium Model Used in Suggestions
1. Set "Preferred premium model" to Opus
2. Disable "Only suggest cheaper"
3. Start chat on Haiku
4. Send complex code request
5. **Expected:** Suggestion toast shows "Try Opus?" (your preferred model)

#### T10: Fallback When Preferred Not Available
1. Set preferred budget model to a model
2. Uninstall/remove that model from gateway
3. Trigger downgrade suggestion
4. **Expected:** Suggestion falls back to tier-based logic (different model suggested)

### Only Suggest Cheaper

#### T11: Enable "Only Suggest Cheaper"
1. Open Settings → Smart Suggestions
2. Enable "Only suggest cheaper models" toggle
3. **Expected:** Toggle ON, saved to localStorage

#### T12: No Upgrade Suggestions When Enabled
1. Enable "Only suggest cheaper"
2. Start chat on Haiku (budget model)
3. Send complex code request
4. **Expected:** NO suggestion toast appears
5. Disable "Only suggest cheaper"
6. Send another complex request
7. **Expected:** Upgrade suggestion appears

#### T13: Downgrade Still Works
1. Enable "Only suggest cheaper"
2. Start chat on Opus (premium model)
3. Send 3 simple messages
4. **Expected:** Downgrade suggestion appears

### Integration

#### T14: Pin + Prefer Same Model
1. Pin Gemini Flash
2. Set it as preferred budget model
3. Trigger downgrade suggestion
4. Click "Switch" in toast
5. **Expected:** Model switches to Gemini Flash
6. Open model switcher
7. **Expected:** Gemini Flash still pinned and marked active

#### T15: Settings Dropdowns Populate
1. Open Settings → Smart Suggestions
2. **Expected:** Both preferred model dropdowns show all available models
3. **Expected:** "Auto-detect" is first option

#### T16: Cross-Tab Sync
1. Open app in two browser tabs
2. Pin a model in tab 1
3. Refresh tab 2
4. **Expected:** Pinned model appears in tab 2

## Edge Cases

### E1: No Models Available
1. Disconnect gateway or remove all models
2. Open Settings → Smart Suggestions
3. **Expected:** Dropdowns only show "Auto-detect"

### E2: Pin All Models
1. Pin every available model
2. Open model switcher
3. **Expected:** Provider sections empty or hidden
4. **Expected:** All models in Pinned section

### E3: Preferred Model = Current Model
1. Set preferred budget to current model
2. Trigger downgrade suggestion
3. **Expected:** No suggestion (already on preferred model)

## Visual Checks

- Pinned section has clear 📌 emoji header
- Star icons (☆ / ⭐) visible and clickable
- Star icon appears on hover for unpinned models
- Star icon always visible for pinned models
- Preferred model dropdowns styled consistently
- Toggle switches work smoothly
