import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ePub from 'epubjs'
import type { Book as EpubBook, Location as EpubLocation, Rendition } from 'epubjs'
import { getBook, fetchBookFile } from '../../api/books'
import { getProgress, updateProgress } from '../../api/progress'
import { toApiError } from '../../api/client'
import ChapterDrawer from './ChapterDrawer'
import ReaderSettings from './ReaderSettings'
import ProgressBar from './ProgressBar'
import { useReaderSettings } from './useReaderSettings'
import type { Book, BookChapter } from '../../types'

const THEME_STYLES: Record<string, { body: Record<string, string> }> = {
  light: { body: { background: '#ffffff', color: '#1a1a1a' } },
  dark: { body: { background: '#16171d', color: '#d1d3d8' } },
  sepia: { body: { background: '#f4ecd8', color: '#3b3324' } },
}

const PROGRESS_SYNC_DELAY_MS = 2500

export default function ReaderPage() {
  const params = useParams<{ bookId: string }>()
  const bookId = Number(params.bookId)
  const navigate = useNavigate()

  const viewerRef = useRef<HTMLDivElement>(null)
  const epubBookRef = useRef<EpubBook | null>(null)
  const renditionRef = useRef<Rendition | null>(null)
  const progressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const advancingRef = useRef(false)

  const [book, setBook] = useState<Book | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentChapterIndex, setCurrentChapterIndex] = useState<number | null>(null)
  const [percentage, setPercentage] = useState<number | null>(null)
  const [showChapters, setShowChapters] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  const { settings, update: updateSettings } = useReaderSettings()

  // Load book metadata + epub binary + saved progress, then boot epub.js.
  useEffect(() => {
    let cancelled = false

    async function init() {
      setIsLoading(true)
      setError(null)

      try {
        const [bookResult, fileBuffer, progressResult] = await Promise.all([
          getBook(bookId),
          fetchBookFile(bookId),
          getProgress(bookId),
        ])

        if (cancelled) return
        setBook(bookResult)

        const epubBook = ePub(fileBuffer)
        epubBookRef.current = epubBook
        await epubBook.ready

        if (cancelled || !viewerRef.current) return

        const rendition = epubBook.renderTo(viewerRef.current, {
          width: '100%',
          height: '100%',
          flow: 'scrolled-doc',
        })
        renditionRef.current = rendition

        registerThemes(rendition)
        applyTheme(rendition, settings.theme)
        rendition.themes.fontSize(`${settings.fontSize}px`)
        rendition.themes.override('line-height', String(settings.lineHeight))

        rendition.on('relocated', (location: EpubLocation) => handleRelocated(location))

        if (progressResult.cfi) {
          await rendition.display(progressResult.cfi)
        } else {
          await rendition.display()
        }

        if (!cancelled) setIsLoading(false)
      } catch (err) {
        if (!cancelled) {
          setError(toApiError(err).message)
          setIsLoading(false)
        }
      }
    }

    init()

    return () => {
      cancelled = true
      if (progressTimerRef.current) clearTimeout(progressTimerRef.current)
      renditionRef.current?.destroy()
      epubBookRef.current?.destroy()
      renditionRef.current = null
      epubBookRef.current = null
    }
    // Settings are applied via the effect below; this effect only runs once
    // per book to avoid re-initializing epub.js on every settings tweak.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId])

  // Keep epub.js's live theme/font/line-height in sync with settings changes
  // without re-mounting the rendition.
  useEffect(() => {
    const rendition = renditionRef.current
    if (!rendition) return
    applyTheme(rendition, settings.theme)
    rendition.themes.fontSize(`${settings.fontSize}px`)
    rendition.themes.override('line-height', String(settings.lineHeight))
  }, [settings])

  function handleRelocated(location: EpubLocation) {
    const chapterIndex = location.start.index
    setCurrentChapterIndex(chapterIndex)
    setPercentage(location.start.percentage)

    queueProgressSync(chapterIndex, location.start.cfi)
    maybeAutoAdvance(location)
  }

  function queueProgressSync(chapterIndex: number, cfi: string) {
    if (progressTimerRef.current) clearTimeout(progressTimerRef.current)
    progressTimerRef.current = setTimeout(() => {
      updateProgress(bookId, { chapter_index: chapterIndex, cfi }).catch(() => {
        // Best-effort sync; a transient failure here shouldn't interrupt reading.
      })
    }, PROGRESS_SYNC_DELAY_MS)
  }

  function maybeAutoAdvance(location: EpubLocation) {
    const epubBook = epubBookRef.current
    const rendition = renditionRef.current
    if (!epubBook || !rendition || !location.atEnd || advancingRef.current) return

    const lastIndex = epubBook.spine.last()?.index ?? 0
    if (location.start.index >= lastIndex) return // already at the last section, nothing to advance to

    advancingRef.current = true
    rendition
      .next()
      .catch(() => {
        // End of navigable content or a transient render error — stop quietly.
      })
      .finally(() => {
        advancingRef.current = false
      })
  }

  function handleSelectChapter(chapter: BookChapter) {
    renditionRef.current?.display(chapter.spine_href)
    setShowChapters(false)
  }

  if (error) return <p className="form-error">{error}</p>

  return (
    <div className={`reader-page reader-theme-${settings.theme}`}>
      <div className="reader-toolbar">
        <button type="button" className="btn btn-ghost" onClick={() => navigate(`/books/${bookId}`)}>
          &larr; Back
        </button>
        <span className="reader-title">{book?.title}</span>
        <div className="reader-toolbar-actions">
          <button type="button" className="btn" onClick={() => setShowChapters((v) => !v)} disabled={isLoading}>
            Chapters
          </button>
          <button type="button" className="btn" onClick={() => setShowSettings((v) => !v)} disabled={isLoading}>
            Aa
          </button>
        </div>
      </div>

      <div className="reader-body">
        {isLoading && <p className="page-loading reader-loading-overlay">Loading book...</p>}
        <div ref={viewerRef} className="reader-viewer" />

        {showChapters && book?.chapters && (
          <ChapterDrawer
            chapters={book.chapters}
            currentIndex={currentChapterIndex}
            onSelect={handleSelectChapter}
            onClose={() => setShowChapters(false)}
          />
        )}

        {showSettings && (
          <ReaderSettings settings={settings} onChange={updateSettings} onClose={() => setShowSettings(false)} />
        )}
      </div>

      <ProgressBar percentage={percentage} />
    </div>
  )
}

function registerThemes(rendition: Rendition) {
  for (const [name, theme] of Object.entries(THEME_STYLES)) {
    rendition.themes.register(name, { body: theme.body })
  }
}

function applyTheme(rendition: Rendition, theme: string) {
  rendition.themes.select(theme)
}
