import {
  BookOpen,
  CalendarDays,
  ClipboardList,
  Dumbbell,
  LayoutDashboard,
  NotebookPen,
  Sparkles,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { EntryModuleId, Timing, ViewId } from '../types'

export type ModuleDefinition = {
  id: ViewId
  label: string
  icon: LucideIcon
}

export const modules: ModuleDefinition[] = [
  { id: 'overview', label: 'Übersicht', icon: LayoutDashboard },
  { id: 'calendar', label: 'Kalender', icon: CalendarDays },
  { id: 'projects', label: 'Vorhaben', icon: ClipboardList },
  { id: 'movement', label: 'Bewegung', icon: Dumbbell },
  { id: 'logbook', label: 'Logbuch', icon: BookOpen },
  { id: 'notes', label: 'Notizen', icon: NotebookPen },
  { id: 'bingo', label: 'Bingo', icon: Sparkles },
]

export const standardEntryModules = modules.filter(
  (
    module,
  ): module is ModuleDefinition & { id: EntryModuleId } =>
    module.id !== 'overview' && module.id !== 'bingo',
)

export const descriptions: Record<ViewId, string> = {
  overview: 'Alles, was in diesem Quartal gerade eine Rolle spielt.',
  calendar: 'Feste Termine, flexible Pläne und lose Möglichkeiten.',
  projects: 'Vorhaben und ihre nächsten Schritte.',
  movement: 'Trainingspläne, Bewegungsideen und einzelne Einheiten.',
  logbook: 'Erlebnisse, Gedanken und Rückblicke festhalten.',
  notes: 'Listen, Links und alles, was noch keinen festen Platz hat.',
  bingo: 'Deine frei gestaltbare Sammlung für dieses Quartal.',
}

export const timingLabels: Record<Timing, string> = {
  open: 'Ohne Datum',
  flexible: 'Flexibel',
  fixed: 'Fest geplant',
}
