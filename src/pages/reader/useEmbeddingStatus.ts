import { useCallback, useEffect, useRef, useState } from 'react'
import { getBook, triggerBookEmbedding } from '../../api/books'
import type { EmbeddingStatus } from '../../types'

const POLL_INTERVAL_MS = 3500

/**
 * Kicks off lazy embedding for a book on mount (idempotent — safe even if
 * embedding is already processing/ready) and polls the book's status while
 * it's 'none' or 'processing', stopping once it settles on 'ready' or
 * 'failed'. Exposes `retry` to re-trigger embedding after a 'failed' status
 * (TriggerBookEmbedding retries from 'failed' the same way).
 */
export function useEmbeddingStatus(bookId: number) {
  const [status, setStatus] = useState<EmbeddingStatus | null>(null)
  // Bumped on every poll attempt so the polling effect below reruns even
  // when the status string comes back unchanged (e.g. still 'processing') —
  // React bails out of re-running effects when a dependency's value is
  // unchanged, so relying on `status` alone would only ever schedule one poll.
  const [pollTick, setPollTick] = useState(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const kickOff = useCallback(async () => {
    try {
      const next = await triggerBookEmbedding(bookId)
      setStatus(next)
      setPollTick((t) => t + 1)
    } catch {
      // Best-effort trigger; leave status as-is, the user can retry manually.
    }
  }, [bookId])

  useEffect(() => {
    kickOff()
    // Only re-run when the book itself changes; `kickOff` is exposed as a
    // stable `retry` action for user-initiated re-triggers, not an effect dep.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId])

  useEffect(() => {
    if (status !== 'none' && status !== 'processing') return undefined

    let cancelled = false
    timerRef.current = setTimeout(async () => {
      try {
        const book = await getBook(bookId)
        if (cancelled) return
        setStatus(book.embedding_status)
        setPollTick((t) => t + 1)
      } catch {
        if (!cancelled) setPollTick((t) => t + 1) // transient network hiccup, retry next tick
      }
    }, POLL_INTERVAL_MS)

    return () => {
      cancelled = true
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [status, pollTick, bookId])

  return { status, retry: kickOff }
}
