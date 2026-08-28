import { apiClient } from './client'
import type { Folder } from '../types'

/**
 * `parent_id: null` lists root-level folders. The backend's
 * ConvertEmptyStringsToNull middleware turns an explicit empty query param
 * into a real null before the controller reads it, so we always send the
 * param (even when empty) rather than omitting it — omitting it entirely
 * returns every folder in the system, unfiltered.
 */
export async function listFolders(parentId: number | null): Promise<Folder[]> {
  const { data } = await apiClient.get<{ data: Folder[] }>('/api/folders', {
    params: { parent_id: parentId ?? '' },
  })
  return data.data
}

export async function getFolder(id: number): Promise<Folder> {
  const { data } = await apiClient.get<{ data: Folder }>(`/api/folders/${id}`)
  return data.data
}

export async function createFolder(name: string, parentId: number | null): Promise<Folder> {
  const { data } = await apiClient.post<{ data: Folder }>('/api/folders', {
    name,
    parent_id: parentId,
  })
  return data.data
}

export interface UpdateFolderPayload {
  name?: string
  parent_id?: number | null
}

export async function updateFolder(id: number, payload: UpdateFolderPayload): Promise<Folder> {
  const { data } = await apiClient.patch<{ data: Folder }>(`/api/folders/${id}`, payload)
  return data.data
}

export async function deleteFolder(id: number): Promise<void> {
  await apiClient.delete(`/api/folders/${id}`)
}
