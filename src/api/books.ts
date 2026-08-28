import { apiClient } from './client'
import type { Book } from '../types'

export async function listBooksInFolder(folderId: number): Promise<Book[]> {
  const { data } = await apiClient.get<{ data: Book[] }>('/api/books', {
    params: { folder_id: folderId },
  })
  return data.data
}

export interface PaginatedBooks {
  data: Book[]
  meta: { current_page: number; last_page: number; total: number }
}

/**
 * Backing the "browse by series" catalog view: no folder_id filter, so
 * BookController::index returns every book (paginated 20/page) latest-first,
 * which we group client-side by series_name.
 */
export async function listBooks(page: number): Promise<PaginatedBooks> {
  const { data } = await apiClient.get<PaginatedBooks>('/api/books', { params: { page } })
  return data
}

export async function getBook(id: number): Promise<Book> {
  const { data } = await apiClient.get<{ data: Book }>(`/api/books/${id}`)
  return data.data
}

export async function searchBooks(query: string): Promise<Book[]> {
  const { data } = await apiClient.get<{ data: Book[] }>('/api/search', {
    params: { q: query },
  })
  return data.data
}

/**
 * Fetches the raw epub binary as an ArrayBuffer for epub.js to open directly
 * (rather than pointing epub.js at the URL itself, which wouldn't carry the
 * Sanctum session cookie). Goes through apiClient so withCredentials/XSRF
 * handling matches every other authenticated request.
 */
export async function fetchBookFile(id: number): Promise<ArrayBuffer> {
  const { data } = await apiClient.get<ArrayBuffer>(`/api/books/${id}/file`, {
    responseType: 'arraybuffer',
  })
  return data
}

export async function uploadBook(
  file: File,
  folderId: number,
  onProgress?: (percent: number) => void,
): Promise<Book> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('folder_id', String(folderId))

  const { data } = await apiClient.post<{ data: Book }>('/api/books', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (event) => {
      if (!onProgress || !event.total) return
      onProgress(Math.round((event.loaded / event.total) * 100))
    },
  })

  return data.data
}

export interface UpdateBookPayload {
  title?: string
  author?: string
  series_name?: string | null
  volume_number?: number | null
  folder_id?: number
}

export async function updateBook(id: number, payload: UpdateBookPayload): Promise<Book> {
  const { data } = await apiClient.patch<{ data: Book }>(`/api/books/${id}`, payload)
  return data.data
}

export async function deleteBook(id: number): Promise<void> {
  await apiClient.delete(`/api/books/${id}`)
}
