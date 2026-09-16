import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  Download,
  Eye,
  EyeOff,
  LayoutDashboard,
  ShieldCheck,
  Upload,
  X,
} from 'lucide-react'
import { modules } from '../../data/modules'
import type { Quarter } from '../../data/quarters'
import { createBackupJson, restoreBackupJson } from '../../storage'
import type { ViewId } from '../../types'
import './SettingsDialog.css'

export function SettingsDialog({
  quarter,
  hiddenModules,
  onVisibilityChange,
  onClose,
}: {
  quarter: Quarter
  hiddenModules: ViewId[]
  onVisibilityChange: (viewId: ViewId, visible: boolean) => void
  onClose: () => void
}) {
  const importInput = useRef<HTMLInputElement>(null)
  const [importError, setImportError] = useState('')

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  function exportBackup() {
    const blob = new Blob([createBackupJson()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `quartalskompass-sicherung-${new Date()
      .toISOString()
      .slice(0, 10)}.json`
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  async function importBackup(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    const shouldRestore = window.confirm(
      'Die Sicherung ersetzt alle momentan in diesem Browser gespeicherten Quartalsdaten. Fortfahren?',
    )
    if (!shouldRestore) return

    try {
      restoreBackupJson(await file.text())
      window.location.reload()
    } catch (error) {
      setImportError(
        error instanceof Error
          ? error.message
          : 'Die Sicherung konnte nicht eingelesen werden.',
      )
    }
  }

  return createPortal(
    <div className="settings-backdrop" onMouseDown={onClose}>
      <section
        className="settings-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="settings-header">
          <div>
            <p className="eyebrow">Quartalskompass anpassen</p>
            <h2 id="settings-title">Module &amp; Sicherung</h2>
          </div>
          <button
            type="button"
            className="settings-close"
            aria-label="Einstellungen schließen"
            onClick={onClose}
          >
            <X aria-hidden="true" />
          </button>
        </header>

        <section className="settings-section">
          <div className="settings-section-heading">
            <div>
              <p className="card-label">{quarter.label}</p>
              <h3>Sichtbare Module</h3>
            </div>
            <span>{modules.length - hiddenModules.length} sichtbar</span>
          </div>
          <p className="settings-explanation">
            Ausgeblendete Module und ihre Inhalte werden nicht gelöscht. Du
            kannst sie jederzeit wieder einschalten.
          </p>

          <div className="settings-module-list">
            <div className="settings-module-row always-visible">
              <span className="settings-module-icon">
                <LayoutDashboard aria-hidden="true" />
              </span>
              <div>
                <strong>Übersicht</strong>
                <span>Bleibt immer sichtbar</span>
              </div>
              <Eye aria-label="Sichtbar" />
            </div>

            {modules
              .filter((module) => module.id !== 'overview')
              .map((module) => {
                const Icon = module.icon
                const visible = !hiddenModules.includes(module.id)
                return (
                  <button
                    type="button"
                    className={`settings-module-row ${visible ? 'visible' : ''}`}
                    key={module.id}
                    aria-pressed={visible}
                    onClick={() => onVisibilityChange(module.id, !visible)}
                  >
                    <span className="settings-module-icon">
                      <Icon aria-hidden="true" />
                    </span>
                    <div>
                      <strong>{module.label}</strong>
                      <span>{visible ? 'Sichtbar' : 'Ausgeblendet'}</span>
                    </div>
                    {visible ? <Eye aria-hidden="true" /> : <EyeOff aria-hidden="true" />}
                  </button>
                )
              })}
          </div>
        </section>

        <section className="settings-section settings-backup-section">
          <div className="settings-backup-copy">
            <span className="settings-backup-icon">
              <ShieldCheck aria-hidden="true" />
            </span>
            <div>
              <p className="card-label">Lokale Datensicherung</p>
              <h3>Alles in einer Datei sichern</h3>
              <p>
                Die JSON-Datei enthält alle Quartale, Module, Einträge und
                Einstellungen. Bewahre sie an einem sicheren Ort auf.
              </p>
            </div>
          </div>

          <div className="settings-backup-actions">
            <button type="button" className="settings-primary" onClick={exportBackup}>
              <Download aria-hidden="true" /> Sicherung exportieren
            </button>
            <button
              type="button"
              className="settings-secondary"
              onClick={() => importInput.current?.click()}
            >
              <Upload aria-hidden="true" /> Sicherung importieren
            </button>
            <input
              ref={importInput}
              className="settings-file-input"
              type="file"
              accept="application/json,.json"
              onChange={importBackup}
            />
          </div>
          {importError && <p className="settings-error" role="alert">{importError}</p>}
        </section>
      </section>
    </div>,
    document.querySelector('.app') ?? document.body,
  )
}
