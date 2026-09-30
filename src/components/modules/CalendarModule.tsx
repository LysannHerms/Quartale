import { useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Circle,
  Pencil,
  Plus,
  Tags,
  Trash2,
  X,
} from 'lucide-react'
import type { Quarter } from '../../data/quarters'
import type {
  BingoBoard,
  CalendarKind,
  CalendarPeriod,
  CalendarTag,
  CalendarTagDefinition,
  Entry,
  QuarterId,
} from '../../types'
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  formatDay,
  formatLongDay,
  formatMonth,
  formatShortRange,
  getInitialDate,
  getMonthDays,
  getQuarterStart,
  isSameDate,
  isWithin,
  parseDate,
  startOfMonth,
  startOfWeek,
  toDateKey,
} from './calendarUtils' 
import './CalendarModule.css'

type CalendarView = 'day' | 'week' | 'month' | 'quarter'
type TodoRange = 'day' | 'week' | 'month'

type CalendarItem = {
  id: string
  sourceEntryId?: string
  title: string
  details: string
  date: string
  tag?: CalendarTag | 'bingo'
  kind: CalendarKind
  period: CalendarPeriod
  completed: boolean
  sourceLabel: string
  editable: boolean
}

const CALENDAR_TAG_STORAGE_PREFIX = 'quartale-calendar-tags-v1'
const BINGO_COLOR = '#b63a56'
const TAG_COLORS = [
  '#8e3d55',
  '#356859',
  '#b56b35',
  '#4f6296',
  '#77604b',
  '#6f577f',
]

const viewLabels: Record<CalendarView, string> = {
  day: 'Tag',
  week: 'Woche',
  month: 'Monat',
  quarter: 'Quartal',
}

const todoLabels: Record<TodoRange, string> = {
  day: 'Tag',
  week: 'Woche',
  month: 'Monat',
}

