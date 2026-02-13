# ClawSuite In-App Onboarding & Feature Tour System

**Version:** 1.0  
**Status:** Design Specification  
**Last Updated:** 2026-02-12

---

## 1. Overview

This specification defines an in-app onboarding and feature discovery system for ClawSuite. The system combines a **first-run interactive walkthrough** with a permanent **feature directory page** to help new and returning users discover and master all capabilities.

### Goals

1. **Reduce time-to-value** — Get new users productive in <5 minutes
2. **Feature discovery** — Make all features visible and accessible
3. **Self-service learning** — Provide on-demand help without leaving the app
4. **Lightweight implementation** — No heavy dependencies, fast load times
5. **Respectful UX** — Easy to skip, replay, or dismiss at any time

---

## 2. System Architecture

### 2.1 Components

The onboarding system consists of three interconnected parts:

```
┌─────────────────────────────────────────┐
│  First-Run Detection & State Management │
│  (localStorage + Zustand store)         │
└──────────────┬──────────────────────────┘
               │
       ┌───────┴────────┐
       │                │
       ▼                ▼
┌──────────────┐  ┌─────────────────┐
│  Interactive │  │  Feature Guide  │
│  Walkthrough │  │  Page (/guide)  │
│  (Spotlight) │  │  (Permanent)    │
└──────────────┘  └─────────────────┘
```

### 2.2 Current State

ClawSuite already has:
- ✅ **OnboardingWizard** component (modal-based, 7 steps)
- ✅ **useOnboardingStore** hook (Zustand)
- ✅ **ONBOARDING_STEPS** configuration
- ✅ **First-run detection** via localStorage

**Enhancement Needed:**
- Add **interactive spotlight tour** (highlights UI elements in context)
- Create **feature guide page** at `/guide` or `/features`
- Expand feature coverage to include all major capabilities
- Add "Show me around" button in settings

---

## 3. Interactive Walkthrough (Spotlight Tour)

### 3.1 User Flow

```
New User Opens ClawSuite
         │
         ▼
   Modal Welcome (current OnboardingWizard)
         │
         ▼
   "Take a Quick Tour" or "Skip"
         │
         ├─── Skip ──> Dashboard (tour available in settings)
         │
         ▼
   Interactive Spotlight Tour
   (highlights actual UI elements)
         │
         ▼
   Tour Complete → Save preference
```

### 3.2 Implementation Approach

**Recommendation:** Custom lightweight overlay system (no external dependencies)

**Why not use a library?**
- Most tour libraries (react-joyride, intro.js, driver.js) add 50-100KB
- ClawSuite already uses Framer Motion (for OnboardingWizard)
- Custom solution: ~5KB, full control over styling/behavior

**Core Mechanism:**
1. **Target elements** have `data-tour-id="feature-name"` attributes
2. **Spotlight overlay** creates a dynamic cutout using CSS `clip-path`
3. **Tooltip component** positions next to highlighted element
4. **Z-index management** ensures spotlight sits above app UI

**Visual Design:**
```
┌─────────────────────────────────────────┐
│  App UI (dimmed with backdrop)          │
│                                         │
│    ┌──────────────────┐                │
│    │ Highlighted      │ ◄── Spotlight  │
│    │ Element          │     cutout     │
│    └──────────────────┘                │
│            │                            │
│            ▼                            │
│    ┌─────────────────────────────┐     │
│    │ ✨ Chat Interface           │     │
│    │ Send messages, attach files │     │
│    │ [Next]  [Skip Tour]         │     │
│    └─────────────────────────────┘     │
└─────────────────────────────────────────┘
```

### 3.3 Tour Steps

**Phase 1: Core Navigation** (5 steps)

