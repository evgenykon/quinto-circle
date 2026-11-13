<script setup lang="ts">
import type { CellData, CellRepeat } from '~/composables/useNotebook'
import { CHORDS_PER_CELL, PART_PRESETS } from '~/composables/useNotebook'

const props = defineProps<{
  cell: CellData
  part: string
  firstColumn?: boolean
  /** Показанный номер ячейки (с учётом повторов). */
  index?: number
  /** Номера всех ячеек листа (по индексу 0…31) — для поля «с ячейки». */
  numbers?: (number | null)[]
  /** Позиция ячейки на листе (0…31). */
  position?: number
  /** Последняя строка листа: поповеры открываются вверх, чтобы не обрезались. */
  lastRow?: boolean
  repeat?: CellRepeat | null
  /** Ячейка пропущена: белое поле без линий, текста и номера. */
  skip?: boolean
}>()

const emit = defineEmits<{
  'update:cell': [cell: CellData]
  'update:part': [part: string]
  'open-diagram': []
  'open-tab': []
  'update:repeat': [repeat: CellRepeat | null]
  'update:skip': [skip: boolean]
}>()

/** Цветовое выделение частей: припев — тёмный, бридж — светло-серый, pre-chorus/solo — серый. */
const partTone = computed(() => {
  const value = props.part.trim().toLowerCase()
  if (/^(chorus|припев)/.test(value)) return 'chorus'
  if (/^(bridge|бридж)/.test(value)) return 'bridge'
  if (/^(pre[-\s]?chorus|предприпев|solo|соло)/.test(value)) return 'grey'
  return ''
})

const menu = ref(false)
const adding = ref(false)
const draft = ref('')
const partMenu = ref(false)
const partDraft = ref('')

const chordsRef = ref<HTMLElement | null>(null)

/** Подгоняет кегль аккордов: они раскладываются в 2 колонки (до 2 рядов). */
const fitChords = () => {
  const el = chordsRef.value
  if (!el) return
  el.style.fontSize = ''
  const base = Number.parseFloat(getComputedStyle(el).fontSize) || 12
  let size = base
  let guard = 0
  while (el.scrollWidth > el.clientWidth + 1 && size > 5 && guard < 40) {
    size -= 0.4
    el.style.fontSize = `${size}px`
    guard++
  }
}

watch(
  () => props.cell.chords.join('|'),
  () => nextTick(fitChords),
)

let fitObserver: ResizeObserver | null = null
onMounted(() => {
  nextTick(fitChords)
  if (chordsRef.value) {
    fitObserver = new ResizeObserver(() => fitChords())
    fitObserver.observe(chordsRef.value)
  }
})
onBeforeUnmount(() => fitObserver?.disconnect())

const repeatMenu = ref(false)
const repeatFrom = ref('')
const repeatTimes = ref('')

const timesWord = (count: number) => {
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 === 1 && mod100 !== 11) return 'раз'
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return 'раза'
  return 'раз'
}

const repeatLabel = computed(() => {
  if (!props.repeat) return ''
  const from = props.numbers?.[props.repeat.from] ?? props.repeat.from + 1
  return `повтор с #${from}, ${props.repeat.times} ${timesWord(props.repeat.times)}`
})

const openRepeatMenu = () => {
  repeatMenu.value = true
  if (props.repeat) {
    repeatFrom.value = String(props.numbers?.[props.repeat.from] ?? props.repeat.from + 1)
    repeatTimes.value = String(props.repeat.times)
    return
  }

  // По умолчанию — блок из 4 ячеек, заканчивающийся текущей (или с 1-й).
  const selfPos = props.position ?? 0
  let fromPos = Math.max(0, selfPos - 3)
  // пропущенные ячейки без номера — берём ближайшую слева с номером
  while (fromPos > 0 && (props.numbers?.[fromPos] ?? null) === null) fromPos--
  const fromNumber = props.numbers?.[fromPos] ?? props.numbers?.find((value) => value !== null) ?? 1
  repeatFrom.value = String(fromNumber)
  repeatTimes.value = '1'
}

const saveRepeat = () => {
  const shownFrom = Number.parseInt(repeatFrom.value, 10)
  const times = Number.parseInt(repeatTimes.value, 10)
  const fromIndex = props.numbers?.indexOf(shownFrom) ?? -1
  if (fromIndex < 0 || Number.isNaN(times) || times < 1) return
  emit('update:repeat', { from: fromIndex, times })
  repeatMenu.value = false
}

const clearRepeat = () => {
  emit('update:repeat', null)
  repeatMenu.value = false
}

