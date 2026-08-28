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

export type EmbeddingStatus = 'none' | 'pending' | 'ready' | 'failed' | string

export interface Book {
  id: number
  folder_id: number
  title: string
  author: string
  series_name: string | null
  volume_number: number | null
  cover_path: string | null
  chapter_count: number
  embedding_status: EmbeddingStatus
  folder?: Folder
  created_at: string
  updated_at: string
}

export interface ApiValidationError {
  message: string
  errors?: Record<string, string[]>
}