| Step | Target Element           | Feature             | Description                                      |
|------|--------------------------|---------------------|--------------------------------------------------|
| 1    | Sidebar nav button       | Navigation          | "Access all features from this sidebar"          |
| 2    | Chat route link          | Chat Interface      | "Start conversations with AI models"             |
| 3    | Dashboard link           | Dashboard           | "Monitor usage, tasks, and system health"        |
| 4    | Search button (⌘K)       | Global Search       | "Press Cmd+K to quickly jump anywhere"           |
| 5    | Settings link            | Preferences         | "Customize theme, models, and providers"         |

**Phase 2: Advanced Features** (7 steps)

| Step | Target Element           | Feature             | Description                                      |
|------|--------------------------|---------------------|--------------------------------------------------|
| 6    | Chat composer            | Voice Input         | "Click mic icon for voice messages"              |
| 7    | Model selector           | Model Switching     | "Switch between GPT-4, Claude, Gemini instantly" |
| 8    | Browser route link       | Browser Automation  | "Launch browser, let AI navigate for you"        |
| 9    | Terminal route link      | Terminal Access     | "Execute shell commands from the UI"             |
| 10   | Skills link              | Skills Marketplace  | "Install vetted AI skills and capabilities"      |
| 11   | Agent Swarm link         | Multi-Agent System  | "Orchestrate specialized agents (coming soon)"   |
| 12   | Activity feed icon       | Real-time Events    | "Watch your AI agents work in real-time"         |

**Phase 3: Completion** (1 step)

| Step | Target Element           | Feature             | Description                                      |
|------|--------------------------|---------------------|--------------------------------------------------|
| 13   | Guide link (/guide)      | Feature Directory   | "Browse all features anytime at /guide"          |

### 3.4 Technical Components

**New Files:**

```
src/
  components/
    tour/
      tour-spotlight.tsx          # Overlay with spotlight cutout
      tour-tooltip.tsx            # Floating tooltip next to target
      tour-provider.tsx           # Context provider for tour state
      tour-steps.ts               # Step definitions
  hooks/
    use-tour.ts                   # Tour state management (Zustand)
  stores/
    tour-store.ts                 # Persist tour progress
```

**Component API:**

```tsx
// tour-provider.tsx
<TourProvider>
  <App />
</TourProvider>

// Any component can trigger tour
const { startTour } = useTour()

// Mark elements as tour targets
<button data-tour-id="chat-button">
  Chat
</button>
```

**Store Schema:**

```ts
type TourState = {
  isActive: boolean           // Tour currently running
  currentStep: number         // 0-indexed step
  totalSteps: number          // Total tour steps
  completed: boolean          // User finished full tour
  dismissed: boolean          // User skipped tour
  lastSeen: string | null     // ISO timestamp
  
  // Actions
  startTour: () => void
  nextStep: () => void
  prevStep: () => void
  skipTour: () => void
  completeTour: () => void
  resetTour: () => void       // For "show me around" button
}
```

---

## 4. Feature Directory Page

### 4.1 Route & Navigation

**URL:** `/guide` or `/features`  
**Access:** 
- Sidebar navigation link (always visible)
- Post-tour CTA
- Settings → "Help & Resources" section

**Sidebar Position:** Below "Dashboard", above "Settings"

### 4.2 Page Structure

```
┌────────────────────────────────────────────────┐
│  ClawSuite Feature Guide                       │
│  "Everything you can do with ClawSuite"        │
├────────────────────────────────────────────────┤
│  [Search features...]                          │
├────────────────────────────────────────────────┤
│                                                │
│  ┌──────────────────────────────────────────┐ │
│  │ 💬 Chat & Conversations                  │ │
│  │ ───────────────────────────              │ │
│  │ • Send messages with any AI model        │ │
│  │ • Attach files, images, code snippets    │ │
│  │ • Voice input (click microphone icon)    │ │
│  │ • Edit & regenerate messages             │ │
│  │ • Multi-session management               │ │
│  │ [Screenshot placeholder]                 │ │
│  │ [Try it now →]                           │ │
│  └──────────────────────────────────────────┘ │
│                                                │
│  ┌──────────────────────────────────────────┐ │
│  │ 🤖 Agent Swarm / Living Office           │ │
│  │ ───────────────────────────              │ │
│  │ • Multi-agent orchestration              │ │
│  │ • Visualize agent relationships          │ │
│  │ • Spawn specialized sub-agents           │ │
│  │ [Screenshot placeholder]                 │ │
│  │ [View Agents →]                          │ │
│  └──────────────────────────────────────────┘ │
│                                                │
│  (more sections...)                            │
└────────────────────────────────────────────────┘
```

