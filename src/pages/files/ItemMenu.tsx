import { useEffect, useRef, useState } from 'react'

interface ItemMenuProps {
  onRename: () => void
  onMove: () => void
  onDelete: () => void
}

export default function ItemMenu({ onRename, onMove, onDelete }: ItemMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="item-menu" ref={ref}>
      <button
        type="button"
        className="btn btn-ghost btn-icon"
        aria-label="More actions"
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen((o) => !o)
        }}
      >
        &#8942;
      </button>
      {isOpen && (
        <div className="item-menu-dropdown" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => {
              setIsOpen(false)
              onRename()
            }}
          >
            Rename
          </button>
          <button
            type="button"
            onClick={() => {
              setIsOpen(false)
              onMove()
            }}
          >
            Move
          </button>
          <button
            type="button"
            className="danger"
            onClick={() => {
              setIsOpen(false)
              onDelete()
            }}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  )
}
