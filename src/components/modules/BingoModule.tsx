import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { Check, Grid3X3, Pencil, Sparkles, X } from 'lucide-react'
import type {
  BingoBoard,
  BingoCell,
  BingoSize,
  QuarterId,
} from '../../types'
import { createPortal } from 'react-dom'
import './BingoModule.css'

const bingoSizes: BingoSize[] = [3, 4, 5]

export function BingoModule({
  board,
  quarterId,
  isEditorOpen,
  onEditorOpen,
  onEditorClose,
  onChange,
}: {
  board?: BingoBoard
  quarterId: QuarterId
  isEditorOpen: boolean
  onEditorOpen: () => void
  onEditorClose: () => void
  onChange: (board: BingoBoard) => void
}) {
  function toggleCell(cellId: string) {
    if (!board) return

    onChange({
      ...board,
      cells: board.cells.map((cell) =>
        cell.id === cellId && cell.text.trim()
          ? { ...cell, completed: !cell.completed }
          : cell,
      ),
    })
  }

  return (
    <>
      {!board ? (
        <section className="dashboard-card bingo-empty">
          <div className="bingo-empty-visual" aria-hidden="true">
            {Array.from({ length: 9 }, (_, index) => (
              <span key={index} />
            ))}
          </div>

          <div>
            <p className="card-label">Dein Quartal, deine Felder</p>
            <h3>Noch kein Bingo angelegt</h3>
            <p>
              Wähle ein Raster und trage nur Dinge ein, die du wirklich sammeln
              möchtest. Es gibt keine Pflicht, das Feld vollständig zu füllen.
            </p>
            <button
              type="button"
              className="inline-add-button"
              onClick={onEditorOpen}
            >
              <Grid3X3 aria-hidden="true" />
              Bingo gestalten
            </button>
          </div>
        </section>
      ) : (
        <section className="bingo-module">
          <div className="bingo-toolbar">
            <div>
              <p className="card-label">Fortschritt</p>
              <strong>
                {board.cells.filter((cell) => cell.completed).length} von{' '}
                {board.cells.filter((cell) => cell.text.trim()).length} gesammelt
              </strong>
            </div>

            <button
              type="button"
              className="secondary-button bingo-edit-button"
              onClick={onEditorOpen}
            >
              <Pencil aria-hidden="true" />
              Felder bearbeiten
            </button>
          </div>

          <div
            className="bingo-grid"
            style={{ '--bingo-size': board.size } as CSSProperties}
          >
            {board.cells.map((cell, index) => (
              <button
                type="button"
                key={cell.id}
                className={`bingo-cell ${cell.completed ? 'completed' : ''} ${
                  !cell.text.trim() ? 'empty' : ''
                }`}
                aria-pressed={cell.completed}
                aria-label={
                  cell.text.trim()
                    ? `${cell.text}${cell.completed ? ', gesammelt' : ''}`
                    : `Leeres Bingo-Feld ${index + 1}`
                }
                onClick={() => toggleCell(cell.id)}
              >
                {cell.completed && <Check aria-hidden="true" />}
                <span>{cell.text}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {isEditorOpen &&
  createPortal(
    <BingoEditor
      board={board}
      quarterId={quarterId}
      onClose={onEditorClose}
      onSave={(nextBoard) => {
        onChange(nextBoard)
        onEditorClose()
      }}
    />,
    document.querySelector('.app') ?? document.body,
  )}
    </>
  )
}

function BingoEditor({
  board,
  quarterId,
  onClose,
  onSave,
}: {
  board?: BingoBoard
  quarterId: QuarterId
  onClose: () => void
  onSave: (board: BingoBoard) => void
}) {
  const [size, setSize] = useState<BingoSize>(board?.size ?? 4)
  const [texts, setTexts] = useState<string[]>(() =>
    createDraftTexts(board?.size ?? 4, board),
  )

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  function changeSize(nextSize: BingoSize) {
    setSize(nextSize)
    setTexts((currentTexts) =>
      Array.from(
        { length: nextSize * nextSize },
        (_, index) => currentTexts[index] ?? '',
      ),
    )
  }

  function saveBoard(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const cells: BingoCell[] = Array.from(
      { length: size * size },
      (_, index) => {
        const existingCell = board?.cells[index]
        const text = texts[index]?.trim() ?? ''

        return {
          id: existingCell?.id ?? crypto.randomUUID(),
          text,
          completed: text ? (existingCell?.completed ?? false) : false,
        }
      },
    )

    onSave({ quarterId, size, cells })
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section
        className="entry-dialog bingo-editor-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bingo-editor-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="dialog-header">
          <div>
            <p className="eyebrow">Bingo konfigurieren</p>
            <h2 id="bingo-editor-title">Deine Felder</h2>
          </div>

          <button
            type="button"
            className="close-button"
            aria-label="Fenster schließen"
            onClick={onClose}
          >
            <X aria-hidden="true" />
          </button>
        </div>

        <form className="entry-form" onSubmit={saveBoard}>
          <fieldset className="bingo-size-fieldset">
            <legend>Rastergröße</legend>
            <div className="bingo-size-options">
              {bingoSizes.map((option) => (
                <button
                  type="button"
                  key={option}
                  className={size === option ? 'active' : ''}
                  onClick={() => changeSize(option)}
                >
                  {option} × {option}
                </button>
              ))}
            </div>
            {board && size < board.size && (
              <p className="form-hint">
                Beim Verkleinern entfallen die hinteren Felder erst nach dem
                Speichern.
              </p>
            )}
          </fieldset>

          <div
            className="bingo-input-grid"
            style={{ '--bingo-size': size } as CSSProperties}
          >
            {texts.map((text, index) => (
              <label key={index}>
                <span>{index + 1}</span>
                <textarea
                  value={text}
                  rows={2}
                  maxLength={90}
                  placeholder="Feld …"
                  onChange={(event) => {
                    const nextText = event.target.value
                    setTexts((currentTexts) =>
                      currentTexts.map((currentText, currentIndex) =>
                        currentIndex === index ? nextText : currentText,
                      ),
                    )
                  }}
                />
              </label>
            ))}
          </div>

          <p className="form-hint">
            Felder dürfen leer bleiben. Du kannst alle Texte später ändern.
          </p>

          <div className="form-actions">
            <button type="button" className="secondary-button" onClick={onClose}>
              Abbrechen
            </button>
            <button type="submit" className="save-button">
              <Sparkles aria-hidden="true" />
              Bingo speichern
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

function createDraftTexts(size: BingoSize, board?: BingoBoard) {
  return Array.from(
    { length: size * size },
    (_, index) => board?.cells[index]?.text ?? '',
  )
}
