import { useEffect, useMemo, useState } from 'react'
import {
  BookPlus,
  CalendarPlus,
  LayoutDashboard,
  Plus,
  Sparkles,
  StickyNote,
} from 'lucide-react'
import './App.css'

import { ModuleNavigation } from './components/layout/ModuleNavigation'
import { QuarterNavigation } from './components/layout/QuarterNavigation'
import { BingoModule } from './components/modules/BingoModule'
import { CalendarModule } from './components/modules/CalendarModule'
import { LogbookModule } from './components/modules/LogbookModule'
import { NotesModule } from './components/modules/NotesModule'
import { OverviewModule } from './components/modules/OverviewModule'
import { ProjectsModule } from './components/modules/ProjectsModule'
import { SettingsDialog } from './components/settings/SettingsDialog'
import {
  createMovementCalendarEntries,
  MovementModule,
} from './components/modules/MovementModule'
import { EntryForm } from './components/ui/EntryForm'
import { descriptions, modules } from './data/modules'
import { quarters } from './data/quarters'
import {
  loadBingoBoards,
  loadAppSettings,
  loadEntries,
  loadMovementData,
  saveAppSettings,
  saveBingoBoards,
  saveEntries,
  saveMovementData,
} from './storage'
import type {
  AppSettings,
  BingoBoard,
  BingoBoards,
  Entry,
  EntryModuleId,
  MovementData,
  QuarterId,
  ViewId,
} from './types'

