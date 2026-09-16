import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { FileText, Pencil, Plus, Trash2, X } from 'lucide-react'
import type { Quarter } from '../../data/quarters'
import type { Entry } from '../../types'
import './NotesModule.css'

export function NotesModule({
  quarter,
  entries,
  isEditorOpen,
  onEditorOpen,
  onEditorClose,
  onAdd,
  onUpdate,
  onDelete,
}: {
  quarter: Quarter
  entries: Entry[]
  isEditorOpen: boolean
  onEditorOpen: () => void
  onEditorClose: () => void
  onAdd: (entry: Entry) => void
  onUpdate: (entry: Entry) => void
  onDelete: (entryId: string) => void
}) {
  const [editingEntry, setEditingEntry] = useState<Entry>()

  const sortedEntries = useMemo(
    () =>
      [...entries].sort((first, second) =>
        (second.updatedAt ?? second.createdAt).localeCompare(
          first.updatedAt ?? first.createdAt,
        ),
      ),
    [entries],
  )

  function openNewNote() {
    setEditingEntry(undefined)
    onEditorOpen()
  }

  function openNote(entry: Entry) {
    setEditingEntry(entry)
    onEditorOpen()
  }

  function closeEditor() {
    setEditingEntry(undefined)
    onEditorClose()
  }

  function saveNote(entry: Entry) {
    if (editingEntry) onUpdate(entry)
    else onAdd(entry)
    closeEditor()
  }

  return (
    <>
      <div className="notes-module">
        {sortedEntries.length === 0 ? (
          <section className="notes-empty">
            <div className="notes-empty-icon">
              <FileText aria-hidden="true" />
            </div>
            <p className="card-label">Freier Platz</p>
            <h3>Noch keine Notiz</h3>
            <p>
              Hier ist Platz für Gedanken, Listen, Links oder alles, was sonst
              nirgends hinpasst.
            </p>
            <button type="button" className="notes-primary-button" onClick={openNewNote}>
              <Plus aria-hidden="true" /> Erste Notiz anlegen
            </button>
          </section>
        ) : (
          <section className="notes-board" aria-label="Notizen">
            {sortedEntries.map((entry) => (
              <article className="notes-card" key={entry.id}>
                <div className="notes-card-glow" aria-hidden="true" />
                <div className="notes-card-content">
                  <h3>{entry.title}</h3>
                  {entry.details && <p>{entry.details}</p>}
                </div>
                <footer>
                  <div className="notes-timestamps">
                    <span>Erstellt {formatTimestamp(entry.createdAt)}</span>
                    {entry.updatedAt && entry.updatedAt !== entry.createdAt && (
                      <span>Bearbeitet {formatTimestamp(entry.updatedAt)}</span>
                    )}
                  </div>
                  <div className="notes-card-actions">
                    <button
                      type="button"
                      aria-label={`${entry.title} bearbeiten`}
                      onClick={() => openNote(entry)}
                    >
                      <Pencil aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      aria-label={`${entry.title} löschen`}
                      onClick={() => onDelete(entry.id)}
                    >
                      <Trash2 aria-hidden="true" />
                    </button>
                  </div>
                </footer>
              </article>
            ))}
          </section>
        )}
      </div>

      {isEditorOpen &&
        createPortal(
          <NoteEditor
            quarter={quarter}
            entry={editingEntry}
            onClose={closeEditor}
            onSave={saveNote}
          />,
          document.querySelector('.app') ?? document.body,
        )}
    </>
  )
}

function NoteEditor({
  quarter,
  entry,
  onClose,
  onSave,
}: {
  quarter: Quarter
  entry?: Entry
  onClose: () => void
  onSave: (entry: Entry) => void
}) {
  const [title, setTitle] = useState(entry?.title ?? '')
  const [details, setDetails] = useState(entry?.details ?? '')

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const cleanTitle = title.trim()
    if (!cleanTitle) return

    const now = new Date().toISOString()
    onSave({
      id: entry?.id ?? crypto.randomUUID(),
      quarterId: quarter.id,
      moduleId: 'notes',
      title: cleanTitle,
      details: details.trim(),
      timing: 'open',
      createdAt: entry?.createdAt ?? now,
      updatedAt: entry ? now : undefined,
    })
  }

  return (
    <div className="notes-modal-backdrop" onMouseDown={onClose}>
      <section
        className="notes-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="notes-dialog-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="notes-dialog-header">
          <div>
            <p className="eyebrow">{quarter.label}</p>
            <h2 id="notes-dialog-title">
              {entry ? 'Notiz bearbeiten' : 'Neue Notiz'}
            </h2>
          </div>
          <button
            type="button"
            className="notes-close-button"
            aria-label="Fenster schließen"
            onClick={onClose}
          >
            <X aria-hidden="true" />
          </button>
        </div>

        <form className="notes-form" onSubmit={submit}>
          <label className="form-field">
            <span>Titel</span>
            <input
              autoFocus
              required
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Titel der Notiz"
            />
          </label>
          <label className="form-field">
            <span>Notiz</span>
            <textarea
              rows={10}
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              placeholder="Schreib einfach los …"
            />
          </label>
          <div className="notes-form-actions">
            <button type="button" className="notes-secondary-button" onClick={onClose}>
              Abbrechen
            </button>
            <button type="submit" className="notes-primary-button">
              Notiz speichern
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}