const toggleSkip = () => {
  emit('update:skip', !props.skip)
  repeatMenu.value = false
}

const editingNote = ref(false)
const noteDraft = ref('')
const noteInput = ref<HTMLInputElement | null>(null)

const patch = (changes: Partial<CellData>) => emit('update:cell', { ...props.cell, ...changes })

const openMenu = () => {
  menu.value = true
  adding.value = false
}

const startAdd = () => {
  adding.value = true
  draft.value = ''
}

const commitAdd = () => {
  const value = draft.value.trim()
  if (!value) {
    adding.value = false
    return
  }
  if (props.cell.chords.length >= CHORDS_PER_CELL) return
  patch({ chords: [...props.cell.chords, value] })
  draft.value = ''
  adding.value = false
  menu.value = false
}

const removeChord = (index: number) => {
  const next = props.cell.chords.filter((_, i) => i !== index)
  patch({ chords: next })
  if (!next.length) menu.value = false
}

const startNote = async () => {
  noteDraft.value = props.cell.note
  editingNote.value = true
  await nextTick()
  noteInput.value?.focus()
}

const commitNote = () => {
  if (!editingNote.value) return
  editingNote.value = false
  if (noteDraft.value !== props.cell.note) patch({ note: noteDraft.value })
}

const openPartMenu = () => {
  partMenu.value = true
  partDraft.value = props.part
}

const commitPart = () => {
  emit('update:part', partDraft.value.trim())
  partMenu.value = false
}

const choosePart = (value: string) => {
  emit('update:part', value)
  partMenu.value = false
}

const closeAll = () => {
  menu.value = false
  adding.value = false
  partMenu.value = false
  repeatMenu.value = false
}

const rootRef = ref<HTMLElement | null>(null)

/** Клик вне ячейки и Esc закрывают все поповеры. */
const onDocumentClick = (event: MouseEvent) => {
  const target = event.target as Node | null
  if (!target) return
  if (rootRef.value && rootRef.value.contains(target)) return
  closeAll()
  if (editingNote.value) commitNote()
}

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') closeAll()
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick)
  document.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick)
  document.removeEventListener('keydown', onKeydown)
})

</script>

