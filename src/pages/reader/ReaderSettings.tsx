import type { ReaderSettingsValue, ReaderTheme } from './useReaderSettings'

const THEMES: { value: ReaderTheme; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'sepia', label: 'Sepia' },
]

export default function ReaderSettings({
  settings,
  onChange,
  onClose,
}: {
  settings: ReaderSettingsValue
  onChange: (patch: Partial<ReaderSettingsValue>) => void
  onClose: () => void
}) {
  return (
    <div className="reader-settings-panel">
      <div className="reader-settings-header">
        <h3>Display</h3>
        <button type="button" className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Close settings">
          &times;
        </button>
      </div>

      <label className="reader-settings-row">
        <span>Font size</span>
        <div className="reader-settings-stepper">
          <button type="button" className="btn btn-icon" onClick={() => onChange({ fontSize: Math.max(12, settings.fontSize - 2) })}>
            A-
          </button>
          <span>{settings.fontSize}px</span>
          <button type="button" className="btn btn-icon" onClick={() => onChange({ fontSize: Math.min(32, settings.fontSize + 2) })}>
            A+
          </button>
        </div>
      </label>

      <label className="reader-settings-row">
        <span>Line height</span>
        <div className="reader-settings-stepper">
          <button
            type="button"
            className="btn btn-icon"
            onClick={() => onChange({ lineHeight: Math.max(1.2, Math.round((settings.lineHeight - 0.2) * 10) / 10 ) })}
          >
            -
          </button>
          <span>{settings.lineHeight.toFixed(1)}</span>
          <button
            type="button"
            className="btn btn-icon"
            onClick={() => onChange({ lineHeight: Math.min(2.4, Math.round((settings.lineHeight + 0.2) * 10) / 10 ) })}
          >
            +
          </button>
        </div>
      </label>

      <div className="reader-settings-row">
        <span>Theme</span>
        <div className="reader-settings-theme-buttons">
          {THEMES.map((theme) => (
            <button
              key={theme.value}
              type="button"
              className={theme.value === settings.theme ? 'btn btn-primary' : 'btn'}
              onClick={() => onChange({ theme: theme.value })}
            >
              {theme.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
