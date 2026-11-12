import {
  CHORDS_PER_CELL,
  COLUMNS,
  ROWS_PER_PAGE,
  TABS_PER_CELL,
  computeNumbers,
  createNotebook,
  emptyCell,
  emptyPage,
  normalizeNotebook,
} from '../app/composables/useNotebook.ts'

let failed = 0
const check = (name: string, ok: boolean, extra = '') => {
  if (!ok) failed++
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${extra ? ' — ' + extra : ''}`)
}

const nb = createNotebook()
check('новая тетрадь: 1 страница', nb.pages.length === 1)
check('новая тетрадь: 8 строк', nb.pages[0]!.rows.length === ROWS_PER_PAGE)
check('новая тетрадь: 4 столбца', nb.pages[0]!.rows[0]!.cells.length === COLUMNS)
check('новая страница: пустые ячейки', JSON.stringify(emptyPage().rows[0]!.cells[0]) === JSON.stringify(emptyCell()))

// мусор на входе
const broken = normalizeNotebook(null)
check('null → валидная тетрадь', broken.pages.length === 1 && broken.pages[0]!.rows.length === ROWS_PER_PAGE)
const weird = normalizeNotebook({ title: '  ', pages: [{ rows: [{ part: 5, cells: 'nope' }] }] })
check('мусор в полях не ломает модель', weird.title === 'Репетиция' && weird.pages[0]!.rows[0]!.part === '')
check('недостающие строки добиваются', weird.pages[0]!.rows.length === ROWS_PER_PAGE)
check('недостающие ячейки добиваются', weird.pages[0]!.rows[0]!.cells.length === COLUMNS)

// ограничения
const overflow = normalizeNotebook({
  pages: [{
    rows: [{
      part: 'Chorus',
      cells: [{
        chords: ['C', 'Am', 'F', 'G', 'Dm', 'Em'],
        note: 'x',
        diagram: { frets: [null, 3, 2, 0, 1, 0, 5, 7], name: 'C', startFret: 1 },
        tab: Array.from({ length: 12 }, (_, i) => ({ string: i % 6, fret: i })),
      }],
    }],
  }],
})
const cell = overflow.pages[0]!.rows[0]!.cells[0]!
check(`аккордов не больше ${CHORDS_PER_CELL}`, cell.chords.length === CHORDS_PER_CELL, String(cell.chords.length))
check(`нот в табах не больше ${TABS_PER_CELL}`, cell.tab.length === TABS_PER_CELL, String(cell.tab.length))
check('струны аппликатуры обрезаются до 6', cell.diagram!.frets.length === 6, String(cell.diagram!.frets.length))
check('часть сохраняется', overflow.pages[0]!.rows[0]!.part === 'Chorus')

// плохие ноты табов отбрасываются
const badTabs = normalizeNotebook({
  pages: [{ rows: [{ cells: [{ tab: [{ string: 1, fret: 2 }, { string: 'x' }, null, { fret: 3 }] }] }] }],
})
check('невалидные ноты табов отброшены', badTabs.pages[0]!.rows[0]!.cells[0]!.tab.length === 1)

// нумерация с повторами
const numbered = emptyPage()
for (let i = 0; i < 2; i++) numbered.rows[i]!.cells.forEach((c) => { c.chords = [] })
numbered.rows[1]!.cells[3]!.repeat = { from: 4, times: 2 } // ячейка 8 → повтор с 5, 2 раза
const nums = computeNumbers(numbered)
check('номера до повтора: 1…8', nums.slice(0, 8).join(',') === '1,2,3,4,5,6,7,8', nums.slice(0, 8).join(','))
check('после повтора нумерация сдвинута на 8', nums[8] === 17, String(nums[8]))
check('сдвиг сохраняется до конца листа', nums[31] === 40, String(nums[31]))
const noRepeat = computeNumbers(emptyPage())
check('без повторов номера 1…32', noRepeat.join(',') === Array.from({ length: 32 }, (_, i) => i + 1).join(','))

// повтор нормализуется из JSON
const withRepeat = normalizeNotebook({
  pages: [{ rows: [{ cells: [{}, {}, {}, { repeat: { from: 0, times: 3 } }] }] }],
})
check('повтор сохраняется при загрузке',
  withRepeat.pages[0]!.rows[0]!.cells[3]!.repeat?.times === 3)
const badRepeat = normalizeNotebook({ pages: [{ rows: [{ cells: [{ repeat: { from: 'x', times: 0 } }] }] }] })
check('невалидный повтор отбрасывается', badRepeat.pages[0]!.rows[0]!.cells[0]!.repeat === null)

// одновременные ноты (одна колонка) и старый формат без колонок
const simultaneous = normalizeNotebook({
  pages: [{ rows: [{ cells: [{ tab: [
    { string: 0, fret: 3, column: 0 },
    { string: 1, fret: 2, column: 0 },
    { string: 2, fret: 2, column: 1 },
  ] }] }] }],
})
const simTab = simultaneous.pages[0]!.rows[0]!.cells[0]!.tab
check('одновременные ноты в одной колонке', simTab.filter((n) => n.column === 0).length === 2, JSON.stringify(simTab))
check('следующая нота в новой колонке', simTab.filter((n) => n.column === 1).length === 1)

const legacy = normalizeNotebook({
  pages: [{ rows: [{ cells: [{ tab: [{ string: 0, fret: 1 }, { string: 1, fret: 2 }] }] }] }],
})
check('старый формат: колонки по порядку',
  legacy.pages[0]!.rows[0]!.cells[0]!.tab.map((n) => n.column).join(',') === '0,1')

// сериализация туда-обратно
const json = JSON.stringify(overflow)
const back = normalizeNotebook(JSON.parse(json))
check('JSON туда-обратно', JSON.stringify(back) === JSON.stringify(overflow))

console.log(failed ? `\n${failed} failing` : '\nall passed')
if (failed) (globalThis as unknown as { process: { exit(code: number): void } }).process.exit(1)
