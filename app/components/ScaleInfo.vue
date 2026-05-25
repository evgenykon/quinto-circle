<script setup lang="ts">
import { useCircleOfFifths } from '~/composables/useCircleOfFifths'

const { scaleNotes, scaleDegrees, selection, selectDegree } = useCircleOfFifths()

const chordTypeLabel: Record<string, string> = {
  maj: 'маж',
  min: 'мин',
  dim: 'ум',
}
</script>

<template>
  <div class="scale-info">
    <div class="section">
      <h3 class="title">Гамма</h3>
      <div class="note-list">
        <span
          v-for="(n, i) in scaleNotes" :key="i"
          class="scale-note"
        >
          {{ n.name }}
        </span>
      </div>
    </div>

    <div class="section">
      <h3 class="title">Аккорды</h3>
      <p class="section-hint">Аккорды на каждой ступени гаммы. Римская цифра — номер ступени. Нажмите на строку для справки.</p>
      <div class="chord-list">
        <div
          v-for="(d, i) in scaleDegrees" :key="i"
          :class="['chord-item', { 'chord-item--active': selection.type === 'degree' && selection.index === i }]"
          @click="selectDegree(i)"
        >
          <span class="chord-roman">{{ d.roman }}</span>
          <span class="chord-type">{{ chordTypeLabel[d.chordType] ?? d.chordType }}</span>
          <span class="chord-notes">{{ d.chordNotes.join(' ') }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.scale-info {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.title {
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--muted-foreground);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.note-list {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.scale-note {
  padding: 4px 10px;
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  background: var(--muted);
  color: var(--foreground);
}

.section-hint {
  margin: 0;
  font-size: 11px;
  line-height: 1.5;
  color: var(--muted-foreground);
  opacity: 0.65;
}

.chord-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.chord-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
}

.chord-item:hover {
  background: var(--muted);
}

.chord-item--active {
  border-color: var(--accent);
  background: var(--muted);
}

.chord-roman {
  font-weight: 700;
  color: var(--accent);
  min-width: 24px;
}

.chord-type {
  color: var(--muted-foreground);
  font-size: 11px;
  min-width: 36px;
}

.chord-notes {
  color: var(--foreground);
  font-family: monospace;
  font-size: 12px;
}
</style>
