import { Trash2 } from 'lucide-react'
import { modules, timingLabels } from '../../data/modules'
import type { Entry } from '../../types'

export function EntryList({
  entries,
  onDelete,
}: {
  entries: Entry[]
  onDelete: (entryId: string) => void
}) {
  return (
    <div className="entry-list">
      {entries.map((entry) => (
        <article className="entry-card" key={entry.id}>
          <div className="entry-card-content">
            <div className="entry-meta">
              <span>
                {modules.find((module) => module.id === entry.moduleId)?.label}
              </span>
              <span>{timingLabels[entry.timing]}</span>
              {entry.date && <span>{formatDate(entry.date)}</span>}
            </div>

            <h4>{entry.title}</h4>
            {entry.details && <p>{entry.details}</p>}
          </div>

          <button
            type="button"
            className="delete-button"
            aria-label={`${entry.title} löschen`}
            onClick={() => onDelete(entry.id)}
          >
            <Trash2 aria-hidden="true" />
          </button>
        </article>
      ))}
    </div>
  )
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: 'short',
  }).format(new Date(`${date}T12:00:00`))
}