### 4.3 Feature Cards

Each feature card includes:

1. **Icon + Title** — Consistent with sidebar icons
2. **Short description** — 1 sentence value prop
3. **Capability list** — 3-5 bullet points
4. **Screenshot placeholder** — `<div>` with gray background + icon
5. **Action button** — "Try it now" → navigates to feature
6. **Tips section** (collapsible) — Power user shortcuts/tricks

**Example Card:**

```tsx
<FeatureCard
  id="chat"
  icon={Message01Icon}
  title="Chat & Conversations"
  description="Natural language interface to any AI model"
  capabilities={[
    "Send messages with any provider (OpenAI, Anthropic, Google)",
    "Attach files, images, and code snippets",
    "Voice input via microphone",
    "Edit and regenerate messages",
    "Multi-session management with history"
  ]}
  tips={[
    "Press Cmd+K to search all sessions",
    "Use @file.txt to reference workspace files",
    "Double-click a message to edit it"
  ]}
  screenshot="/screenshots/chat.png"
  action={{ label: "Start Chatting", href: "/chat/main" }}
/>
```

### 4.4 Feature Coverage

**All Features (alphabetical):**

1. **Activity Feed**
   - Real-time event stream from Gateway WebSocket
   - Filter by event type (messages, tool calls, errors)
   - Export logs for debugging

2. **Agent Swarm / Living Office**
   - Multi-agent orchestration for complex workflows
   - Visual graph of agent relationships
   - Spawn specialized sub-agents on demand

3. **Browser Automation**
   - Launch headless or headful browser
   - Let AI navigate, fill forms, scrape data
   - Session handoff (manual → agent control)
   - Screenshot capture and analysis

4. **Chat Interface**
   - Send messages to any AI model
   - Model selection (GPT-4, Claude, Gemini, etc.)
   - Voice input (microphone button)
   - Attachment support (drag & drop files)
   - Message editing & regeneration
   - Session history & search

5. **Dashboard**
   - Widget-based layout (drag to reorder)
   - Usage meter (cost tracking across providers)
   - Active tasks widget
   - Agent status overview
   - Quick action buttons
   - Customizable widget visibility

6. **Files & Workspace**
   - Browse workspace files
   - Code editor (Monaco) with syntax highlighting
   - Upload, download, delete files
   - Integration with chat (@file.txt references)

7. **Memory Viewer**
   - Inspect agent memory state
   - View conversation history
   - Clear memory or export for analysis

8. **Settings**
   - Theme selection (light/dark/system)
   - Accent color (orange/purple/blue/green)
   - Provider configuration wizard
   - Gateway URL customization
   - Display preferences

9. **Skills Marketplace**
   - Browse ClawdHub skill library
   - Install skills with one click
   - Security scanning before install
   - Manage installed skills

10. **Task System**
    - Create tasks with deadlines
    - Priority levels (low/medium/high)
    - Reminder notifications
    - Mark complete or snooze
    - Integration with dashboard widget

11. **Terminal**
    - Full PTY support
    - Execute shell commands
    - Tab completion
    - Persistent sessions
    - Copy/paste support

12. **Update System**
    - Auto-check for updates on launch
    - One-click install from UI
    - Release notes display
    - Version history

### 4.5 Component Structure

**New Files:**