export function CalendarModule({
  quarter,
  entries,
  bingoBoard,
  isFormOpen,
  onFormOpen,
  onFormClose,
  onAdd,
  onUpdate,
  onDelete,
}: {
  quarter: Quarter
  entries: Entry[]
  bingoBoard?: BingoBoard
  isFormOpen: boolean
  onFormOpen: () => void
  onFormClose: () => void
  onAdd: (entry: Entry) => void
  onUpdate: (entry: Entry) => void
  onDelete: (entryId: string) => void
}) {
  const [selectedDate, setSelectedDate] = useState(() =>
    getInitialDate(quarter.start, quarter.end),
  )
  const [calendarView, setCalendarView] = useState<CalendarView>('month')
  const [todoRange, setTodoRange] = useState<TodoRange>('week')
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null)
  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false)
  const [tagsByQuarter, setTagsByQuarter] = useState<
    Partial<Record<QuarterId, CalendarTagDefinition[]>>
  >(() => loadAllCalendarTags())

  const storedCalendarTags = tagsByQuarter[quarter.id] ?? []
  const calendarTags = useMemo(() => {
    const knownIds = new Set(storedCalendarTags.map((tag) => tag.id))
    const referencedTags = entries
      .map((entry) => entry.calendarTag)
      .filter((tagId): tagId is string => Boolean(tagId) && !knownIds.has(tagId!))
      .filter((tagId, index, all) => all.indexOf(tagId) === index)
      .map((tagId) => createLegacyTagDefinition(tagId, quarter.id))

    return [...storedCalendarTags, ...referencedTags]
  }, [entries, quarter.id, storedCalendarTags])

  const items = useMemo(
    () => createCalendarItems(entries, bingoBoard),
    [entries, bingoBoard],
  )

  const weekStart = startOfWeek(selectedDate)
  const weekEnd = endOfWeek(selectedDate)
  const weekDays = Array.from({ length: 7 }, (_, index) =>
    addDays(weekStart, index),
  )

  const visibleTodos = items.filter((item) => {
    if (item.kind !== 'todo' || item.completed) return false
    const itemDate = parseDate(item.date)

    if (todoRange === 'day') return isSameDate(itemDate, selectedDate)
    if (todoRange === 'week') return isWithin(itemDate, weekStart, weekEnd)
    return isWithin(
      itemDate,
      startOfMonth(selectedDate),
      endOfMonth(selectedDate),
    )
  })

  function closeForm() {
    setEditingEntry(null)
    onFormClose()
  }

  function saveCalendarEntry(entry: Entry) {
    if (editingEntry) {
      onUpdate(entry)
    } else {
      onAdd(entry)
    }
    closeForm()
  }

  function saveCalendarTags(nextTags: CalendarTagDefinition[]) {
    setTagsByQuarter((current) => ({ ...current, [quarter.id]: nextTags }))
    persistCalendarTags(quarter.id, nextTags)
  }

  function deleteCalendarTag(tagId: string) {
    entries
      .filter((entry) => entry.calendarTag === tagId)
      .forEach((entry) => onUpdate({ ...entry, calendarTag: undefined }))

    saveCalendarTags(calendarTags.filter((tag) => tag.id !== tagId))
  }

  function toggleTodo(item: CalendarItem) {
    if (!item.sourceEntryId) return
    const entry = entries.find((candidate) => candidate.id === item.sourceEntryId)
    if (entry) onUpdate({ ...entry, completed: !entry.completed })
  }

  function editItem(item: CalendarItem) {
    if (!item.sourceEntryId || !item.editable) return
    const entry = entries.find((candidate) => candidate.id === item.sourceEntryId)
    if (entry) setEditingEntry(entry)
  }

  function moveSelectedDate(direction: -1 | 1) {
    if (calendarView === 'day') {
      setSelectedDate((date) => addDays(date, direction))
    } else if (calendarView === 'week') {
      setSelectedDate((date) => addDays(date, direction * 7))
    } else if (calendarView === 'month') {
      setSelectedDate((date) => addMonths(date, direction))
    }
  }

  const editorIsOpen = isFormOpen || editingEntry !== null

  return (
    <div className="calendar-module">
      <div className="calendar-topline">
        <div>
          <p className="card-label">Diese Woche</p>
          <h3>{formatShortRange(weekStart, weekEnd)}</h3>
        </div>

        <button type="button" className="calendar-primary-button" onClick={onFormOpen}>
          <Plus aria-hidden="true" />
          Eintrag hinzufügen
        </button>
      </div>

      <div className="calendar-planning-grid">
        <section className="calendar-surface calendar-week-panel">
          <div className="calendar-section-heading">
            <div>
              <h3>Wochenplan</h3>
              <p>Keine Stunden nötig – ein Tag reicht.</p>
            </div>
            <div className="calendar-arrow-group">
              <button
                type="button"
                aria-label="Vorherige Woche"
                onClick={() => setSelectedDate((date) => addDays(date, -7))}
              >
                <ChevronLeft aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label="Nächste Woche"
                onClick={() => setSelectedDate((date) => addDays(date, 7))}
              >
                <ChevronRight aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="calendar-week-strip">
            {weekDays.map((day) => {
              const dayItems = items.filter((item) =>
                isSameDate(parseDate(item.date), day),
              )
              const isSelected = isSameDate(day, selectedDate)

              return (
                <button
                  type="button"
                  key={toDateKey(day)}
                  className={`calendar-week-day ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedDate(day)}
                >
                  <strong>{formatDay(day).split(',')[0]}</strong>
                  <span>{formatDay(day).split(',')[1]}</span>
                  <div className="calendar-week-items">
                    {dayItems.slice(0, 3).map((item) => (
                      <span
                        className="calendar-week-item"
                        key={item.id}
                        style={getTagStyle(item.tag, calendarTags)}
                      >
                        <i />
                        {item.title}
                      </span>
                    ))}
                    {dayItems.length > 3 && <small>+{dayItems.length - 3} weitere</small>}
                  </div>
                </button>
              )
            })}
          </div>
        </section>

        <section className="calendar-surface calendar-todo-panel">
          <div className="calendar-section-heading calendar-todo-heading">
            <h3>To-dos</h3>
            <div className="calendar-tabs" aria-label="Zeitraum der To-do-Liste">
              {(Object.keys(todoLabels) as TodoRange[]).map((range) => (
                <button
                  type="button"
                  key={range}
                  className={todoRange === range ? 'active' : ''}
                  onClick={() => setTodoRange(range)}
                >
                  {todoLabels[range]}
                </button>
              ))}
            </div>
          </div>

          <div className="calendar-todo-list">
            {visibleTodos.length === 0 ? (
              <p className="calendar-empty-text">Für diesen Zeitraum ist nichts offen.</p>
            ) : (
              visibleTodos.map((item) => (
                <article className="calendar-todo-item" key={item.id}>
                  <button
                    type="button"
                    className="calendar-check-button"
                    aria-label={`${item.title} erledigen`}
                    onClick={() => toggleTodo(item)}
                  >
                    <Circle aria-hidden="true" />
                  </button>
                  <div>
                    <strong>{item.title}</strong>
                    <span>
                      <i
                        className="calendar-dot"
                        style={getTagStyle(item.tag, calendarTags)}
                      />
                      {item.sourceLabel}
                    </span>
                  </div>
                  {item.editable && (
                    <button
                      type="button"
                      className="calendar-edit-icon"
                      aria-label={`${item.title} bearbeiten`}
                      onClick={() => editItem(item)}
                    >
                      <Pencil aria-hidden="true" />
                    </button>
                  )}
                </article>
              ))
            )}
          </div>
        </section>
      </div>

      <section className="calendar-surface calendar-browser">
        <div className="calendar-browser-heading">
          <div>
            <p className="card-label">Kalender</p>
            <h3>{getCalendarHeading(calendarView, selectedDate, quarter.label)}</h3>
          </div>

          <div className="calendar-browser-controls">
            {calendarView !== 'quarter' && (
              <div className="calendar-arrow-group">
                <button type="button" aria-label="Zurück" onClick={() => moveSelectedDate(-1)}>
                  <ChevronLeft aria-hidden="true" />
                </button>
                <button type="button" aria-label="Weiter" onClick={() => moveSelectedDate(1)}>
                  <ChevronRight aria-hidden="true" />
                </button>
              </div>
            )}

            <div className="calendar-tabs" aria-label="Kalenderansicht">
              {(Object.keys(viewLabels) as CalendarView[]).map((view) => (
                <button
                  type="button"
                  key={view}
                  className={calendarView === view ? 'active' : ''}
                  onClick={() => setCalendarView(view)}
                >
                  {viewLabels[view]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {calendarView === 'day' && (
          <DayView
            date={selectedDate}
            items={items}
            tags={calendarTags}
            onEdit={editItem}
            onDelete={onDelete}
            onToggle={toggleTodo}
          />
        )}

        {calendarView === 'week' && (
          <WeekView
            date={selectedDate}
            items={items}
            tags={calendarTags}
            onSelectDate={setSelectedDate}
          />
        )}

        {calendarView === 'month' && (
          <MonthView
            date={selectedDate}
            items={items}
            tags={calendarTags}
            onSelectDate={(date) => {
              setSelectedDate(date)
              setCalendarView('day')
            }}
          />
        )}

        {calendarView === 'quarter' && (
          <QuarterView
            quarterStart={quarter.start}
            items={items}
            tags={calendarTags}
            onSelectDate={(date) => {
              setSelectedDate(date)
              setCalendarView('day')
            }}
          />
        )}

        <div className="calendar-legend-row">
          <div className="calendar-legend">
            {calendarTags.map((tag) => (
              <span key={tag.id}>
                <i className="calendar-dot" style={getTagStyle(tag.id, calendarTags)} />
                {tag.name}
              </span>
            ))}
            <span><i className="calendar-dot" style={getTagStyle('bingo', calendarTags)} />Bingo</span>
          </div>
          <button
            type="button"
            className="calendar-manage-tags-button"
            onClick={() => setIsTagManagerOpen(true)}
          >
            <Pencil aria-hidden="true" />
            Tags verwalten
          </button>
        </div>
      </section>

      {editorIsOpen &&
        createPortal(
          <CalendarEntryForm
            quarter={quarter}
            tags={calendarTags}
            initialEntry={editingEntry ?? undefined}
            initialDate={toDateKey(selectedDate)}
            onClose={closeForm}
            onSave={saveCalendarEntry}
          />,
          document.querySelector('.app') ?? document.body,
        )}

      {isTagManagerOpen &&
        createPortal(
          <CalendarTagManager
            quarterId={quarter.id}
            tags={calendarTags}
            onChange={saveCalendarTags}
            onDelete={deleteCalendarTag}
            onClose={() => setIsTagManagerOpen(false)}
          />,
          document.querySelector('.app') ?? document.body,
        )}
    </div>
  )
}

function DayView({
  date,
  items,
  tags,
  onEdit,
  onDelete,
  onToggle,
}: {
  date: Date
  items: CalendarItem[]
  tags: CalendarTagDefinition[]
  onEdit: (item: CalendarItem) => void
  onDelete: (entryId: string) => void
  onToggle: (item: CalendarItem) => void
}) {
  const dayItems = items.filter((item) => isSameDate(parseDate(item.date), date))

  return (
    <div className="calendar-day-view">
      <h4>{formatLongDay(date)}</h4>
      {dayItems.length === 0 ? (
        <p className="calendar-empty-text">An diesem Tag steht noch nichts.</p>
      ) : (
        <div className="calendar-day-list">
          {dayItems.map((item) => (
            <article
              className="calendar-day-item"
              key={item.id}
              style={getTagStyle(item.tag, tags)}
            >
              <i className="calendar-dot" />
              <div>
                <strong className={item.completed ? 'completed' : ''}>{item.title}</strong>
                <span>{item.sourceLabel}{item.details ? ` · ${item.details}` : ''}</span>
              </div>
              {item.kind === 'todo' && item.sourceEntryId && (
                <button type="button" onClick={() => onToggle(item)} aria-label="Erledigt umschalten">
                  <Check aria-hidden="true" />
                </button>
              )}
              {item.editable && item.sourceEntryId && (
                <>
                  <button type="button" onClick={() => onEdit(item)} aria-label="Bearbeiten">
                    <Pencil aria-hidden="true" />
                  </button>
                  <button type="button" onClick={() => onDelete(item.sourceEntryId!)} aria-label="Löschen">
                    <Trash2 aria-hidden="true" />
                  </button>
                </>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

function WeekView({
  date,
  items,
  tags,
  onSelectDate,
}: {
  date: Date
  items: CalendarItem[]
  tags: CalendarTagDefinition[]
  onSelectDate: (date: Date) => void
}) {
  const firstDay = startOfWeek(date)

  return (
    <div className="calendar-list-view">
      {Array.from({ length: 7 }, (_, index) => addDays(firstDay, index)).map((day) => {
        const dayItems = items.filter((item) => isSameDate(parseDate(item.date), day))
        return (
          <button type="button" key={toDateKey(day)} onClick={() => onSelectDate(day)}>
            <strong>{formatDay(day)}</strong>
            <span>{dayItems.length ? `${dayItems.length} Einträge` : 'frei'}</span>
            <div className="calendar-dots">
              {dayItems.map((item) => (
                <i
                  className="calendar-dot"
                  key={item.id}
                  style={getTagStyle(item.tag, tags)}
                />
              ))}
            </div>
          </button>
        )
      })}
    </div>
  )
}

function MonthView({
  date,
  items,
  tags,
  onSelectDate,
}: {
  date: Date
  items: CalendarItem[]
  tags: CalendarTagDefinition[]
  onSelectDate: (date: Date) => void
}) {
  return (
    <div className="calendar-month">
      <div className="calendar-weekdays">
        {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((day) => <span key={day}>{day}</span>)}
      </div>
      <div className="calendar-month-grid">
        {getMonthDays(date).map((day) => {
          const dayItems = items.filter((item) => isSameDate(parseDate(item.date), day))
          return (
            <button
              type="button"
              key={toDateKey(day)}
              className={`${day.getMonth() !== date.getMonth() ? 'outside' : ''} ${isSameDate(day, date) ? 'selected' : ''}`}
              onClick={() => onSelectDate(day)}
            >
              <span>{day.getDate()}</span>
              <div className="calendar-dots">
                {dayItems.slice(0, 5).map((item) => (
                  <i
                    className="calendar-dot"
                    key={item.id}
                    style={getTagStyle(item.tag, tags)}
                  />
                ))}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function QuarterView({
  quarterStart,
  items,
  tags,
  onSelectDate,
}: {
  quarterStart: string
  items: CalendarItem[]
  tags: CalendarTagDefinition[]
  onSelectDate: (date: Date) => void
}) {
  const start = getQuarterStart(quarterStart)

  return (
    <div className="calendar-quarter-grid">
      {[0, 1, 2].map((offset) => {
        const month = addMonths(start, offset)
        return (
          <div className="calendar-mini-month" key={offset}>
            <h4>{formatMonth(month)}</h4>
            <div className="calendar-mini-grid">
              {getMonthDays(month).map((day) => {
                const dayItems = items.filter((item) => isSameDate(parseDate(item.date), day))
                return (
                  <button
                    type="button"
                    key={toDateKey(day)}
                    className={day.getMonth() !== month.getMonth() ? 'outside' : ''}
                    onClick={() => onSelectDate(day)}
                  >
                    <span>{day.getDate()}</span>
                    {dayItems.length > 0 && (
                      <i
                        className="calendar-dot"
                        style={getTagStyle(dayItems[0].tag, tags)}
                      />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function CalendarEntryForm({
  quarter,
  tags,
  initialEntry,
  initialDate,
  onClose,
  onSave,
}: {
  quarter: Quarter
  tags: CalendarTagDefinition[]
  initialEntry?: Entry
  initialDate: string
  onClose: () => void
  onSave: (entry: Entry) => void
}) {
  const [title, setTitle] = useState(initialEntry?.title ?? '')
  const [kind, setKind] = useState<CalendarKind>(initialEntry?.calendarKind ?? 'todo')
  const [period, setPeriod] = useState<CalendarPeriod>(initialEntry?.calendarPeriod ?? 'day')
  const [date, setDate] = useState(initialEntry?.date ?? initialDate)
  const [tag, setTag] = useState<CalendarTag | ''>(initialEntry?.calendarTag ?? '')
  const [details, setDetails] = useState(initialEntry?.details ?? '')

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!title.trim()) return

    onSave({
      id: initialEntry?.id ?? crypto.randomUUID(),
      quarterId: quarter.id,
      moduleId: 'calendar',
      title: title.trim(),
      details: details.trim(),
      timing: 'fixed',
      date,
      calendarKind: kind,
      calendarTag: tag || undefined,
      calendarPeriod: kind === 'event' ? 'day' : period,
      completed: initialEntry?.completed ?? false,
      createdAt: initialEntry?.createdAt ?? new Date().toISOString(),
    })
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section className="entry-dialog calendar-entry-dialog" role="dialog" aria-modal="true" aria-labelledby="calendar-form-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="dialog-header">
          <div>
            <p className="eyebrow">{initialEntry ? 'Eintrag bearbeiten' : quarter.label}</p>
            <h2 id="calendar-form-title">{initialEntry ? 'Eintrag ändern' : 'Neuer Eintrag'}</h2>
          </div>
          <button type="button" className="close-button" aria-label="Schließen" onClick={onClose}><X aria-hidden="true" /></button>
        </div>

        <form className="entry-form" onSubmit={submit}>
          <label className="form-field">
            <span>Titel</span>
            <input autoFocus required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Was steht an?" />
          </label>

          <div className="calendar-form-choice">
            <span>Art</span>
            <div>
              <button type="button" className={kind === 'todo' ? 'active' : ''} onClick={() => setKind('todo')}>To-do</button>
              <button type="button" className={kind === 'event' ? 'active' : ''} onClick={() => setKind('event')}>Termin / Eintrag</button>
            </div>
          </div>

          {kind === 'todo' && (
            <div className="calendar-form-choice">
              <span>Zeitraum</span>
              <div>
                {(['day', 'week', 'month'] as CalendarPeriod[]).map((option) => (
                  <button type="button" key={option} className={period === option ? 'active' : ''} onClick={() => setPeriod(option)}>
                    {option === 'day' ? 'Tag' : option === 'week' ? 'Woche' : 'Monat'}
                  </button>
                ))}
              </div>
            </div>
          )}

          <label className="form-field">
            <span>{kind === 'todo' && period !== 'day' ? 'Datum innerhalb des Zeitraums' : 'Datum'}</span>
            <input type="date" required min={quarter.start} max={quarter.end} value={date} onChange={(event) => setDate(event.target.value)} />
          </label>

          <div className="calendar-form-choice calendar-tag-choice">
            <span>Tag – optional</span>
            <div>
              <button
                type="button"
                className={tag === '' ? 'active' : ''}
                onClick={() => setTag('')}
              >
                Ohne Tag
              </button>
              {tags.map((option) => (
                <button
                  type="button"
                  key={option.id}
                  className={tag === option.id ? 'active' : ''}
                  style={getTagStyle(option.id, tags)}
                  onClick={() => setTag(option.id)}
                >
                  <i className="calendar-dot" />
                  {option.name}
                </button>
              ))}
            </div>
            {tags.length === 0 && (
              <small className="calendar-tag-hint">
                Für dieses Quartal sind noch keine Tags angelegt.
              </small>
            )}
          </div>

          <label className="form-field">
            <span>Details – optional</span>
            <textarea rows={3} value={details} onChange={(event) => setDetails(event.target.value)} placeholder="Zum Beispiel Uhrzeit, Ort oder kurze Notiz …" />
          </label>

          <div className="form-actions">
            <button type="button" className="secondary-button" onClick={onClose}>Abbrechen</button>
            <button type="submit" className="save-button">Speichern</button>
          </div>
        </form>
      </section>
    </div>
  )
}

function CalendarTagManager({
  quarterId,
  tags,
  onChange,
  onDelete,
  onClose,
}: {
  quarterId: QuarterId
  tags: CalendarTagDefinition[]
  onChange: (tags: CalendarTagDefinition[]) => void
  onDelete: (tagId: string) => void
  onClose: () => void
}) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [color, setColor] = useState(TAG_COLORS[tags.length % TAG_COLORS.length])
  const [error, setError] = useState('')

  function resetForm() {
    setEditingId(null)
    setName('')
    setColor(TAG_COLORS[tags.length % TAG_COLORS.length])
    setError('')
  }

  function startEditing(tag: CalendarTagDefinition) {
    setEditingId(tag.id)
    setName(tag.name)
    setColor(tag.color)
    setError('')
  }

  function saveTag(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const cleanName = name.trim()
    if (!cleanName) return

    const duplicate = tags.some(
      (tag) => tag.id !== editingId && tag.name.toLocaleLowerCase() === cleanName.toLocaleLowerCase(),
    )
    if (duplicate) {
      setError('Diesen Tag gibt es bereits.')
      return
    }

    if (editingId) {
      onChange(
        tags.map((tag) =>
          tag.id === editingId ? { ...tag, name: cleanName, color } : tag,
        ),
      )
    } else {
      onChange([
        ...tags,
        {
          id: `calendar-tag-${crypto.randomUUID()}`,
          quarterId,
          name: cleanName,
          color,
        },
      ])
    }

    resetForm()
  }

  function removeTag(tag: CalendarTagDefinition) {
    if (!window.confirm(`Tag „${tag.name}“ wirklich löschen? Die Kalendereinträge bleiben erhalten.`)) {
      return
    }
    onDelete(tag.id)
    if (editingId === tag.id) resetForm()
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section
        className="entry-dialog calendar-tag-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="calendar-tag-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="dialog-header">
          <div>
            <p className="eyebrow">Dieses Quartal</p>
            <h2 id="calendar-tag-title">Tags verwalten</h2>
          </div>
          <button type="button" className="close-button" aria-label="Schließen" onClick={onClose}>
            <X aria-hidden="true" />
          </button>
        </div>

        <div className="calendar-tag-manager-body">
          {tags.length === 0 ? (
            <p className="calendar-empty-text">
              Noch keine Tags angelegt. Kalendereinträge funktionieren auch ohne Tags.
            </p>
          ) : (
            <div className="calendar-tag-manager-list">
              {tags.map((tag) => (
                <article key={tag.id} style={getTagStyle(tag.id, tags)}>
                  <span><i className="calendar-dot" />{tag.name}</span>
                  <div>
                    <button type="button" aria-label={`${tag.name} bearbeiten`} onClick={() => startEditing(tag)}>
                      <Pencil aria-hidden="true" />
                    </button>
                    <button type="button" aria-label={`${tag.name} löschen`} onClick={() => removeTag(tag)}>
                      <Trash2 aria-hidden="true" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}

          <form className="calendar-tag-editor" onSubmit={saveTag}>
            <div className="calendar-tag-editor-heading">
              <Tags aria-hidden="true" />
              <strong>{editingId ? 'Tag bearbeiten' : 'Neuen Tag anlegen'}</strong>
            </div>
            <label className="form-field">
              <span>Name</span>
              <input
                value={name}
                onChange={(event) => {
                  setName(event.target.value)
                  setError('')
                }}
                placeholder="Zum Beispiel Arbeit, Sport oder Familie"
                maxLength={32}
              />
            </label>
            <label className="calendar-tag-color-field">
              <span>Farbe</span>
              <input type="color" value={color} onChange={(event) => setColor(event.target.value)} />
              <i className="calendar-dot" style={{ '--calendar-tag-color': color } as CSSProperties} />
            </label>
            {error && <p className="calendar-tag-error" role="alert">{error}</p>}
            <div className="calendar-tag-editor-actions">
              {editingId && <button type="button" className="secondary-button" onClick={resetForm}>Abbrechen</button>}
              <button type="submit" className="save-button" disabled={!name.trim()}>
                {editingId ? 'Änderungen speichern' : 'Tag hinzufügen'}
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  )
}

function createCalendarItems(entries: Entry[], bingoBoard?: BingoBoard): CalendarItem[] {
  const entryItems = entries
    .filter((entry): entry is Entry & { date: string } => Boolean(entry.date))
    .map((entry): CalendarItem => ({
      id: `entry-${entry.id}`,
      sourceEntryId: entry.id,
      title: entry.title,
      details: entry.details,
      date: entry.date,
      tag: entry.calendarTag,
      kind: entry.calendarKind ?? getDefaultKind(entry),
      period: entry.calendarPeriod ?? 'day',
      completed: entry.completed ?? false,
      sourceLabel: getSourceLabel(entry),
      editable: entry.moduleId === 'calendar',
    }))

  const bingoItems: CalendarItem[] =
    bingoBoard?.cells
      .filter((cell): cell is typeof cell & { completedAt: string } => Boolean(cell.completed && cell.completedAt))
      .map((cell) => ({
        id: `bingo-${cell.id}`,
        title: cell.text,
        details: '',
        date: cell.completedAt,
        tag: 'bingo',
        kind: 'event',
        period: 'day',
        completed: true,
        sourceLabel: 'Bingo erreicht',
        editable: false,
      })) ?? []

  return [...entryItems, ...bingoItems]
}

function getDefaultKind(entry: Entry): CalendarKind {
  return entry.moduleId === 'projects' || entry.moduleId === 'notes' ? 'todo' : 'event'
}

function getSourceLabel(entry: Entry) {
  const labels: Record<Entry['moduleId'], string> = {
    calendar: 'Kalender',
    projects: 'Vorhaben',
    movement: 'Bewegung',
    logbook: 'Logbuch',
    notes: 'Notizen',
  }
  return labels[entry.moduleId]
}

function getCalendarHeading(view: CalendarView, date: Date, quarterLabel: string) {
  if (view === 'day') return formatLongDay(date)
  if (view === 'week') return formatShortRange(startOfWeek(date), endOfWeek(date))
  if (view === 'month') return formatMonth(date)
  return quarterLabel
}

function getTagStyle(
  tagId: CalendarTag | 'bingo' | undefined,
  tags: CalendarTagDefinition[],
): CSSProperties {
  const color =
    tagId === 'bingo'
      ? BINGO_COLOR
      : tags.find((tag) => tag.id === tagId)?.color ?? '#8a8781'

  return { '--calendar-tag-color': color } as CSSProperties
}

function getCalendarTagStorageKey(quarterId: QuarterId) {
  return `${CALENDAR_TAG_STORAGE_PREFIX}:${quarterId}`
}

function loadAllCalendarTags(): Partial<Record<QuarterId, CalendarTagDefinition[]>> {
  if (typeof window === 'undefined') return {}

  const result: Partial<Record<QuarterId, CalendarTagDefinition[]>> = {}
  ;(['q1', 'q2', 'q3', 'q4'] as QuarterId[]).forEach((quarterId) => {
    try {
      const stored = window.localStorage.getItem(getCalendarTagStorageKey(quarterId))
      if (!stored) return
      const parsed = JSON.parse(stored) as unknown
      if (!Array.isArray(parsed)) return

      result[quarterId] = parsed.filter(isCalendarTagDefinition)
    } catch {
      // Ungültige oder nicht verfügbare lokale Daten blockieren den Kalender nicht.
    }
  })

  return result
}

function persistCalendarTags(quarterId: QuarterId, tags: CalendarTagDefinition[]) {
  try {
    window.localStorage.setItem(getCalendarTagStorageKey(quarterId), JSON.stringify(tags))
  } catch {
    // Der Kalender bleibt auch dann nutzbar, wenn lokaler Speicher blockiert ist.
  }
}

function isCalendarTagDefinition(value: unknown): value is CalendarTagDefinition {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<CalendarTagDefinition>
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.quarterId === 'string' &&
    typeof candidate.name === 'string' &&
    typeof candidate.color === 'string'
  )
}

function createLegacyTagDefinition(
  tagId: string,
  quarterId: QuarterId,
): CalendarTagDefinition {
  const legacyTags: Record<string, { name: string; color: string }> = {
    todo: { name: 'To-do', color: '#8e3d89' },
    movement: { name: 'Bewegung', color: '#357d78' },
    internship: { name: 'Praktikum', color: '#427a4d' },
    leisure: { name: 'Freizeit', color: '#405c9a' },
    university: { name: 'Uni', color: '#b56b35' },
  }
  const legacy = legacyTags[tagId]

  return {
    id: tagId,
    quarterId,
    name: legacy?.name ?? tagId,
    color: legacy?.color ?? TAG_COLORS[0],
  }
}