function App() {
   const [activeQuarterId, setActiveQuarterId] = useState<QuarterId>('q4')
  const [activeView, setActiveView] = useState<ViewId>('overview')
  const [entries, setEntries] = useState<Entry[]>(loadEntries)
  const [bingoBoards, setBingoBoards] =
    useState<BingoBoards>(loadBingoBoards)
  const [isEntryFormOpen, setIsEntryFormOpen] = useState(false)
  const [isBingoEditorOpen, setIsBingoEditorOpen] = useState(false)
  const [isCalendarFormOpen, setIsCalendarFormOpen] = useState(false)
  const [isActivityEditorOpen, setIsActivityEditorOpen] = useState(false)
  const [movementData, setMovementData] =
    useState<MovementData>(loadMovementData)
  const [isMovementSessionFormOpen, setIsMovementSessionFormOpen] =
    useState(false)
  const [isLogbookEditorOpen, setIsLogbookEditorOpen] = useState(false)
  const [isNotesEditorOpen, setIsNotesEditorOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [appSettings, setAppSettings] =
    useState<AppSettings>(loadAppSettings)


  useEffect(() => {
    saveEntries(entries)
  }, [entries])

  useEffect(() => {
    saveBingoBoards(bingoBoards)
  }, [bingoBoards])

  useEffect(() => {
    saveMovementData(movementData)
  }, [movementData])

  useEffect(() => {
    saveAppSettings(appSettings)
  }, [appSettings])

  const activeQuarter =
    quarters.find((quarter) => quarter.id === activeQuarterId) ?? quarters[3]

 const activeModule =
    modules.find((module) => module.id === activeView) ?? modules[0]

  const ActiveViewIcon = activeModule.icon ?? LayoutDashboard

  const hiddenModules = appSettings.hiddenModules[activeQuarterId] ?? []
  const visibleViews = modules
    .filter(
      (module) =>
        module.id === 'overview' || !hiddenModules.includes(module.id),
    )
    .map((module) => module.id)

  const quarterEntries = useMemo(
    () => entries.filter((entry) => entry.quarterId === activeQuarterId),
    [entries, activeQuarterId],
  )

  const calendarEntries = useMemo(
    () => [
      ...quarterEntries,
      ...createMovementCalendarEntries(movementData, activeQuarterId),
    ],
    [quarterEntries, movementData, activeQuarterId],
  )

  function changeQuarter(quarterId: QuarterId) {
    setActiveQuarterId(quarterId)
    setActiveView('overview')
    setIsEntryFormOpen(false)
    setIsBingoEditorOpen(false)
    setIsCalendarFormOpen(false)
    setIsActivityEditorOpen(false)
    setIsMovementSessionFormOpen(false)
    setIsLogbookEditorOpen(false)
    setIsNotesEditorOpen(false)
    setIsSettingsOpen(false)
  }

  function changeView(viewId: ViewId) {
    setActiveView(viewId)
    setIsEntryFormOpen(false)
    setIsBingoEditorOpen(false)
    setIsCalendarFormOpen(false)
    setIsActivityEditorOpen(false)
    setIsMovementSessionFormOpen(false)
    setIsLogbookEditorOpen(false)
    setIsNotesEditorOpen(false)
    setIsSettingsOpen(false)
  }

  function changeModuleVisibility(viewId: ViewId, visible: boolean) {
    if (viewId === 'overview') return

    setAppSettings((current) => {
      const currentHidden = current.hiddenModules[activeQuarterId] ?? []
      const nextHidden = visible
        ? currentHidden.filter((moduleId) => moduleId !== viewId)
        : [...new Set([...currentHidden, viewId])]

      return {
        ...current,
        hiddenModules: {
          ...current.hiddenModules,
          [activeQuarterId]: nextHidden,
        },
      }
    })

    if (!visible && activeView === viewId) setActiveView('overview')
  }

  function addEntry(entry: Entry) {
    setEntries((currentEntries) => [entry, ...currentEntries])
    setIsEntryFormOpen(false)
    setIsCalendarFormOpen(false)
  }

  function updateEntry(updatedEntry: Entry) {
    setEntries((currentEntries) =>
      currentEntries.map((entry) =>
        entry.id === updatedEntry.id ? updatedEntry : entry,
      ),
    )
  }

  function deleteEntry(entryId: string) {
    const shouldDelete = window.confirm(
      'Möchtest du diesen Eintrag wirklich löschen?',
    )

    if (shouldDelete) {
      setEntries((currentEntries) =>
        currentEntries.filter((entry) => entry.id !== entryId),
      )
    }
  }

  function updateBingo(board: BingoBoard) {
    setBingoBoards((currentBoards) => ({
      ...currentBoards,
      [board.quarterId]: board,
    }))
  }

  function openPrimaryForm() {
    if (activeView === 'bingo') {
      setIsBingoEditorOpen(true)
      return
    }

    if (activeView === 'calendar') {
      setIsCalendarFormOpen(true)
      return
    }

    if (activeView === 'projects') {
      setIsActivityEditorOpen(true)
      return
    }

    if (activeView === 'movement') {
      setIsMovementSessionFormOpen(true)
      return
    }

    if (activeView === 'logbook') {
      setIsLogbookEditorOpen(true)
      return
    }

    if (activeView === 'notes') {
      setIsNotesEditorOpen(true)
      return
    }

    setIsEntryFormOpen(true)
  }

  return (
    <div className={`app theme-${activeQuarter.theme}`}>
     
      <QuarterNavigation
        activeQuarterId={activeQuarterId}
        onChange={changeQuarter}
      />

      <div className="workspace">
        <ModuleNavigation
          activeView={activeView}
          visibleViews={visibleViews}
          onChange={changeView}
          onSettingsOpen={() => setIsSettingsOpen(true)}
        />

        <main className="main-content">
          <section className="quarter-heading">
            <div>
              <p className="eyebrow">{activeQuarter.range}</p>
              <h1>{activeQuarter.label}</h1>
            </div>

            <button
              type="button"
              className="add-button"
              onClick={openPrimaryForm}
            >
              {activeView === 'bingo' ? (
                <Sparkles aria-hidden="true" />
              ) : activeView === 'calendar' ? (
                <CalendarPlus aria-hidden="true" />
              ) : activeView === 'logbook' ? (
                <BookPlus aria-hidden="true" />
              ) : activeView === 'notes' ? (
                <StickyNote aria-hidden="true" />
              ) : (
                <Plus aria-hidden="true" />
              )}
              <span>
                {activeView === 'bingo'
                  ? 'Bingo gestalten'
                  : activeView === 'calendar'
                    ? 'Kalendereintrag'
                    : activeView === 'projects'
                      ? 'Aktivität anlegen'
                      : activeView === 'movement'
                        ? 'Training eintragen'
                        : activeView === 'logbook'
                          ? 'Logbucheintrag'
                          : activeView === 'notes'
                            ? 'Notiz anlegen'
                    : 'Neu eintragen'}
              </span>
            </button>
          </section>

          <section className="view-heading">
            <div className="view-icon">
              <ActiveViewIcon aria-hidden="true" />
            </div>

            <div>
              <h2>{activeModule.label}</h2>
              <p>{descriptions[activeView]}</p>
            </div>
          </section>

          {activeView === 'overview' && (
            <OverviewModule
              quarter={activeQuarter}
              entries={calendarEntries}
              bingoBoard={bingoBoards[activeQuarterId]}
              movementData={movementData}
            />
          )}

          {activeView === 'bingo' && (
            <BingoModule
              board={bingoBoards[activeQuarterId]}
              quarterId={activeQuarterId}
              isEditorOpen={isBingoEditorOpen}
              onEditorOpen={() => setIsBingoEditorOpen(true)}
              onEditorClose={() => setIsBingoEditorOpen(false)}
              onChange={updateBingo}
            />
          )}

          {activeView === 'calendar' && (
            <CalendarModule
              key={activeQuarterId}
              quarter={activeQuarter}
              entries={calendarEntries}
              bingoBoard={bingoBoards[activeQuarterId]}
              isFormOpen={isCalendarFormOpen}
              onFormOpen={() => setIsCalendarFormOpen(true)}
              onFormClose={() => setIsCalendarFormOpen(false)}
              onAdd={addEntry}
              onUpdate={updateEntry}
              onDelete={deleteEntry}
            />
          )}
          {activeView === 'projects' && (
            <ProjectsModule
              quarterId={activeQuarterId}
              quarterLabel={activeQuarter.label}
              isActivityEditorOpen={isActivityEditorOpen}
              onActivityEditorOpen={() => setIsActivityEditorOpen(true)}
              onActivityEditorClose={() => setIsActivityEditorOpen(false)}
            />
          )}

          {activeView === 'movement' && (
            <MovementModule
              quarter={activeQuarter}
              data={movementData}
              isSessionFormOpen={isMovementSessionFormOpen}
              onSessionFormOpen={() => setIsMovementSessionFormOpen(true)}
              onSessionFormClose={() => setIsMovementSessionFormOpen(false)}
              onChange={setMovementData}
            />
          )}

          {activeView === 'logbook' && (
            <LogbookModule
              quarter={activeQuarter}
              entries={quarterEntries}
              bingoBoard={bingoBoards[activeQuarterId]}
              movementData={movementData}
              isEditorOpen={isLogbookEditorOpen}
              onEditorOpen={() => setIsLogbookEditorOpen(true)}
              onEditorClose={() => setIsLogbookEditorOpen(false)}
            />
          )}

          {activeView === 'notes' && (
            <NotesModule
              quarter={activeQuarter}
              entries={quarterEntries.filter(
                (entry) => entry.moduleId === 'notes',
              )}
              isEditorOpen={isNotesEditorOpen}
              onEditorOpen={() => setIsNotesEditorOpen(true)}
              onEditorClose={() => setIsNotesEditorOpen(false)}
              onAdd={addEntry}
              onUpdate={updateEntry}
              onDelete={deleteEntry}
            />
          )}
        </main>
      </div>

      {isEntryFormOpen &&
        activeView !== 'bingo' &&
        activeView !== 'movement' &&
        activeView !== 'projects' &&
        activeView !== 'logbook' &&
        activeView !== 'notes' && (
        <EntryForm
          quarter={activeQuarter}
          initialModule={
            activeView === 'overview'
              ? 'calendar'
              : (activeView as EntryModuleId)
          }
          onClose={() => setIsEntryFormOpen(false)}
          onSave={addEntry}
        />
      )}

      {isSettingsOpen && (
        <SettingsDialog
          quarter={activeQuarter}
          hiddenModules={hiddenModules}
          onVisibilityChange={changeModuleVisibility}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
    </div>
  )
}

export default App
