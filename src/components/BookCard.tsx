import { Link } from 'react-router-dom'
import type { Book } from '../types'
import BookCover from './BookCover'

export default function BookCard({ book, to }: { book: Book; to?: string }) {
  return (
    <Link to={to ?? `/books/${book.id}`} className="book-card">
      <BookCover book={book} />
      <div className="book-card-title">{book.title}</div>
      <div className="book-card-subtext">
        {book.series_name ? `${book.series_name}${book.volume_number ? ` #${book.volume_number}` : ''}` : book.author}
      </div>
    </Link>
  )
}
