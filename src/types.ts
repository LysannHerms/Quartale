export type QuarterId = 'q1' | 'q2' | 'q3' | 'q4'

export type ViewId =
  | 'overview'
  | 'calendar'
  | 'projects'
  | 'movement'
  | 'logbook'
  | 'notes'
  | 'bingo'

export type EntryModuleId = Exclude<ViewId, 'overview' | 'bingo'>

export type Timing = 'open' | 'flexible' | 'fixed'

export type CalendarKind = 'todo' | 'event'
export type CalendarPeriod = 'day' | 'week' | 'month'
export type CalendarTag =
  | 'todo'
  | 'movement'
  | 'internship'
  | 'leisure'
  | 'university'

export type Entry = {
  id: string
  quarterId: QuarterId
  moduleId: EntryModuleId
  title: string
  details: string
  timing: Timing
  date?: string
  calendarKind?: CalendarKind
  calendarPeriod?: CalendarPeriod
  calendarTag?: CalendarTag
  completed?: boolean
  createdAt: string
  updatedAt?: string
}

export type BingoSize = 3 | 4 | 5

export type BingoCell = {
  id: string
  text: string
  completed: boolean
  completedAt?: string
}

export type BingoBoard = {
  quarterId: QuarterId
  size: BingoSize
  cells: BingoCell[]
}

export type BingoBoards = Partial<Record<QuarterId, BingoBoard>>

export type ProjectStep = {
  id: string
  title: string
  completed: boolean
  completedAt?: string
}

export type Project = {
  id: string
  quarterId: QuarterId
  title: string
  description: string
  nextStep: string
  date?: string
  steps: ProjectStep[]
  createdAt: string
  updatedAt: string
}

export type ProjectFilterKind = 'time' | 'world'

export type ProjectFilter = {
  id: string
  quarterId: QuarterId
  kind: ProjectFilterKind
  name: string
}

export type ActivityStatus = 'available' | 'saved' | 'done'

export type ProjectActivity = {
  id: string
  quarterId: QuarterId
  title: string
  description: string
  filterIds: string[]
  status: ActivityStatus
  createdAt: string
  updatedAt: string
  completedAt?: string
}

export type ProjectsData = {
  projects: Project[]
  activities: ProjectActivity[]
  filters: ProjectFilter[]
  initializedQuarters: QuarterId[]
}

export type MovementPlanStatus = 'planned' | 'completed' | 'postponed'

export type MovementPlanItem = {
  id: string
  quarterId: QuarterId
  date: string
  title: string
  notes: string
  status: MovementPlanStatus
  completedSessionId?: string
  createdAt: string
  updatedAt: string
}

export type MovementGoal = {
  id: string
  quarterId: QuarterId
  title: string
  details: string
  completed: boolean
  completedAt?: string
  createdAt: string
  updatedAt: string
}

export type MovementRating = 'good' | 'neutral' | 'hard'

export type MovementSession = {
  id: string
  quarterId: QuarterId
  date: string
  activity: string
  durationMinutes: number
  notes: string
  rating: MovementRating
  sourcePlanId?: string
  createdAt: string
  updatedAt: string
}

export type MovementHabit = {
  id: string
  quarterId: QuarterId
  title: string
  weeklyTarget: number
  checkDates: string[]
  paused: boolean
  createdAt: string
  updatedAt: string
}

export type MovementData = {
  planItems: MovementPlanItem[]
  goals: MovementGoal[]
  sessions: MovementSession[]
  habits: MovementHabit[]
  habitTrackerHidden: Partial<Record<QuarterId, boolean>>
}

export type LogbookMood = 'good' | 'difficult' | 'interesting' | 'neutral'

export type LogbookLinkedModule = Exclude<ViewId, 'overview' | 'logbook'>

export type LogbookEntry = {
  id: string
  quarterId: QuarterId
  date: string
  title: string
  details: string
  mood: LogbookMood
  moduleId?: LogbookLinkedModule
  createdAt: string
  updatedAt: string
}

export type LogbookData = {
  entries: LogbookEntry[]
}

export type AppSettings = {
  hiddenModules: Partial<Record<QuarterId, ViewId[]>>
}