```
src/
  routes/
    guide.tsx                   # Route definition
  screens/
    guide/
      guide-screen.tsx          # Main page layout
      components/
        feature-card.tsx        # Individual feature card
        feature-grid.tsx        # Responsive grid layout
        feature-search.tsx      # Search/filter bar
        screenshot-placeholder.tsx  # Placeholder for missing images
  lib/
    features.ts                 # Feature metadata (icons, descriptions, etc.)
```

**Route Registration:**

```tsx
// src/routes/guide.tsx
import { createFileRoute } from '@tanstack/react-router'
import { GuideScreen } from '@/screens/guide/guide-screen'
import { usePageTitle } from '@/hooks/use-page-title'

export const Route = createFileRoute('/guide')({
  component: function GuideRoute() {
    usePageTitle('Feature Guide')
    return <GuideScreen />
  },
})
```

**Feature Metadata:**

```ts
// src/lib/features.ts
export type Feature = {
  id: string
  icon: IconType
  title: string
  description: string
  capabilities: string[]
  tips?: string[]
  screenshot?: string
  action: {
    label: string
    href: string
  }
  category: 'core' | 'advanced' | 'power-user'
}

export const FEATURES: Feature[] = [
  {
    id: 'chat',
    icon: Message01Icon,
    title: 'Chat & Conversations',
    description: 'Natural language interface to any AI model',
    capabilities: [
      'Send messages with any provider (OpenAI, Anthropic, Google)',
      'Attach files, images, and code snippets',
      // ...
    ],
    tips: [
      'Press Cmd+K to search all sessions',
      // ...
    ],
    screenshot: '/screenshots/chat.png',
    action: { label: 'Start Chatting', href: '/chat/main' },
    category: 'core',
  },
  // ... other features
]
```

---

## 5. First-Run Detection

### 5.1 Current Implementation

**Storage Key:** `openclaw-onboarding-complete`  
**Mechanism:** `localStorage.getItem()` on app mount  
**State Management:** `useOnboardingStore` (Zustand)

**Existing Flow:**
```
App Mount → useOnboardingStore.initialize()
         → Check localStorage
         → If not completed, open modal wizard
```

### 5.2 Enhanced Detection

**New Storage Keys:**

```ts
const STORAGE_KEYS = {
  ONBOARDING_COMPLETE: 'openclaw-onboarding-complete',    // Modal wizard
  TOUR_COMPLETE: 'openclaw-tour-complete',               // Spotlight tour
  LAST_VERSION_SEEN: 'openclaw-last-version',            // For update tours
  GUIDE_VISITED: 'openclaw-guide-visited',               // Analytics
}
```

**Version-Based Re-Tours:**

When ClawSuite ships a major feature, show a mini-tour for just that feature:

```ts
const CURRENT_VERSION = '2.2.0'
const lastSeen = localStorage.getItem('openclaw-last-version')

if (lastSeen !== CURRENT_VERSION) {
  // Show "What's New" modal or mini-tour
  showWhatsNew()
  localStorage.setItem('openclaw-last-version', CURRENT_VERSION)
}
```

### 5.3 Settings Integration

**New Settings Section:** "Help & Resources"

```tsx
<SettingsSection title="Help & Resources">
  <SettingRow
    label="Show Welcome Tour"
    description="Replay the interactive feature tour"
    action={
      <Button onClick={() => useTourStore.getState().resetTour()}>
        Show Tour
      </Button>
    }
  />
  <SettingRow
    label="Feature Guide"
    description="Browse all features and capabilities"
    action={
      <Button onClick={() => navigate({ to: '/guide' })}>
        Open Guide
      </Button>
    }
  />
  <SettingRow
    label="Reset Onboarding"
    description="See the first-run wizard again"
    action={
      <Button
        variant="ghost"
        onClick={() => {
          useOnboardingStore.getState().reset()
          window.location.reload()
        }}
      >
        Reset
      </Button>
    }
  />
</SettingsSection>
```

