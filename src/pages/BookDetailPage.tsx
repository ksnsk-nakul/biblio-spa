import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getBook } from '../api/books'
import { getProgress } from '../api/progress'
import { addToShelf, removeFromShelf } from '../api/shelf'
import { toApiError } from '../api/client'
import BookCover from '../components/BookCover'
import type { Book, ReadingProgress } from '../types'

export default function BookDetailPage() {
  const params = useParams<{ id: string }>()
  const bookId = Number(params.id)
  const navigate = useNavigate()

  const [book, setBook] = useState<Book | null>(null)
  const [progress, setProgress] = useState<ReadingProgress | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOnShelf, setIsOnShelf] = useState(false)
  const [shelfBusy, setShelfBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setError(null)

    Promise.all([getBook(bookId), getProgress(bookId)])
      .then(([bookResult, progressResult]) => {
        if (cancelled) return
        setBook(bookResult)
        setProgress(progressResult)
      })
      .catch((err) => {
        if (!cancelled) setError(toApiError(err).message)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [bookId])

  // The book detail response has no "on shelf" flag of its own — shelf
  // membership isn't exposed on BookResource, so this toggle is
  // optimistic/local rather than reflecting a server-known initial state.
  async function toggleShelf() {
    if (!book) return
    setShelfBusy(true)
    try {
      if (isOnShelf) {
        await removeFromShelf(book.id)
      } else {
        await addToShelf(book.id)
      }
      setIsOnShelf((prev) => !prev)
    } catch (err) {
      setError(toApiError(err).message)
    } finally {
      setShelfBusy(false)
    }
  }

  if (isLoading) return <p className="page-loading">Loading...</p>
  if (error) return <p className="form-error">{error}</p>
  if (!book) return null

  const hasProgress = progress?.cfi != null

  return (
    <div className="page book-detail">
      <div className="book-detail-main">
        <BookCover book={book} />

        <div className="book-detail-info">
          <h1>{book.title}</h1>
          <p className="book-detail-author">{book.author}</p>
          {book.series_name && (
            <p className="book-detail-series">
              {book.series_name}
              {book.volume_number ? ` — Volume ${book.volume_number}` : ''}
            </p>
          )}
          <p className="book-detail-meta">{book.chapter_count} chapters</p>

          <div className="book-detail-actions">
            <button type="button" className="btn btn-primary" onClick={() => navigate(`/read/${book.id}`)}>
              {hasProgress ? 'Continue Reading' : 'Start Reading'}
            </button>
            <button type="button" className="btn" disabled={shelfBusy} onClick={toggleShelf}>
              {isOnShelf ? 'Remove from Shelf' : 'Add to Shelf'}
            </button>
          </div>
        </div>
      </div>

      <Link to="/library" className="book-detail-back">
        &larr; Back to library
      </Link>
    </div>
  )
}
