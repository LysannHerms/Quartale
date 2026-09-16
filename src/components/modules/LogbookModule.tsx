import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  BookOpen,
  Circle,
  CloudRain,
  Heart,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Quarter } from '../../data/quarters'
import { loadLogbookData, loadProjectsData, saveLogbookData } from '../../storage'
import type {
  BingoBoard,
  Entry,
  LogbookData,
  LogbookEntry,
  LogbookLinkedModule,
  LogbookMood,
  MovementData,
} from '../../types'
import { getInitialDate, toDateKey } from './calendarUtils'
import { createLogbookTimeline } from './logbookUtils'
import type { LogbookTimelineItem } from './logbookUtils'
import './LogbookModule.css'

type TimelineFilter =
  | 'all'
  | 'manual'
  | LogbookMood
  | 'movement'
  | 'projects'
  | 'bingo'
  | 'calendar'

const moodOptions: Array<{
  id: LogbookMood
  label: string
  icon: LucideIcon
}> = [
  { id: 'good', label: 'Schön', icon: Heart },
  { id: 'difficult', label: 'Schwierig', icon: CloudRain },
  { id: 'interesting', label: 'Spannend', icon: Sparkles },
  { id: 'neutral', label: 'Festhalten', icon: Circle },
]

const moduleOptions: Array<{
  id: LogbookLinkedModule
  label: string
}> = [
  { id: 'calendar', label: 'Kalender' },
  { id: 'projects', label: 'Vorhaben' },
  { id: 'movement', label: 'Bewegung' },
  { id: 'notes', label: 'Notizen' },
  { id: 'bingo', label: 'Bingo' },
]

