import { useEffect, useRef, useState } from 'react'

const CHARS_PER_FRAME = 3 // characters to reveal per animation frame (~180 chars/sec at 60fps)
const FRAME_INTERVAL_MS = 16 // ~60fps

/**
 * Progressively reveals text character-by-character for a typewriter effect.
 * When `enabled` is false, returns the full text immediately.
 * When new text arrives that extends the current text, animates only the new portion.
 */
export function useTypewriter(fullText: string, enabled: boolean): string {
  const [revealedLength, setRevealedLength] = useState(enabled ? 0 : fullText.length)
  const targetLengthRef = useRef(fullText.length)
  const frameRef = useRef<number | null>(null)
  const prevTextRef = useRef(fullText)

  useEffect(() => {
    if (!enabled) {
      setRevealedLength(fullText.length)
      targetLengthRef.current = fullText.length
      prevTextRef.current = fullText
      return
    }

    const prevText = prevTextRef.current
    prevTextRef.current = fullText
    targetLengthRef.current = fullText.length

    // If new text is an extension of previous, keep current revealed position
    // If text changed entirely (e.g. different message), reset
    if (!fullText.startsWith(prevText.slice(0, revealedLength))) {
      setRevealedLength(0)
    }
  }, [fullText, enabled])

  useEffect(() => {
    if (!enabled) return
    if (revealedLength >= targetLengthRef.current) return

    const tick = () => {
      setRevealedLength(prev => {
        const next = Math.min(prev + CHARS_PER_FRAME, targetLengthRef.current)
        if (next >= targetLengthRef.current) {
          frameRef.current = null
          return next
        }
        frameRef.current = window.setTimeout(tick, FRAME_INTERVAL_MS)
        return next
      })
    }

    frameRef.current = window.setTimeout(tick, FRAME_INTERVAL_MS)
    return () => {
      if (frameRef.current !== null) {
        window.clearTimeout(frameRef.current)
        frameRef.current = null
      }
    }
  }, [enabled, revealedLength])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (frameRef.current !== null) {
        window.clearTimeout(frameRef.current)
      }
    }
  }, [])

  if (!enabled) return fullText
  return fullText.slice(0, revealedLength)
}
