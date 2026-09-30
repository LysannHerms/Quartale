import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Circle,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react'
import type { Quarter } from '../../data/quarters'
import type {
  BingoBoard,
  CalendarKind,
  CalendarPeriod,
  CalendarTag,
  Entry,
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
  tag: CalendarTag | 'bingo'
  kind: CalendarKind
  period: CalendarPeriod
  completed: boolean
  sourceLabel: string
  editable: boolean
}

const calendarTags: Array<{ id: CalendarTag; label: string }> = [
  { id: 'todo', label: 'To-do' },
  { id: 'movement', label: 'Bewegung' },
  { id: 'internship', label: 'Praktikum' },
  { id: 'leisure', label: 'Freizeit' },
  { id: 'university', label: 'Uni' },
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
                      <span className={`calendar-week-item tag-${item.tag}`} key={item.id}>
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
                      <i className={`calendar-dot tag-${item.tag}`} />
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
            onEdit={editItem}
            onDelete={onDelete}
            onToggle={toggleTodo}
          />
        )}

        {calendarView === 'week' && (
          <WeekView
            date={selectedDate}
            items={items}
            onSelectDate={setSelectedDate}
          />
        )}

        {calendarView === 'month' && (
          <MonthView
            date={selectedDate}
            items={items}
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
            onSelectDate={(date) => {
              setSelectedDate(date)
              setCalendarView('day')
            }}
          />
        )}

        <div className="calendar-legend">
          {calendarTags.map((tag) => (
            <span key={tag.id}>
              <i className={`calendar-dot tag-${tag.id}`} />
              {tag.label}
            </span>
          ))}
          <span><i className="calendar-dot tag-bingo" />Bingo</span>
        </div>
      </section>

      {editorIsOpen &&
        createPortal(
          <CalendarEntryForm
            quarter={quarter}
            initialEntry={editingEntry ?? undefined}
            initialDate={toDateKey(selectedDate)}
            onClose={closeForm}
            onSave={saveCalendarEntry}
          />,
          document.querySelector('.app') ?? document.body,
        )}
    </div>
  )
}

function DayView({
  date,
  items,
  onEdit,
  onDelete,
  onToggle,
}: {
  date: Date
  items: CalendarItem[]
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
            <article className={`calendar-day-item tag-${item.tag}`} key={item.id}>
              <i className={`calendar-dot tag-${item.tag}`} />
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
  onSelectDate,
}: {
  date: Date
  items: CalendarItem[]
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
              {dayItems.map((item) => <i className={`calendar-dot tag-${item.tag}`} key={item.id} />)}
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
  onSelectDate,
}: {
  date: Date
  items: CalendarItem[]
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
                {dayItems.slice(0, 5).map((item) => <i className={`calendar-dot tag-${item.tag}`} key={item.id} />)}
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
  onSelectDate,
}: {
  quarterStart: string
  items: CalendarItem[]
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
                    {dayItems.length > 0 && <i className={`calendar-dot tag-${dayItems[0].tag}`} />}
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
  initialEntry,
  initialDate,
  onClose,
  onSave,
}: {
  quarter: Quarter
  initialEntry?: Entry
  initialDate: string
  onClose: () => void
  onSave: (entry: Entry) => void
}) {
  const [title, setTitle] = useState(initialEntry?.title ?? '')
  const [kind, setKind] = useState<CalendarKind>(initialEntry?.calendarKind ?? 'todo')
  const [period, setPeriod] = useState<CalendarPeriod>(initialEntry?.calendarPeriod ?? 'day')
  const [date, setDate] = useState(initialEntry?.date ?? initialDate)
  const [tag, setTag] = useState<CalendarTag>(initialEntry?.calendarTag ?? 'todo')
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
      calendarTag: tag,
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
            <span>Tag</span>
            <div>
              {calendarTags.map((option) => (
                <button type="button" key={option.id} className={`${tag === option.id ? 'active' : ''} tag-${option.id}`} onClick={() => setTag(option.id)}>
                  <i className={`calendar-dot tag-${option.id}`} />
                  {option.label}
                </button>
              ))}
            </div>
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

function createCalendarItems(entries: Entry[], bingoBoard?: BingoBoard): CalendarItem[] {
  const entryItems = entries
    .filter((entry): entry is Entry & { date: string } => Boolean(entry.date))
    .map((entry): CalendarItem => ({
      id: `entry-${entry.id}`,
      sourceEntryId: entry.id,
      title: entry.title,
      details: entry.details,
      date: entry.date,
      tag: entry.calendarTag ?? getDefaultTag(entry),
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

function getDefaultTag(entry: Entry): CalendarTag {
  if (entry.moduleId === 'movement') return 'movement'
  if (entry.moduleId === 'projects') return 'todo'
  if (entry.moduleId === 'logbook') return 'leisure'
  return 'todo'
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
