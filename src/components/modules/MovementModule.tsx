import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  CalendarPlus,
  Check,
  ChevronLeft,
  ChevronRight,
  CirclePlus,
  Eye,
  EyeOff,
  Frown,
  Meh,
  Pause,
  Pencil,
  Play,
  Plus,
  RotateCcw,
  Smile,
  Trash2,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Quarter } from '../../data/quarters'
import type {
  Entry,
  MovementData,
  MovementGoal,
  MovementHabit,
  MovementPlanItem,
  MovementPlanStatus,
  MovementRating,
  MovementSession,
  QuarterId,
} from '../../types'
import {
  addDays,
  endOfWeek,
  formatShortRange,
  getInitialDate,
  isWithin,
  parseDate,
  startOfWeek,
  toDateKey,
} from './calendarUtils'
import './MovementModule.css'

const weekdays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

const ratingOptions: Array<{
  id: MovementRating
  icon: LucideIcon
  label: string
}> = [
  { id: 'good', icon: Smile, label: 'Hat gutgetan' },
  { id: 'neutral', icon: Meh, label: 'War okay' },
  { id: 'hard', icon: Frown, label: 'War heute schwierig' },
]

const planStatusLabels: Record<MovementPlanStatus, string> = {
  planned: 'Geplant',
  completed: 'Erledigt',
  postponed: 'Verschoben',
}

