import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { useFolderContents } from './useFolderContents'
import { deleteFolder, updateFolder } from '../../api/folders'
import { deleteBook, updateBook } from '../../api/books'
import { toApiError } from '../../api/client'
import NewFolderModal from './NewFolderModal'
import RenameModal from './RenameModal'
import MoveModal from './MoveModal'
import ConfirmDialog from '../../components/ConfirmDialog'
import UploadZone from './UploadZone'
import ItemMenu from './ItemMenu'
import type { Book, Folder } from '../../types'

type RenameTarget = { type: 'folder' | 'book'; id: number; name: string }
type MoveTarget = { type: 'folder' | 'book'; id: number }
type DeleteTarget = { type: 'folder' | 'book'; id: number; name: string }

export default function FileManagerPage() {
  const { user } = useAuth()

  if (!user?.is_admin) {
    return (
      <div className="page admin-required">
        <h1>Admin access required</h1>
        <p>You don't have permission to view the file manager.</p>
      </div>
    )
  }

  return <FileManager />
}

function FileManager() {
  const params = useParams<{ folderId?: string }>()
  const navigate = useNavigate()
  const currentFolderId = params.folderId ? Number(params.folderId) : null

  const { folders, books, crumbs, isLoading, error, reload } = useFolderContents(currentFolderId)

  const [showNewFolder, setShowNewFolder] = useState(false)
  const [renameTarget, setRenameTarget] = useState<RenameTarget | null>(null)
  const [moveTarget, setMoveTarget] = useState<MoveTarget | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  function openFolder(folder: Folder) {
    navigate(`/files/${folder.id}`)
  }

  async function handleRenameSubmit(value: string) {
    if (!renameTarget) return
    if (renameTarget.type === 'folder') {
      await updateFolder(renameTarget.id, { name: value })
    } else {
      await updateBook(renameTarget.id, { title: value })
    }
    reload()
  }

  async function handleMove(destinationFolderId: number | null) {
    if (!moveTarget) return
    if (moveTarget.type === 'folder') {
      await updateFolder(moveTarget.id, { parent_id: destinationFolderId })
    } else {
      if (destinationFolderId === null) {
        throw new Error('Books must be inside a folder.')
      }
      await updateBook(moveTarget.id, { folder_id: destinationFolderId })
    }
    reload()
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setActionError(null)
    try {
      if (deleteTarget.type === 'folder') {
        await deleteFolder(deleteTarget.id)
      } else {
        await deleteBook(deleteTarget.id)
      }
      setDeleteTarget(null)
      reload()
    } catch (err) {
      // Surface the API's actual message (e.g. "folder still contains ...")
      // rather than a generic error.
      setActionError(toApiError(err).message)
    }
  }

  return (
    <div className="page file-manager">
      <div className="file-manager-header">
        <Breadcrumbs crumbs={crumbs} />
        <button type="button" className="btn btn-primary" onClick={() => setShowNewFolder(true)}>
          New folder
        </button>
      </div>

      {error && <p className="form-error">{error}</p>}
      {actionError && <p className="form-error">{actionError}</p>}

      {currentFolderId !== null && (
        <UploadZone folderId={currentFolderId} onUploaded={reload} />
      )}

      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <div className="file-grid">
          {folders.map((folder) => (
            <div key={`folder-${folder.id}`} className="file-item" onClick={() => openFolder(folder)}>
              <div className="file-item-icon folder-icon">&#128193;</div>
              <div className="file-item-name">{folder.name}</div>
              <ItemMenu
                onRename={() => setRenameTarget({ type: 'folder', id: folder.id, name: folder.name })}
                onMove={() => setMoveTarget({ type: 'folder', id: folder.id })}
                onDelete={() => setDeleteTarget({ type: 'folder', id: folder.id, name: folder.name })}
              />
            </div>
          ))}

          {books.map((book) => (
            <BookItem
              key={`book-${book.id}`}
              book={book}
              onRename={() => setRenameTarget({ type: 'book', id: book.id, name: book.title })}
              onMove={() => setMoveTarget({ type: 'book', id: book.id })}
              onDelete={() => setDeleteTarget({ type: 'book', id: book.id, name: book.title })}
            />
          ))}

          {!isLoading && folders.length === 0 && books.length === 0 && (
            <p className="empty">This folder is empty.</p>
          )}
        </div>
      )}

      {showNewFolder && (
        <NewFolderModal
          parentId={currentFolderId}
          onClose={() => setShowNewFolder(false)}
          onCreated={reload}
        />
      )}

      {renameTarget && (
        <RenameModal
          title={renameTarget.type === 'folder' ? 'Rename folder' : 'Rename book'}
          label={renameTarget.type === 'folder' ? 'Folder name' : 'Title'}
          initialValue={renameTarget.name}
          onClose={() => setRenameTarget(null)}
          onSubmit={handleRenameSubmit}
        />
      )}

      {moveTarget && (
        <MoveModal
          title={moveTarget.type === 'folder' ? 'Move folder' : 'Move book'}
          allowRoot={moveTarget.type === 'folder'}
          excludeFolderId={moveTarget.type === 'folder' ? moveTarget.id : undefined}
          onClose={() => setMoveTarget(null)}
          onMove={handleMove}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title={deleteTarget.type === 'folder' ? 'Delete folder' : 'Delete book'}
          message={`Are you sure you want to delete "${deleteTarget.name}"? This can't be undone.`}
          confirmLabel="Delete"
          danger
          onConfirm={handleDelete}
          onCancel={() => {
            setDeleteTarget(null)
            setActionError(null)
          }}
        />
      )}
    </div>
  )
}

function Breadcrumbs({ crumbs }: { crumbs: { id: number | null; name: string }[] }) {
  return (
    <nav className="breadcrumbs">
      {crumbs.map((crumb, index) => (
        <span key={crumb.id ?? 'root'}>
          {index > 0 && <span className="breadcrumb-sep"> / </span>}
          {index === crumbs.length - 1 ? (
            <span className="breadcrumb-current">{crumb.name}</span>
          ) : (
            <Link to={crumb.id === null ? '/files' : `/files/${crumb.id}`}>{crumb.name}</Link>
          )}
        </span>
      ))}
    </nav>
  )
}

function BookItem({
  book,
  onRename,
  onMove,
  onDelete,
}: {
  book: Book
  onRename: () => void
  onMove: () => void
  onDelete: () => void
}) {
  // The API stores covers on the private local disk with no public URL or
  // dedicated serving route yet (no storage symlink, cover_path is a raw
  // relative path). Falling back to a placeholder icon rather than guessing
  // at a URL scheme the backend doesn't actually expose.
  return (
    <div className="file-item">
      <div className="file-item-icon book-icon">&#128214;</div>
      <div className="file-item-name">
        {book.title}
        <span className="file-item-subtext">{book.author}</span>
      </div>
      <ItemMenu onRename={onRename} onMove={onMove} onDelete={onDelete} />
    </div>
  )
}
