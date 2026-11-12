<script setup lang="ts">
import {
  COLUMNS,
  computeNumbers,
  ROWS_PER_PAGE,
  createNotebook,
  normalizeNotebook,
  type CellData,
  type CellRepeat,
  type ChordDiagramData,
  type NotebookFile,
  type PageData,
  type TabNote,
} from '~/composables/useNotebook'

useHead({ title: 'Блокнот для репетиций — quinto-circle' })

const notebook = ref<NotebookFile>(createNotebook())
const menuOpen = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const storageKey = 'quinto-notebook-v1'

const pages = computed(() => notebook.value.pages)

/** Короткая строка свойств для шапки листа: темп · конфиг · пресет. */
const propsLine = computed(() => {
  const parts: string[] = []
  const tempo = notebook.value.tempo.trim()
  const config = notebook.value.config.trim()
  const preset = notebook.value.preset.trim()
  if (tempo) parts.push(`♩ ${tempo}`)
  if (config) parts.push(config)
  if (preset) parts.push(preset)
  return parts.join(' · ')
})

const pageNumbers = computed(() => {
  const map = new Map<string, (number | null)[]>()
  let next = 1
  notebook.value.pages.forEach((page) => {
    const result = computeNumbers(page, next)
    map.set(page.id, result.numbers)
    next = result.next
  })
  return map
})

const numbersFor = (page: PageData) => pageNumbers.value.get(page.id) ?? []

const updateRepeat = (pageIndex: number, rowIndex: number, cellIndex: number, repeat: CellRepeat | null) => {
  const cell = notebook.value.pages[pageIndex]?.rows[rowIndex]?.cells[cellIndex]
  if (cell) cell.repeat = repeat
}

const updateSkip = (pageIndex: number, rowIndex: number, cellIndex: number, skip: boolean) => {
  const cell = notebook.value.pages[pageIndex]?.rows[rowIndex]?.cells[cellIndex]
  if (!cell) return
  cell.skip = skip
  if (skip) cell.repeat = null
}

const diagramEditor = ref<{ page: number; row: number; cell: number; value: ChordDiagramData | null } | null>(null)
const tabEditor = ref<{ page: number; row: number; cell: number; value: TabNote[] } | null>(null)

const onMountedStorage = () => {
  try {
    const raw = localStorage.getItem(storageKey)
    if (raw) notebook.value = normalizeNotebook(JSON.parse(raw))
  } catch {
    // повреждённое хранилище просто игнорируем
  }
}

onMounted(onMountedStorage)

watch(
  notebook,
  (value) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(value))
    } catch {
      // переполнение хранилища не критично
    }
  },
  { deep: true },
)

const updateCell = (pageIndex: number, rowIndex: number, cellIndex: number, cell: CellData) => {
  const row = notebook.value.pages[pageIndex]?.rows[rowIndex]
  if (row) row.cells[cellIndex] = cell
}

const updatePart = (pageIndex: number, rowIndex: number, part: string) => {
  const row = notebook.value.pages[pageIndex]?.rows[rowIndex]
  if (row) row.part = part
}

const addPage = () => {
  notebook.value.pages.push({
    id: `page-${Date.now().toString(36)}`,
    rows: Array.from({ length: ROWS_PER_PAGE }, () => ({
      part: '',
      cells: Array.from({ length: COLUMNS }, () => ({ chords: [], note: '', diagram: null, tab: [] })),
    })),
  })
}

const removePage = (pageIndex: number) => {
  if (notebook.value.pages.length <= 1) return
  notebook.value.pages.splice(pageIndex, 1)
}

const clearPage = (page: PageData) => {
  page.rows.forEach((row) => {
    row.part = ''
    row.cells = row.cells.map(() => ({ chords: [], note: '', diagram: null, tab: [] }))
  })
}

