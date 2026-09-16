import { Plus } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Entry } from '../../types'
import { EntryList } from '../ui/EntryList'

export function GenericModule({
  entries,
  icon: Icon,
  title,
  onAdd,
  onDelete,
}: {
  entries: Entry[]
  icon: LucideIcon
  title: string
  onAdd: () => void
  onDelete: (entryId: string) => void
}) {
  if (entries.length > 0) {
    return (
      <section className="dashboard-card module-content">
        <EntryList entries={entries} onDelete={onDelete} />
      </section>
    )
  }

  return (
    <section className="dashboard-card empty-module">
      <div className="large-icon">
        <Icon aria-hidden="true" />
      </div>
      <h3>{title} ist noch leer</h3>
      <p>Du entscheidest selbst, ob und wie du diesen Bereich verwendest.</p>
      <button type="button" className="inline-add-button" onClick={onAdd}>
        <Plus aria-hidden="true" />
        Ersten Eintrag hinzufügen
      </button>
    </section>
  )
}
