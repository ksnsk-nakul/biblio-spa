import { useEffect, useState } from 'react'
import Modal from '../../components/Modal'
import { listFolders } from '../../api/folders'
import { toApiError } from '../../api/client'
import type { Folder } from '../../types'

interface MoveModalProps {
  title: string
  /** Books can't live at the root, so callers can disable that as a target. */
  allowRoot?: boolean
  /** Folder being moved can't be moved into itself. */
  excludeFolderId?: number
  onClose: () => void
  onMove: (destinationFolderId: number | null) => Promise<void>
}

export default function MoveModal({ title, allowRoot = true, excludeFolderId, onClose, onMove }: MoveModalProps) {
  const [browsingId, setBrowsingId] = useState<number | null>(null)
  const [browsingName, setBrowsingName] = useState('Home')
  const [folders, setFolders] = useState<Folder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isMoving, setIsMoving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setIsLoading(true)
    listFolders(browsingId)
      .then((list) => setFolders(list.filter((f) => f.id !== excludeFolderId)))
      .catch((err) => setError(toApiError(err).message))
      .finally(() => setIsLoading(false))
  }, [browsingId, excludeFolderId])

  function enterFolder(folder: Folder) {
    setBrowsingId(folder.id)
    setBrowsingName(folder.name)
  }

  async function handleMoveHere() {
    if (browsingId === null && !allowRoot) return

    setError(null)
    setIsMoving(true)
    try {
      await onMove(browsingId)
      onClose()
    } catch (err) {
      setError(toApiError(err).message)
    } finally {
      setIsMoving(false)
    }
  }

  return (
    <Modal title={title} onClose={onClose}>
      {error && <p className="form-error">{error}</p>}

      <p className="move-modal-location">
        Currently browsing: <strong>{browsingName}</strong>
      </p>

      {browsingId !== null && (
        <button type="button" className="btn btn-ghost" onClick={() => { setBrowsingId(null); setBrowsingName('Home') }}>
          &larr; Back to Home
        </button>
      )}

      <ul className="move-modal-list">
        {isLoading && <li>Loading...</li>}
        {!isLoading && folders.length === 0 && <li className="empty">No subfolders here.</li>}
        {!isLoading &&
          folders.map((folder) => (
            <li key={folder.id}>
              <button type="button" className="move-modal-item" onClick={() => enterFolder(folder)}>
                {folder.name}
              </button>
            </li>
          ))}
      </ul>

      <div className="modal-actions">
        <button type="button" className="btn btn-ghost" onClick={onClose}>
          Cancel
        </button>
        <button
          type="button"
          className="btn btn-primary"
          disabled={isMoving || (browsingId === null && !allowRoot)}
          onClick={handleMoveHere}
        >
          {isMoving ? 'Moving...' : `Move here (${browsingName})`}
        </button>
      </div>
    </Modal>
  )
}