<template>
  <div
    ref="rootRef"
    class="cell"
    :class="{ 'cell--first': firstColumn, 'cell--repeat': repeat, 'cell--skip': skip }"
    @click="closeAll"
  >
    <button
      v-if="skip"
      type="button"
      class="skip-blank"
      aria-label="Пропущенная ячейка"
      @click.stop="openRepeatMenu"
    />
    <template v-if="!skip">
    <button
      v-if="index"
      type="button"
      class="cell-number"
      :class="{ 'cell-number--repeat': repeat }"
      @click.stop="openRepeatMenu"
    >
      <span class="cell-index">{{ index }}</span>
      <span v-if="repeatLabel" class="cell-repeat">{{ repeatLabel }}</span>
    </button>
    <button
      v-if="firstColumn"
      type="button"
      class="part-strip"
      :class="{ 'part-strip--filled': part, 'part-strip--accent': partTone === 'chorus',
        'part-strip--bridge': partTone === 'bridge',
        'part-strip--pre': partTone === 'grey',
      }"
      @click.stop="openPartMenu"
    >
      <span v-if="part" class="part-text">{{ part }}</span>
    </button>

    <div class="quarters">
      <!-- аккорды -->
      <div ref="chordsRef" class="quarter quarter--chords" @click.stop="openMenu">
        <span v-for="(chord, index) in cell.chords" :key="`${chord}-${index}`" class="chord">{{ chord }}</span>
        <span v-if="!cell.chords.length" class="placeholder">Аккорды</span>
      </div>

      <!-- заметка -->
      <div class="quarter quarter--note" @click.stop="startNote">
        <input
          v-if="editingNote"
          ref="noteInput"
          v-model="noteDraft"
          class="note-input"
          type="text"
          @blur="commitNote"
          @keydown.enter.prevent="commitNote"
          @click.stop
        >
        <span v-else class="note-text">{{ cell.note }}</span>
      </div>

      <!-- схема аккорда -->
      <div class="quarter quarter--diagram" @click.stop="emit('open-diagram')">
        <NotebookDiagram
          v-if="cell.diagram"
          :frets="cell.diagram.frets"
          :start-fret="cell.diagram.startFret"
        />
        <span v-else class="placeholder">Гриф</span>
        <span v-if="cell.diagram?.name" class="diagram-name">{{ cell.diagram.name }}</span>
      </div>

      <!-- табы -->
      <div class="quarter quarter--tab" @click.stop="emit('open-tab')">
        <NotebookTab v-if="cell.tab.length" :notes="cell.tab" />
        <span v-else class="placeholder">Табы</span>
      </div>
    </div>

    <div v-if="menu" class="popover" :class="{ 'popover--up': lastRow }" @click.stop>
      <template v-if="!adding">
        <button type="button" class="popover-item" @click="startAdd">Добавить аккорд</button>
        <button
          v-for="(chord, index) in cell.chords"
          :key="`rm-${chord}-${index}`"
          type="button"
          class="popover-item popover-item--danger"
          @click="removeChord(index)"
        >
          Удалить аккорд «{{ chord }}»
        </button>
      </template>
      <form v-else class="add-form" @submit.prevent="commitAdd">
        <input
          v-model="draft"
          class="add-input"
          type="text"
          placeholder="C, Am, G7…"
          autofocus
          @keydown.enter.prevent="commitAdd"
        >
        <button type="submit" class="add-submit">OK</button>
      </form>
    </div>

    </template>

    <div v-if="repeatMenu" class="popover popover--repeat" :class="{ 'popover--up': lastRow }" @click.stop>
      <span class="popover-title">Повтор блока</span>
      <form class="add-form" @submit.prevent="saveRepeat">
        <label class="repeat-field">
          <span>с ячейки</span>
          <input v-model="repeatFrom" class="add-input add-input--num" type="number" min="1">
        </label>
        <label class="repeat-field">
          <span>раз</span>
          <input v-model="repeatTimes" class="add-input add-input--num" type="number" min="1" max="8">
        </label>
        <button type="submit" class="add-submit">OK</button>
      </form>
      <button v-if="repeat" type="button" class="popover-item popover-item--danger" @click="clearRepeat">
        Убрать повтор
      </button>
      <button type="button" class="popover-item" @click="toggleSkip">
        {{ skip ? 'Вернуть ячейку' : 'Пропуск' }}
      </button>
    </div>

    <div v-if="partMenu" class="popover popover--part" :class="{ 'popover--up': lastRow }" @click.stop>
      <form class="add-form" @submit.prevent="commitPart">
        <input
          v-model="partDraft"
          class="add-input"
          type="text"
          placeholder="Intro, Chorus…"
          @keydown.enter.prevent="commitPart"
        >
        <button type="submit" class="add-submit">OK</button>
      </form>
      <button
        v-for="preset in PART_PRESETS"
        :key="preset"
        type="button"
        class="popover-item"
        @click="choosePart(preset)"
      >
        {{ preset }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.cell {
  position: relative;
  display: flex;
  min-height: 0;
  min-width: 0;
  border-right: var(--nb-cell-border, 1.5px) solid var(--nb-border-color, #000);
  /* горизонтальные линии рисует строка (.row) — иначе у пропущенных ячеек
     в печати линия перекрывается белой заливкой соседа */
  border-bottom: 0;
  background: var(--background);
}


.cell-number {
  position: absolute;
  top: 1px;
  right: 3px;
  z-index: 2;
  display: inline-flex;
  align-items: baseline;
  gap: 3px;
  padding: 1px 3px;
  border: 0;
  border-radius: 3px;
  background: transparent;
  font-size: 0.56em;
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;
  color: var(--muted-foreground);
  cursor: pointer;
  user-select: none;
}

.cell-number:hover {
  background: var(--muted);
  color: var(--foreground);
}

.cell-number--repeat {
  color: var(--foreground);
  background: var(--muted);
}

.cell-index {
  font-weight: 700;
}

.cell-repeat {
  font-weight: 600;
  font-size: 0.92em;
  color: var(--accent);
}

.cell--repeat {
  border-right: 4px double #000;
  border-left: 1px dashed #000;
}

.cell--skip {
  /* Сетка остаётся целой: пустая ячейка только внутри.
     Фон прозрачный — иначе в печати белая заливка перекрывает линию снизу. */
  background: transparent;
}

.skip-blank {
  width: 100%;
  height: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
}

.popover--repeat {
  right: 4px;
  left: auto;
  min-width: 210px;
}

.popover.popover--up {
  top: auto;
  bottom: 100%;
}

.popover-title {
  font-size: 11px;
  font-weight: 700;
  color: var(--muted-foreground);
  padding: 2px 2px 4px;
}

.repeat-field {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--muted-foreground);
}

.add-input--num {
  width: 48px;
}

.part-strip {
  flex: 0 0 25px;
  width: 25px;
  padding: 2px 0;
  border: 0;
  border-right: 1px dashed color-mix(in srgb, var(--muted-foreground) 30%, transparent);
  background: transparent;
  opacity: 0.35;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.15s;
}

.part-strip:hover {
  opacity: 1;
  background: var(--muted);
}

.part-strip--filled {
  opacity: 1;
  background: transparent;
}

.part-strip--filled .part-text {
  color: var(--foreground);
}

.part-strip--accent,
.part-strip--accent:hover {
  background: #111;
}

.part-strip--accent .part-text {
  color: #f5f5f5;
}

.part-strip--bridge,
.part-strip--bridge:hover {
  background: #cccccc;
}

.part-strip--bridge .part-text {
  color: #111111;
}

.part-strip--pre,
.part-strip--pre:hover {
  background: #aaaaaa;
}

.part-strip--pre .part-text {
  color: #111111;
}

.part-text {
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  font-size: 0.72em;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: #f5f5f5;
  white-space: nowrap;
}

.quarters {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
}

.quarter {
  position: relative;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.32em;
  overflow: hidden;
  cursor: pointer;
  min-width: 0;
}

.quarter--chords {
  border-right: 1px dashed color-mix(in srgb, var(--muted-foreground) 35%, transparent);
  border-bottom: 1px dashed color-mix(in srgb, var(--muted-foreground) 35%, transparent);
  display: grid;
  grid-template-columns: repeat(2, auto);
  align-content: center;
  justify-content: center;
  column-gap: 0.35em;
  row-gap: 0.08em;
  padding: 0.05em 0.15em;
}

.quarter--note {
  border-bottom: 1px dashed color-mix(in srgb, var(--muted-foreground) 35%, transparent);
  padding: 0 0.3em;
}

.quarter--diagram {
  border-right: 1px dashed color-mix(in srgb, var(--muted-foreground) 35%, transparent);
}

.quarter--tab {
  padding: 0.15em;
}

.chord {
  font-weight: 700;
  font-size: 1em;
  line-height: 1;
  white-space: nowrap;
}

.placeholder {
  font-size: 0.62em;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: transparent;
  transition: color 0.15s;
  pointer-events: none;
}

.cell:hover .placeholder {
  color: var(--border);
}

.note-text,
.note-input {
  width: 100%;
  font-size: 0.72em;
  line-height: 1.2;
  text-align: center;
  color: var(--foreground);
}

.note-input {
  border: 1px solid var(--accent);
  border-radius: 3px;
  background: var(--background);
  padding: 1px 3px;
  font-family: inherit;
}

.diagram-name {
  position: absolute;
  right: 2px;
  bottom: 0;
  font-size: 0.55em;
  font-weight: 700;
  color: var(--muted-foreground);
  background: var(--background);
  padding: 0 2px;
  border-radius: 3px;
}

.popover {
  position: absolute;
  left: 0;
  top: 100%;
  z-index: 20;
  min-width: 180px;
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--background);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.18);
}

