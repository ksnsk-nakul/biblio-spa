import { useRef, useState } from 'react'
import type { DragEvent } from 'react'
import { uploadBook } from '../../api/books'
import { toApiError } from '../../api/client'
import type { Book } from '../../types'

interface UploadZoneProps {
  folderId: number
  onUploaded: (book: Book) => void
}

interface UploadTask {
  id: string
  fileName: string
  progress: number
  error: string | null
  done: boolean
}

export default function UploadZone({ folderId, onUploaded }: UploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [tasks, setTasks] = useState<UploadTask[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFiles(fileList: FileList | null) {
    if (!fileList) return

    Array.from(fileList).forEach((file) => {
      if (!file.name.toLowerCase().endsWith('.epub')) return
      startUpload(file)
    })
  }

  function startUpload(file: File) {
    const id = `${file.name}-${Date.now()}-${Math.random()}`
    setTasks((prev) => [...prev, { id, fileName: file.name, progress: 0, error: null, done: false }])

    uploadBook(file, folderId, (percent) => {
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, progress: percent } : t)))
    })
      .then((book) => {
        setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, progress: 100, done: true } : t)))
        onUploaded(book)
        setTimeout(() => setTasks((prev) => prev.filter((t) => t.id !== id)), 2000)
      })
      .catch((err) => {
        setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, error: toApiError(err).message } : t)))
      })
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragOver(false)
    handleFiles(event.dataTransfer.files)
  }

  return (
    <div className="upload-zone-wrapper">
      <div
        className={`upload-zone ${isDragOver ? 'drag-over' : ''}`}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragOver(true)
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <p>Drag and drop an .epub file here, or click to choose a file.</p>
        <input
          ref={inputRef}
          type="file"
          accept=".epub"
          multiple
          hidden
          onChange={(e) => {
            handleFiles(e.target.files)
            e.target.value = ''
          }}
        />
      </div>

      {tasks.length > 0 && (
        <ul className="upload-task-list">
          {tasks.map((task) => (
            <li key={task.id} className="upload-task">
              <span className="upload-task-name">{task.fileName}</span>
              {task.error ? (
                <span className="form-error">{task.error}</span>
              ) : (
                <div className="upload-progress-track">
                  <div className="upload-progress-fill" style={{ width: `${task.progress}%` }} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
