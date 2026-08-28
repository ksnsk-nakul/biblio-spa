export interface User {
  id: number
  name: string
  email: string
  is_admin: boolean
  created_at: string
}

export interface Folder {
  id: number
  name: string
  parent_id: number | null
  created_by: number
  children_count?: number
  books_count?: number
  children?: Folder[]
  books?: Book[]
  created_at: string
  updated_at: string
}

export type EmbeddingStatus = 'none' | 'processing' | 'ready' | 'failed'

export interface BookChapter {
  id: number
  index: number
  title: string
  spine_href: string
}

export interface Book {
  id: number
  folder_id: number
  title: string
  author: string
  series_name: string | null
  volume_number: number | null
  cover_url: string | null
  chapter_count: number
  embedding_status: EmbeddingStatus
  folder?: Folder
  chapters?: BookChapter[]
  created_at: string
  updated_at: string
}

export interface ReadingProgress {
  book_id: number | null
  chapter_index: number | null
  cfi: string | null
  updated_at: string | null
}

export interface DashboardData {
  continue_reading: Book[]
  shelf: Book[]
}

export interface ApiValidationError {
  message: string
  errors?: Record<string, string[]>
}