.popover--part {
  left: 25px;
  top: 0;
  transform: none;
}

.popover-item {
  padding: 6px 8px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--foreground);
  font-size: 12px;
  text-align: left;
  cursor: pointer;
}

.popover-item:hover {
  background: var(--muted);
}

.popover-item--danger {
  color: #c0392b;
}

.add-form {
  display: flex;
  gap: 4px;
}

.add-input {
  flex: 1;
  min-width: 0;
  padding: 5px 7px;
  font-size: 12px;
  color: var(--foreground);
  background: var(--background);
  border: 1px solid var(--border);
  border-radius: 6px;
}

.add-submit {
  padding: 5px 9px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 6px;
  border: 1px solid var(--accent);
  background: var(--accent);
  color: var(--accent-foreground);
  cursor: pointer;
}
/* На телефоне поповер у крайней ячейки не помещается в лист —
   показываем его как нижнюю панель на всю ширину экрана. */
@media (max-width: 760px) {
  .popover,
  .popover--repeat,
  .popover--part {
    position: fixed;
    left: 10px;
    right: 10px;
    bottom: 10px;
    top: auto;
    min-width: 0;
    max-width: none;
    max-height: 60vh;
    overflow: auto;
    z-index: 80;
    padding: 10px;
    box-shadow: 0 -8px 28px rgba(0, 0, 0, 0.28);
  }

  .popover-item {
    padding: 10px 10px;
    font-size: 14px;
  }

  .popover-title {
    font-size: 13px;
  }

  .repeat-field {
    font-size: 13px;
  }

  .add-input {
    font-size: 15px;
    padding: 8px 9px;
  }

  .add-submit {
    padding: 8px 14px;
    font-size: 14px;
  }
}
</style>
