import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useFolderContents } from './files/useFolderContents'
import { listBooks, searchBooks } from '../api/books'
import BookCard from '../components/BookCard'
import type { Book, Folder } from '../types'

type BrowseMode = 'folder' | 'series'

export default function LibraryPage() {
  const params = useParams<{ folderId?: string }>()
  const navigate = useNavigate()
  const currentFolderId = params.folderId ? Number(params.folderId) : null

  const [mode, setMode] = useState<BrowseMode>('folder')
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 300)
    return () => clearTimeout(timer)
  }, [query])

  const isSearching = debouncedQuery.length > 0

  return (
    <div className="page catalog-page">
      <div className="catalog-header">
        <h1>Library</h1>
        <input
          type="search"
          className="catalog-search"
          placeholder="Search by title, author, or series..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        {!isSearching && (
          <div className="catalog-mode-toggle">
            <button
              type="button"
              className={mode === 'folder' ? 'btn btn-primary' : 'btn'}
              onClick={() => setMode('folder')}
            >
              By folder
            </button>
            <button
              type="button"
              className={mode === 'series' ? 'btn btn-primary' : 'btn'}
              onClick={() => setMode('series')}
            >
              By series
            </button>
          </div>
        )}
      </div>

      {isSearching ? (
        <SearchResults query={debouncedQuery} />
      ) : mode === 'folder' ? (
        <FolderBrowser
          folderId={currentFolderId}
          onOpenFolder={(folder) => navigate(`/library/${folder.id}`)}
        />
      ) : (
        <SeriesBrowser />
      )}
    </div>
  )
}

function SearchResults({ query }: { query: string }) {
  const [books, setBooks] = useState<Book[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setError(null)

    searchBooks(query)
      .then((results) => {
        if (!cancelled) setBooks(results)
      })
      .catch(() => {
        if (!cancelled) setError('Search failed. Try again.')
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [query])

  if (isLoading) return <p>Searching...</p>
  if (error) return <p className="form-error">{error}</p>
  if (books.length === 0) return <p className="empty">No books match "{query}".</p>

  return (
    <div className="book-grid">
      {books.map((book) => (
        <BookCard key={book.id} book={book} />
      ))}
    </div>
  )
}

function FolderBrowser({
  folderId,
  onOpenFolder,
}: {
  folderId: number | null
  onOpenFolder: (folder: Folder) => void
}) {
  const { folders, books, crumbs, isLoading, error } = useFolderContents(folderId)

  return (
    <div className="page">
      <nav className="breadcrumbs">
        {crumbs.map((crumb, index) => (
          <span key={crumb.id ?? 'root'}>
            {index > 0 && <span className="breadcrumb-sep"> / </span>}
            {index === crumbs.length - 1 ? (
              <span className="breadcrumb-current">{crumb.name}</span>
            ) : (
              <Link to={crumb.id === null ? '/library' : `/library/${crumb.id}`}>{crumb.name}</Link>
            )}
          </span>
        ))}
      </nav>

      {error && <p className="form-error">{error}</p>}

      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <div className="file-grid">
          {folders.map((folder) => (
            <div key={`folder-${folder.id}`} className="file-item" onClick={() => onOpenFolder(folder)}>
              <div className="file-item-icon folder-icon">&#128193;</div>
              <div className="file-item-name">{folder.name}</div>
            </div>
          ))}

          {books.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}

          {folders.length === 0 && books.length === 0 && <p className="empty">This folder is empty.</p>}
        </div>
      )}
    </div>
  )
}

function SeriesBrowser() {
  const [pages, setPages] = useState<Book[][]>([])
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)

    listBooks(page)
      .then((result) => {
        if (cancelled) return
        setPages((prev) => {
          const next = [...prev]
          next[page - 1] = result.data
          return next
        })
        setLastPage(result.meta.last_page)
        setError(null)
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load the catalog.')
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [page])

  const books = useMemo(() => pages.flat(), [pages])

  const groups = useMemo(() => {
    const bySeries = new Map<string, Book[]>()
    for (const book of books) {
      const key = book.series_name ?? 'Standalone'
      const group = bySeries.get(key) ?? []
      group.push(book)
      bySeries.set(key, group)
    }
    return [...bySeries.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [books])

  return (
    <div className="page">
      {error && <p className="form-error">{error}</p>}

      {groups.map(([seriesName, seriesBooks]) => (
        <section key={seriesName} className="series-section">
          <h2>{seriesName}</h2>
          <div className="book-grid">
            {seriesBooks
              .sort((a, b) => (a.volume_number ?? 0) - (b.volume_number ?? 0))
              .map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
          </div>
        </section>
      ))}

      {books.length === 0 && !isLoading && <p className="empty">The library is empty.</p>}

      {lastPage !== null && page < lastPage && (
        <button type="button" className="btn" disabled={isLoading} onClick={() => setPage((p) => p + 1)}>
          {isLoading ? 'Loading...' : 'Load more'}
        </button>
      )}
    </div>
  )
}
