import { useState } from 'react'
import type { FormEvent } from 'react'
import Modal from '../../components/Modal'
import { createFolder } from '../../api/folders'
import { toApiError } from '../../api/client'
import type { Folder } from '../../types'

interface NewFolderModalProps {
  parentId: number | null
  onClose: () => void
  onCreated: (folder: Folder) => void
}

export default function NewFolderModal({ parentId, onClose, onCreated }: NewFolderModalProps) {
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const folder = await createFolder(name.trim(), parentId)
      onCreated(folder)
      onClose()
    } catch (err) {
      setError(toApiError(err).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal title="New folder" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {error && <p className="form-error">{error}</p>}
        <label>
          Folder name
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
        </label>
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
