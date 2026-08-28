import { apiClient } from './client'
import type { Book } from '../types'

export async function listBooksInFolder(folderId: number): Promise<Book[]> {
  const { data } = await apiClient.get<{ data: Book[] }>('/api/books', {
    params: { folder_id: folderId },
  })
  return data.data
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
