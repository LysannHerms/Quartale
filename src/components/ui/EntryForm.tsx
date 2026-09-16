import { useState } from 'react'
import { X } from 'lucide-react'
import { standardEntryModules } from '../../data/modules'
import type { Quarter } from '../../data/quarters'
import type { Entry, EntryModuleId, Timing } from '../../types'

export function EntryForm({
  quarter,
  initialModule,
  onClose,
  onSave,
}: {
  quarter: Quarter
  initialModule: EntryModuleId
  onClose: () => void
  onSave: (entry: Entry) => void
}) {
  const [moduleId, setModuleId] = useState<EntryModuleId>(initialModule)
  const [title, setTitle] = useState('')
  const [details, setDetails] = useState('')
  const [timing, setTiming] = useState<Timing>('open')
  const [date, setDate] = useState('')

  function submitEntry(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const cleanTitle = title.trim()
    if (!cleanTitle) return

    onSave({
      id: crypto.randomUUID(),
      quarterId: quarter.id,
      moduleId,
      title: cleanTitle,
      details: details.trim(),
      timing,
      date: timing === 'open' || !date ? undefined : date,
      createdAt: new Date().toISOString(),
    })
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section
        className="entry-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="entry-dialog-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="dialog-header">
          <div>
            <p className="eyebrow">{quarter.label}</p>
            <h2 id="entry-dialog-title">Neuer Eintrag</h2>
          </div>

          <button
            type="button"
            className="close-button"
            aria-label="Fenster schließen"
            onClick={onClose}
          >
            <X aria-hidden="true" />
          </button>
        </div>

        <form className="entry-form" onSubmit={submitEntry}>
          <label className="form-field">
            <span>Bereich</span>
            <select
              value={moduleId}
              onChange={(event) =>
                setModuleId(event.target.value as EntryModuleId)
              }
            >
              {standardEntryModules.map((module) => (
                <option key={module.id} value={module.id}>
                  {module.label}
                </option>
              ))}
            </select>
          </label>

          <label className="form-field">
            <span>Titel</span>
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Was möchtest du festhalten?"
              autoFocus
              required
            />
          </label>

          <div className="form-grid">
            <label className="form-field">
              <span>Planung</span>
              <select
                value={timing}
                onChange={(event) => {
                  const nextTiming = event.target.value as Timing
                  setTiming(nextTiming)
                  if (nextTiming === 'open') setDate('')
                }}
              >
                <option value="open">Ohne Datum</option>
                <option value="flexible">Flexibel</option>
                <option value="fixed">Fest geplant</option>
              </select>
            </label>

            {timing !== 'open' && (
              <label className="form-field">
                <span>Datum</span>
                <input
                  type="date"
                  min={quarter.start}
                  max={quarter.end}
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  required={timing === 'fixed'}
                />
              </label>
            )}
          </div>

          <label className="form-field">
            <span>Details – optional</span>
            <textarea
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              placeholder="Gedanken, nächster Schritt, Ort oder eine kleine Notiz …"
              rows={4}
            />
          </label>

          <div className="form-actions">
            <button type="button" className="secondary-button" onClick={onClose}>
              Abbrechen
            </button>
            <button type="submit" className="save-button">
              Eintrag speichern
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
