import type {
  BingoBoard,
  Entry,
  LogbookData,
  LogbookEntry,
  LogbookMood,
  MovementData,
  ProjectsData,
  QuarterId,
  ViewId,
} from '../../types'

export type LogbookTimelineItem = {
  id: string
  date: string
  title: string
  details: string
  source: string
  moduleId: ViewId
  mood: LogbookMood
  automatic: boolean
  logEntry?: LogbookEntry
}

export type QuarterTraces = {
  total: number
  movement: number
  projects: number
  bingo: number
  logbook: number
}

export function createLogbookTimeline({
  quarterId,
  entries,
  bingoBoard,
  projectsData,
  movementData,
  logbookData,
}: {
  quarterId: QuarterId
  entries: Entry[]
  bingoBoard?: BingoBoard
  projectsData: ProjectsData
  movementData: MovementData
  logbookData: LogbookData
}): LogbookTimelineItem[] {
  const today = new Date().toISOString().slice(0, 10)

  const manualItems: LogbookTimelineItem[] = logbookData.entries
    .filter((entry) => entry.quarterId === quarterId)
    .map((entry) => ({
      id: `logbook-${entry.id}`,
      date: entry.date,
      title: entry.title,
      details: entry.details,
      source: entry.moduleId ? sourceLabel(entry.moduleId) : 'Eigener Eintrag',
      moduleId: entry.moduleId ?? 'logbook',
      mood: entry.mood,
      automatic: false,
      logEntry: entry,
    }))

  const entryItems: LogbookTimelineItem[] = entries
    .filter(
      (entry): entry is Entry & { date: string } =>
        entry.quarterId === quarterId &&
        Boolean(entry.date) &&
        entry.date! <= today &&
        (entry.calendarKind !== 'todo' || entry.completed === true),
    )
    .map((entry) => ({
      id: `entry-${entry.id}`,
      date: entry.date,
      title: entry.title,
      details: entry.details,
      source: sourceLabel(entry.moduleId),
      moduleId: entry.moduleId,
      mood: 'neutral',
      automatic: true,
    }))

  const sessionItems: LogbookTimelineItem[] = movementData.sessions
    .filter((session) => session.quarterId === quarterId)
    .map((session) => ({
      id: `session-${session.id}`,
      date: session.date,
      title: session.activity,
      details: `${session.durationMinutes} Min${session.notes ? ` · ${session.notes}` : ''}`,
      source: 'Bewegung',
      moduleId: 'movement',
      mood:
        session.rating === 'good'
          ? 'good'
          : session.rating === 'hard'
            ? 'difficult'
            : 'neutral',
      automatic: true,
    }))

  const movementPlanItems: LogbookTimelineItem[] = movementData.planItems
    .filter((item) => item.quarterId === quarterId)
    .map((item) => ({
      id: `movement-plan-${item.id}`,
      date: item.date,
      title: item.title,
      details: item.notes,
      source:
        item.status === 'completed'
          ? 'Bewegungsplan erledigt'
          : item.status === 'postponed'
            ? 'Bewegungsplan verschoben'
            : 'Bewegungsplan',
      moduleId: 'movement',
      mood: item.status === 'completed' ? 'good' : 'neutral',
      automatic: true,
    }))

  const goalItems: LogbookTimelineItem[] = movementData.goals
    .filter((goal) => goal.quarterId === quarterId && goal.completed)
    .map((goal) => ({
      id: `movement-goal-${goal.id}`,
      date: goal.completedAt ?? goal.updatedAt.slice(0, 10),
      title: goal.title,
      details: goal.details,
      source: 'Bewegungsziel erreicht',
      moduleId: 'movement',
      mood: 'good',
      automatic: true,
    }))

  const stepItems: LogbookTimelineItem[] = projectsData.projects
    .filter((project) => project.quarterId === quarterId)
    .flatMap((project) =>
      project.steps
        .filter((step) => step.completed)
        .map((step) => ({
          id: `project-step-${project.id}-${step.id}`,
          date: step.completedAt ?? project.updatedAt.slice(0, 10),
          title: step.title,
          details: `Schritt aus „${project.title}“`,
          source: 'Vorhaben',
          moduleId: 'projects' as const,
          mood: 'good' as const,
          automatic: true,
        })),
    )

  const sidequestItems: LogbookTimelineItem[] = projectsData.activities
    .filter(
      (activity) =>
        activity.quarterId === quarterId &&
        activity.status === 'done' &&
        activity.completedAt,
    )
    .map((activity) => ({
      id: `sidequest-${activity.id}`,
      date: activity.completedAt!.slice(0, 10),
      title: activity.title,
      details: activity.description,
      source: 'Sidequest',
      moduleId: 'projects',
      mood: 'interesting',
      automatic: true,
    }))

  const bingoItems: LogbookTimelineItem[] =
    bingoBoard?.cells
      .filter((cell) => cell.completed && cell.completedAt && cell.text.trim())
      .map((cell) => ({
        id: `bingo-${cell.id}`,
        date: cell.completedAt!,
        title: cell.text,
        details: '',
        source: 'Bingo gesammelt',
        moduleId: 'bingo',
        mood: 'good',
        automatic: true,
      })) ?? []

  return [
    ...manualItems,
    ...entryItems,
    ...movementPlanItems,
    ...sessionItems,
    ...goalItems,
    ...stepItems,
    ...sidequestItems,
    ...bingoItems,
  ].sort((first, second) =>
    second.date.localeCompare(first.date) || second.id.localeCompare(first.id),
  )
}

export function countQuarterTraces({
  quarterId,
  bingoBoard,
  projectsData,
  movementData,
  logbookData,
}: {
  quarterId: QuarterId
  bingoBoard?: BingoBoard
  projectsData: ProjectsData
  movementData: MovementData
  logbookData: LogbookData
}): QuarterTraces {
  const movement =
    movementData.sessions.filter((session) => session.quarterId === quarterId)
      .length +
    movementData.goals.filter(
      (goal) => goal.quarterId === quarterId && goal.completed,
    ).length
  const projects =
    projectsData.activities.filter(
      (activity) =>
        activity.quarterId === quarterId && activity.status === 'done',
    ).length +
    projectsData.projects
      .filter((project) => project.quarterId === quarterId)
      .flatMap((project) => project.steps)
      .filter((step) => step.completed).length
  const bingo =
    bingoBoard?.cells.filter((cell) => cell.completed).length ?? 0
  const logbook = logbookData.entries.filter(
    (entry) => entry.quarterId === quarterId,
  ).length

  return {
    total: movement + projects + bingo + logbook,
    movement,
    projects,
    bingo,
    logbook,
  }
}

function sourceLabel(moduleId: ViewId) {
  const labels: Record<ViewId, string> = {
    overview: 'Übersicht',
    calendar: 'Kalender',
    projects: 'Vorhaben',
    movement: 'Bewegung',
    logbook: 'Logbuch',
    notes: 'Notizen',
    bingo: 'Bingo',
  }
  return labels[moduleId]
}
