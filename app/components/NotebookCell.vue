<script setup lang="ts">
import type { CellData } from '~/composables/useNotebook'
import { CHORDS_PER_CELL, PART_PRESETS } from '~/composables/useNotebook'

const props = defineProps<{
  cell: CellData
  part: string
  firstColumn?: boolean
}>()

const emit = defineEmits<{
  'update:cell': [cell: CellData]
  'update:part': [part: string]
  'open-diagram': []
  'open-tab': []
}>()

const menu = ref(false)
const adding = ref(false)
const draft = ref('')
const partMenu = ref(false)
const partDraft = ref('')

const chordsRef = ref<HTMLElement | null>(null)

/** Подгоняет размер аккордов так, чтобы 4 штуки влезали в строку без переноса. */
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
}

</script>

<template>
  <div class="cell" :class="{ 'cell--first': firstColumn }" @click="closeAll">
    <button
      v-if="firstColumn"
      type="button"
      class="part-strip"
      @click.stop="openPartMenu"
    >
      <span class="part-text">{{ part || 'Часть' }}</span>
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

    <div v-if="menu" class="popover" @click.stop>
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

    <div v-if="partMenu" class="popover popover--part" @click.stop>
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
  border-right: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  background: var(--background);
}

.cell--first {
  border-right-width: 2px;
}

.part-strip {
  flex: 0 0 25px;
  width: 25px;
  padding: 2px 0;
  border: 0;
  border-right: 1px dashed var(--border);
  background: var(--muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.part-text {
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  font-size: 0.72em;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: var(--muted-foreground);
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
  gap: 0.18em;
  overflow: hidden;
  cursor: pointer;
  min-width: 0;
}

.quarter--chords {
  border-right: 1px dashed color-mix(in srgb, var(--muted-foreground) 35%, transparent);
  border-bottom: 1px dashed color-mix(in srgb, var(--muted-foreground) 35%, transparent);
  flex-wrap: nowrap;
  white-space: nowrap;
  padding: 0 0.2em;
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
</style>
