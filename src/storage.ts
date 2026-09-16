import type {
  AppSettings,
  BingoBoards,
  Entry,
  LogbookData,
  MovementData,
  ProjectsData,
  QuarterId,
  ViewId,
} from './types'

const ENTRY_STORAGE_KEY = 'quartalskompass.entries.v1'
const BINGO_STORAGE_KEY = 'quartalskompass.bingo.v1'
const PROJECTS_STORAGE_KEY = 'quartalskompass.projects.v1'
const MOVEMENT_STORAGE_KEY = 'quartalskompass.movement.v1'
const LOGBOOK_STORAGE_KEY = 'quartalskompass.logbook.v1'
const SETTINGS_STORAGE_KEY = 'quartalskompass.settings.v1'

const quarterIds: QuarterId[] = ['q1', 'q2', 'q3', 'q4']
const viewIds: ViewId[] = [
  'overview',
  'calendar',
  'projects',
  'movement',
  'logbook',
  'notes',
  'bingo',
]

export function loadEntries(): Entry[] {
  try {
    const savedEntries = localStorage.getItem(ENTRY_STORAGE_KEY)

    if (!savedEntries) return []

    const parsedEntries: unknown = JSON.parse(savedEntries)
    return Array.isArray(parsedEntries) ? (parsedEntries as Entry[]) : []
  } catch {
    return []
  }
}

export function saveEntries(entries: Entry[]) {
  localStorage.setItem(ENTRY_STORAGE_KEY, JSON.stringify(entries))
}

export function loadBingoBoards(): BingoBoards {
  try {
    const savedBoards = localStorage.getItem(BINGO_STORAGE_KEY)

    if (!savedBoards) return {}

    const parsedBoards: unknown = JSON.parse(savedBoards)
    return parsedBoards && typeof parsedBoards === 'object'
      ? (parsedBoards as BingoBoards)
      : {}
  } catch {
    return {}
  }
}

export function saveBingoBoards(boards: BingoBoards) {
  localStorage.setItem(BINGO_STORAGE_KEY, JSON.stringify(boards))
}

const emptyProjectsData: ProjectsData = {
  projects: [],
  activities: [],
  filters: [],
  initializedQuarters: [],
}

export function loadProjectsData(): ProjectsData {
  try {
    const savedData = localStorage.getItem(PROJECTS_STORAGE_KEY)

    if (!savedData) return emptyProjectsData

    const parsedData = JSON.parse(savedData) as Partial<ProjectsData>

    return {
      projects: Array.isArray(parsedData.projects) ? parsedData.projects : [],
      activities: Array.isArray(parsedData.activities)
        ? parsedData.activities
        : [],
      filters: Array.isArray(parsedData.filters) ? parsedData.filters : [],
      initializedQuarters: Array.isArray(parsedData.initializedQuarters)
        ? parsedData.initializedQuarters
        : [],
    }
  } catch {
    return emptyProjectsData
  }
}

export function saveProjectsData(data: ProjectsData) {
  localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(data))
}

const emptyMovementData: MovementData = {
  planItems: [],
  goals: [],
  sessions: [],
  habits: [],
  habitTrackerHidden: {},
}

export function loadMovementData(): MovementData {
  try {
    const savedData = localStorage.getItem(MOVEMENT_STORAGE_KEY)
    if (!savedData) return emptyMovementData

    const parsedData = JSON.parse(savedData) as Partial<MovementData>
    return {
      planItems: Array.isArray(parsedData.planItems) ? parsedData.planItems : [],
      goals: Array.isArray(parsedData.goals) ? parsedData.goals : [],
      sessions: Array.isArray(parsedData.sessions) ? parsedData.sessions : [],
      habits: Array.isArray(parsedData.habits) ? parsedData.habits : [],
      habitTrackerHidden:
        parsedData.habitTrackerHidden &&
        typeof parsedData.habitTrackerHidden === 'object'
          ? parsedData.habitTrackerHidden
          : {},
    }
  } catch {
    return emptyMovementData
  }
}