---

## 6. Implementation Plan

### Phase 1: Spotlight Tour System (Week 1)

**Day 1-2: Core Infrastructure**
- [ ] Create `tour-store.ts` (Zustand)
- [ ] Create `tour-spotlight.tsx` (overlay component)
- [ ] Create `tour-tooltip.tsx` (floating tooltip)
- [ ] Add `data-tour-id` attributes to key UI elements

**Day 3-4: Tour Steps**
- [ ] Define all 13 tour steps in `tour-steps.ts`
- [ ] Implement step navigation (next/prev/skip)
- [ ] Add keyboard shortcuts (Enter, Escape, Backspace)

**Day 5: Integration**
- [ ] Connect tour to existing OnboardingWizard
- [ ] Add "Take a Tour" button after modal wizard
- [ ] Test on all screen sizes (mobile, tablet, desktop)

### Phase 2: Feature Guide Page (Week 2)

**Day 1-2: Page Structure**
- [ ] Create `/guide` route
- [ ] Build `GuideScreen` layout
- [ ] Implement search/filter bar

**Day 3-4: Feature Cards**
- [ ] Create `FeatureCard` component
- [ ] Define all 12 features in `features.ts`
- [ ] Design screenshot placeholders

**Day 5: Polish**
- [ ] Add sidebar link to Guide page
- [ ] Test navigation from feature cards
- [ ] Add responsive grid layout

### Phase 3: Settings & Cleanup (Week 3)

**Day 1-2: Settings Integration**
- [ ] Add "Help & Resources" section
- [ ] Wire up "Show Tour" button
- [ ] Add "Reset Onboarding" option

**Day 3-4: Documentation**
- [ ] Update README with onboarding info
- [ ] Create CONTRIBUTING section for adding features
- [ ] Add screenshots to `/public/screenshots/`

**Day 5: QA & Launch**
- [ ] Test full onboarding flow (new user)
- [ ] Test tour replay (returning user)
- [ ] Test feature guide search

---

## 7. Design System

### 7.1 Visual Consistency

**Colors:**
- Spotlight backdrop: `rgba(0, 0, 0, 0.6)` (dark) / `rgba(255, 255, 255, 0.8)` (light)
- Tooltip background: `--primary-50` (matches modal wizard)
- Tooltip border: `--primary-200`
- Action button: `--accent-500` (orange by default)

**Typography:**
- Tour title: `text-2xl font-semibold`
- Tour description: `text-base leading-relaxed`
- Feature card title: `text-xl font-bold`
- Feature card body: `text-sm text-primary-600`

**Icons:**
- Use existing HugeIcons library
- Consistent icon sizing: `size-5` (20px) for inline, `size-10` (40px) for cards

### 7.2 Animation

**Framer Motion Variants:**

```ts
const spotlightVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.2 } }
}

const tooltipVariants = {
  hidden: { opacity: 0, y: 10, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', damping: 20, stiffness: 300 }
  },
  exit: { opacity: 0, scale: 0.95 }
}
```

**Performance:**
- Use `will-change: transform` on animated elements
- Debounce spotlight positioning on window resize
- Lazy-load feature guide images

---

## 8. Accessibility

### 8.1 Keyboard Navigation

**Tour Controls:**
- `Enter` — Next step
- `Escape` — Skip tour
- `Backspace` — Previous step
- `Tab` — Focus action button

**Screen Reader Support:**
- ARIA live regions for tour step announcements
- `aria-describedby` linking tooltip to target element
- Focus management (trap focus in tooltip during tour)

### 8.2 Reduced Motion

Respect `prefers-reduced-motion`:

```tsx
const shouldReduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

const tooltipVariants = shouldReduceMotion
  ? { hidden: { opacity: 0 }, visible: { opacity: 1 } }
  : { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }
```

---

## 9. Analytics & Metrics

### 9.1 Events to Track

