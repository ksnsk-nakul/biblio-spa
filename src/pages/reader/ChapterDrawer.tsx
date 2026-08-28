import type { BookChapter } from '../../types'

export default function ChapterDrawer({
  chapters,
  currentIndex,
  onSelect,
  onClose,
}: {
  chapters: BookChapter[]
  currentIndex: number | null
  onSelect: (chapter: BookChapter) => void
  onClose: () => void
}) {
  return (
    <div className="chapter-drawer">
      <div className="chapter-drawer-header">
        <h3>Chapters</h3>
        <button type="button" className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Close chapters">
          &times;
        </button>
      </div>

      <ul className="chapter-drawer-list">
        {chapters.map((chapter) => (
          <li key={chapter.id}>
            <button
              type="button"
              className={chapter.index === currentIndex ? 'chapter-drawer-item active' : 'chapter-drawer-item'}
              onClick={() => onSelect(chapter)}
            >
              {chapter.title}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
