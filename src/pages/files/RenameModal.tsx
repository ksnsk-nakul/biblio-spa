import { useState } from 'react'
import type { FormEvent } from 'react'
import Modal from '../../components/Modal'
import { toApiError } from '../../api/client'

interface RenameModalProps {
  title: string
  label: string
  initialValue: string
  onClose: () => void
  onSubmit: (value: string) => Promise<void>
}

export default function RenameModal({ title, label, initialValue, onClose, onSubmit }: RenameModalProps) {
  const [value, setValue] = useState(initialValue)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      await onSubmit(value.trim())
      onClose()
    } catch (err) {
      setError(toApiError(err).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal title={title} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {error && <p className="form-error">{error}</p>}
        <label>
          {label}
          <input type="text" value={value} onChange={(e) => setValue(e.target.value)} required autoFocus />
        </label>
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