export function saveMovementData(data: MovementData) {
  localStorage.setItem(MOVEMENT_STORAGE_KEY, JSON.stringify(data))
}

export function loadLogbookData(): LogbookData {
  try {
    const savedData = localStorage.getItem(LOGBOOK_STORAGE_KEY)
    if (!savedData) return { entries: [] }
    const parsedData = JSON.parse(savedData) as Partial<LogbookData>
    return {
      entries: Array.isArray(parsedData.entries) ? parsedData.entries : [],
    }
  } catch {
    return { entries: [] }
  }
}

export function saveLogbookData(data: LogbookData) {
  localStorage.setItem(LOGBOOK_STORAGE_KEY, JSON.stringify(data))
}

export function loadAppSettings(): AppSettings {
  try {
    const savedData = localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (!savedData) return { hiddenModules: {} }
    return normalizeSettings(JSON.parse(savedData))
  } catch {
    return { hiddenModules: {} }
  }
}

export function saveAppSettings(settings: AppSettings) {
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
}

export function createBackupJson() {
  return JSON.stringify(
    {
      app: 'quartalskompass',
      version: 1,
      exportedAt: new Date().toISOString(),
      data: {
        entries: loadEntries(),
        bingoBoards: loadBingoBoards(),
        projectsData: loadProjectsData(),
        movementData: loadMovementData(),
        logbookData: loadLogbookData(),
        settings: loadAppSettings(),
      },
    },
    null,
    2,
  )
}

export function restoreBackupJson(json: string) {
  let parsed: unknown

  try {
    parsed = JSON.parse(json)
  } catch {
    throw new Error('Die Datei enthält kein gültiges JSON.')
  }

  if (!isRecord(parsed) || parsed.app !== 'quartalskompass') {
    throw new Error('Die Datei ist keine Quartalskompass-Sicherung.')
  }

  if (parsed.version !== 1 || !isRecord(parsed.data)) {
    throw new Error('Diese Sicherungsversion wird nicht unterstützt.')
  }

  const data = parsed.data
  if (
    !Array.isArray(data.entries) ||
    !isRecord(data.bingoBoards) ||
    !isProjectsData(data.projectsData) ||
    !isMovementData(data.movementData) ||
    !isLogbookData(data.logbookData)
  ) {
    throw new Error('Die Sicherung ist unvollständig oder beschädigt.')
  }

  saveEntries(data.entries as Entry[])
  saveBingoBoards(data.bingoBoards as BingoBoards)
  saveProjectsData(data.projectsData as ProjectsData)
  saveMovementData(data.movementData as MovementData)
  saveLogbookData(data.logbookData as LogbookData)
  saveAppSettings(normalizeSettings(data.settings))
}

function normalizeSettings(value: unknown): AppSettings {
  if (!isRecord(value)) {
    return { hiddenModules: {} }
  }

  const rawHiddenModules = value.hiddenModules
  if (!isRecord(rawHiddenModules)) return { hiddenModules: {} }

  const hiddenModules: AppSettings['hiddenModules'] = {}
  quarterIds.forEach((quarterId) => {
    const hidden = rawHiddenModules[quarterId]
    if (!Array.isArray(hidden)) return
    hiddenModules[quarterId] = hidden.filter(
      (moduleId): moduleId is ViewId =>
        typeof moduleId === 'string' &&
        moduleId !== 'overview' &&
        viewIds.includes(moduleId as ViewId),
    )
  })

  return { hiddenModules }
}

function isProjectsData(value: unknown) {
  return (
    isRecord(value) &&
    Array.isArray(value.projects) &&
    Array.isArray(value.activities) &&
    Array.isArray(value.filters) &&
    Array.isArray(value.initializedQuarters)
  )
}

function isMovementData(value: unknown) {
  return (
    isRecord(value) &&
    Array.isArray(value.planItems) &&
    Array.isArray(value.goals) &&
    Array.isArray(value.sessions) &&
    Array.isArray(value.habits) &&
    isRecord(value.habitTrackerHidden)
  )
}

function isLogbookData(value: unknown) {
  return isRecord(value) && Array.isArray(value.entries)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
