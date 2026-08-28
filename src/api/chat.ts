import { API_URL } from './client'

/**
 * BookController::chat streams Server-Sent Events, which axios doesn't
 * handle well for incremental reads — so this uses the raw Fetch API with
 * a streaming body reader instead of going through apiClient. Auth still
 * needs to match apiClient's Sanctum SPA convention: cookies via
 * `credentials: 'include'` plus the XSRF-TOKEN cookie echoed back as the
 * X-XSRF-TOKEN header (axios does this automatically via withXSRFToken;
 * here we replicate it by hand since fetch doesn't have that built in).
 */
function readXsrfTokenCookie(): string | undefined {
  const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]*)/)
  return match ? decodeURIComponent(match[1]) : undefined
}

export interface ChatStreamHandlers {
  onDelta: (delta: string) => void
  onDone: () => void
  onError: (message: string) => void
}

/**
 * Streams a single-turn chat response for a book. Frames look like
 * `data: {"delta": "..."}` per token, ending with `data: [DONE]`, or
 * `data: {"error": "..."}` on a mid-stream failure (see
 * BookController::chat). Each SSE frame is delimited by a blank line
 * (`\n\n`); a frame can still arrive split across chunk boundaries, so
 * we buffer and only split off complete frames.
 *
 * Returns an AbortController the caller can use to cancel the stream
 * (e.g. if the user navigates away mid-response).
 */
export function streamBookChat(bookId: number, message: string, handlers: ChatStreamHandlers): AbortController {
  const controller = new AbortController()

  ;(async () => {
    try {
      const response = await fetch(`${API_URL}/api/books/${bookId}/chat`, {
        method: 'POST',
        credentials: 'include',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
          'X-XSRF-TOKEN': readXsrfTokenCookie() ?? '',
        },
        body: JSON.stringify({ message }),
      })

      if (!response.ok || !response.body) {
        const message = await extractErrorMessage(response)
        handlers.onError(message)
        return
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        let frameEnd = buffer.indexOf('\n\n')
        while (frameEnd !== -1) {
          const frame = buffer.slice(0, frameEnd)
          buffer = buffer.slice(frameEnd + 2)

          const finished = handleFrame(frame, handlers)
          if (finished) return

          frameEnd = buffer.indexOf('\n\n')
        }
      }

      // Stream ended without an explicit [DONE] frame (e.g. connection closed
      // early) — treat whatever we've accumulated as the final answer.
      handlers.onDone()
    } catch (err) {
      if (controller.signal.aborted) return
      handlers.onError(err instanceof Error ? err.message : 'The chat request failed.')
    }
  })()

  return controller
}

/** Returns true once a terminal frame ([DONE] or an error) has been handled. */
function handleFrame(frame: string, handlers: ChatStreamHandlers): boolean {
  const line = frame.split('\n').find((l) => l.startsWith('data:'))
  if (!line) return false

  const payload = line.slice('data:'.length).trim()
  if (payload === '[DONE]') {
    handlers.onDone()
    return true
  }

  try {
    const parsed = JSON.parse(payload) as { delta?: string; error?: string }
    if (parsed.error) {
      handlers.onError(parsed.error)
      return true
    }
    if (typeof parsed.delta === 'string') {
      handlers.onDelta(parsed.delta)
    }
  } catch {
    // Malformed frame — ignore rather than corrupting the accumulated message.
  }

  return false
}

async function extractErrorMessage(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { message?: string }
    return data.message ?? 'The chat request failed.'
  } catch {
    return 'The chat request failed.'
  }
}