const saveFile = () => {
  const blob = new Blob([JSON.stringify(notebook.value, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const safeTitle = (notebook.value.title || 'notebook').replace(/[^\p{L}\p{N}\-_ ]/gu, '').replace(/\s+/g, '-')
  link.href = url
  link.download = `${safeTitle || 'notebook'}.chords.json`
  link.click()
  URL.revokeObjectURL(url)
}

const openFile = () => fileInput.value?.click()

const loadFile = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  try {
    notebook.value = normalizeNotebook(JSON.parse(await file.text()))
  } catch {
    window.alert('Не удалось прочитать файл блокнота')
  }
  input.value = ''
}

const openDiagram = (page: number, row: number, cell: number) => {
  const target = notebook.value.pages[page]?.rows[row]?.cells[cell]
  if (!target) return
  diagramEditor.value = { page, row, cell, value: target.diagram }
}

const applyDiagram = (value: ChordDiagramData) => {
  const target = diagramEditor.value
  if (!target) return
  const cell = notebook.value.pages[target.page]?.rows[target.row]?.cells[target.cell]
  if (cell) cell.diagram = value
  diagramEditor.value = null
}

const openTab = (page: number, row: number, cell: number) => {
  const target = notebook.value.pages[page]?.rows[row]?.cells[cell]
  if (!target) return
  tabEditor.value = { page, row, cell, value: target.tab }
}

const applyTab = (value: TabNote[]) => {
  const target = tabEditor.value
  if (!target) return
  const cell = notebook.value.pages[target.page]?.rows[target.row]?.cells[target.cell]
  if (cell) cell.tab = value
  tabEditor.value = null
}

const print = () => window.print()

const dropDiagram = () => {
  const target = diagramEditor.value
  if (!target) return
  const cell = notebook.value.pages[target.page]?.rows[target.row]?.cells[target.cell]
  if (cell) cell.diagram = null
  diagramEditor.value = null
}
</script>

<template>
  <div class="notebook">
    <header class="toolbar">
      <div class="toolbar-group toolbar-group--title">
        <NuxtLink to="/" class="nav-link">←</NuxtLink>
        <input v-model="notebook.title" class="title-input" type="text" aria-label="Название блокнота">
      </div>

      <div class="toolbar-group toolbar-actions">
        <button type="button" class="button" @click="addPage">+ страница</button>
        <button type="button" class="button" @click="saveFile">Сохранить</button>
        <button type="button" class="button" @click="openFile">Загрузить</button>
        <button type="button" class="button button--primary" @click="print">Печать</button>
      </div>

      <button type="button" class="menu-button" aria-label="Меню" @click="menuOpen = true">☰</button>

      <input ref="fileInput" class="hidden-input" type="file" accept="application/json,.json" @change="loadFile">
    </header>

    <section class="doc-props">
      <label class="prop">
        <span class="prop-label">Темп</span>
        <input v-model="notebook.tempo" class="prop-input" type="text" placeholder="120">
      </label>
      <label class="prop">
        <span class="prop-label">Конфиг</span>
        <input v-model="notebook.config" class="prop-input" type="text" placeholder="—">
      </label>
      <label class="prop">
        <span class="prop-label">Пресет</span>
        <input v-model="notebook.preset" class="prop-input" type="text" placeholder="—">
      </label>
    </section>

    <div class="sheets">
      <section v-for="(page, pageIndex) in pages" :key="page.id" class="sheet">
        <header class="sheet-head">
          <span class="sheet-title">{{ notebook.title }}</span>
          <span v-if="propsLine" class="sheet-props">{{ propsLine }}</span>
          <span class="sheet-page">{{ pageIndex + 1 }} / {{ pages.length }}</span>
          <span class="sheet-tools">
            <button type="button" class="sheet-tool" @click="clearPage(page)">Очистить</button>
            <button
              v-if="pages.length > 1"
              type="button"
              class="sheet-tool sheet-tool--danger"
              @click="removePage(pageIndex)"
            >Удалить</button>
          </span>
        </header>

        <div class="grid">
          <div
            v-for="(row, rowIndex) in page.rows"
            :key="`${page.id}-${rowIndex}`"
            class="row"
          >
            <NotebookCell
              v-for="(cell, cellIndex) in row.cells"
              :key="`${page.id}-${rowIndex}-${cellIndex}`"
              :cell="cell"
              :part="row.part"
              :index="numbersFor(page)[rowIndex * COLUMNS + cellIndex] ?? undefined"
              :numbers="numbersFor(page)"
              :position="rowIndex * COLUMNS + cellIndex"
              :last-row="rowIndex === page.rows.length - 1"
              :repeat="cell.repeat"
              :skip="cell.skip === true"
              :first-column="cellIndex === 0"
              class="cell-slot"
              @update:cell="updateCell(pageIndex, rowIndex, cellIndex, $event)"
              @update:part="updatePart(pageIndex, rowIndex, $event)"
              @open-diagram="openDiagram(pageIndex, rowIndex, cellIndex)"
              @open-tab="openTab(pageIndex, rowIndex, cellIndex)"
              @update:repeat="updateRepeat(pageIndex, rowIndex, cellIndex, $event)"
              @update:skip="updateSkip(pageIndex, rowIndex, cellIndex, $event)"
            />
          </div>
        </div>
      </section>

      <button type="button" class="add-page" @click="addPage">+ Добавить страницу</button>
    </div>

    <div v-if="menuOpen" class="menu-overlay" @click.self="menuOpen = false">
      <div class="menu-panel">
        <div class="menu-props">
          <label class="prop">
            <span class="prop-label">Темп</span>
            <input v-model="notebook.tempo" class="prop-input" type="text" placeholder="120">
          </label>
          <label class="prop">
            <span class="prop-label">Конфиг</span>
            <input v-model="notebook.config" class="prop-input" type="text" placeholder="—">
          </label>
          <label class="prop">
            <span class="prop-label">Пресет</span>
            <input v-model="notebook.preset" class="prop-input" type="text" placeholder="—">
          </label>
        </div>
        <button type="button" class="menu-item" @click="addPage(); menuOpen = false">Добавить страницу</button>
        <button type="button" class="menu-item" @click="saveFile(); menuOpen = false">Сохранить в файл</button>
        <button type="button" class="menu-item" @click="openFile(); menuOpen = false">Загрузить из файла</button>
        <button type="button" class="menu-item" @click="print(); menuOpen = false">Печать</button>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="diagramEditor" class="modal" @click.self="diagramEditor = null">
        <div class="modal-body">
          <h2 class="modal-title">Схема аккорда</h2>
          <NotebookChordPicker
            :diagram="diagramEditor.value"
            @apply="applyDiagram"
            @cancel="diagramEditor = null"
          />
          <button v-if="diagramEditor.value" type="button" class="modal-remove" @click="dropDiagram">
            Удалить схему
          </button>
        </div>
      </div>

      <div v-if="tabEditor" class="modal" @click.self="tabEditor = null">
        <div class="modal-body">
          <h2 class="modal-title">Табы</h2>
          <NotebookTabEditor
            :notes="tabEditor.value"
            @apply="applyTab"
            @cancel="tabEditor = null"
          />
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.notebook {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 14px 16px 28px;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 18px;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 30;
  padding: 8px 10px;
  background: color-mix(in srgb, var(--background) 88%, transparent);
  backdrop-filter: blur(8px);
  border: 1px solid var(--border);
  border-radius: 12px;
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.toolbar-group--title {
  flex: 1 1 240px;
}

.nav-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--muted-foreground);
  text-decoration: none;
  font-size: 14px;
}

.title-input {
  flex: 1;
  min-width: 120px;
  padding: 6px 8px;
  font-size: 14px;
  font-weight: 700;
  color: var(--foreground);
  background: transparent;
  border: 1px solid transparent;
  border-radius: 8px;
}

.title-input:hover,
.title-input:focus {
  border-color: var(--border);
  outline: none;
}

.button {
  padding: 6px 11px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--foreground);
  cursor: pointer;
}

