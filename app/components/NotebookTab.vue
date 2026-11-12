<script setup lang="ts">
import type { TabNote } from '~/composables/useNotebook'

const props = defineProps<{ notes: TabNote[] }>()

const STRING_LABELS = ['E', 'A', 'D', 'G', 'B', 'e']

const columnList = computed(() =>
  [...new Set(props.notes.map((note) => note.column ?? 0))].sort((a, b) => a - b),
)

const columns = computed(() => Math.max(columnList.value.length, 1))

/** Текстовая табулатура: 6 строк, по клетке на каждую ноту. */
const rows = computed(() =>
  [5, 4, 3, 2, 1, 0].map((string) => ({
    string,
    label: STRING_LABELS[string]!,
    cells: columnList.value.map((column) => {
      const note = props.notes.find((item) => (item.column ?? 0) === column && item.string === string)
      return note ? String(note.fret) : ''
    }),
  })),
)
</script>

<template>
  <div class="tab">
    <div v-for="row in rows" :key="row.string" class="row">
      <span class="label">{{ row.label }}</span>
      <span class="cells" :style="{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }">
        <span v-for="(cell, index) in row.cells" :key="index" class="cell" :class="{ 'cell--on': cell }">
          <span class="line" />
          <span v-if="cell" class="fret">{{ cell }}</span>
        </span>
      </span>
    </div>
  </div>
</template>

<style scoped>
.tab {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 0;
  overflow: hidden;
  padding: 0 0.2em;
  box-sizing: border-box;
}

.row {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  gap: 0.2em;
}

.label {
  font-size: 0.46em;
  color: var(--muted-foreground);
  width: 0.85em;
  text-align: right;
  flex: 0 0 auto;
}

.cells {
  flex: 1;
  height: 100%;
  display: grid;
  align-items: center;
}

.cell {
  position: relative;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.line {
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  height: 1px;
  background: color-mix(in srgb, var(--muted-foreground) 40%, transparent);
}

.fret {
  position: relative;
  padding: 0 0.12em;
  background: var(--background);
  font-size: 0.48em;
  font-weight: 700;
  line-height: 1;
  color: var(--foreground);
}
</style>
