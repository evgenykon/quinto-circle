export interface ChordDiagramData {
  frets: (number | null)[]
  name: string
  startFret: number
}

export interface TabNote {
  /** 0 — 6-я (нижняя) струна, 5 — 1-я. */
  string: number
  fret: number
  /** Колонка табулатуры: ноты с одинаковой колонкой играются одновременно. */
  column: number
}

export interface CellRepeat {
  /** Индекс ячейки листа (0…31), с которой повторяется блок. */
  from: number
  /** Сколько раз повторить блок. */
  times: number
}

export interface CellData {
  chords: string[]
  note: string
  diagram: ChordDiagramData | null
  tab: TabNote[]
  /** Повтор: после этой ячейки возвращаемся к ячейке `from` ещё `times` раз. */
  repeat?: CellRepeat | null
}

export interface RowData {
  part: string
  cells: CellData[]
}

export interface PageData {
  id: string
  rows: RowData[]
}

export interface NotebookFile {
  version: 1
  title: string
  pages: PageData[]
}

export const ROWS_PER_PAGE = 8
export const COLUMNS = 4
export const CHORDS_PER_CELL = 4
export const TABS_PER_CELL = 8

export const PART_PRESETS = [
  'Intro',
  'Verse',
  'Pre-Chorus',
  'Chorus',
  'Bridge',
  'Solo',
  'Interlude',
  'Outro',
]

export const emptyCell = (): CellData => ({
  chords: [],
  note: '',
  diagram: null,
  tab: [],
})

export const emptyPage = (index = 0): PageData => ({
  id: `page-${Date.now().toString(36)}-${index}-${Math.random().toString(36).slice(2, 6)}`,
  rows: Array.from({ length: ROWS_PER_PAGE }, () => ({
    part: '',
    cells: Array.from({ length: COLUMNS }, emptyCell),
  })),
})

export const createNotebook = (): NotebookFile => ({
  version: 1,
  title: 'Репетиция',
  pages: [emptyPage()],
})

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

/** Приводит загруженный файл к актуальной структуре. */
export function normalizeNotebook(input: unknown): NotebookFile {
  const source = (input ?? {}) as Partial<NotebookFile>
  const pages = Array.isArray(source.pages) ? source.pages : []

  return {
    version: 1,
    title: typeof source.title === 'string' && source.title.trim() ? source.title : 'Репетиция',
    pages: (pages.length ? pages : [emptyPage()]).map((page, pageIndex) => {
      const rows = Array.isArray(page?.rows) ? page.rows : []
      return {
        id: typeof page?.id === 'string' ? page.id : `page-${pageIndex}`,
        rows: Array.from({ length: ROWS_PER_PAGE }, (_, rowIndex) => {
          const row = rows[rowIndex] as Partial<RowData> | undefined
          const cells = Array.isArray(row?.cells) ? row!.cells : []
          return {
            part: typeof row?.part === 'string' ? row.part : '',
            cells: Array.from({ length: COLUMNS }, (_, cellIndex) => {
              const cell = cells[cellIndex] as Partial<CellData> | undefined
              return {
                chords: Array.isArray(cell?.chords)
                  ? cell!.chords.filter((item) => typeof item === 'string').slice(0, CHORDS_PER_CELL)
                  : [],
                note: typeof cell?.note === 'string' ? cell.note : '',
                repeat:
                  cell?.repeat
                  && typeof cell.repeat.from === 'number'
                  && typeof cell.repeat.times === 'number'
                  && cell.repeat.times > 0
                    ? { from: cell.repeat.from, times: cell.repeat.times }
                    : null,
                diagram: cell?.diagram && Array.isArray(cell.diagram.frets)
                  ? {
                      frets: cell.diagram.frets.slice(0, 6).map((fret) => (typeof fret === 'number' ? fret : null)),
                      name: typeof cell.diagram.name === 'string' ? cell.diagram.name : '',
                      startFret: typeof cell.diagram.startFret === 'number' ? cell.diagram.startFret : 1,
                    }
                  : null,
                tab: Array.isArray(cell?.tab)
                  ? cell!.tab
                      .map((note, index) => ({ note, index }))
                      .filter(({ note }) => typeof note?.string === 'number' && typeof note?.fret === 'number')
                      .slice(0, TABS_PER_CELL)
                      .map(({ note, index }) => ({
                        string: note.string,
                        fret: note.fret,
                        column:
                          typeof (note as Partial<TabNote>).column === 'number'
                            ? (note as TabNote).column
                            : index,
                      }))
                  : [],
              }
            }),
          }
        }),
      }
    }),
  }
}

/**
 * Номера ячеек листа с учётом повторов: метка «повторить блок [from…index]
 * ещё times раз» сдвигает нумерацию всех последующих ячеек.
 */
export function computeNumbers(page: PageData): number[] {
  const numbers: number[] = []
  let shift = 0
  page.rows.forEach((row, rowIndex) => {
    row.cells.forEach((cell, cellIndex) => {
      const index = rowIndex * COLUMNS + cellIndex
      numbers[index] = index + 1 + shift
      const repeat = cell.repeat
      if (repeat && repeat.times > 0 && repeat.from <= index) {
        shift += repeat.times * (index - repeat.from + 1)
      }
    })
  })
  return numbers
}

export function useNotebook() {
  const notebook = ref<NotebookFile>(createNotebook())
  const activePage = ref(0)

  const page = computed(() => notebook.value.pages[activePage.value] ?? notebook.value.pages[0]!)

  const addPage = () => {
    notebook.value.pages.push(emptyPage(notebook.value.pages.length))
    activePage.value = notebook.value.pages.length - 1
  }

  const removePage = (index: number) => {
    if (notebook.value.pages.length <= 1) return
    notebook.value.pages.splice(index, 1)
    activePage.value = Math.min(activePage.value, notebook.value.pages.length - 1)
  }

  const serialize = () => JSON.stringify(notebook.value, null, 2)

  const toFile = () => {
    const blob = new Blob([serialize()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const safeTitle = notebook.value.title.trim().replace(/[^\p{L}\p{N}\-_ ]/gu, '').replace(/\s+/g, '-')
    link.href = url
    link.download = `${safeTitle || 'notebook'}.chords.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const fromJson = (text: string) => {
    const parsed = JSON.parse(text)
    notebook.value = normalizeNotebook(parsed)
    activePage.value = 0
  }

  return { notebook, activePage, page, addPage, removePage, serialize, toFile, fromJson, clone }
}

export type { CellData as NotebookCellData }