.button:hover:not(:disabled) {
  background: var(--muted);
}

.button:disabled {
  opacity: 0.35;
  cursor: default;
}

.button--primary {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--accent-foreground);
}

.page-indicator {
  font-size: 12px;
  color: var(--muted-foreground);
  min-width: 52px;
  text-align: center;
}

.hidden-input {
  display: none;
}

.sheets {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 22px;
}

.sheet {
  /* Лист всегда «бумажный»: в тёмной теме чёрные границы иначе не видны. */
  --background: #ffffff;
  --foreground: #111111;
  --muted: #f2f2f2;
  --muted-foreground: #666666;
  --border: #d8d8d8;
  --accent: #111111;
  --accent-foreground: #ffffff;
  color: #111111;
  /* Размер шрифта масштабируется от ширины листа (без container-type:
     в текущем Chromium layout-контейнер ломает отрисовку SVG внутри). */
  display: flex;
  flex-direction: column;
  width: min(100%, 900px);
  font-size: clamp(9px, 1.55vw, 14.4px);
  aspect-ratio: 210 / 297;
  background: var(--background);
  border: var(--nb-sheet-border, 2px) solid var(--nb-border-color, #000);
  border-radius: 2px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
  overflow: hidden;
}

.sheet--hidden {
  display: none;
}

.sheet-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.6em;
  padding: 0.15em 0.35em 0.2em;
  border-bottom: 1.5px solid #000;
  flex: 0 0 auto;
}

