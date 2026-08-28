import type { Book } from '../types'

/**
 * Books without a stored cover image (cover_url null) fall back to the same
 * book emoji glyph the file manager phase already uses for book items, so
 * the "no cover" look stays consistent across both surfaces.
 */
export default function BookCover({ book }: { book: Pick<Book, 'cover_url' | 'title'> }) {
  if (book.cover_url) {
    return <img className="book-cover" src={book.cover_url} alt={book.title} loading="lazy" />
  }

  return (
    <div className="book-cover book-cover-placeholder" aria-hidden="true">
      &#128214;
    </div>
  )
}
