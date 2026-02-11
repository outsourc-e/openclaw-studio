# OpenClaw Gateway WebSocket Protocol Analysis
*Reverse-engineered from control-ui source (2026-02-11)*

## Core Architecture

The gateway uses a JSON-RPC-like protocol over WebSocket with three frame types:
- `req` — client → server request (with `id`, `method`, `params`)
- `res` — server → client response (with `id`, matching request)
- `evt` — server → client event (pushed, no request needed)

## Authentication Flow

1. Connect to `ws://127.0.0.1:18789`
2. Send connect frame:
```json
{ "type": "req", "id": "<uuid>", "method": "connect", "params": { "token": "<gateway-token>" } }
```
3. Server responds with `res` frame confirming connection
4. After connect, events start flowing automatically (no subscription needed!)

## Key RPC Methods

### `chat.send` — Send a message
```json
{
  "type": "req", "id": "<uuid>", "method": "chat.send",
  "params": {
    "sessionKey": "<session-key>",
    "message": "<text>",
    "deliver": false,
    "idempotencyKey": "<uuid>",
    "attachments": [{ "type": "image", "mimeType": "...", "content": "base64..." }]
  }
}
```
- `deliver: false` means don't deliver to external channels (webchat-only)
- Returns immediately — response comes via `evt` frames

### `chat.history` — Fetch message history
```json
{ "type": "req", "id": "<uuid>", "method": "chat.history", "params": { "sessionKey": "..." } }
```

### `chat.abort` — Stop current generation
```json
{ "type": "req", "id": "<uuid>", "method": "chat.abort", "params": { "sessionKey": "..." } }
```

### `sessions.list` — List sessions
```json
{ "type": "req", "id": "<uuid>", "method": "sessions.list", "params": {} }
```

### `session_status` — Get session status
### `sessions_history` — Get session message history
### `sessions_send` — Send to another session
### `sessions_spawn` — Spawn subagent

## Event Types (pushed via `evt` frames)

### `chat` event — Streaming response
```json
{
  "type": "evt", "event": "chat",
  "payload": {
    "sessionKey": "<key>",
    "runId": "<run-id>",
    "state": "delta" | "final" | "error" | "aborted",
    "message": { "role": "assistant", "content": [{ "type": "text", "text": "..." }] },
    "errorMessage": "..." // only on state: "error"
  }
}
```

**States:**
- `delta` — streaming chunk (partial text, grows incrementally)
- `final` — generation complete
- `error` — generation failed
- `aborted` — user stopped generation

**CRITICAL INSIGHT:** The `delta` state sends the FULL accumulated text so far (not just the new chunk). The control UI does:
```js
if (state === "delta") {
  const text = extractText(message)
  if (!currentStream || text.length >= currentStream.length) {
    chatStream = text  // Replace, not append
  }
}
```

### `agent` event — Tool execution
```json
{
  "type": "evt", "event": "agent",
  "payload": {
    "stream": "tool" | "compaction",
    "sessionKey": "<key>",
    "runId": "<run-id>",
    "data": {
      "toolCallId": "<id>",
      "name": "<tool-name>",
      "phase": "start" | "update" | "result",
      "args": { ... },        // on phase: "start"
      "partialResult": "...",  // on phase: "update"
      "result": "..."          // on phase: "result"
    }
  }
}
```

### `presence` event — User presence
### `cron` event — Cron job updates
### `device.pair.requested` — Device pairing

## How Control UI Renders Chat

1. **Messages array** (`chatMessages`): fetched via `chat.history` on session load
2. **Streaming text** (`chatStream`): set from `delta` events, displayed as in-progress message
3. **Tool calls** (`toolStreamById`): accumulated from `agent` events with `stream: "tool"`, rendered inline
4. **On `final`**: `chatStream` cleared, `chat.history` re-fetched to get the complete message with all tool calls

## What Our SSE Bridge Gets Wrong

1. **No subscription needed** — Events flow automatically after `connect`. Our `chat.subscribe` RPC call doesn't exist.
2. **Event routing** — Events come as `evt` frames with `event: "chat"` or `event: "agent"`. Our bridge listens for `"agent"` events but the streaming text comes via `"chat"` events.
3. **Delta is full text** — We treat chunks as incremental deltas. They're actually full accumulated text replacements.
4. **Tool calls come via `agent` events** — Separate from chat streaming. Need to handle `stream: "tool"` payloads.
5. **Session key filtering** — Events include `sessionKey`; client filters to show only the active session.

## Step-by-Step Plan to Match Gateway 1:1

### Phase 1: Fix the SSE Bridge (server-side)
1. In `gateway-stream.ts`: after `connect`, events flow automatically — remove the fake `chat.subscribe` call
2. In `chat-events.ts`: listen for BOTH `chat` AND `agent` events:
   - `chat` events → forward as SSE `chat` events (with state, message, runId, sessionKey)  
   - `agent` events with `stream: "tool"` → forward as SSE `tool` events

### Phase 2: Fix the Client Store
1. In `gateway-chat-store.ts`: handle `delta` as full-text replacement (not append)
2. Track `chatRunId` — only accept events matching current run
3. On `final` → clear streaming, trigger history refetch for complete message
4. Handle tool events: accumulate by `toolCallId`, render inline

### Phase 3: Wire into Chat Screen
1. Use SSE `chat` events for streaming text display (replace old polling-based streaming)
2. Use SSE `tool` events for real-time tool call display
3. Keep 350ms polling as fallback for initial load and reconnect scenarios
4. On `final` event → refetch history once to get the canonical message

### Phase 4: Message Rendering
1. User messages from Telegram appear in `chat.history` as system events with channel prefix like `[Telegram ...]`
2. The control UI strips these prefixes: `Es()` function removes `[timestamp]` and `[Channel ...]` prefixes
3. Implement same prefix stripping in our message renderer

### Phase 5: Features to Add
- `chat.abort` — wire to a stop button (control UI has this)
- Compaction status display (from `agent` events with `stream: "compaction"`)
- Queue system for rapid messages (control UI queues messages, sends sequentially)
- Session refresh after chat completes

## Gateway Webchat Features We Don't Have
- **Abort/Stop button** — sends `chat.abort` to stop generation
- **Compaction indicator** — shows when context is being compacted
- **Debug/event log** — shows raw gateway events
- **Presence** — shows connected users
- **Message queue** — queues outgoing messages if one is in-flight