export function LogbookModule({
  quarter,
  entries,
  bingoBoard,
  movementData,
  isEditorOpen,
  onEditorOpen,
  onEditorClose,
}: {
  quarter: Quarter
  entries: Entry[]
  bingoBoard?: BingoBoard
  movementData: MovementData
  isEditorOpen: boolean
  onEditorOpen: () => void
  onEditorClose: () => void
}) {
  const [logbookData, setLogbookData] = useState<LogbookData>(loadLogbookData)
  const [activeFilter, setActiveFilter] = useState<TimelineFilter>('all')
  const [editingEntry, setEditingEntry] = useState<LogbookEntry>()
  const [projectsData] = useState(loadProjectsData)

  useEffect(() => {
    saveLogbookData(logbookData)
  }, [logbookData])

  useEffect(() => {
    setActiveFilter('all')
    setEditingEntry(undefined)
  }, [quarter.id])

  const timeline = useMemo(
    () =>
      createLogbookTimeline({
        quarterId: quarter.id,
        entries,
        bingoBoard,
        projectsData,
        movementData,
        logbookData,
      }),
    [quarter.id, entries, bingoBoard, projectsData, movementData, logbookData],
  )

  const visibleItems = timeline.filter((item) => {
    if (activeFilter === 'all') return true
    if (activeFilter === 'manual') return !item.automatic
    if (
      activeFilter === 'good' ||
      activeFilter === 'difficult' ||
      activeFilter === 'interesting' ||
      activeFilter === 'neutral'
    )
      return item.mood === activeFilter
    return item.moduleId === activeFilter
  })

  const groupedItems = groupByDate(visibleItems)

  function saveEntry(entry: LogbookEntry) {
    setLogbookData((current) => ({
      ...current,
      entries: current.entries.some((candidate) => candidate.id === entry.id)
        ? current.entries.map((candidate) =>
            candidate.id === entry.id ? entry : candidate,
          )
        : [entry, ...current.entries],
    }))
    setEditingEntry(undefined)
    onEditorClose()
  }

  function deleteEntry(entryId: string) {
    if (!window.confirm('Diesen Logbucheintrag wirklich löschen?')) return
    setLogbookData((current) => ({
      ...current,
      entries: current.entries.filter((entry) => entry.id !== entryId),
    }))
  }

  function closeEditor() {
    setEditingEntry(undefined)
    onEditorClose()
  }

  return (
    <>
      <div className="logbook-module">
        <section className="logbook-intro">
          <div>
            <p className="card-label">Chronologisch, ohne Bewertung</p>
            <h3>Was im Quartal passiert</h3>
            <p>
              Erledigte Dinge aus den Modulen erscheinen automatisch. Eigene
              Momente kannst du unabhängig davon festhalten.
            </p>
          </div>
          <button type="button" className="logbook-primary-button" onClick={onEditorOpen}>
            <Plus aria-hidden="true" /> Eintrag schreiben
          </button>
        </section>

        <section className="logbook-surface">
          <div className="logbook-filter-bar" aria-label="Logbuch filtern">
            <FilterButton active={activeFilter === 'all'} onClick={() => setActiveFilter('all')}>Alles</FilterButton>
            <FilterButton active={activeFilter === 'manual'} onClick={() => setActiveFilter('manual')}>Eigene Einträge</FilterButton>
            {moodOptions.slice(0, 3).map((option) => {
              const Icon = option.icon
              return <FilterButton key={option.id} active={activeFilter === option.id} onClick={() => setActiveFilter(option.id)}><Icon aria-hidden="true" />{option.label}</FilterButton>
            })}
            <FilterButton active={activeFilter === 'movement'} onClick={() => setActiveFilter('movement')}>Bewegung</FilterButton>
            <FilterButton active={activeFilter === 'projects'} onClick={() => setActiveFilter('projects')}>Vorhaben</FilterButton>
            <FilterButton active={activeFilter === 'calendar'} onClick={() => setActiveFilter('calendar')}>Kalender</FilterButton>
            <FilterButton active={activeFilter === 'bingo'} onClick={() => setActiveFilter('bingo')}>Bingo</FilterButton>
          </div>

          {visibleItems.length === 0 ? (
            <div className="logbook-empty">
              <BookOpen aria-hidden="true" />
              <h4>{timeline.length === 0 ? 'Noch keine Spuren' : 'Nichts in diesem Filter'}</h4>
              <p>{timeline.length === 0 ? 'Der erste Eintrag darf klein, schön, schwierig oder einfach nur bemerkenswert sein.' : 'Wähle einen anderen Filter oder schreibe einen neuen Eintrag.'}</p>
              <button type="button" className="logbook-primary-button" onClick={onEditorOpen}>Eintrag schreiben</button>
            </div>
          ) : (
            <div className="logbook-timeline">
              {groupedItems.map(([date, items]) => (
                <section className="logbook-day" key={date}>
                  <div className="logbook-date"><strong>{formatDateHeading(date)}</strong><span>{items.length} {items.length === 1 ? 'Eintrag' : 'Einträge'}</span></div>
                  <div className="logbook-day-items">
                    {items.map((item) => (
                      <TimelineCard
                        key={item.id}
                        item={item}
                        onEdit={item.logEntry ? () => { setEditingEntry(item.logEntry); onEditorOpen() } : undefined}
                        onDelete={item.logEntry ? () => deleteEntry(item.logEntry!.id) : undefined}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </section>
      </div>

      {isEditorOpen && createPortal(
        <LogbookEditor quarter={quarter} entry={editingEntry} onClose={closeEditor} onSave={saveEntry} />,
        document.querySelector('.app') ?? document.body,
      )}
    </>
  )
}

function TimelineCard({ item, onEdit, onDelete }: { item: LogbookTimelineItem; onEdit?: () => void; onDelete?: () => void }) {
  const mood = moodOptions.find((option) => option.id === item.mood) ?? moodOptions[3]
  const MoodIcon = mood.icon
  return (
    <article className={`logbook-entry mood-${item.mood}`}>
      <div className="logbook-mood-icon"><MoodIcon aria-hidden="true" /></div>
      <div className="logbook-entry-content">
        <div className="logbook-entry-meta"><span>{item.source}</span>{item.automatic && <span>automatisch</span>}<span>{mood.label}</span></div>
        <h4>{item.title}</h4>
        {item.details && <p>{item.details}</p>}
      </div>
      {(onEdit || onDelete) && <div className="logbook-entry-actions">{onEdit && <button type="button" aria-label="Eintrag bearbeiten" onClick={onEdit}><Pencil aria-hidden="true" /></button>}{onDelete && <button type="button" aria-label="Eintrag löschen" onClick={onDelete}><Trash2 aria-hidden="true" /></button>}</div>}
    </article>
  )
}

function FilterButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" className={active ? 'active' : ''} aria-pressed={active} onClick={onClick}>{children}</button>
}

function LogbookEditor({ quarter, entry, onClose, onSave }: { quarter: Quarter; entry?: LogbookEntry; onClose: () => void; onSave: (entry: LogbookEntry) => void }) {
  const [title, setTitle] = useState(entry?.title ?? '')
  const [details, setDetails] = useState(entry?.details ?? '')
  const [date, setDate] = useState(entry?.date ?? toDateKey(getInitialDate(quarter.start, quarter.end)))
  const [mood, setMood] = useState<LogbookMood>(entry?.mood ?? 'neutral')
  const [moduleId, setModuleId] = useState<LogbookLinkedModule | ''>(entry?.moduleId ?? '')

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!title.trim()) return
    const now = new Date().toISOString()
    onSave({ id: entry?.id ?? crypto.randomUUID(), quarterId: quarter.id, date, title: title.trim(), details: details.trim(), mood, moduleId: moduleId || undefined, createdAt: entry?.createdAt ?? now, updatedAt: now })
  }

  return <div className="logbook-modal-backdrop" onMouseDown={onClose}><section className="logbook-dialog" role="dialog" aria-modal="true" aria-label={entry ? 'Logbucheintrag bearbeiten' : 'Logbucheintrag schreiben'} onMouseDown={(event) => event.stopPropagation()}><div className="logbook-dialog-header"><div><p className="eyebrow">{quarter.label}</p><h2>{entry ? 'Eintrag bearbeiten' : 'Moment festhalten'}</h2></div><button type="button" className="logbook-close-button" aria-label="Fenster schließen" onClick={onClose}><X aria-hidden="true" /></button></div><form className="logbook-form" onSubmit={submit}><div className="logbook-form-grid"><label className="form-field"><span>Datum</span><input type="date" min={quarter.start} max={quarter.end} required value={date} onChange={(event) => setDate(event.target.value)} /></label><label className="form-field"><span>Modul – optional</span><select value={moduleId} onChange={(event) => setModuleId(event.target.value as LogbookLinkedModule | '')}><option value="">Ohne Zuordnung</option>{moduleOptions.map((option) => <option value={option.id} key={option.id}>{option.label}</option>)}</select></label></div><label className="form-field"><span>Titel</span><input autoFocus required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Was ist passiert?" /></label><fieldset className="logbook-mood-picker"><legend>Art des Eintrags</legend><div>{moodOptions.map((option) => { const Icon = option.icon; return <button type="button" key={option.id} className={mood === option.id ? 'active' : ''} aria-pressed={mood === option.id} onClick={() => setMood(option.id)}><Icon aria-hidden="true" /><strong>{option.label}</strong></button> })}</div></fieldset><label className="form-field"><span>Text – optional</span><textarea rows={6} value={details} onChange={(event) => setDetails(event.target.value)} placeholder="Gedanken, Beobachtungen oder das, was du nicht vergessen möchtest" /></label><div className="logbook-form-actions"><button type="button" className="logbook-secondary-button" onClick={onClose}>Abbrechen</button><button type="submit" className="logbook-primary-button">Eintrag speichern</button></div></form></section></div>
}

function groupByDate(items: LogbookTimelineItem[]) {
  const groups = new Map<string, LogbookTimelineItem[]>()
  items.forEach((item) => groups.set(item.date, [...(groups.get(item.date) ?? []), item]))
  return [...groups.entries()]
}

function formatDateHeading(date: string) {
  return new Intl.DateTimeFormat('de-DE', { weekday: 'long', day: '2-digit', month: 'long' }).format(new Date(`${date}T12:00:00`))
}
