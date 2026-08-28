import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getDashboard } from '../api/dashboard'
import { toApiError } from '../api/client'
import BookCard from '../components/BookCard'
import type { Book, DashboardData } from '../types'

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    getDashboard()
      .then((result) => {
        if (!cancelled) setData(result)
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
  }, [])

  if (isLoading) return <p className="page-loading">Loading...</p>
  if (error) return <p className="form-error">{error}</p>
  if (!data) return null

  return (
    <div className="page dashboard-page">
      <div className="catalog-header">
        <h1>Home</h1>
        <Link to="/library" className="btn btn-primary">
          Browse Library
        </Link>
      </div>

      <DashboardRow
        title="Continue Reading"
        books={data.continue_reading}
        emptyText="Nothing in progress yet — pick a book from the library to get started."
        linkTo={(book) => `/read/${book.id}`}
      />

      <DashboardRow
        title="My Shelf"
        books={data.shelf}
        emptyText="Your shelf is empty — add books from their detail page."
      />
    </div>
  )
}

function DashboardRow({
  title,
  books,
  emptyText,
  linkTo,
}: {
  title: string
  books: Book[]
  emptyText: string
  linkTo?: (book: Book) => string
}) {
  return (
    <section className="dashboard-row">
      <h2>{title}</h2>
      {books.length === 0 ? (
        <p className="empty">{emptyText}</p>
      ) : (
        <div className="dashboard-scroll">
          {books.map((book) => (
            <BookCard key={book.id} book={book} to={linkTo?.(book)} />
          ))}
        </div>
      )}
    </section>
  )
}
