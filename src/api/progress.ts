import { apiClient } from './client'
import type { ReadingProgress } from '../types'

export interface UpdateProgressPayload {
  chapter_index: number
  cfi: string
}

/**
 * Always returns a ReadingProgressResource — book_id/chapter_index/cfi come
 * back null when the caller has no saved progress for this book yet
 * (no 404 in that case, see ReadingProgressController::show).
 */
export async function getProgress(bookId: number): Promise<ReadingProgress> {
  const { data } = await apiClient.get<{ data: ReadingProgress }>(`/api/books/${bookId}/progress`)
  return data.data
}

export async function updateProgress(bookId: number, payload: UpdateProgressPayload): Promise<ReadingProgress> {
  const { data } = await apiClient.patch<{ data: ReadingProgress }>(`/api/books/${bookId}/progress`, payload)
  return data.data
}