**Onboarding Events:**
- `onboarding_modal_shown` — Modal wizard displayed
- `onboarding_modal_completed` — User finished all modal steps
- `onboarding_modal_skipped` — User clicked skip

**Tour Events:**
- `tour_started` — Spotlight tour initiated
- `tour_step_viewed` — User reached step N
- `tour_completed` — User finished all tour steps
- `tour_skipped` — User clicked skip
- `tour_replayed` — User clicked "Show Tour" in settings

**Guide Events:**
- `guide_visited` — User navigated to /guide
- `guide_feature_viewed` — User clicked on feature card
- `guide_search_used` — User typed in search bar

### 9.2 Implementation

**Client-Side Only (Privacy-Preserving):**

```ts
// lib/analytics.ts
export function trackEvent(event: string, properties?: Record<string, any>) {
  if (!window.localStorage.getItem('analytics-consent')) return
  
  const payload = {
    event,
    properties,
    timestamp: new Date().toISOString(),
    version: import.meta.env.VITE_APP_VERSION
  }
  
  // Store locally for debugging (no external sending)
  const events = JSON.parse(localStorage.getItem('analytics-events') || '[]')
  events.push(payload)
  localStorage.setItem('analytics-events', JSON.stringify(events.slice(-100)))
  
  console.log('[Analytics]', event, properties)
}
```

---

## 10. Future Enhancements

### 10.1 Contextual Tooltips

Show inline tooltips when user hovers over new features:

```tsx
<Tooltip content="New! Voice input for chat">
  <Button data-feature="voice-input">
    <MicrophoneIcon />
  </Button>
</Tooltip>
```

**Storage:** `openclaw-feature-tooltips-seen` (JSON array of seen feature IDs)

### 10.2 Interactive Playground

Embed live demos in feature guide:

```tsx
<FeatureCard id="chat">
  <LiveDemo>
    <ChatComposer readonly demo />
  </LiveDemo>
</FeatureCard>
```

### 10.3 Video Walkthroughs

Add optional video embeds for complex features:

```tsx
<FeatureCard id="agent-swarm">
  <VideoPlayer src="/videos/agent-swarm-intro.mp4" />
</FeatureCard>
```

### 10.4 Progressive Disclosure

Show advanced features only after user completes basic tour:

```ts
const tourState = useTourStore()

if (tourState.completed && !tourState.advancedTourCompleted) {
  // Show "Ready for advanced features?" modal
}
```

---

## 11. Success Metrics

### 11.1 Adoption Goals

**Week 1:**
- 70% of new users complete modal wizard
- 50% of new users complete spotlight tour
- 30% of new users visit guide page

**Week 4:**
- 80% onboarding completion rate
- 60% tour completion rate
- 50% guide page visit rate
- <5% users immediately reset onboarding (indicates good UX)

### 11.2 Qualitative Feedback

**Survey Questions (after tour completion):**
1. "Did the tour help you understand ClawSuite's features?" (1-5 stars)
2. "What feature are you most excited to try?" (free text)
3. "Anything confusing or missing?" (free text)

---

## 12. Open Questions

1. **Screenshot Strategy:** Real screenshots vs. illustrated mockups?
   - Recommendation: Use real screenshots, update with each UI change
   - Fallback: SVG illustrations that match theme

2. **Tour Triggering:** Auto-start after modal, or separate button?
   - Recommendation: Offer choice in modal: "Take Tour" vs. "Explore on My Own"

3. **Mobile Support:** How does spotlight tour work on mobile?
   - Recommendation: Simplified tour with bottom-sheet tooltips instead of spotlight

4. **Localization:** Support multiple languages?
   - Recommendation: Phase 2 — extract all strings to i18n files

---

## 13. References

### 13.1 Existing Code

- `src/components/onboarding/onboarding-wizard.tsx` — Current modal wizard
- `src/hooks/use-onboarding.ts` — Onboarding state management
- `src/components/onboarding/onboarding-steps.ts` — Step definitions

