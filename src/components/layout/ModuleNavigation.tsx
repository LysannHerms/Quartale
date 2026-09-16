import { Settings2 } from 'lucide-react'
import { modules } from '../../data/modules'
import type { ViewId } from '../../types'

export function ModuleNavigation({
  activeView,
  visibleViews,
  onChange,
  onSettingsOpen,
}: {
  activeView: ViewId
  visibleViews: ViewId[]
  onChange: (viewId: ViewId) => void
  onSettingsOpen: () => void
}) {
  return (
    <aside className="sidebar">
      <nav
        className={visibleViews.length <= 4 ? 'compact' : ''}
        aria-label="Bereiche"
      >
        {modules.filter((module) => visibleViews.includes(module.id)).map((module) => {
          const Icon = module.icon

          return (
            <button
              type="button"
              key={module.id}
              className={`sidebar-button ${
                activeView === module.id ? 'active' : ''
              }`}
              onClick={() => onChange(module.id)}
            >
              <Icon aria-hidden="true" />
              <span>{module.label}</span>
            </button>
          )
        })}

        <button
          type="button"
          className="sidebar-button sidebar-settings-button"
          onClick={onSettingsOpen}
        >
          <Settings2 aria-hidden="true" />
          <span>Anpassen</span>
        </button>
      </nav>

      <p className="privacy-note">
        Deine Einträge werden nur in diesem Browser gespeichert.
      </p>
    </aside>
  )
}
