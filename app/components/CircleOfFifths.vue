<script setup lang="ts">
import { useCircleOfFifths } from '~/composables/useCircleOfFifths'
import type { PositionedNote } from '~/composables/useCircleOfFifths'

const { circleNotes, tonic, setTonic, isInScale, getDegreeInfo, selectKey, selectDegree, selectNonScale, getDegreeIndexFromCircle } = useCircleOfFifths()

const handleClick = (n: PositionedNote) => {
  if (tonic.value === n.index) {
    selectKey()
  } else if (isInScale(n.index)) {
    const idx = getDegreeIndexFromCircle(n.index)
    if (idx !== null) selectDegree(idx)
  } else {
    selectNonScale(n.index)
  }
}

const SIZE = 400
const PAD = 12
const VIEW = SIZE + PAD * 2
const CENTER = VIEW / 2
const OUTER_R = 180
const INNER_R = 140
const NOTE_R = 22

const angle = (index: number) => (index * 30 - 90) * (Math.PI / 180)

const notePos = (note: PositionedNote) => ({
  x: CENTER + OUTER_R * Math.cos(angle(note.index)),
  y: CENTER + OUTER_R * Math.sin(angle(note.index)),
})

const innerPos = (note: PositionedNote) => ({
  x: CENTER + INNER_R * Math.cos(angle(note.index)),
  y: CENTER + INNER_R * Math.sin(angle(note.index)),
})

const displayName = (n: PositionedNote) => {
  if (tonic.value === n.index) return n.note.name
  return isInScale(n.index) ? n.note.name : (n.note.altName ?? n.note.name)
}
</script>

<template>
  <svg :width="SIZE" :height="SIZE" :viewBox="`0 0 ${VIEW} ${VIEW}`" class="circle-svg">
    <circle
      :cx="CENTER" :cy="CENTER" :r="OUTER_R + NOTE_R + 4"
      fill="none" stroke="var(--border)" stroke-width="1"
    />
    <circle
      :cx="CENTER" :cy="CENTER" :r="INNER_R - NOTE_R - 4"
      fill="none" stroke="var(--border)" stroke-width="1" stroke-dasharray="4 4"
    />
    <line
      v-for="n in circleNotes" :key="n.index"
      :x1="innerPos(n).x" :y1="innerPos(n).y"
      :x2="notePos(n).x" :y2="notePos(n).y"
      stroke="var(--border)" stroke-width="1"
    />
    <g
      v-for="n in circleNotes" :key="n.index"
      :class="['note-group', { tonic: tonic === n.index, 'in-scale': isInScale(n.index) }]"
      @click="handleClick(n)"
    >
      <circle
        :cx="notePos(n).x" :cy="notePos(n).y" :r="NOTE_R"
        :class="['note-bg', { 'note-bg--tonic': tonic === n.index, 'note-bg--scale': isInScale(n.index) && tonic !== n.index }]"
      />
      <text
        :x="notePos(n).x" :y="notePos(n).y"
        text-anchor="middle" dominant-baseline="central"
        class="note-label"
      >
        {{ displayName(n) }}
      </text>
    </g>
    <!-- degree indicators -->
    <g v-for="n in circleNotes" :key="'deg-' + n.index">
      <text
        v-if="isInScale(n.index) && tonic !== n.index"
        :x="innerPos(n).x" :y="innerPos(n).y"
        text-anchor="middle" dominant-baseline="central"
        class="degree-label"
      >
        {{ getDegreeInfo(n.index)?.roman }}
      </text>
    </g>
  </svg>
</template>

<style scoped>
.circle-svg {
  display: block;
}

.note-group {
  cursor: pointer;
}

.note-bg {
  fill: var(--background);
  stroke: var(--border);
  stroke-width: 1.5;
  transition: all 0.15s;
}

.note-group:hover .note-bg {
  stroke: var(--foreground);
  fill: var(--muted);
}

.note-bg--tonic {
  fill: var(--accent);
  stroke: var(--accent);
}

.note-group:hover .note-bg--tonic {
  fill: var(--accent);
  opacity: 0.8;
}

.note-bg--scale {
  fill: var(--muted);
  stroke: var(--border);
}

.note-label {
  font-size: 11px;
  font-weight: 600;
  fill: var(--foreground);
  pointer-events: none;
  user-select: none;
}

.degree-label {
  font-size: 10px;
  font-weight: 700;
  fill: var(--muted-foreground);
  pointer-events: none;
  user-select: none;
}
</style>
