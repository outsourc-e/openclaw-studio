# Phase 4.2 — Pinned Models + Preferred Defaults

**Priority:** P0 Differentiation  
**Branch:** phase4.2-pinned-models  
**Base:** main (v2.0.6)

## Goal

Make model switching and suggestions feel intentional and personal through:
- Quick access to favorite models
- User-defined suggestion targets
- Granular control over suggestion behavior

## Features

### 1. Pinned Models (Model Switcher)

**Location:** Model switcher dropdown (chat composer)

**UX:**
```
┌────────────────────────────────────┐
│ 📌 Pinned                          │
│   ⭐ Claude Sonnet 4.5             │
│   ⭐ Gemini 2.5 Flash              │
├────────────────────────────────────┤
│ Anthropic                          │
│   ☆ Claude Opus 4.6                │
│   ☆ Claude Haiku 3.5               │
├────────────────────────────────────┤
│ Google                             │
│   ☆ Gemini 2.5 Pro                 │
└────────────────────────────────────┘
```

**Interactions:**
- Click star icon → pin/unpin model
- Pinned models show at top of dropdown
- Pinned models persist in localStorage
- Empty pinned section hidden when no pins

**Storage:**
```typescript
localStorage.pinnedModels = JSON.stringify([
  'anthropic/claude-sonnet-4-5',
  'google-antigravity/gemini-2.5-flash'
])
```

### 2. Preferred Models (Settings)

**Location:** Settings → Smart Suggestions section

**New fields:**
```
┌────────────────────────────────────┐
│ Preferred Budget Model             │
│ [Dropdown: All configured models]  │
│                                    │
│ Preferred Premium Model            │
│ [Dropdown: All configured models]  │
│                                    │
│ Only suggest cheaper models        │
│ [Toggle: OFF]                      │
└────────────────────────────────────┘
```

**Settings Schema:**
```typescript
{
  smartSuggestionsEnabled: boolean
  preferredBudgetModel: string // e.g., 'google/gemini-2.5-flash'
  preferredPremiumModel: string // e.g., 'anthropic/claude-opus-4-6'
  onlySuggestCheaper: boolean
}
```

**Defaults:**
- `preferredBudgetModel`: '' (empty, use tier fallback)
- `preferredPremiumModel`: '' (empty, use tier fallback)
- `onlySuggestCheaper`: false

### 3. Updated Smart Suggestions Logic

**Suggestion Priority:**

1. **User's preferred model** (if set and available)
2. **Tier-based fallback** (existing logic)
3. **No suggestion** (if no suitable model found)

**Downgrade suggestion:**
```typescript
function suggestCheaper(currentModel, preferredBudget, availableModels) {
  // Priority 1: User's preferred budget model
  if (preferredBudget && availableModels.includes(preferredBudget)) {
    return preferredBudget
  }
  
  // Priority 2: Tier fallback (existing logic)
  return findModelInTier(provider, 'budget', availableModels)
}
```

**Upgrade suggestion:**
```typescript
function suggestBetter(currentModel, preferredPremium, availableModels) {
  // If "Only suggest cheaper" is enabled, skip upgrades
  if (onlySuggestCheaper) return null
  
  // Priority 1: User's preferred premium model
  if (preferredPremium && availableModels.includes(preferredPremium)) {
    return preferredPremium
  }
  
  // Priority 2: Tier fallback (existing logic)
  return findModelInTier(provider, nextTierUp, availableModels)
}
```

**"Only suggest cheaper" toggle:**
- When enabled: Never suggest upgrades (only downgrades)
- When disabled: Suggest both upgrades and downgrades
- Default: OFF (suggest both)

## Implementation Plan

### New Components

1. **Pinned Models UI** (update existing model switcher)
   - Star icon in model dropdown items
   - "Pinned" section at top
   - Click handler for pin/unpin

2. **Settings Fields** (update settings screen)
   - Preferred Budget Model dropdown
   - Preferred Premium Model dropdown
   - "Only suggest cheaper" toggle

