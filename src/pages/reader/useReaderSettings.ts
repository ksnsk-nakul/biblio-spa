import { useCallback, useState } from 'react'

export type ReaderTheme = 'light' | 'dark' | 'sepia'

export interface ReaderSettingsValue {
  fontSize: number
  lineHeight: number
  theme: ReaderTheme
}

const STORAGE_KEY = 'bibliocon-reader-settings'

const DEFAULTS: ReaderSettingsValue = {
  fontSize: 18,
  lineHeight: 1.6,
  theme: 'light',
}

function loadSettings(): ReaderSettingsValue {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULTS
    return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<ReaderSettingsValue>) }
  } catch {
    return DEFAULTS
  }
}

/**
 * Per-device reading preferences (font size / line height / theme). Stored
 * only in localStorage, never synced to the backend — there's no endpoint
 * for it and the spec calls this out as device-local by design.
 */
export function useReaderSettings() {
  const [settings, setSettings] = useState<ReaderSettingsValue>(loadSettings)

  const update = useCallback((patch: Partial<ReaderSettingsValue>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  return { settings, update }
}
