import { useEffect, useRef, useState } from 'react'
import { streamBookChat } from '../../api/chat'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'error'
  content: string
}

let nextId = 0
function makeId(): string {
  nextId += 1
  return `msg-${nextId}`
}

export default function ChatPanel({ bookId, onClose }: { bookId: number; onClose: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)

  const listRef = useRef<HTMLDivElement>(null)
  const controllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
  }, [messages])

  useEffect(() => {
    return () => controllerRef.current?.abort()
  }, [])

  function handleSend() {
    const trimmed = input.trim()
    if (!trimmed || isStreaming) return

    const userMessage: ChatMessage = { id: makeId(), role: 'user', content: trimmed }
    const assistantId = makeId()

    setMessages((prev) => [...prev, userMessage, { id: assistantId, role: 'assistant', content: '' }])
    setInput('')
    setIsStreaming(true)

    controllerRef.current = streamBookChat(bookId, trimmed, {
      onDelta: (delta) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + delta } : m)),
        )
      },
      onDone: () => {
        setIsStreaming(false)
      },
      onError: (message) => {
        // Leave the (possibly empty) assistant bubble as-is and append a
        // distinct error bubble, rather than clearing anything already sent.
        setMessages((prev) => [...prev, { id: makeId(), role: 'error', content: message }])
        setIsStreaming(false)
      },
    })
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="chat-panel">
      <div className="chat-panel-header">
        <h3>Ask about this book</h3>
        <button type="button" className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Close chat">
          &times;
        </button>
      </div>

      <div ref={listRef} className="chat-panel-messages">
        {messages.length === 0 && <p className="chat-panel-empty">Ask a question about what you've read so far.</p>}

        {messages.map((message) => (
          <div key={message.id} className={`chat-bubble chat-bubble-${message.role}`}>
            {message.content || (message.role === 'assistant' ? '…' : '')}
          </div>
        ))}
      </div>

      <div className="chat-panel-input">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a question..."
          rows={2}
        />
        <button type="button" className="btn btn-primary" onClick={handleSend} disabled={isStreaming || !input.trim()}>
          {isStreaming ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  )
}