### Storage

**localStorage Schema:**
```typescript
{
  "pinnedModels": [
    "anthropic/claude-sonnet-4-5",
    "google/gemini-2.5-flash"
  ],
  "openclaw-settings": {
    "smartSuggestionsEnabled": false,
    "preferredBudgetModel": "",
    "preferredPremiumModel": "",
    "onlySuggestCheaper": false
  }
}
```

### Updated Hooks

**usePinnedModels** (NEW):
```typescript
export function usePinnedModels() {
  const [pinned, setPinned] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('pinnedModels')
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })
  
  const togglePin = (modelId: string) => {
    setPinned(prev => {
      const next = prev.includes(modelId)
        ? prev.filter(id => id !== modelId)
        : [...prev, modelId]
      localStorage.setItem('pinnedModels', JSON.stringify(next))
      return next
    })
  }
  
  return { pinned, togglePin }
}
```

**useModelSuggestions** (UPDATE):
- Add `preferredBudgetModel`, `preferredPremiumModel`, `onlySuggestCheaper` params
- Update suggestion logic to check preferred models first
- Skip upgrades when `onlySuggestCheaper` is true

## Files to Change

- `src/screens/chat/components/chat-composer.tsx` — Add pinned section to dropdown
- `src/hooks/use-pinned-models.ts` — NEW: Pin/unpin logic
- `src/hooks/use-model-suggestions.ts` — Update with preferred models logic
- `src/hooks/use-settings.ts` — Add new settings fields
- `src/routes/settings/index.tsx` — Add preferred model dropdowns + toggle
- `docs/QA/phase4.2-pinned-models_TESTPLAN.md` — Test steps
- `docs/QA/phase4.2-pinned-models_RESULTS.md` — Test results

## Manual Test Plan

### T1: Pin/Unpin Models
1. Open model switcher dropdown
2. Click star icon on a model
3. **Expected:** Model moves to "Pinned" section at top
4. Click star again
5. **Expected:** Model unpins, returns to provider section

### T2: Pinned Models Persistence
1. Pin 2 models
2. Refresh browser
3. Open model switcher
4. **Expected:** Pinned models still at top

### T3: Set Preferred Budget Model
1. Open Settings → Smart Suggestions
2. Select a model from "Preferred Budget Model" dropdown
3. Enable Smart Suggestions
4. Start on Sonnet, send simple messages
5. **Expected:** Suggestion uses your preferred budget model

### T4: Set Preferred Premium Model
1. Set "Preferred Premium Model" in Settings
2. Start on Haiku, send complex message
3. **Expected:** Suggestion uses your preferred premium model

### T5: "Only Suggest Cheaper" Toggle
1. Enable "Only suggest cheaper models"
2. Start on Haiku, send complex message
3. **Expected:** NO upgrade suggestion
4. Start on Sonnet, send simple messages
5. **Expected:** Downgrade suggestion appears

### T6: Fallback When Preferred Not Available
1. Set preferred budget model to a model not in `/api/models`
2. Trigger downgrade suggestion
3. **Expected:** Falls back to tier-based logic

### T7: Empty Pinned Section
1. Unpin all models
2. Open model switcher
3. **Expected:** "Pinned" section hidden (not shown)

## Security

- No secrets in pinned models list
- No secrets in preferred model settings
- All data stored in localStorage (client-side only)
- Model IDs are not sensitive (publicly visible in UI)

## Risks

- **Low:** Pinned models list could grow large (no limit set)
- **Low:** Preferred models might not be available (fallback handles this)
- **None:** No breaking changes, additive only

## Deferred

- Server-side pin sync across devices (future enhancement)
- Pin reordering via drag-and-drop (UX enhancement)
- Pin limits (e.g., max 5 pinned models)
- Analytics on pin usage

## Success Metrics (Future)

- % of users who pin models
- % of suggestions using preferred models vs fallback
- Adoption rate of "Only suggest cheaper" toggle
