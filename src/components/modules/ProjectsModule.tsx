import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  Bookmark,
  Check,
  ChevronRight,
  CirclePlus,
  Download,
  ExternalLink,
  FileJson,
  Pencil,
  Plus,
  Settings2,
  Shuffle,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { loadProjectsData, saveProjectsData } from '../../storage'
import type {
  ActivityStatus,
  Project,
  ProjectActivity,
  ProjectFilter,
  ProjectFilterKind,
  ProjectStep,
  ProjectsData,
  QuarterId,
} from '../../types'
import './ProjectsModule.css'

const defaultFilters: Record<ProjectFilterKind, string[]> = {
  time: ['Bis 30 Min', '1–2 Stunden', 'Ganztägig'],
  world: ['Zuhause', 'Kreativ', 'Küche', 'Draußen', 'Bewegung', 'Zu zweit'],
}

type ImportedActivity = {
  title: string
  description: string
  imageData: string
  linkUrl: string
  status: ActivityStatus
  filters: Record<ProjectFilterKind, string[]>
}

type ImportPreview = {
  activities: ImportedActivity[]
  newFilterNames: Record<ProjectFilterKind, string[]>
  skipped: number
}

export function ProjectsModule({
  quarterId,
  quarterLabel,
  isActivityEditorOpen,
  onActivityEditorOpen,
  onActivityEditorClose,
}: {
  quarterId: QuarterId
  quarterLabel: string
  isActivityEditorOpen: boolean
  onActivityEditorOpen: () => void
  onActivityEditorClose: () => void
}) {
  const [data, setData] = useState<ProjectsData>(loadProjectsData)
  const [selectedFilterIds, setSelectedFilterIds] = useState<string[]>([])
  const [ideaIndex, setIdeaIndex] = useState(0)
  const [isProjectEditorOpen, setIsProjectEditorOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project>()
  const [editingActivity, setEditingActivity] = useState<ProjectActivity>()
  const [isFilterManagerOpen, setIsFilterManagerOpen] = useState(false)
  const [isJsonHelpOpen, setIsJsonHelpOpen] = useState(false)
  const [importPreview, setImportPreview] = useState<ImportPreview>()
  const [importError, setImportError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setData((currentData) => initializeQuarter(currentData, quarterId))
    setSelectedFilterIds([])
    setIdeaIndex(0)
  }, [quarterId])

  useEffect(() => {
    saveProjectsData(data)
  }, [data])

  const projects = useMemo(
    () => data.projects.filter((project) => project.quarterId === quarterId),
    [data.projects, quarterId],
  )

  const activities = useMemo(
    () => data.activities.filter((activity) => activity.quarterId === quarterId),
    [data.activities, quarterId],
  )

  const filters = useMemo(
    () => data.filters.filter((filter) => filter.quarterId === quarterId),
    [data.filters, quarterId],
  )

  const matchingIdeas = useMemo(
    () =>
      activities.filter(
        (activity) =>
          activity.status !== 'done' &&
          selectedFilterIds.every((filterId) =>
            activity.filterIds.includes(filterId),
          ),
      ),
    [activities, selectedFilterIds],
  )

  const currentIdea =
    matchingIdeas.length > 0
      ? matchingIdeas[ideaIndex % matchingIdeas.length]
      : undefined

  function openNewProject() {
    setEditingProject(undefined)
    setIsProjectEditorOpen(true)
  }

  function saveProject(project: Project) {
    setData((currentData) => ({
      ...currentData,
      projects: currentData.projects.some((item) => item.id === project.id)
        ? currentData.projects.map((item) =>
            item.id === project.id ? project : item,
          )
        : [project, ...currentData.projects],
    }))
    setIsProjectEditorOpen(false)
    setEditingProject(undefined)
  }

  function deleteProject(projectId: string) {
    if (!window.confirm('Möchtest du dieses Vorhaben wirklich löschen?')) return
    setData((currentData) => ({
      ...currentData,
      projects: currentData.projects.filter((item) => item.id !== projectId),
    }))
  }

  function toggleProjectStep(projectId: string, stepId: string) {
    const updatedAt = new Date().toISOString()
    setData((currentData) => ({
      ...currentData,
      projects: currentData.projects.map((project) =>
        project.id === projectId
          ? {
              ...project,
              updatedAt,
              steps: project.steps.map((step) =>
                step.id === stepId
                  ? {
                      ...step,
                      completed: !step.completed,
                      completedAt: !step.completed ? updatedAt : undefined,
                    }
                  : step,
              ),
            }
          : project,
      ),
    }))
  }

  function deleteProjectStep(projectId: string, stepId: string) {
    if (!window.confirm('Möchtest du diesen Schritt wirklich löschen?')) return
    const updatedAt = new Date().toISOString()
    setData((currentData) => ({
      ...currentData,
      projects: currentData.projects.map((project) =>
        project.id === projectId
          ? {
              ...project,
              updatedAt,
              steps: project.steps.filter((step) => step.id !== stepId),
            }
          : project,
      ),
    }))
  }

  function saveActivity(activity: ProjectActivity) {
    setData((currentData) => ({
      ...currentData,
      activities: currentData.activities.some((item) => item.id === activity.id)
        ? currentData.activities.map((item) =>
            item.id === activity.id ? activity : item,
          )
        : [activity, ...currentData.activities],
    }))
    setEditingActivity(undefined)
    onActivityEditorClose()
  }

  function editActivity(activity: ProjectActivity) {
    setEditingActivity(activity)
    onActivityEditorOpen()
  }

  function deleteActivity(activityId: string) {
    if (!window.confirm('Möchtest du diese Aktivität wirklich löschen?')) return
    setData((currentData) => ({
      ...currentData,
      activities: currentData.activities.filter(
        (activity) => activity.id !== activityId,
      ),
    }))
  }

  function changeActivityStatus(
    activityId: string,
    status: ActivityStatus,
  ) {
    const now = new Date().toISOString()
    setData((currentData) => ({
      ...currentData,
      activities: currentData.activities.map((activity) =>
        activity.id === activityId
          ? {
              ...activity,
              status,
              updatedAt: now,
              completedAt: status === 'done' ? now : undefined,
            }
          : activity,
      ),
    }))
  }

  function addFilter(kind: ProjectFilterKind, name: string) {
    const cleanName = name.trim()
    if (!cleanName) return
    const exists = filters.some(
      (filter) =>
        filter.kind === kind &&
        filter.name.toLocaleLowerCase() === cleanName.toLocaleLowerCase(),
    )
    if (exists) return
    setData((currentData) => ({
      ...currentData,
      filters: [
        ...currentData.filters,
        { id: crypto.randomUUID(), quarterId, kind, name: cleanName },
      ],
    }))
  }

  function renameFilter(filterId: string, name: string) {
    const cleanName = name.trim()
    if (!cleanName) return
    setData((currentData) => ({
      ...currentData,
      filters: currentData.filters.map((filter) =>
        filter.id === filterId ? { ...filter, name: cleanName } : filter,
      ),
    }))
  }

  function deleteFilter(filterId: string) {
    if (
      !window.confirm(
        'Filter löschen? Aktivitäten bleiben erhalten; nur die Zuordnung wird entfernt.',
      )
    )
      return

    setSelectedFilterIds((current) =>
      current.filter((id) => id !== filterId),
    )
    setData((currentData) => ({
      ...currentData,
      filters: currentData.filters.filter((filter) => filter.id !== filterId),
      activities: currentData.activities.map((activity) => ({
        ...activity,
        filterIds: activity.filterIds.filter((id) => id !== filterId),
      })),
    }))
  }

  function toggleFilter(filterId: string) {
    setSelectedFilterIds((current) =>
      current.includes(filterId)
        ? current.filter((id) => id !== filterId)
        : [...current, filterId],
    )
    setIdeaIndex(0)
  }

  async function readImportFile(file?: File) {
    if (!file) return
    setImportError('')
    try {
      const preview = parseImport(await file.text(), filters)
      if (preview.activities.length === 0) {
        setImportError('Die Datei enthält keine gültigen Aktivitäten.')
        return
      }
      setImportPreview(preview)
    } catch {
      setImportError('Die Datei konnte nicht als gültiges JSON gelesen werden.')
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function confirmImport() {
    if (!importPreview) return
    setData((currentData) => importActivities(currentData, quarterId, importPreview))
    setImportPreview(undefined)
  }

  function exportActivities() {
    const filterMap = new Map(filters.map((filter) => [filter.id, filter]))
    const payload = {
      version: 2,
      quarter: quarterId,
      activities: activities.map((activity) => ({
        title: activity.title,
        description: activity.description,
        image: activity.imageData ?? '',
        link: activity.linkUrl ?? '',
        status: activity.status,
        filters: {
          timeframe: activity.filterIds
            .map((id) => filterMap.get(id))
            .filter((filter) => filter?.kind === 'time')
            .map((filter) => filter?.name),
          categories: activity.filterIds
            .map((id) => filterMap.get(id))
            .filter((filter) => filter?.kind === 'world')
            .map((filter) => filter?.name),
        },
      })),
    }
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(payload, null, 2)], {
        type: 'application/json',
      }),
    )
    const link = document.createElement('a')
    link.href = url
    link.download = `sidequests-${quarterId}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <section className="projects-layout">
        <div className="projects-panel projects-main-panel">
          <div className="projects-section-heading">
            <div>
              <p className="card-label">Mit eigenen Schritten</p>
              <h3>Meine Vorhaben</h3>
            </div>
            <button type="button" className="projects-soft-button" onClick={openNewProject}>
              <Plus aria-hidden="true" /> Vorhaben anlegen
            </button>
          </div>

          {projects.length === 0 ? (
            <div className="projects-empty-state">
              <CirclePlus aria-hidden="true" />
              <h4>Noch kein Vorhaben angelegt</h4>
              <p>Titel, Beschreibung und Schritte legst du vollständig selbst fest.</p>
              <button type="button" className="projects-primary-button" onClick={openNewProject}>
                Erstes Vorhaben anlegen
              </button>
            </div>
          ) : (
            <div className="projects-list">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onEdit={() => {
                    setEditingProject(project)
                    setIsProjectEditorOpen(true)
                  }}
                  onDelete={() => deleteProject(project.id)}
                  onToggleStep={(stepId) => toggleProjectStep(project.id, stepId)}
                  onDeleteStep={(stepId) => deleteProjectStep(project.id, stepId)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="projects-side-column">
          <div className="projects-panel projects-filter-panel">
            <div className="projects-section-heading">
              <div>
                <p className="card-label">Frei kombinierbar</p>
                <h3>Was passt gerade?</h3>
              </div>
              <button
                type="button"
                className="projects-icon-button"
                aria-label="Filter verwalten"
                onClick={() => setIsFilterManagerOpen(true)}
              >
                <Settings2 aria-hidden="true" />
              </button>
            </div>

            <FilterChips
              title="Zeitrahmen"
              filters={filters.filter((filter) => filter.kind === 'time')}
              selectedFilterIds={selectedFilterIds}
              onToggle={toggleFilter}
            />
            <FilterChips
              title="Kategorien"
              filters={filters.filter((filter) => filter.kind === 'world')}
              selectedFilterIds={selectedFilterIds}
              onToggle={toggleFilter}
            />
          </div>

          <div className="projects-idea-card">
            <p className="card-label">Passende Sidequest</p>
            {currentIdea ? (
              <>
                <ActivityImage activity={currentIdea} />
                <h3>{currentIdea.title}</h3>
                {currentIdea.description && <p>{currentIdea.description}</p>}
                <ActivityFilterLabels activity={currentIdea} filters={filters} />
                {currentIdea.linkUrl && (
                  <ActivityLink url={currentIdea.linkUrl} />
                )}
                <div className="projects-idea-actions">
                  <button
                    type="button"
                    className="projects-soft-button"
                    onClick={() => setIdeaIndex((current) => current + 1)}
                  >
                    <Shuffle aria-hidden="true" /> Andere Idee
                  </button>
                  <button
                    type="button"
                    className="projects-soft-button"
                    onClick={() => changeActivityStatus(currentIdea.id, 'saved')}
                  >
                    <Bookmark aria-hidden="true" /> Für später
                  </button>
                  <button
                    type="button"
                    className="projects-primary-button"
                    onClick={() => changeActivityStatus(currentIdea.id, 'done')}
                  >
                    <Sparkles aria-hidden="true" /> Gemacht
                  </button>
                </div>
              </>
            ) : (
              <div className="projects-no-idea">
                <h3>{activities.length === 0 ? 'Noch keine Aktivitäten' : 'Keine passende Idee'}</h3>
                <p>
                  {activities.length === 0
                    ? 'Lege eine Aktivität direkt in der App an oder importiere eine JSON-Datei.'
                    : 'Entferne einen Filter oder lege eine passend markierte Aktivität an.'}
                </p>
                <button type="button" className="projects-primary-button" onClick={onActivityEditorOpen}>
                  <Plus aria-hidden="true" /> Aktivität anlegen
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="projects-panel projects-library-panel">
        <div className="projects-section-heading">
          <div>
            <p className="card-label">Bearbeitbar und lokal gespeichert</p>
            <h3>Meine Aktivitäten</h3>
          </div>
          <div className="projects-heading-actions">
            <button type="button" className="projects-soft-button" onClick={() => setIsJsonHelpOpen(true)}>
              <FileJson aria-hidden="true" /> JSON-Hilfe
            </button>
            <input
              ref={fileInputRef}
              className="projects-hidden-input"
              type="file"
              accept="application/json,.json"
              onChange={(event) => readImportFile(event.target.files?.[0])}
            />
            <button type="button" className="projects-soft-button" onClick={() => fileInputRef.current?.click()}>
              <Upload aria-hidden="true" /> Importieren
            </button>
            <button type="button" className="projects-soft-button" disabled={activities.length === 0} onClick={exportActivities}>
              <Download aria-hidden="true" /> Exportieren
            </button>
          </div>
        </div>

        {importError && <p className="projects-error" role="alert">{importError}</p>}

        {activities.length === 0 ? (
          <p className="projects-library-empty">Noch keine Aktivitäten angelegt.</p>
        ) : (
          <div className="projects-activity-grid">
            {activities.map((activity) => (
              <article className={`projects-activity-card status-${activity.status}`} key={activity.id}>
                <div className="projects-card-actions">
                  <button type="button" aria-label="Aktivität bearbeiten" onClick={() => editActivity(activity)}><Pencil aria-hidden="true" /></button>
                  <button type="button" aria-label="Aktivität löschen" onClick={() => deleteActivity(activity.id)}><Trash2 aria-hidden="true" /></button>
                </div>
                <p className="projects-status-label">{statusLabel(activity.status)}</p>
                <ActivityImage activity={activity} />
                <h4>{activity.title}</h4>
                {activity.description && <p>{activity.description}</p>}
                <ActivityFilterLabels activity={activity} filters={filters} />
                {activity.linkUrl && <ActivityLink url={activity.linkUrl} />}
                {activity.status !== 'available' && (
                  <button type="button" className="projects-text-button" onClick={() => changeActivityStatus(activity.id, 'available')}>
                    Wieder verfügbar machen <ChevronRight aria-hidden="true" />
                  </button>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      {isProjectEditorOpen &&
        createPortal(
          <ProjectEditor
            quarterId={quarterId}
            quarterLabel={quarterLabel}
            project={editingProject}
            onClose={() => {
              setIsProjectEditorOpen(false)
              setEditingProject(undefined)
            }}
            onSave={saveProject}
          />,
          document.querySelector('.app') ?? document.body,
        )}

      {isActivityEditorOpen &&
        createPortal(
          <ActivityEditor
            quarterId={quarterId}
            quarterLabel={quarterLabel}
            activity={editingActivity}
            filters={filters}
            onClose={() => {
              setEditingActivity(undefined)
              onActivityEditorClose()
            }}
            onSave={saveActivity}
            onManageFilters={() => setIsFilterManagerOpen(true)}
          />,
          document.querySelector('.app') ?? document.body,
        )}

      {isFilterManagerOpen &&
        createPortal(
          <FilterManager
            quarterLabel={quarterLabel}
            filters={filters}
            onAdd={addFilter}
            onRename={renameFilter}
            onDelete={deleteFilter}
            onClose={() => setIsFilterManagerOpen(false)}
          />,
          document.querySelector('.app') ?? document.body,
        )}

      {isJsonHelpOpen &&
        createPortal(
          <JsonHelp onClose={() => setIsJsonHelpOpen(false)} />,
          document.querySelector('.app') ?? document.body,
        )}

      {importPreview &&
        createPortal(
          <ImportPreviewDialog
            preview={importPreview}
            onCancel={() => setImportPreview(undefined)}
            onConfirm={confirmImport}
          />,
          document.querySelector('.app') ?? document.body,
        )}
    </>
  )
}

function ProjectCard({
  project,
  onEdit,
  onDelete,
  onToggleStep,
  onDeleteStep,
}: {
  project: Project
  onEdit: () => void
  onDelete: () => void
  onToggleStep: (stepId: string) => void
  onDeleteStep: (stepId: string) => void
}) {
  const completedSteps = project.steps.filter((step) => step.completed).length
  const progress = project.steps.length > 0
    ? Math.round((completedSteps / project.steps.length) * 100)
    : 0
  return (
    <article className="projects-project-card">
      <div className="projects-card-actions">
        <button type="button" aria-label="Vorhaben bearbeiten" onClick={onEdit}><Pencil aria-hidden="true" /></button>
        <button type="button" aria-label="Vorhaben löschen" onClick={onDelete}><Trash2 aria-hidden="true" /></button>
      </div>
      <p className="projects-status-label">
        {project.steps.length > 0
          ? `${completedSteps} von ${project.steps.length} Schritten`
          : 'Ohne Schritte'}
      </p>
      <h4>{project.title}</h4>
      {project.description && <p>{project.description}</p>}
      {project.steps.length > 0 && (
        <div
          className="projects-progress"
          role="progressbar"
          aria-label="Fortschritt"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
        >
          <span style={{ width: `${progress}%` }} />
        </div>
      )}
      {project.nextStep && (
        <div className="projects-next-step"><strong>Nächster kleiner Schritt</strong><span>{project.nextStep}</span></div>
      )}
      {project.steps.length > 0 && (
        <div className="projects-steps">
          {project.steps.map((step) => (
            <div className="projects-step-row" key={step.id}>
              <button
                type="button"
                className={`projects-step-toggle${step.completed ? ' completed' : ''}`}
                onClick={() => onToggleStep(step.id)}
              >
                <span className="projects-check">{step.completed && <Check aria-hidden="true" />}</span>
                <span>{step.title}</span>
              </button>
              <button
                type="button"
                className="projects-step-delete"
                aria-label={`Schritt „${step.title}“ löschen`}
                onClick={() => onDeleteStep(step.id)}
              >
                <Trash2 aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      )}
    </article>
  )
}

function ActivityImage({ activity }: { activity: ProjectActivity }) {
  const imageSource = safeImageSource(activity.imageData ?? activity.imageUrl)
  if (!imageSource) return null

  return (
    <img
      className="projects-activity-image"
      src={imageSource}
      alt={activity.title}
      loading="lazy"
      onError={(event) => {
        event.currentTarget.hidden = true
      }}
    />
  )
}

function ActivityLink({ url }: { url: string }) {
  const safeUrl = safeHttpUrl(url)
  if (!safeUrl) return null

  return (
    <a
      className="projects-activity-link"
      href={safeUrl}
      target="_blank"
      rel="noreferrer noopener"
    >
      Link öffnen <ExternalLink aria-hidden="true" />
    </a>
  )
}

function FilterChips({
  title,
  filters,
  selectedFilterIds,
  onToggle,
}: {
  title: string
  filters: ProjectFilter[]
  selectedFilterIds: string[]
  onToggle: (filterId: string) => void
}) {
  return (
    <div className="projects-filter-group">
      <strong>{title}</strong>
      <div className="projects-filter-chips">
        {filters.length === 0 ? (
          <span className="projects-filter-empty">Keine Filter angelegt</span>
        ) : (
          filters.map((filter) => (
            <button
              type="button"
              key={filter.id}
              className={selectedFilterIds.includes(filter.id) ? 'active' : ''}
              aria-pressed={selectedFilterIds.includes(filter.id)}
              onClick={() => onToggle(filter.id)}
            >
              {filter.name}
            </button>
          ))
        )}
      </div>
    </div>
  )
}

function ActivityFilterLabels({
  activity,
  filters,
}: {
  activity: ProjectActivity
  filters: ProjectFilter[]
}) {
  const labels = activity.filterIds
    .map((filterId) => filters.find((filter) => filter.id === filterId))
    .filter((filter): filter is ProjectFilter => Boolean(filter))

  if (labels.length === 0) return null

  return (
    <div className="projects-activity-labels">
      {labels.map((filter) => <span key={filter.id}>{filter.name}</span>)}
    </div>
  )
}

function ProjectEditor({
  quarterId,
  quarterLabel,
  project,
  onClose,
  onSave,
}: {
  quarterId: QuarterId
  quarterLabel: string
  project?: Project
  onClose: () => void
  onSave: (project: Project) => void
}) {
  const [title, setTitle] = useState(project?.title ?? '')
  const [description, setDescription] = useState(project?.description ?? '')
  const [nextStep, setNextStep] = useState(project?.nextStep ?? '')
  const [date, setDate] = useState(project?.date ?? '')
  const [steps, setSteps] = useState<ProjectStep[]>(project?.steps ?? [])

  function addStep() {
    setSteps((current) => [
      ...current,
      { id: crypto.randomUUID(), title: '', completed: false },
    ])
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const cleanTitle = title.trim()
    if (!cleanTitle) return
    const now = new Date().toISOString()
    onSave({
      id: project?.id ?? crypto.randomUUID(),
      quarterId,
      title: cleanTitle,
      description: description.trim(),
      nextStep: nextStep.trim(),
      date: date || undefined,
      steps: steps
        .map((step) => ({ ...step, title: step.title.trim() }))
        .filter((step) => step.title),
      createdAt: project?.createdAt ?? now,
      updatedAt: now,
    })
  }

  return (
    <Dialog title={project ? 'Vorhaben bearbeiten' : 'Vorhaben anlegen'} eyebrow={quarterLabel} onClose={onClose}>
      <form className="projects-form" onSubmit={submit}>
        <label className="form-field"><span>Titel</span><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Titel" autoFocus required /></label>
        <label className="form-field"><span>Beschreibung – optional</span><textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Beschreibung" rows={3} /></label>
        <div className="projects-form-grid">
          <label className="form-field"><span>Nächster kleiner Schritt – optional</span><input value={nextStep} onChange={(event) => setNextStep(event.target.value)} placeholder="Nächster Schritt" /></label>
          <label className="form-field"><span>Datum – optional</span><input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>
        </div>
        <fieldset className="projects-steps-editor">
          <legend>Schritte – optional</legend>
          {steps.map((step, index) => (
            <div key={step.id}>
              <input value={step.title} onChange={(event) => setSteps((current) => current.map((item) => item.id === step.id ? { ...item, title: event.target.value } : item))} placeholder={`Schritt ${index + 1}`} />
              <button type="button" aria-label={`Schritt ${index + 1} entfernen`} onClick={() => setSteps((current) => current.filter((item) => item.id !== step.id))}><X aria-hidden="true" /></button>
            </div>
          ))}
          <button type="button" className="projects-text-button" onClick={addStep}><Plus aria-hidden="true" /> Schritt hinzufügen</button>
        </fieldset>
        <FormActions onClose={onClose} label="Vorhaben speichern" />
      </form>
    </Dialog>
  )
}

function ActivityEditor({
  quarterId,
  quarterLabel,
  activity,
  filters,
  onClose,
  onSave,
  onManageFilters,
}: {
  quarterId: QuarterId
  quarterLabel: string
  activity?: ProjectActivity
  filters: ProjectFilter[]
  onClose: () => void
  onSave: (activity: ProjectActivity) => void
  onManageFilters: () => void
}) {
  const [title, setTitle] = useState(activity?.title ?? '')
  const [description, setDescription] = useState(activity?.description ?? '')
  const [imageData, setImageData] = useState(activity?.imageData ?? activity?.imageUrl ?? '')
  const [imageError, setImageError] = useState('')
  const [linkUrl, setLinkUrl] = useState(activity?.linkUrl ?? '')
  const [filterIds, setFilterIds] = useState<string[]>(activity?.filterIds ?? [])

  function toggle(filterId: string) {
    setFilterIds((current) =>
      current.includes(filterId)
        ? current.filter((id) => id !== filterId)
        : [...current, filterId],
    )
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const cleanTitle = title.trim()
    if (!cleanTitle) return
    const now = new Date().toISOString()
    onSave({
      id: activity?.id ?? crypto.randomUUID(),
      quarterId,
      title: cleanTitle,
      description: description.trim(),
      imageData: imageData || undefined,
      imageUrl: undefined,
      linkUrl: linkUrl.trim() || undefined,
      filterIds,
      status: activity?.status ?? 'available',
      createdAt: activity?.createdAt ?? now,
      updatedAt: now,
      completedAt: activity?.completedAt,
    })
  }

  async function selectImage(file?: File) {
    if (!file) return
    setImageError('')
    try {
      setImageData(await prepareLocalImage(file))
    } catch (error) {
      setImageError(
        error instanceof Error
          ? error.message
          : 'Das Bild konnte nicht verarbeitet werden.',
      )
    }
  }

  return (
    <Dialog title={activity ? 'Aktivität bearbeiten' : 'Aktivität anlegen'} eyebrow={quarterLabel} onClose={onClose}>
      <form className="projects-form" onSubmit={submit}>
        <label className="form-field"><span>Titel</span><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Titel der Aktivität" autoFocus required /></label>
        <label className="form-field"><span>Beschreibung – optional</span><textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Beschreibung, Ort oder Notiz" rows={3} /></label>
        <div className="projects-image-editor">
          <span>Bild – optional</span>
          {safeImageSource(imageData) && <img src={safeImageSource(imageData)} alt="Vorschau" />}
          <div className="projects-image-actions">
            <label className="projects-soft-button">
              <Upload aria-hidden="true" />
              {imageData ? 'Bild ersetzen' : 'Bild auswählen'}
              <input type="file" accept="image/*" onChange={(event) => selectImage(event.target.files?.[0])} />
            </label>
            {imageData && (
              <button type="button" className="projects-secondary-button" onClick={() => { setImageData(''); setImageError('') }}>
                <Trash2 aria-hidden="true" /> Bild entfernen
              </button>
            )}
          </div>
          <small>Das Bild wird verkleinert und nur in diesem Browser gespeichert.</small>
          {imageError && <p className="projects-error" role="alert">{imageError}</p>}
        </div>
        <label className="form-field"><span>Link – optional</span><input type="url" value={linkUrl} onChange={(event) => setLinkUrl(event.target.value)} placeholder="https://…" /></label>
        {(['time', 'world'] as ProjectFilterKind[]).map((kind) => (
          <fieldset className="projects-filter-picker" key={kind}>
            <legend>{kind === 'time' ? 'Zeitrahmen' : 'Kategorien'}</legend>
            <div className="projects-filter-chips">
              {filters.filter((filter) => filter.kind === kind).map((filter) => (
                <button type="button" key={filter.id} className={filterIds.includes(filter.id) ? 'active' : ''} aria-pressed={filterIds.includes(filter.id)} onClick={() => toggle(filter.id)}>{filter.name}</button>
              ))}
            </div>
          </fieldset>
        ))}
        <button type="button" className="projects-text-button" onClick={onManageFilters}><Settings2 aria-hidden="true" /> Filter verwalten</button>
        <FormActions onClose={onClose} label="Aktivität speichern" />
      </form>
    </Dialog>
  )
}

function FilterManager({
  quarterLabel,
  filters,
  onAdd,
  onRename,
  onDelete,
  onClose,
}: {
  quarterLabel: string
  filters: ProjectFilter[]
  onAdd: (kind: ProjectFilterKind, name: string) => void
  onRename: (filterId: string, name: string) => void
  onDelete: (filterId: string) => void
  onClose: () => void
}) {
  const [newNames, setNewNames] = useState<Record<ProjectFilterKind, string>>({ time: '', world: '' })
  return (
    <Dialog title="Filter verwalten" eyebrow={quarterLabel} onClose={onClose}>
      <div className="projects-filter-manager">
        {(['time', 'world'] as ProjectFilterKind[]).map((kind) => (
          <section key={kind}>
            <h3>{kind === 'time' ? 'Zeitrahmen' : 'Kategorien'}</h3>
            <div className="projects-filter-rows">
              {filters.filter((filter) => filter.kind === kind).map((filter) => (
                <FilterRow key={filter.id} filter={filter} onRename={onRename} onDelete={onDelete} />
              ))}
            </div>
            <form onSubmit={(event) => { event.preventDefault(); onAdd(kind, newNames[kind]); setNewNames((current) => ({ ...current, [kind]: '' })) }}>
              <input value={newNames[kind]} onChange={(event) => setNewNames((current) => ({ ...current, [kind]: event.target.value }))} placeholder="Neuer Filter" />
              <button type="submit" className="projects-soft-button"><Plus aria-hidden="true" /> Hinzufügen</button>
            </form>
          </section>
        ))}
        <div className="projects-form-actions"><button type="button" className="projects-primary-button" onClick={onClose}>Fertig</button></div>
      </div>
    </Dialog>
  )
}

function FilterRow({ filter, onRename, onDelete }: { filter: ProjectFilter; onRename: (id: string, name: string) => void; onDelete: (id: string) => void }) {
  const [name, setName] = useState(filter.name)
  return (
    <div className="projects-filter-row">
      <input value={name} onChange={(event) => setName(event.target.value)} onBlur={() => onRename(filter.id, name)} aria-label="Filtername" />
      <button type="button" aria-label="Filter löschen" onClick={() => onDelete(filter.id)}><Trash2 aria-hidden="true" /></button>
    </div>
  )
}

function JsonHelp({ onClose }: { onClose: () => void }) {
  const example = `{
  "version": 2,
  "activities": [
    {
      "title": "Titel der Aktivität",
      "description": "Optionaler Text",
      "link": "https://example.com/weitere-infos",
      "filters": {
        "timeframe": ["Ganztägig"],
        "categories": ["Eigene Kategorie"]
      }
    }
  ]
}`
  return (
    <Dialog title="JSON importieren" eyebrow="So muss die Datei aufgebaut sein" onClose={onClose}>
      <div className="projects-json-help">
        <p>Du kannst beliebig viele Aktivitäten in das Array <code>activities</code> schreiben. Noch unbekannte Filternamen werden beim Import nach deiner Bestätigung automatisch angelegt.</p>
        <pre><code>{example}</code></pre>
        <p><code>title</code> ist erforderlich. <code>description</code>, <code>link</code> und alle Filter sind optional. Unter <code>timeframe</code> und <code>categories</code> kannst du jeweils mehrere Werte eintragen.</p>
        <p>Bilder wählst du nach dem Import beim Bearbeiten der Aktivität direkt vom Handy oder PC aus. Beim späteren Export werden sie automatisch in die JSON-Datei eingebettet und beim erneuten Import wiederhergestellt.</p>
        <div className="projects-form-actions"><button type="button" className="projects-primary-button" onClick={onClose}>Verstanden</button></div>
      </div>
    </Dialog>
  )
}

function ImportPreviewDialog({ preview, onCancel, onConfirm }: { preview: ImportPreview; onCancel: () => void; onConfirm: () => void }) {
  const newFilterCount = preview.newFilterNames.time.length + preview.newFilterNames.world.length
  return (
    <Dialog title="Import prüfen" eyebrow="Vorschau" onClose={onCancel}>
      <div className="projects-import-preview">
        <div><strong>{preview.activities.length}</strong><span>Aktivitäten</span></div>
        <div><strong>{newFilterCount}</strong><span>neue Filter</span></div>
        <div><strong>{preview.skipped}</strong><span>übersprungen</span></div>
      </div>
      {newFilterCount > 0 && <p className="projects-import-note">Neue Filter: {[...preview.newFilterNames.time, ...preview.newFilterNames.world].join(', ')}</p>}
      <div className="projects-form-actions"><button type="button" className="projects-secondary-button" onClick={onCancel}>Abbrechen</button><button type="button" className="projects-primary-button" onClick={onConfirm}>Importieren</button></div>
    </Dialog>
  )
}

function Dialog({ title, eyebrow, onClose, children }: { title: string; eyebrow: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="projects-modal-backdrop" onMouseDown={onClose}>
      <section className="projects-dialog" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.stopPropagation()}>
        <div className="projects-dialog-header"><div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2></div><button type="button" className="projects-close-button" aria-label="Fenster schließen" onClick={onClose}><X aria-hidden="true" /></button></div>
        {children}
      </section>
    </div>
  )
}

function FormActions({ onClose, label }: { onClose: () => void; label: string }) {
  return <div className="projects-form-actions"><button type="button" className="projects-secondary-button" onClick={onClose}>Abbrechen</button><button type="submit" className="projects-primary-button">{label}</button></div>
}

function initializeQuarter(data: ProjectsData, quarterId: QuarterId): ProjectsData {
  if (data.initializedQuarters.includes(quarterId)) return data
  const filters = (Object.keys(defaultFilters) as ProjectFilterKind[]).flatMap((kind) =>
    defaultFilters[kind].map((name) => ({ id: crypto.randomUUID(), quarterId, kind, name })),
  )
  return { ...data, filters: [...data.filters, ...filters], initializedQuarters: [...data.initializedQuarters, quarterId] }
}

function statusLabel(status: ActivityStatus) {
  if (status === 'saved') return 'Für später'
  if (status === 'done') return 'Gemacht'
  return 'Verfügbar'
}

function safeHttpUrl(value?: string) {
  if (!value) return undefined
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
      ? url.toString()
      : undefined
  } catch {
    return undefined
  }
}

function safeImageSource(value?: string) {
  if (!value) return undefined
  if (value.startsWith('data:image/')) return value
  return safeHttpUrl(value)
}

async function prepareLocalImage(file: File) {
  if (!file.type.startsWith('image/')) {
    throw new Error('Bitte wähle eine Bilddatei aus.')
  }
  if (file.size > 20 * 1024 * 1024) {
    throw new Error('Das Bild ist größer als 20 MB. Bitte wähle eine kleinere Datei.')
  }

  const objectUrl = URL.createObjectURL(file)
  try {
    const image = await loadImage(objectUrl)
    const longestSide = Math.max(image.naturalWidth, image.naturalHeight)
    const scale = Math.min(1, 1200 / longestSide)
    const width = Math.max(1, Math.round(image.naturalWidth * scale))
    const height = Math.max(1, Math.round(image.naturalHeight * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Das Bild konnte nicht verarbeitet werden.')
    context.drawImage(image, 0, 0, width, height)

    const blob = await canvasToBlob(canvas, 'image/webp', 0.72)
    return await blobToDataUrl(blob)
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Das Bild konnte nicht geöffnet werden.'))
    image.src = source
  })
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob
        ? resolve(blob)
        : reject(new Error('Das Bild konnte nicht gespeichert werden.')),
      type,
      quality,
    )
  })
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => typeof reader.result === 'string'
      ? resolve(reader.result)
      : reject(new Error('Das Bild konnte nicht gelesen werden.'))
    reader.onerror = () => reject(new Error('Das Bild konnte nicht gelesen werden.'))
    reader.readAsDataURL(blob)
  })
}

function parseImport(source: string, existingFilters: ProjectFilter[]): ImportPreview {
  const parsed: unknown = JSON.parse(source)
  const records = Array.isArray(parsed)
    ? parsed
    : parsed && typeof parsed === 'object' && Array.isArray((parsed as { activities?: unknown }).activities)
      ? (parsed as { activities: unknown[] }).activities
      : []
  const activities: ImportedActivity[] = []
  let skipped = 0
  for (const record of records) {
    if (!record || typeof record !== 'object') { skipped += 1; continue }
    const item = record as Record<string, unknown>
    if (typeof item.title !== 'string' || !item.title.trim()) { skipped += 1; continue }
    const filterObject = item.filters && typeof item.filters === 'object' ? item.filters as Record<string, unknown> : {}
    const getFilterValues = (...keys: string[]) => {
      const value = keys.map((key) => filterObject[key] ?? item[key]).find(Array.isArray)
      return Array.isArray(value)
        ? [...new Set(value.filter((name): name is string => typeof name === 'string').map((name) => name.trim()).filter(Boolean))]
        : []
    }
    const status: ActivityStatus = item.status === 'saved' || item.status === 'done' ? item.status : 'available'
    activities.push({
      title: item.title.trim(),
      description: typeof item.description === 'string' ? item.description.trim() : '',
      imageData: typeof item.image === 'string' && item.image.startsWith('data:image/') ? item.image : '',
      linkUrl: typeof item.link === 'string' ? item.link.trim() : typeof item.linkUrl === 'string' ? item.linkUrl.trim() : '',
      status,
      filters: {
        time: getFilterValues('timeframe', 'time'),
        world: getFilterValues('categories', 'category', 'world'),
      },
    })
  }
  const newFilterNames = (['time', 'world'] as ProjectFilterKind[]).reduce<Record<ProjectFilterKind, string[]>>((result, kind) => {
    result[kind] = [...new Set(activities.flatMap((activity) => activity.filters[kind]))].filter((name) => !existingFilters.some((filter) => filter.kind === kind && filter.name.toLocaleLowerCase() === name.toLocaleLowerCase()))
    return result
  }, { time: [], world: [] })
  return { activities, newFilterNames, skipped }
}

function importActivities(data: ProjectsData, quarterId: QuarterId, preview: ImportPreview): ProjectsData {
  const filters = [...data.filters]
  for (const kind of ['time', 'world'] as ProjectFilterKind[]) {
    for (const name of preview.newFilterNames[kind]) filters.push({ id: crypto.randomUUID(), quarterId, kind, name })
  }
  const quarterFilters = filters.filter((filter) => filter.quarterId === quarterId)
  const now = new Date().toISOString()
  const activities = preview.activities.map<ProjectActivity>((activity) => ({
    id: crypto.randomUUID(), quarterId, title: activity.title, description: activity.description,
    imageData: activity.imageData || undefined, linkUrl: activity.linkUrl || undefined, status: activity.status,
    filterIds: (['time', 'world'] as ProjectFilterKind[]).flatMap((kind) => activity.filters[kind].map((name) => quarterFilters.find((filter) => filter.kind === kind && filter.name.toLocaleLowerCase() === name.toLocaleLowerCase())?.id).filter((id): id is string => Boolean(id))),
    createdAt: now, updatedAt: now, completedAt: activity.status === 'done' ? now : undefined,
  }))
  return { ...data, filters, activities: [...activities, ...data.activities] }
}