export function MovementModule({
  quarter,
  data,
  isSessionFormOpen,
  onSessionFormOpen,
  onSessionFormClose,
  onChange,
}: {
  quarter: Quarter
  data: MovementData
  isSessionFormOpen: boolean
  onSessionFormOpen: () => void
  onSessionFormClose: () => void
  onChange: React.Dispatch<React.SetStateAction<MovementData>>
}) {
  const [selectedDate, setSelectedDate] = useState(() =>
    getInitialDate(quarter.start, quarter.end),
  )
  const [isPlanEditorOpen, setIsPlanEditorOpen] = useState(false)
  const [editingPlanItem, setEditingPlanItem] = useState<MovementPlanItem>()
  const [planInitialDate, setPlanInitialDate] = useState(quarter.start)
  const [isGoalEditorOpen, setIsGoalEditorOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<MovementGoal>()
  const [isHabitEditorOpen, setIsHabitEditorOpen] = useState(false)
  const [editingHabit, setEditingHabit] = useState<MovementHabit>()
  const [editingSession, setEditingSession] = useState<MovementSession>()
  const [sessionSourcePlan, setSessionSourcePlan] =
    useState<MovementPlanItem>()

  useEffect(() => {
    setSelectedDate(getInitialDate(quarter.start, quarter.end))
    setIsPlanEditorOpen(false)
    setIsGoalEditorOpen(false)
    setIsHabitEditorOpen(false)
    setEditingSession(undefined)
    setSessionSourcePlan(undefined)
  }, [quarter.id, quarter.start, quarter.end])

  const quarterPlanItems = useMemo(
    () => data.planItems.filter((item) => item.quarterId === quarter.id),
    [data.planItems, quarter.id],
  )
  const quarterGoals = useMemo(
    () => data.goals.filter((goal) => goal.quarterId === quarter.id),
    [data.goals, quarter.id],
  )
  const quarterSessions = useMemo(
    () =>
      data.sessions
        .filter((session) => session.quarterId === quarter.id)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [data.sessions, quarter.id],
  )
  const quarterHabits = useMemo(
    () => data.habits.filter((habit) => habit.quarterId === quarter.id),
    [data.habits, quarter.id],
  )

  const weekStart = startOfWeek(selectedDate)
  const weekEnd = endOfWeek(selectedDate)
  const weekDays = Array.from({ length: 7 }, (_, index) =>
    addDays(weekStart, index),
  )
  const weekSessions = quarterSessions.filter((session) =>
    isWithin(parseDate(session.date), weekStart, weekEnd),
  )
  const weekMinutes = weekSessions.reduce(
    (sum, session) => sum + session.durationMinutes,
    0,
  )
  const trackerHidden = data.habitTrackerHidden[quarter.id] ?? false

  function updateData(updater: (current: MovementData) => MovementData) {
    onChange(updater)
  }

  function openNewPlan(date: Date) {
    setEditingPlanItem(undefined)
    setPlanInitialDate(toDateKey(date))
    setIsPlanEditorOpen(true)
  }

  function savePlanItem(item: MovementPlanItem) {
    updateData((current) => ({
      ...current,
      planItems: current.planItems.some((candidate) => candidate.id === item.id)
        ? current.planItems.map((candidate) =>
            candidate.id === item.id ? item : candidate,
          )
        : [...current.planItems, item],
    }))
    setIsPlanEditorOpen(false)
    setEditingPlanItem(undefined)
  }

  function deletePlanItem(itemId: string) {
    if (!window.confirm('Diesen Planeintrag wirklich löschen?')) return
    updateData((current) => ({
      ...current,
      planItems: current.planItems.filter((item) => item.id !== itemId),
    }))
  }

  function changePlanStatus(itemId: string, status: MovementPlanStatus) {
    const now = new Date().toISOString()
    updateData((current) => ({
      ...current,
      planItems: current.planItems.map((item) =>
        item.id === itemId ? { ...item, status, updatedAt: now } : item,
      ),
    }))
  }

  function logPlannedSession(item: MovementPlanItem) {
    setEditingSession(undefined)
    setSessionSourcePlan(item)
    onSessionFormOpen()
  }

  function saveGoal(goal: MovementGoal) {
    updateData((current) => ({
      ...current,
      goals: current.goals.some((candidate) => candidate.id === goal.id)
        ? current.goals.map((candidate) =>
            candidate.id === goal.id ? goal : candidate,
          )
        : [goal, ...current.goals],
    }))
    setIsGoalEditorOpen(false)
    setEditingGoal(undefined)
  }

  function toggleGoal(goalId: string) {
    const now = new Date().toISOString()
    updateData((current) => ({
      ...current,
      goals: current.goals.map((goal) =>
        goal.id === goalId
          ? { ...goal, completed: !goal.completed, updatedAt: now }
          : goal,
      ),
    }))
  }

  function deleteGoal(goalId: string) {
    if (!window.confirm('Dieses Ziel wirklich löschen?')) return
    updateData((current) => ({
      ...current,
      goals: current.goals.filter((goal) => goal.id !== goalId),
    }))
  }

  function saveSession(session: MovementSession) {
    updateData((current) => ({
      ...current,
      sessions: current.sessions.some(
        (candidate) => candidate.id === session.id,
      )
        ? current.sessions.map((candidate) =>
            candidate.id === session.id ? session : candidate,
          )
        : [session, ...current.sessions],
      planItems: session.sourcePlanId
        ? current.planItems.map((item) =>
            item.id === session.sourcePlanId
              ? {
                  ...item,
                  status: 'completed',
                  completedSessionId: session.id,
                  updatedAt: session.updatedAt,
                }
              : item,
          )
        : current.planItems,
    }))
    closeSessionEditor()
  }

  function deleteSession(session: MovementSession) {
    if (!window.confirm('Diese Trainingseinheit wirklich löschen?')) return
    updateData((current) => ({
      ...current,
      sessions: current.sessions.filter((item) => item.id !== session.id),
      planItems: session.sourcePlanId
        ? current.planItems.map((item) =>
            item.id === session.sourcePlanId
              ? {
                  ...item,
                  status: 'planned',
                  completedSessionId: undefined,
                  updatedAt: new Date().toISOString(),
                }
              : item,
          )
        : current.planItems,
    }))
  }

  function closeSessionEditor() {
    setEditingSession(undefined)
    setSessionSourcePlan(undefined)
    onSessionFormClose()
  }

  function saveHabit(habit: MovementHabit) {
    updateData((current) => ({
      ...current,
      habits: current.habits.some((candidate) => candidate.id === habit.id)
        ? current.habits.map((candidate) =>
            candidate.id === habit.id ? habit : candidate,
          )
        : [...current.habits, habit],
    }))
    setIsHabitEditorOpen(false)
    setEditingHabit(undefined)
  }

  function toggleHabitDate(habitId: string, date: string) {
    const now = new Date().toISOString()
    updateData((current) => ({
      ...current,
      habits: current.habits.map((habit) =>
        habit.id === habitId
          ? {
              ...habit,
              checkDates: habit.checkDates.includes(date)
                ? habit.checkDates.filter((item) => item !== date)
                : [...habit.checkDates, date],
              updatedAt: now,
            }
          : habit,
      ),
    }))
  }

  function toggleHabitPause(habitId: string) {
    const now = new Date().toISOString()
    updateData((current) => ({
      ...current,
      habits: current.habits.map((habit) =>
        habit.id === habitId
          ? { ...habit, paused: !habit.paused, updatedAt: now }
          : habit,
      ),
    }))
  }

  function deleteHabit(habitId: string) {
    if (!window.confirm('Diesen Wochenrhythmus wirklich löschen?')) return
    updateData((current) => ({
      ...current,
      habits: current.habits.filter((habit) => habit.id !== habitId),
    }))
  }

  function toggleTrackerVisibility() {
    updateData((current) => ({
      ...current,
      habitTrackerHidden: {
        ...current.habitTrackerHidden,
        [quarter.id]: !trackerHidden,
      },
    }))
  }

  return (
    <>
      <div className="movement-module">
        <section className="movement-surface movement-week-section">
          <div className="movement-section-heading">
            <div>
              <p className="card-label">Wochenplan</p>
              <h3>{formatShortRange(weekStart, weekEnd)}</h3>
            </div>
            <div className="movement-arrow-buttons">
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

          <div className="movement-week-table">
            {weekDays.map((day, index) => {
              const dateKey = toDateKey(day)
              const dayItems = quarterPlanItems.filter((item) => item.date === dateKey)
              const inQuarter = isWithin(
                day,
                parseDate(quarter.start),
                parseDate(quarter.end),
              )
              return (
                <div
                  className={`movement-day-row ${!inQuarter ? 'outside-quarter' : ''}`}
                  key={dateKey}
                >
                  <div className="movement-day-label">
                    <strong>{weekdays[index]}</strong>
                    <span>{formatDayNumber(day)}</span>
                  </div>
                  <div className="movement-day-content">
                    {dayItems.length === 0 ? (
                      <span className="movement-day-empty">Noch nichts geplant</span>
                    ) : (
                      dayItems.map((item) => (
                        <div className={`movement-plan-item status-${item.status}`} key={item.id}>
                          <div>
                            <strong>{item.title}</strong>
                            {item.notes && <span>{item.notes}</span>}
                          </div>
                          <span className="movement-status">{planStatusLabels[item.status]}</span>
                          <div className="movement-row-actions">
                            {item.status !== 'completed' && (
                              <button type="button" aria-label="Als Training eintragen" onClick={() => logPlannedSession(item)}><Check aria-hidden="true" /></button>
                            )}
                            {item.status !== 'postponed' && item.status !== 'completed' && (
                              <button type="button" aria-label="Als verschoben markieren" onClick={() => changePlanStatus(item.id, 'postponed')}><RotateCcw aria-hidden="true" /></button>
                            )}
                            <button type="button" aria-label="Planeintrag bearbeiten" onClick={() => { setEditingPlanItem(item); setPlanInitialDate(item.date); setIsPlanEditorOpen(true) }}><Pencil aria-hidden="true" /></button>
                            <button type="button" aria-label="Planeintrag löschen" onClick={() => deletePlanItem(item.id)}><Trash2 aria-hidden="true" /></button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <button
                    type="button"
                    className="movement-add-day"
                    aria-label={`Eintrag für ${weekdays[index]} hinzufügen`}
                    disabled={!inQuarter}
                    onClick={() => openNewPlan(day)}
                  >
                    <Plus aria-hidden="true" />
                  </button>
                </div>
              )
            })}
          </div>

          <div className="movement-habit-heading">
            <div>
              <p className="card-label">Optional</p>
              <h4>Wochenrhythmus</h4>
            </div>
            <button type="button" className="movement-text-button" onClick={toggleTrackerVisibility}>
              {trackerHidden ? <Eye aria-hidden="true" /> : <EyeOff aria-hidden="true" />}
              {trackerHidden ? 'Einblenden' : 'Ausblenden'}
            </button>
          </div>

          {!trackerHidden && (
            <div className="movement-habits">
              {quarterHabits.length === 0 ? (
                <div className="movement-inline-empty">
                  <span>Noch kein Wochenrhythmus angelegt.</span>
                  <button type="button" className="movement-soft-button" onClick={() => { setEditingHabit(undefined); setIsHabitEditorOpen(true) }}><Plus aria-hidden="true" /> Rhythmus anlegen</button>
                </div>
              ) : (
                <>
                  {quarterHabits.map((habit) => (
                    <HabitRow
                      key={habit.id}
                      habit={habit}
                      weekDays={weekDays}
                      quarter={quarter}
                      onToggleDate={(date) => toggleHabitDate(habit.id, date)}
                      onPause={() => toggleHabitPause(habit.id)}
                      onEdit={() => { setEditingHabit(habit); setIsHabitEditorOpen(true) }}
                      onDelete={() => deleteHabit(habit.id)}
                    />
                  ))}
                  <button type="button" className="movement-text-button" onClick={() => { setEditingHabit(undefined); setIsHabitEditorOpen(true) }}><Plus aria-hidden="true" /> Weiteren Rhythmus anlegen</button>
                </>
              )}
            </div>
          )}
        </section>

        <section className="movement-surface movement-goals-section">
          <div className="movement-section-heading">
            <div><p className="card-label">Eigene Richtung</p><h3>Ziele</h3></div>
            <button type="button" className="movement-soft-button" onClick={() => { setEditingGoal(undefined); setIsGoalEditorOpen(true) }}><Plus aria-hidden="true" /> Ziel anlegen</button>
          </div>
          {quarterGoals.length === 0 ? (
            <div className="movement-goals-empty"><CirclePlus aria-hidden="true" /><p>Noch keine Ziele angelegt.</p></div>
          ) : (
            <div className="movement-goal-list">
              {quarterGoals.map((goal) => (
                <article className={goal.completed ? 'completed' : ''} key={goal.id}>
                  <button type="button" className="movement-goal-check" aria-label={goal.completed ? 'Ziel wieder öffnen' : 'Ziel abhaken'} onClick={() => toggleGoal(goal.id)}>{goal.completed && <Check aria-hidden="true" />}</button>
                  <div><h4>{goal.title}</h4>{goal.details && <p>{goal.details}</p>}</div>
                  <div className="movement-row-actions"><button type="button" aria-label="Ziel bearbeiten" onClick={() => { setEditingGoal(goal); setIsGoalEditorOpen(true) }}><Pencil aria-hidden="true" /></button><button type="button" aria-label="Ziel löschen" onClick={() => deleteGoal(goal.id)}><Trash2 aria-hidden="true" /></button></div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="movement-surface movement-log-section">
          <div className="movement-section-heading">
            <div><p className="card-label">Was wirklich stattgefunden hat</p><h3>Trainingslog</h3></div>
            <button type="button" className="movement-primary-button" onClick={onSessionFormOpen}><CalendarPlus aria-hidden="true" /> Spontane Einheit</button>
          </div>

          <div className="movement-week-review">
            <div><strong>{weekSessions.length}</strong><span>Einheiten diese Woche</span></div>
            <div><strong>{formatDuration(weekMinutes)}</strong><span>Bewegungszeit</span></div>
            <div className="movement-rating-summary">
              {ratingOptions.map((option) => {
                const Icon = option.icon
                return <span key={option.id}><Icon aria-hidden="true" />{weekSessions.filter((session) => session.rating === option.id).length}</span>
              })}
            </div>
          </div>

          {quarterSessions.length === 0 ? (
            <div className="movement-log-empty"><p>Noch keine Trainingseinheit eingetragen.</p><button type="button" className="movement-primary-button" onClick={onSessionFormOpen}>Erste Einheit eintragen</button></div>
          ) : (
            <div className="movement-session-list">
              {quarterSessions.map((session) => (
                <article key={session.id}>
                  <div className="movement-session-date"><strong>{formatDateShort(session.date)}</strong><span>{session.durationMinutes} Min</span></div>
                  <div className="movement-session-content"><h4>{session.activity}</h4>{session.notes && <p>{session.notes}</p>}<span className="movement-rating-label"><RatingIcon rating={session.rating} /> {ratingLabel(session.rating)}</span></div>
                  <div className="movement-row-actions"><button type="button" aria-label="Training bearbeiten" onClick={() => { setEditingSession(session); setSessionSourcePlan(undefined); onSessionFormOpen() }}><Pencil aria-hidden="true" /></button><button type="button" aria-label="Training löschen" onClick={() => deleteSession(session)}><Trash2 aria-hidden="true" /></button></div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      {isPlanEditorOpen && createPortal(
        <PlanEditor quarter={quarter} item={editingPlanItem} initialDate={planInitialDate} onClose={() => { setIsPlanEditorOpen(false); setEditingPlanItem(undefined) }} onSave={savePlanItem} />,
        document.querySelector('.app') ?? document.body,
      )}
      {isGoalEditorOpen && createPortal(
        <GoalEditor quarterId={quarter.id} quarterLabel={quarter.label} goal={editingGoal} onClose={() => { setIsGoalEditorOpen(false); setEditingGoal(undefined) }} onSave={saveGoal} />,
        document.querySelector('.app') ?? document.body,
      )}
      {isHabitEditorOpen && createPortal(
        <HabitEditor quarterId={quarter.id} quarterLabel={quarter.label} habit={editingHabit} onClose={() => { setIsHabitEditorOpen(false); setEditingHabit(undefined) }} onSave={saveHabit} />,
        document.querySelector('.app') ?? document.body,
      )}
      {isSessionFormOpen && createPortal(
        <SessionEditor quarter={quarter} session={editingSession} sourcePlan={sessionSourcePlan} onClose={closeSessionEditor} onSave={saveSession} />,
        document.querySelector('.app') ?? document.body,
      )}
    </>
  )
}

function HabitRow({ habit, weekDays, quarter, onToggleDate, onPause, onEdit, onDelete }: { habit: MovementHabit; weekDays: Date[]; quarter: Quarter; onToggleDate: (date: string) => void; onPause: () => void; onEdit: () => void; onDelete: () => void }) {
  const weekKeys = weekDays.map(toDateKey)
  const count = habit.checkDates.filter((date) => weekKeys.includes(date)).length
  return (
    <article className={`movement-habit-row ${habit.paused ? 'paused' : ''}`}>
      <div className="movement-habit-title"><strong>{habit.title}</strong><span>{habit.paused ? 'Pausiert' : `${count} von ${habit.weeklyTarget} diese Woche`}</span></div>
      <div className="movement-habit-days">
        {weekDays.map((day, index) => {
          const key = toDateKey(day)
          const checked = habit.checkDates.includes(key)
          const inQuarter = isWithin(day, parseDate(quarter.start), parseDate(quarter.end))
          return <button type="button" key={key} className={checked ? 'checked' : ''} disabled={habit.paused || !inQuarter} aria-pressed={checked} aria-label={`${weekdays[index]} ${checked ? 'entfernen' : 'markieren'}`} onClick={() => onToggleDate(key)}><span>{weekdays[index]}</span>{checked && <Check aria-hidden="true" />}</button>
        })}
      </div>
      <div className="movement-row-actions"><button type="button" aria-label={habit.paused ? 'Fortsetzen' : 'Pausieren'} onClick={onPause}>{habit.paused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}</button><button type="button" aria-label="Rhythmus bearbeiten" onClick={onEdit}><Pencil aria-hidden="true" /></button><button type="button" aria-label="Rhythmus löschen" onClick={onDelete}><Trash2 aria-hidden="true" /></button></div>
    </article>
  )
}

function PlanEditor({ quarter, item, initialDate, onClose, onSave }: { quarter: Quarter; item?: MovementPlanItem; initialDate: string; onClose: () => void; onSave: (item: MovementPlanItem) => void }) {
  const [title, setTitle] = useState(item?.title ?? '')
  const [notes, setNotes] = useState(item?.notes ?? '')
  const [date, setDate] = useState(item?.date ?? initialDate)
  const [status, setStatus] = useState<MovementPlanStatus>(item?.status ?? 'planned')
  function submit(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); if (!title.trim()) return; const now = new Date().toISOString(); onSave({ id: item?.id ?? crypto.randomUUID(), quarterId: quarter.id, title: title.trim(), notes: notes.trim(), date, status, completedSessionId: item?.completedSessionId, createdAt: item?.createdAt ?? now, updatedAt: now }) }
  return <MovementDialog eyebrow={quarter.label} title={item ? 'Plan ändern' : 'Bewegung planen'} onClose={onClose}><form className="movement-form" onSubmit={submit}><label className="form-field"><span>Aktivität</span><input autoFocus required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Was steht an?" /></label><div className="movement-form-grid"><label className="form-field"><span>Tag</span><input type="date" min={quarter.start} max={quarter.end} required value={date} onChange={(event) => setDate(event.target.value)} /></label><label className="form-field"><span>Status</span><select value={status} onChange={(event) => setStatus(event.target.value as MovementPlanStatus)}><option value="planned">Geplant</option><option value="completed">Erledigt</option><option value="postponed">Verschoben</option></select></label></div><label className="form-field"><span>Notiz – optional</span><textarea rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Notiz" /></label><MovementFormActions onClose={onClose} label="Plan speichern" /></form></MovementDialog>
}

function GoalEditor({ quarterId, quarterLabel, goal, onClose, onSave }: { quarterId: QuarterId; quarterLabel: string; goal?: MovementGoal; onClose: () => void; onSave: (goal: MovementGoal) => void }) {
  const [title, setTitle] = useState(goal?.title ?? '')
  const [details, setDetails] = useState(goal?.details ?? '')
  function submit(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); if (!title.trim()) return; const now = new Date().toISOString(); onSave({ id: goal?.id ?? crypto.randomUUID(), quarterId, title: title.trim(), details: details.trim(), completed: goal?.completed ?? false, createdAt: goal?.createdAt ?? now, updatedAt: now }) }
  return <MovementDialog eyebrow={quarterLabel} title={goal ? 'Ziel bearbeiten' : 'Ziel anlegen'} onClose={onClose}><form className="movement-form" onSubmit={submit}><label className="form-field"><span>Titel</span><input autoFocus required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Titel" /></label><label className="form-field"><span>Beschreibung – optional</span><textarea rows={3} value={details} onChange={(event) => setDetails(event.target.value)} placeholder="Beschreibung oder eigener Zielwert" /></label><MovementFormActions onClose={onClose} label="Ziel speichern" /></form></MovementDialog>
}

function HabitEditor({ quarterId, quarterLabel, habit, onClose, onSave }: { quarterId: QuarterId; quarterLabel: string; habit?: MovementHabit; onClose: () => void; onSave: (habit: MovementHabit) => void }) {
  const [title, setTitle] = useState(habit?.title ?? '')
  const [weeklyTarget, setWeeklyTarget] = useState(habit?.weeklyTarget ?? 2)
  function submit(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); if (!title.trim()) return; const now = new Date().toISOString(); onSave({ id: habit?.id ?? crypto.randomUUID(), quarterId, title: title.trim(), weeklyTarget, checkDates: habit?.checkDates ?? [], paused: habit?.paused ?? false, createdAt: habit?.createdAt ?? now, updatedAt: now }) }
  return <MovementDialog eyebrow={quarterLabel} title={habit ? 'Rhythmus bearbeiten' : 'Wochenrhythmus anlegen'} onClose={onClose}><form className="movement-form" onSubmit={submit}><label className="form-field"><span>Titel</span><input autoFocus required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Titel" /></label><label className="form-field"><span>Wie oft ungefähr pro Woche?</span><select value={weeklyTarget} onChange={(event) => setWeeklyTarget(Number(event.target.value))}>{Array.from({ length: 7 }, (_, index) => index + 1).map((value) => <option value={value} key={value}>{value} × pro Woche</option>)}</select></label><p className="movement-form-note">Das ist ein hilfreicher Rahmen, keine verpflichtende Serie.</p><MovementFormActions onClose={onClose} label="Rhythmus speichern" /></form></MovementDialog>
}

function SessionEditor({ quarter, session, sourcePlan, onClose, onSave }: { quarter: Quarter; session?: MovementSession; sourcePlan?: MovementPlanItem; onClose: () => void; onSave: (session: MovementSession) => void }) {
  const [activity, setActivity] = useState(session?.activity ?? sourcePlan?.title ?? '')
  const [date, setDate] = useState(session?.date ?? sourcePlan?.date ?? toDateKey(getInitialDate(quarter.start, quarter.end)))
  const [duration, setDuration] = useState(session?.durationMinutes ? String(session.durationMinutes) : '')
  const [notes, setNotes] = useState(session?.notes ?? sourcePlan?.notes ?? '')
  const [rating, setRating] = useState<MovementRating>(session?.rating ?? 'neutral')
  function submit(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); if (!activity.trim() || !Number(duration)) return; const now = new Date().toISOString(); onSave({ id: session?.id ?? crypto.randomUUID(), quarterId: quarter.id, activity: activity.trim(), date, durationMinutes: Number(duration), notes: notes.trim(), rating, sourcePlanId: session?.sourcePlanId ?? sourcePlan?.id, createdAt: session?.createdAt ?? now, updatedAt: now }) }
  return <MovementDialog eyebrow={sourcePlan ? 'Aus dem Wochenplan' : quarter.label} title={session ? 'Training bearbeiten' : 'Training eintragen'} onClose={onClose}><form className="movement-form" onSubmit={submit}><label className="form-field"><span>Aktivität</span><input autoFocus required value={activity} onChange={(event) => setActivity(event.target.value)} placeholder="Aktivität" /></label><div className="movement-form-grid"><label className="form-field"><span>Datum</span><input type="date" min={quarter.start} max={quarter.end} required value={date} onChange={(event) => setDate(event.target.value)} /></label><label className="form-field"><span>Dauer in Minuten</span><input type="number" min="1" step="1" inputMode="numeric" required value={duration} onChange={(event) => setDuration(event.target.value)} placeholder="Minuten" /></label></div><label className="form-field"><span>Notizen – optional</span><textarea rows={4} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Strecke, Kilometer, Gewichte, Wiederholungen, Zeiten oder andere Notizen" /></label><fieldset className="movement-rating-picker"><legend>Wie war es?</legend><div>{ratingOptions.map((option) => { const Icon = option.icon; return <button type="button" key={option.id} className={rating === option.id ? 'active' : ''} aria-pressed={rating === option.id} onClick={() => setRating(option.id)}><Icon aria-hidden="true" /><strong>{option.label}</strong></button> })}</div></fieldset><MovementFormActions onClose={onClose} label="Training speichern" /></form></MovementDialog>
}

function MovementDialog({ eyebrow, title, onClose, children }: { eyebrow: string; title: string; onClose: () => void; children: React.ReactNode }) {
  return <div className="movement-modal-backdrop" onMouseDown={onClose}><section className="movement-dialog" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.stopPropagation()}><div className="movement-dialog-header"><div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2></div><button type="button" className="movement-close-button" aria-label="Fenster schließen" onClick={onClose}><X aria-hidden="true" /></button></div>{children}</section></div>
}

function MovementFormActions({ onClose, label }: { onClose: () => void; label: string }) {
  return <div className="movement-form-actions"><button type="button" className="movement-secondary-button" onClick={onClose}>Abbrechen</button><button type="submit" className="movement-primary-button">{label}</button></div>
}

export function createMovementCalendarEntries(data: MovementData, quarterId: QuarterId): Entry[] {
  const planEntries = data.planItems
    .filter((item) => item.quarterId === quarterId && item.status !== 'postponed' && !item.completedSessionId)
    .map<Entry>((item) => ({ id: `movement-plan-${item.id}`, quarterId, moduleId: 'movement', title: item.title, details: item.notes, timing: 'fixed', date: item.date, calendarKind: 'event', calendarPeriod: 'day', calendarTag: 'movement', completed: item.status === 'completed', createdAt: item.createdAt }))
  const sessionEntries = data.sessions
    .filter((session) => session.quarterId === quarterId)
    .map<Entry>((session) => ({ id: `movement-session-${session.id}`, quarterId, moduleId: 'movement', title: session.activity, details: `${session.durationMinutes} Min${session.notes ? ` · ${session.notes}` : ''}`, timing: 'fixed', date: session.date, calendarKind: 'event', calendarPeriod: 'day', calendarTag: 'movement', completed: true, createdAt: session.createdAt }))
  return [...planEntries, ...sessionEntries]
}

function formatDayNumber(date: Date) { return new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit' }).format(date) }
function formatDateShort(date: string) { return new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: 'short' }).format(parseDate(date)) }
function formatDuration(minutes: number) { if (minutes < 60) return `${minutes} Min`; const hours = Math.floor(minutes / 60); const rest = minutes % 60; return rest ? `${hours} h ${rest} min` : `${hours} h` }
function ratingLabel(rating: MovementRating) { return ratingOptions.find((option) => option.id === rating)?.label ?? 'War okay' }

function RatingIcon({ rating }: { rating: MovementRating }) {
  const Icon = ratingOptions.find((option) => option.id === rating)?.icon ?? Meh
  return <Icon aria-hidden="true" />
}