### 13.2 Inspiration

- **Linear** — Inline tooltips for new features
- **Notion** — Feature guide page with searchable cards
- **Raycast** — Keyboard-first tour with spotlight
- **Figma** — Context-aware help panel

### 13.3 Design Resources

- Feature icons: [HugeIcons](https://hugeicons.com/)
- Animation: [Framer Motion](https://www.framer.com/motion/)
- Spotlight library reference (for research): [driver.js](https://driverjs.com/)

---

## 14. Appendix: Component Code Sketches

### 14.1 TourSpotlight Component

```tsx
// src/components/tour/tour-spotlight.tsx
import { motion } from 'motion/react'
import { useTour } from '@/hooks/use-tour'
import { useEffect, useState } from 'react'

export function TourSpotlight() {
  const { isActive, currentStep, steps } = useTour()
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)

  useEffect(() => {
    if (!isActive) return

    const step = steps[currentStep]
    const target = document.querySelector(`[data-tour-id="${step.targetId}"]`)
    
    if (target) {
      setTargetRect(target.getBoundingClientRect())
    }
  }, [isActive, currentStep, steps])

  if (!isActive || !targetRect) return null

  // Create clip-path for spotlight effect
  const clipPath = `
    polygon(
      0% 0%,
      0% 100%,
      ${targetRect.left}px 100%,
      ${targetRect.left}px ${targetRect.top}px,
      ${targetRect.right}px ${targetRect.top}px,
      ${targetRect.right}px ${targetRect.bottom}px,
      ${targetRect.left}px ${targetRect.bottom}px,
      ${targetRect.left}px 100%,
      100% 100%,
      100% 0%
    )
  `

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[999] bg-ink/60 backdrop-blur-sm"
      style={{ clipPath }}
    />
  )
}
```

### 14.2 FeatureCard Component

```tsx
// src/screens/guide/components/feature-card.tsx
import { HugeiconsIcon } from '@hugeicons/react'
import { Button } from '@/components/ui/button'
import { useNavigate } from '@tanstack/react-router'
import type { Feature } from '@/lib/features'

export function FeatureCard({ feature }: { feature: Feature }) {
  const navigate = useNavigate()

  return (
    <div className="rounded-xl border border-primary-200 bg-primary-50 p-6 shadow-sm transition-shadow hover:shadow-md">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <div className="flex size-12 items-center justify-center rounded-lg bg-accent-500 text-white">
          <HugeiconsIcon icon={feature.icon} className="size-6" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-primary-900">{feature.title}</h3>
          <p className="text-sm text-primary-600">{feature.description}</p>
        </div>
      </div>

      {/* Capabilities */}
      <ul className="mb-4 space-y-2">
        {feature.capabilities.map((capability, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-primary-700">
            <span className="mt-1 text-accent-500">•</span>
            <span>{capability}</span>
          </li>
        ))}
      </ul>

      {/* Screenshot Placeholder */}
      {feature.screenshot && (
        <div className="mb-4 flex h-48 items-center justify-center rounded-lg bg-primary-100">
          <HugeiconsIcon icon={feature.icon} className="size-16 text-primary-300" />
        </div>
      )}

      {/* Action Button */}
      <Button
        onClick={() => navigate({ to: feature.action.href })}
        className="w-full"
      >
        {feature.action.label}
      </Button>

      {/* Collapsible Tips */}
      {feature.tips && feature.tips.length > 0 && (
        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-medium text-primary-700">
            💡 Pro Tips
          </summary>
          <ul className="mt-2 space-y-1 pl-4">
            {feature.tips.map((tip, i) => (
              <li key={i} className="text-xs text-primary-600">
                {tip}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}
```

---

**End of Specification**

For implementation questions, contact: [project maintainer]  
For design feedback, open an issue: [GitHub repo]
