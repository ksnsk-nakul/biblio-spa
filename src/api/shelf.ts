import { apiClient } from './client'

export async function addToShelf(bookId: number): Promise<void> {
  await apiClient.post(`/api/shelf/${bookId}`)
}

export async function removeFromShelf(bookId: number): Promise<void> {
  await apiClient.delete(`/api/shelf/${bookId}`)
}
