import { useMemo, useState } from 'react'
import {
  ArrowRight,
  CalendarDays,
  Check,
  ClipboardList,
  Dumbbell,
  NotebookPen,
  Sparkles,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { modules } from '../../data/modules'
import type { Quarter } from '../../data/quarters'
import { loadLogbookData, loadProjectsData } from '../../storage'
import type { BingoBoard, Entry, MovementData } from '../../types'
import { getInitialDate, parseDate, startOfWeek, toDateKey } from './calendarUtils'
import { countQuarterTraces } from './logbookUtils'
import './OverviewModule.css'

export function OverviewModule({
  quarter,
  entries,
  bingoBoard,
  movementData,
}: {
  quarter: Quarter
  entries: Entry[]
  bingoBoard?: BingoBoard
  movementData: MovementData
}) {
  const [projectsData] = useState(loadProjectsData)
  const [logbookData] = useState(loadLogbookData)
  const referenceDate = getInitialDate(quarter.start, quarter.end)
  const referenceKey = toDateKey(referenceDate)

  const upcomingEntries = useMemo(
    () =>
      entries
        .filter((entry) => entry.date && entry.date >= referenceKey)
        .sort((first, second) =>
          first.date!.localeCompare(second.date!) ||
          first.createdAt.localeCompare(second.createdAt),
        )
        .slice(0, 5),
    [entries, referenceKey],
  )

  const quarterProjects = projectsData.projects.filter(
    (project) => project.quarterId === quarter.id,
  )
  const openProjectSteps = quarterProjects.flatMap((project) =>
    project.steps.filter((step) => !step.completed),
  )
  const nextProject = quarterProjects.find((project) => project.nextStep.trim())
  const nextMovement = movementData.planItems
    .filter(
      (item) =>
        item.quarterId === quarter.id &&
        item.status === 'planned' &&
        item.date >= referenceKey,
    )
    .sort((first, second) => first.date.localeCompare(second.date))[0]
  const nextStep = nextProject?.nextStep || nextMovement?.title

  const weekStart = startOfWeek(referenceDate)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 6)
  const weekStartKey = toDateKey(weekStart)
  const weekEndKey = toDateKey(weekEnd)
  const sessionsThisWeek = movementData.sessions.filter(
    (session) =>
      session.quarterId === quarter.id &&
      session.date >= weekStartKey &&
      session.date <= weekEndKey,
  ).length

  const manualLogbookEntries = logbookData.entries.filter(
    (entry) => entry.quarterId === quarter.id,
  ).length
  const completedBingoCells =
    bingoBoard?.cells.filter((cell) => cell.completed).length ?? 0
  const traces = countQuarterTraces({
    quarterId: quarter.id,
    bingoBoard,
    projectsData,
    movementData,
    logbookData,
  })

  return (
    <div className="overview-module">
      <section className="overview-surface overview-upcoming">
        <div className="overview-card-heading">
          <div>
            <p className="card-label">Ab {formatDate(referenceKey)}</p>
            <h3>Als Nächstes</h3>
          </div>
          <span className="overview-count">{upcomingEntries.length}</span>
        </div>

        {upcomingEntries.length === 0 ? (
          <div className="overview-empty">
            <CalendarDays aria-hidden="true" />
            <div>
              <h4>Gerade ist nichts vorgemerkt</h4>
              <p>Hier erscheinen deine nächsten Termine und flexiblen Pläne.</p>
            </div>
          </div>
        ) : (
          <div className="overview-entry-list">
            {upcomingEntries.map((entry) => (
              <article className="overview-entry" key={entry.id}>
                <time dateTime={entry.date}>{formatDate(entry.date!)}</time>
                <div>
                  <span>{moduleLabel(entry.moduleId)}</span>
                  <h4>{entry.title}</h4>
                  {entry.details && <p>{entry.details}</p>}
                </div>
                {entry.completed && <Check aria-label="Erledigt" />}
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="overview-surface overview-traces">
        <div className="overview-glow" aria-hidden="true" />
        <p className="card-label">Was schon da ist</p>
        <strong>{traces.total}</strong>
        <h3>{quarter.label.split(' ')[0]}-Spuren</h3>
        <p>
          Kein Streak, kein Soll. Nur Dinge, die du gemacht oder festgehalten
          hast.
        </p>
        <div className="overview-trace-dots" aria-label={`${traces.total} Spuren`}>
          {Array.from({ length: Math.min(traces.total, 18) }, (_, index) => (
            <i key={index} />
          ))}
          {traces.total > 18 && <span>+{traces.total - 18}</span>}
        </div>
      </section>

      <section className="overview-surface overview-next-step">
        <div className="overview-next-icon">
          <ArrowRight aria-hidden="true" />
        </div>
        <div>
          <p className="card-label">Ein kleiner nächster Schritt</p>
          <h3>{nextStep || 'Du musst gerade nichts festlegen'}</h3>
          <p>
            {nextStep
              ? 'Nur dieser eine Schritt darf für den Moment reichen.'
              : 'Wenn etwas auftaucht, kannst du es bei Vorhaben oder Bewegung eintragen.'}
          </p>
        </div>
      </section>

      <section className="overview-stat-grid" aria-label="Quartalsübersicht">
        <OverviewStat icon={ClipboardList} value={openProjectSteps.length} label="offene Schritte" />
        <OverviewStat icon={Dumbbell} value={sessionsThisWeek} label="Einheiten diese Woche" />
        <OverviewStat icon={NotebookPen} value={manualLogbookEntries} label="eigene Logbucheinträge" />
        <OverviewStat icon={Sparkles} value={completedBingoCells} label="Bingo-Felder" />
      </section>
    </div>
  )
}

function OverviewStat({ icon: Icon, value, label }: { icon: LucideIcon; value: number; label: string }) {
  return (
    <article className="overview-stat">
      <Icon aria-hidden="true" />
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </article>
  )
}

function moduleLabel(moduleId: Entry['moduleId']) {
  return modules.find((module) => module.id === moduleId)?.label ?? 'Eintrag'
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: 'short',
  }).format(parseDate(date))
}
