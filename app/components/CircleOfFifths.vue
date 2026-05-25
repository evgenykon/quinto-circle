<script setup lang="ts">
import { useCircleOfFifths } from '~/composables/useCircleOfFifths'
import type { PositionedNote } from '~/composables/useCircleOfFifths'

const { circleNotes, tonic, setTonic, isInScale, getDegreeInfo, selectKey, selectDegree, selectNonScale, getDegreeIndexFromCircle, progressionRoots, currentStep } = useCircleOfFifths()

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
const ARROW_R = INNER_R - NOTE_R - 4
const CP_R = 60

const angle = (index: number) => (index * 30 - 90) * (Math.PI / 180)

const notePos = (note: PositionedNote) => ({
  x: CENTER + OUTER_R * Math.cos(angle(note.index)),
  y: CENTER + OUTER_R * Math.sin(angle(note.index)),
})

const innerPos = (note: PositionedNote) => ({
  x: CENTER + INNER_R * Math.cos(angle(note.index)),
  y: CENTER + INNER_R * Math.sin(angle(note.index)),
})

const graphPos = (circleIndex: number) => ({
  x: CENTER + ARROW_R * Math.cos(angle(circleIndex)),
  y: CENTER + ARROW_R * Math.sin(angle(circleIndex)),
})

const displayName = (n: PositionedNote) => {
  if (tonic.value === n.index) return n.note.name
  return isInScale(n.index) ? n.note.name : (n.note.altName ?? n.note.name)
}

interface ArrowArc {
  path: string
  from: number
  to: number
  active: boolean
}

const arrows = computed<ArrowArc[]>(() => {
  const roots = progressionRoots.value
  const step = currentStep.value
  const result: ArrowArc[] = []
  for (let i = 0; i < roots.length; i++) {
    const j = (i + 1) % roots.length
    const from = roots[i]
    const to = roots[j]
    const isActive = step >= 0 && j === step
    if (from === to) {
      const a = angle(from)
      const p = graphPos(from)
      const loopR = 14
      const cp = {
        x: p.x - loopR * Math.cos(a),
        y: p.y - loopR * Math.sin(a),
      }
      result.push({
        path: `M${p.x.toFixed(1)},${p.y.toFixed(1)} Q${cp.x.toFixed(1)},${cp.y.toFixed(1)} ${p.x.toFixed(1)},${p.y.toFixed(1)}`,
        from,
        to,
        active: isActive,
      })
      continue
    }
    const a1 = angle(from)
    const a2 = angle(to)
    const p1 = graphPos(from)
    const p2 = graphPos(to)
    const midA = (a1 + a2) / 2
    const cp = {
      x: CENTER + CP_R * Math.cos(midA),
      y: CENTER + CP_R * Math.sin(midA),
    }
    result.push({
      path: `M${p1.x.toFixed(1)},${p1.y.toFixed(1)} Q${cp.x.toFixed(1)},${cp.y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`,
      from,
      to,
      active: isActive,
    })
  }
  return result
})
</script>

<template>
  <svg :width="SIZE" :height="SIZE" :viewBox="`0 0 ${VIEW} ${VIEW}`" class="circle-svg">
    <defs>
      <marker id="arr" markerWidth="12" markerHeight="10" refX="11" refY="5" orient="auto" markerUnits="userSpaceOnUse">
        <polygon points="0 0, 12 5, 0 10" fill="var(--muted-foreground)" stroke="none" />
      </marker>
      <marker id="arr-active" markerWidth="12" markerHeight="10" refX="11" refY="5" orient="auto" markerUnits="userSpaceOnUse">
        <polygon points="0 0, 12 5, 0 10" fill="var(--accent)" stroke="none" />
      </marker>
    </defs>
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
    <path
      v-for="(a, i) in arrows" :key="i"
      :d="a.path"
      fill="none"
      :stroke="a.active ? 'var(--accent)' : 'var(--muted-foreground)'"
      :stroke-width="a.active ? 2 : 1.5"
      stroke-linecap="round"
      :marker-end="a.active ? 'url(#arr-active)' : 'url(#arr)'"
      class="arrow-path"
    />
  </svg>
</template>

<style scoped>
.circle-svg {
  display: block;
}

.arrow-path {
  transition: stroke 0.15s;
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
