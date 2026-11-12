<script setup lang="ts">
import type { TabNote } from '~/composables/useNotebook'
import { TABS_PER_CELL } from '~/composables/useNotebook'

const props = defineProps<{ notes: TabNote[] }>()
const emit = defineEmits<{
  apply: [notes: TabNote[]]
  cancel: []
}>()

const draft = ref<TabNote[]>(props.notes.map((note) => ({ ...note })))

const FRETS = 13
const STRING_LABELS = ['E', 'A', 'D', 'G', 'B', 'e']

const has = (string: number, fret: number) =>
  draft.value.some((note) => note.string === string && note.fret === fret)

const toggle = (string: number, fret: number) => {
  const index = draft.value.findIndex((note) => note.string === string && note.fret === fret)
  if (index >= 0) {
    draft.value.splice(index, 1)
    return
  }
  if (draft.value.length >= TABS_PER_CELL) return
  draft.value.push({ string, fret })
}

const clear = () => {
  draft.value = []
}

const apply = () => {
  emit('apply', [...draft.value])
}

const label = (string: number) => STRING_LABELS[string]!
</script>

<template>
  <div class="tab-editor">
    <p class="hint">
      Кликни по струне на нужном ладу — до {{ TABS_PER_CELL }} нот. Выбрано: {{ draft.length }}.
    </p>

    <div class="grid">
      <div v-for="string in 6" :key="`row-${string}`" class="row">
        <span class="string-label">{{ label(string - 1) }}</span>
        <button
          v-for="fret in FRETS"
          :key="`${string}-${fret}`"
          type="button"
          class="fret-cell"
          :class="{ 'fret-cell--on': has(string - 1, fret - 1) }"
          @click="toggle(string - 1, fret - 1)"
        >
          <span class="fret-number">{{ fret - 1 }}</span>
          <span v-if="has(string - 1, fret - 1)" class="fret-dot" />
        </button>
      </div>
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
  gap: 10px;
}

.hint {
  margin: 0;
  font-size: 12px;
  color: var(--muted-foreground);
}

.grid {
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow-x: auto;
}

.row {
  display: flex;
  align-items: center;
  gap: 2px;
}

.string-label {
  width: 16px;
  font-size: 10px;
  color: var(--muted-foreground);
  text-align: center;
}

.fret-cell {
  position: relative;
  width: 26px;
  height: 26px;
  padding: 0;
  border: 1px solid var(--border);
  border-radius: 5px;
  background: transparent;
  color: var(--muted-foreground);
  font-size: 9px;
  cursor: pointer;
}

.fret-cell:hover {
  background: var(--muted);
}

.fret-cell--on {
  border-color: var(--accent);
  background: var(--accent);
  color: var(--accent-foreground);
}

.fret-number {
  position: relative;
  z-index: 1;
}

.fret-dot {
  position: absolute;
  inset: 7px;
  border-radius: 50%;
  background: var(--accent-foreground);
  opacity: 0.9;
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
