import { quarters } from '../../data/quarters'
import type { QuarterId } from '../../types'

export function QuarterNavigation({
  activeQuarterId,
  onChange,
}: {
  activeQuarterId: QuarterId
  onChange: (quarterId: QuarterId) => void
}) {
  return (
    <nav className="quarter-navigation" aria-label="Quartale">
      {quarters.map((quarter) => (
        <button
          type="button"
          key={quarter.id}
          className={`quarter-button theme-${quarter.theme} ${
            activeQuarterId === quarter.id ? 'active' : ''
          }`}
          onClick={() => onChange(quarter.id)}
        >
          <strong>{quarter.label}</strong>
          <span>{quarter.range}</span>
        </button>
      ))}
    </nav>
  )
}
