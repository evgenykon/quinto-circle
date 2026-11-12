<script setup lang="ts">
import type { TabNote } from '~/composables/useNotebook'
import { TABS_PER_CELL } from '~/composables/useNotebook'

const props = defineProps<{ notes: TabNote[] }>()
const emit = defineEmits<{
  apply: [notes: TabNote[]]
  cancel: []
}>()

const draft = ref<TabNote[]>(props.notes.map((note) => ({ ...note })))
const entering = ref<number | null>(null)
const fretInput = ref('')

const STRING_LABELS = ['E', 'A', 'D', 'G', 'B', 'e']
const label = (string: number) => STRING_LABELS[string]!

const rows = computed(() => [5, 4, 3, 2, 1, 0].map((string) => ({ string, label: STRING_LABELS[string]! })))

const columns = computed(() => Math.max(draft.value.length, 1))

/** Уже добавленные ноты на «стане»: колонка — порядок добавления. */
const placed = computed(() =>
  draft.value.map((note, index) => ({
    key: `${note.string}-${note.fret}-${index}`,
    string: note.string,
    left: ((index + 0.5) / columns.value) * 100,
    fret: note.fret,
  })),
)

const notesFor = (string: number) => placed.value.filter((item) => item.string === string)

const startEntry = (string: number) => {
  entering.value = string
  fretInput.value = ''
}

const confirmEntry = () => {
  if (entering.value === null) return
  const fret = Number.parseInt(fretInput.value, 10)
  if (Number.isNaN(fret) || fret < 0 || fret > 24) return
  if (draft.value.length >= TABS_PER_CELL) {
    entering.value = null
    return
  }
  draft.value.push({ string: entering.value, fret })
  entering.value = null
  fretInput.value = ''
}

const removeAt = (index: number) => {
  draft.value.splice(index, 1)
}

const clear = () => {
  draft.value = []
}

const apply = () => {
  emit('apply', [...draft.value])
}
</script>

<template>
  <div class="tab-editor">
    <p class="hint">
      Кликни по струне и укажи номер лада — нота добавится в табы. До {{ TABS_PER_CELL }} нот,
      сейчас: {{ draft.length }}.
    </p>

    <div class="staff">
      <div v-for="row in rows" :key="`row-${row.string}`" class="staff-row">
        <span class="string-label">{{ row.label }}</span>
        <button
          type="button"
          class="string-hit"
          :class="{ 'string-hit--active': entering === row.string }"
          :aria-label="`Струна ${row.label}`"
          @click="startEntry(row.string)"
        >
          <span class="line" />
        </button>
        <span
          v-for="note in notesFor(row.string)"
          :key="note.key"
          class="staff-note"
          :style="{ left: `calc(${note.left}% + 18px)` }"
        >
          {{ note.fret }}
        </span>
      </div>
    </div>

    <form v-if="entering !== null" class="entry" @submit.prevent="confirmEntry">
      <span class="entry-label">Струна {{ label(entering) }} — лад:</span>
      <input
        v-model="fretInput"
        class="fret-input"
        type="number"
        min="0"
        max="24"
        inputmode="numeric"
        placeholder="0"
        autofocus
        @keydown.enter.prevent="confirmEntry"
      >
      <button type="submit" class="button button--primary">Добавить</button>
      <button type="button" class="button" @click="entering = null">Отмена</button>
    </form>

    <div v-if="draft.length" class="notes">
      <span v-for="(note, index) in draft" :key="`${note.string}-${note.fret}-${index}`" class="chip">
        {{ label(note.string) }}·{{ note.fret }}
        <button type="button" class="chip-remove" @click="removeAt(index)">×</button>
      </span>
    </div>

    <div class="actions">
      <button type="button" class="button" @click="clear">Очистить</button>
      <button type="button" class="button" @click="emit('cancel')">Отмена</button>
      <button type="button" class="button button--primary" @click="apply">Применить</button>
    </div>
  </div>
</template>

<style scoped>
.tab-editor {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.hint {
  margin: 0;
  font-size: 12px;
  color: var(--muted-foreground);
}

.staff {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 6px 0;
}

.staff-row {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  height: 26px;
}

.string-label {
  width: 18px;
  font-size: 11px;
  color: var(--muted-foreground);
  text-align: center;
  flex: 0 0 auto;
}

.string-hit {
  flex: 1;
  height: 22px;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
}

.line {
  display: block;
  width: 100%;
  height: 1.5px;
  background: var(--muted-foreground);
  border-radius: 1px;
}

.string-hit:hover .line,
.string-hit--active .line {
  background: var(--accent);
  height: 3px;
}

.staff-note {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  padding: 0 4px;
  background: var(--background);
  font-size: 13px;
  font-weight: 700;
  color: var(--foreground);
  pointer-events: none;
}

.entry {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 8px 10px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--muted);
}

.entry-label {
  font-size: 12px;
  color: var(--muted-foreground);
}

.fret-input {
  width: 72px;
  padding: 6px 8px;
  font-size: 13px;
  color: var(--foreground);
  background: var(--background);
  border: 1px solid var(--border);
  border-radius: 7px;
}

.notes {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border: 1px solid var(--border);
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}

.chip-remove {
  border: 0;
  background: transparent;
  color: var(--muted-foreground);
  font-size: 13px;
  line-height: 1;
  cursor: pointer;
  padding: 0;
}

.chip-remove:hover {
  color: #c0392b;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.button {
  padding: 7px 14px;
  font-size: 13px;
  font-weight: 600;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--foreground);
  cursor: pointer;
}

.button:hover {
  background: var(--muted);
}

.button--primary {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--accent-foreground);
}
</style>
