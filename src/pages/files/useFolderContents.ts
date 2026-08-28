import { useCallback, useEffect, useState } from 'react'
import { getFolder, listFolders } from '../../api/folders'
import { toApiError } from '../../api/client'
import type { Book, Folder } from '../../types'

export interface Crumb {
  id: number | null
  name: string
}

interface FolderContentsState {
  isLoading: boolean
  error: string | null
  folders: Folder[]
  books: Book[]
  crumbs: Crumb[]
}

/**
 * GET /folders/{id} eager-loads children and books, so for a specific
 * folder we get everything in one call. Root (folderId === null) has no
 * single-resource endpoint, so it falls back to GET /folders?parent_id= and
 * has no books of its own (books always require a folder_id).
 */
export function useFolderContents(folderId: number | null) {
  const [state, setState] = useState<FolderContentsState>({
    isLoading: true,
    error: null,
    folders: [],
    books: [],
    crumbs: [{ id: null, name: 'Home' }],
  })

  const load = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      if (folderId === null) {
        const folders = await listFolders(null)
        setState({ isLoading: false, error: null, folders, books: [], crumbs: [{ id: null, name: 'Home' }] })
        return
      }

      const folder = await getFolder(folderId)
      const crumbs = await buildCrumbs(folder)

      setState({
        isLoading: false,
        error: null,
        folders: folder.children ?? [],
        books: folder.books ?? [],
        crumbs,
      })
    } catch (err) {
      setState((prev) => ({ ...prev, isLoading: false, error: toApiError(err).message ?? 'Failed to load folder.' }))
    }
  }, [folderId])

  useEffect(() => {
    load()
  }, [load])

  return { ...state, reload: load }
}

async function buildCrumbs(folder: Folder): Promise<Crumb[]> {
  const trail: Crumb[] = [{ id: folder.id, name: folder.name }]
  let parentId = folder.parent_id

  while (parentId !== null) {
    const parent = await getFolder(parentId)
    trail.unshift({ id: parent.id, name: parent.name })
    parentId = parent.parent_id
  }

  trail.unshift({ id: null, name: 'Home' })
  return trail
}