.sheet-title {
  font-size: 0.95em;
  font-weight: 800;
  letter-spacing: -0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sheet-props {
  margin-left: auto;
  padding-left: 0.6em;
  font-size: 0.55em;
  color: var(--muted-foreground);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

.sheet-page {
  font-size: 0.6em;
  color: var(--muted-foreground);
  flex: 0 0 auto;
  padding-left: 0.8em;
}

.grid {
  display: grid;
  grid-template-rows: repeat(8, minmax(0, 1fr));
  flex: 1;
  min-height: 0;
}

.row {
  display: grid;
  grid-template-columns: calc(25% + 25px) 1fr 1fr 1fr;
  min-height: 0;
  min-width: 0;
}

.cell-slot {
  min-width: 0;
}

.row .cell-slot:last-child :deep(.cell) {
  border-right: 0;
}

.grid .row:last-child :deep(.cell) {
  border-bottom: 0;
}

.hidden-input,
.hidden-input:focus {
  outline: none;
}

.modal {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(0, 0, 0, 0.45);
}

.modal-body {
  position: relative;
  width: min(760px, 100%);
  max-height: 92vh;
  overflow: auto;
  padding: 16px 18px 18px;
  border-radius: 14px;
  background: var(--background);
  border: 1px solid var(--border);
}

.modal-title {
  margin: 0 0 12px;
  font-size: 15px;
  font-weight: 700;
}

.modal-remove {
  margin-top: 10px;
  padding: 6px 10px;
  font-size: 12px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: transparent;
  color: #c0392b;
  cursor: pointer;
}
</style>

<style>

.doc-props {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  padding: 8px 10px;
  border: 1px solid var(--border);
  border-radius: 12px;
}

.prop {
  display: flex;
  align-items: center;
  gap: 6px;
}

.prop-label {
  font-size: 12px;
  color: var(--muted-foreground);
}

.prop-input {
  width: 120px;
  padding: 6px 9px;
  font-size: 13px;
  color: var(--foreground);
  background: var(--background);
  border: 1px solid var(--border);
  border-radius: 8px;
}

.menu-button {
  display: none;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  margin-left: auto;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: transparent;
  color: var(--foreground);
  font-size: 18px;
  cursor: pointer;
}

.menu-overlay {
  position: fixed;
  inset: 0;
  z-index: 90;
  display: flex;
  align-items: flex-end;
  background: rgba(0, 0, 0, 0.35);
}

.menu-panel {
  width: 100%;
  max-height: 85vh;
  overflow: auto;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: var(--background);
  border-radius: 16px 16px 0 0;
  border-top: 1px solid var(--border);
}

.menu-props {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border);
}

.menu-props .prop {
  justify-content: space-between;
}

.menu-props .prop-input {
  width: 60%;
}

.menu-item {
  padding: 12px;
  font-size: 15px;
  font-weight: 600;
  text-align: left;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: transparent;
  color: var(--foreground);
  cursor: pointer;
}

.sheet-tools {
  display: flex;
  gap: 6px;
  margin-left: auto;
}

.sheet-tool {
  padding: 2px 8px;
  font-size: 0.5em;
  font-weight: 600;
  border: 1px solid var(--border);
  border-radius: 5px;
  background: transparent;
  color: var(--muted-foreground);
  cursor: pointer;
}

.sheet-tool:hover {
  color: var(--foreground);
  background: var(--muted);
}

.sheet-tool--danger:hover {
  color: #c0392b;
}

.add-page {
  align-self: center;
  padding: 10px 18px;
  font-size: 13px;
  font-weight: 600;
  border: 1px dashed var(--border);
  border-radius: 10px;
  background: transparent;
  color: var(--muted-foreground);
  cursor: pointer;
}

.add-page:hover {
  color: var(--foreground);
  background: var(--muted);
}

@media (max-width: 760px) {
  .toolbar-actions,
  .doc-props {
    display: none !important;
  }

  .menu-button {
    display: inline-flex !important;
  }

  .toolbar {
    position: sticky;
    top: 0;
  }
}

@page {
  size: A4 portrait;
  margin: 6mm;
}

@media print {
  body {
    background: #fff !important;
  }

  .toolbar,
  .doc-props,
  .menu-button,
  .menu-overlay,
  .sheet-tools,
  .add-page,
  .modal {
    display: none !important;
  }

  .notebook {
    padding: 0 !important;
    gap: 0 !important;
    min-height: 0 !important;
  }

  .sheets {
    display: block !important;
  }

  .sheet {
    display: flex !important;
    width: 100% !important;
    height: 279mm !important;
    aspect-ratio: auto !important;
    border-width: var(--nb-sheet-border, 1px) !important;
    border-style: solid !important;
    border-color: var(--nb-border-color, #000) !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    break-after: page;
    page-break-after: always;
    font-size: 3.6mm !important;
    color: #000;
    --nb-cell-border: 1px;
    --nb-sheet-border: 1px;
  }

  .sheet:last-of-type {
    break-after: auto;
    page-break-after: auto;
  }

  .placeholder {
    display: none !important;
  }
}
</style>
