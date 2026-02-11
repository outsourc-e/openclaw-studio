# Orchestrator Avatar Spec

## Goal
Create a dynamic avatar for the main orchestrator (Aurora) that lives in the chat header (top-right area, before UsageMeter). It shows the current state of the AI visually.

## States
1. **idle** — Neutral face, subtle breathing animation (scale pulse)
2. **thinking** — Eyes looking up, thought bubble particles, slow pulse glow
3. **working** — Focused expression, typing animation dots below
4. **orchestrating** — Excited expression, connection lines radiating outward (when subagents are active)
5. **listening** — Attentive expression, ear/sound wave indicator

## Component: `src/components/orchestrator-avatar.tsx`
- SVG-based, same pixel art style as PixelAvatar from agent swarm
- Size: 32px (fits in 48px header)
- Colors: Orange theme (#f97316 primary, #1a1a2e dark)
- Tooltip on hover showing state text ("Aurora is thinking...", "Aurora is orchestrating 3 agents...")
- Smooth CSS transitions between states

## State Detection (hook): `src/hooks/use-orchestrator-state.ts`
- Import from chat-screen context or props:
  - `waitingForResponse` → "thinking" state
  - `streaming.isStreaming` → "working" state  
  - Check `useAgentSwarmStore` for active subagents → "orchestrating" state
  - Default → "idle" state
- Priority: orchestrating > working > thinking > idle
- Export: `useOrchestratorState()` returning `{ state, label, activeAgentCount }`

## Integration in `chat-header.tsx`
- Add `<OrchestratorAvatar />` between the title and `<UsageMeter />`
- Pass necessary props or use hooks directly
- Chat header needs new props: `waitingForResponse?: boolean`, `isStreaming?: boolean`

## Integration in `chat-screen.tsx`
- Pass `waitingForResponse` and `streaming.isStreaming` to ChatHeader

## Animation Details
- State transitions: 300ms ease-in-out crossfade
- Idle: gentle 3s breathing scale(1) → scale(1.05) → scale(1)
- Thinking: rotating gradient ring around avatar, 2s loop
- Working: 3 dots below avatar bouncing sequentially
- Orchestrating: pulsing orange glow ring, connection count badge

## Files to create/modify:
1. CREATE `src/components/orchestrator-avatar.tsx`
2. CREATE `src/hooks/use-orchestrator-state.ts`
3. MODIFY `src/screens/chat/components/chat-header.tsx` — add avatar + props
4. MODIFY `src/screens/chat/chat-screen.tsx` — pass streaming/waiting props to header
