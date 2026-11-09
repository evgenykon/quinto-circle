<script setup lang="ts">
import { countLeaves, type TreeNode } from '~/composables/useChordTree'

const props = defineProps<{
  root: TreeNode
  selectedId?: string | null
}>()

const emit = defineEmits<{
  select: [node: TreeNode]
}>()

const RING = 140
const NODE_R = 30
const ROOT_R = 42
const PAD = 96

interface PlacedNode {
  node: TreeNode
  x: number
  y: number
  parent: PlacedNode | null
}

const placed = computed<PlacedNode[]>(() => {
  const result: PlacedNode[] = []

  const place = (
    node: TreeNode,
    start: number,
    end: number,
    level: number,
    parent: PlacedNode | null,
  ) => {
    const angle = (start + end) / 2
    const radius = level * RING
    const self: PlacedNode = {
      node,
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      parent,
    }
    result.push(self)

    const total = countLeaves(node)
    if (!node.children.length || total === 0) return

    let cursor = start
    for (const child of node.children) {
      const span = ((end - start) * countLeaves(child)) / total
      place(child, cursor, cursor + span, level + 1, self)
      cursor += span
    }
  }

  place(props.root, -Math.PI / 2, Math.PI * 1.5, 0, null)
  return result
})

const maxLevel = computed(() => placed.value.reduce((max, item) => Math.max(max, item.node.level), 0))
const size = computed(() => 2 * (maxLevel.value * RING + PAD))
const half = computed(() => size.value / 2)

/* Глубокие деревья не влезают в экран целиком: держим масштаб, при котором
   подписи читаемы, и даём области прокрутку. */
const viewport = ref<HTMLElement | null>(null)
const areaW = ref(0)
const areaH = ref(0)

let observer: ResizeObserver | null = null

const centerScroll = () => {
  const el = viewport.value
  if (!el) return
  el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2
  el.scrollTop = (el.scrollHeight - el.clientHeight) / 2
}

onMounted(() => {
  const el = viewport.value
  if (!el) return
  observer = new ResizeObserver(() => {
    areaW.value = el.clientWidth
    areaH.value = el.clientHeight
  })
  observer.observe(el)
  areaW.value = el.clientWidth
  areaH.value = el.clientHeight
  nextTick(centerScroll)
})

onBeforeUnmount(() => observer?.disconnect())

watch([size, maxLevel], () => nextTick(centerScroll))

const displaySize = computed(() =>
  Math.max(Math.min(areaW.value || 800, areaH.value || 600), size.value * 0.6),
)

const nodeRadius = (level: number) => (level === 0 ? ROOT_R : NODE_R)

/** Листья, из которых есть возврат на центральный аккорд. */
const returnEdges = computed(() => placed.value.filter((item) => item.node.canReturn))

const isOnSelectedPath = (item: PlacedNode) => {
  const selected = placed.value.find((candidate) => candidate.node.id === props.selectedId)
  if (!selected) return false
  return selected.node.path.some((chord) => chord.key === item.node.chord.key)
}

const edgePath = (from: PlacedNode, to: PlacedNode) => {
  const startR = nodeRadius(from.node.level)
  const endR = nodeRadius(to.node.level) + 3
  const dx = to.x - from.x
  const dy = to.y - from.y
  const len = Math.hypot(dx, dy) || 1
  const x1 = from.x + (dx / len) * startR
  const y1 = from.y + (dy / len) * startR
  const x2 = to.x - (dx / len) * endR
  const y2 = to.y - (dy / len) * endR
  const mx = (x1 + x2) / 2
  const my = (y1 + y2) / 2
  const cx = mx * 0.82
  const cy = my * 0.82
  return `M${x1.toFixed(1)},${y1.toFixed(1)} Q${cx.toFixed(1)},${cy.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`
}

const returnPath = (item: PlacedNode) => {
  const dx = -item.x
  const dy = -item.y
  const len = Math.hypot(dx, dy) || 1
  const x1 = item.x + (dx / len) * nodeRadius(item.node.level)
  const y1 = item.y + (dy / len) * nodeRadius(item.node.level)
  const x2 = (dx / len) * (ROOT_R + 3)
  const y2 = (dy / len) * (ROOT_R + 3)
  const cx = ((x1 + x2) / 2) * 0.6
  const cy = ((y1 + y2) / 2) * 0.6
  return `M${x1.toFixed(1)},${y1.toFixed(1)} Q${cx.toFixed(1)},${cy.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`
}
</script>

<template>
  <div ref="viewport" class="tree-scroll">
    <div class="tree-canvas" :style="{ width: `${displaySize}px`, height: `${displaySize}px` }">
      <svg
        width="100%"
        height="100%"
        :viewBox="`${-half} ${-half} ${size} ${size}`"
        class="tree-svg"
        preserveAspectRatio="xMidYMid meet"
      >
    <!-- связи -->
    <g class="edges">
      <path
        v-for="item in placed.filter((p) => p.parent)"
        :key="`edge-${item.node.id}`"
        :d="edgePath(item.parent!, item)"
        :stroke="item.node.chord.color"
        :stroke-width="isOnSelectedPath(item) ? 2.5 : 1.2"
        :stroke-opacity="isOnSelectedPath(item) ? 0.95 : 0.35"
        fill="none"
      />
    </g>

    <!-- возвраты на центральный аккорд -->
    <g class="returns">
      <path
        v-for="item in returnEdges"
        :key="`ret-${item.node.id}`"
        :d="returnPath(item)"
        :stroke="item.node.chord.color"
        stroke-width="1.2"
        stroke-dasharray="4 5"
        stroke-opacity="0.5"
        fill="none"
      />
    </g>

    <!-- узлы -->
    <g class="nodes">
      <g
        v-for="item in placed"
        :key="item.node.id"
        class="node"
        :class="{ 'node--selected': item.node.id === selectedId, 'node--dim': selectedId && !isOnSelectedPath(item) }"
        @click="emit('select', item.node)"
      >
        <circle
          :cx="item.x"
          :cy="item.y"
          :r="nodeRadius(item.node.level)"
          :fill="item.node.chord.color"
          :stroke="item.node.id === selectedId ? 'var(--foreground)' : 'var(--background)'"
          :stroke-width="item.node.id === selectedId ? 3 : 2"
        />
        <text
          :x="item.x"
          :y="item.y"
          class="node-name"
          :class="{ 'node-name--root': item.node.level === 0 }"
          text-anchor="middle"
          dominant-baseline="central"
        >
          {{ item.node.chord.name }}
        </text>
        <text
          v-if="item.node.level > 0"
          :x="item.x"
          :y="item.y + nodeRadius(item.node.level) + 14"
          class="node-roman"
          text-anchor="middle"
          dominant-baseline="central"
        >
          {{ item.node.chord.roman }}
        </text>
      </g>
    </g>
      </svg>
    </div>
  </div>
</template>

<style scoped>
.tree-scroll {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.tree-canvas {
  margin: 0 auto;
}

.tree-svg {
  display: block;
  user-select: none;
}

.node {
  cursor: pointer;
}

.node circle {
  transition: stroke 0.15s, opacity 0.15s;
}

.node:hover circle {
  stroke: var(--foreground);
}

.node--dim {
  opacity: 0.45;
}

.node-name {
  font-size: 19px;
  font-weight: 700;
  fill: #111;
  pointer-events: none;
}

.node-name--root {
  font-size: 22px;
  font-weight: 800;
}

.node-roman {
  font-size: 12px;
  font-weight: 600;
  fill: var(--muted-foreground);
  pointer-events: none;
}
</style>
