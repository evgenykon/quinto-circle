<script setup lang="ts">
import type { TabNote } from '~/composables/useNotebook'
import { TABS_PER_CELL } from '~/composables/useNotebook'

const props = defineProps<{ notes: TabNote[] }>()
const emit = defineEmits<{
  apply: [notes: TabNote[]]
  cancel: []
}>()

const draft = ref<TabNote[]>(props.notes.map((note) => ({ ...note })))

/** Отмеченные струны: ключ — номер струны, значение — введённый лад. */
const armed = ref<Record<number, string>>({})

const STRING_LABELS = ['E', 'A', 'D', 'G', 'B', 'e']
const label = (string: number) => STRING_LABELS[string]!

const rows = computed(() => [5, 4, 3, 2, 1, 0].map((string) => ({ string, label: STRING_LABELS[string]! })))

const armedStrings = computed(() => Object.keys(armed.value).map(Number))
const armedCount = computed(() => armedStrings.value.length)

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
const isArmed = (string: number) => armed.value[string] !== undefined

const toggleString = (string: number) => {
  const next = { ...armed.value }
  if (next[string] !== undefined) delete next[string]
  else next[string] = ''
  armed.value = next
}

const setFret = (string: number, value: string) => {
  armed.value = { ...armed.value, [string]: value }
}

const canAdd = computed(
  () =>
    armedStrings.value.filter((string) => {
      const fret = Number.parseInt(armed.value[string] ?? '', 10)
      return !Number.isNaN(fret) && fret >= 0 && fret <= 24
    }).length > 0,
)

const addArmed = () => {
  const next = [...draft.value]
  for (const string of armedStrings.value) {
    if (next.length >= TABS_PER_CELL) break
    const fret = Number.parseInt(armed.value[string] ?? '', 10)
    if (Number.isNaN(fret) || fret < 0 || fret > 24) continue
    next.push({ string, fret })
  }
  draft.value = next
  armed.value = {}
}

const removeAt = (index: number) => {
  draft.value.splice(index, 1)
}

const clear = () => {
  draft.value = []
  armed.value = {}
}

const apply = () => {
  emit('apply', [...draft.value])
}
</script>

<template>
  <div class="tab-editor">
    <p class="hint">
      Отметь струны точками (можно несколько), кликни по точке и укажи лад, затем «Добавить».
      В табах: {{ draft.length }} из {{ TABS_PER_CELL }}.
    </p>

    <div class="staff">
      <div v-for="row in rows" :key="`row-${row.string}`" class="staff-row">
        <span class="string-label">{{ row.label }}</span>

        <div class="track" @click="toggleString(row.string)">
          <span class="line" />
          <span
            v-if="isArmed(row.string)"
            class="dot"
            :class="{ 'dot--empty': armed[row.string] === '' }"
            @click.stop
          >
            <input
              :value="armed[row.string]"
              class="dot-input"
              type="number"
              min="0"
              max="24"
              inputmode="numeric"
              placeholder="–"
              @input="setFret(row.string, ($event.target as HTMLInputElement).value)"
              @keydown.enter.prevent="addArmed"
            >
          </span>
          <span
            v-for="note in notesFor(row.string)"
            :key="note.key"
            class="staff-note"
            :style="{ left: `${note.left}%` }"
          >
            {{ note.fret }}
          </span>
        </div>
      </div>
    </div>

    <div class="add-row">
      <button type="button" class="button button--primary" :disabled="!canAdd" @click="addArmed">
        Добавить{{ armedCount ? ` (${armedCount})` : '' }}
      </button>
      <button v-if="armedCount" type="button" class="button" @click="armed = {}">Снять точки</button>
      <span v-if="armedCount" class="add-hint">Отмечено струн: {{ armedCount }}</span>
    </div>

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
  gap: 4px;
  padding: 4px 0;
}

.staff-row {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 30px;
}

.string-label {
  width: 18px;
  font-size: 11px;
  color: var(--muted-foreground);
  text-align: center;
  flex: 0 0 auto;
}

.track {
  position: relative;
  flex: 1;
  height: 26px;
  display: flex;
  align-items: center;
  cursor: pointer;
}

.line {
  width: 100%;
  height: 1.5px;
  background: var(--muted-foreground);
  border-radius: 1px;
}

.track:hover .line {
  background: var(--accent);
}

.dot {
  position: absolute;
  left: 14%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 44px;
  height: 21px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: var(--accent);
  border: 1px solid var(--accent);
  cursor: text;
}

.dot--empty {
  background: var(--background);
  border: 1.5px dashed var(--accent);
}

.dot-input {
  width: 100%;
  height: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--accent-foreground);
  font-size: 12px;
  font-weight: 700;
  text-align: center;
  outline: none;
  -moz-appearance: textfield;
}

.dot-input::-webkit-outer-spin-button,
.dot-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.dot--empty .dot-input {
  color: var(--foreground);
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

.add-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.add-hint {
  font-size: 12px;
  color: var(--muted-foreground);
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

.button:hover:not(:disabled) {
  background: var(--muted);
}

.button:disabled {
  opacity: 0.4;
  cursor: default;
}

.button--primary {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--accent-foreground);
}
</style>
