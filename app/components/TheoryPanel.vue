<script setup lang="ts">
import { useCircleOfFifths } from '~/composables/useCircleOfFifths'
import type { Mode } from '~/composables/useCircleOfFifths'

const {
  selection, scaleDegrees, scaleNotes, keyName, keySignature, relativeKey,
  CHORD_FUNCTIONS, DEGREE_NAMES, MODE_DESCRIPTION, MODE_CHAR_INTERVAL,
  tonic, mode, circleNotes, CHROMATIC_NOTES, CIRCLE_ORDER, getChromaticIndex, isInScale,
} = useCircleOfFifths()

const chordTypeLabel: Record<string, string> = {
  maj: 'мажорное',
  min: 'минорное',
  dim: 'уменьшённое',
}

const modeLabel: Record<Mode, string> = {
  major: 'Мажор',
  natural_minor: 'Натуральный минор',
  harmonic_minor: 'Гармонический минор',
  melodic_minor: 'Мелодический минор',
}

const parallelKey = computed(() => {
  const note = CHROMATIC_NOTES[CIRCLE_ORDER[tonic.value]]
  if (mode.value === 'major') return `${note.name} минор`
  return `${note.name} мажор`
})

const chordFunction = computed(() => {
  if (selection.value.type !== 'degree') return null
  return CHORD_FUNCTIONS[mode.value === 'major' ? 'major' : 'minor'][selection.value.index]
})

const degree = computed(() => {
  if (selection.value.type !== 'degree') return null
  return scaleDegrees.value[selection.value.index]
})

const degreeName = computed(() => {
  if (selection.value.type !== 'degree') return null
  return DEGREE_NAMES[selection.value.index]
})

const isMinorTonic = computed(() =>
  selection.value.type === 'degree' && selection.value.index === 0 && mode.value !== 'major'
)

const chordIntervals = computed(() => {
  if (selection.value.type !== 'degree' || !degree.value) return []
  switch (degree.value.chordType) {
    case 'maj': return ['ч.1', 'б.3', 'ч.5']
    case 'min': return ['ч.1', 'м.3', 'ч.5']
    case 'dim': return ['ч.1', 'м.3', 'ум.5']
    default: return ['ч.1', 'б.3', 'ч.5']
  }
})

const nonScale = computed(() => {
  if (selection.value.type !== 'non-scale') return null
  const note = circleNotes.value[selection.value.circleIndex]
  const chromatic = getChromaticIndex(selection.value.circleIndex)
  const tonicChromatic = CIRCLE_ORDER[tonic.value]
  const semitones = ((chromatic - tonicChromatic) + 12) % 12

  const intervalNames = [
    'ч.1 (прима)', 'м.2 (малая секунда)', 'б.2 (большая секунда)',
    'м.3 (малая терция)', 'б.3 (большая терция)', 'ч.4 (чистая кварта)',
    'тритон (ув.4/ум.5)', 'ч.5 (чистая квинта)', 'м.6 (малая секста)',
    'б.6 (большая секста)', 'м.7 (малая септима)', 'б.7 (большая септима)',
  ]

  return {
    note,
    semitones,
    interval: intervalNames[semitones],
  }
})

const degreeExtendedInfo = computed(() => {
  if (selection.value.type !== 'degree') return null
  const i = selection.value.index

  const info: Record<number, { role: string; progressions: string; substitution: string }> = {
    0: {
      role: 'Центр тональности, устойчивая опора. В мажоре — мажорное трезвучие, в миноре — минорное. Все остальные ступени так или иначе тяготеют в тонику.',
      progressions: 'Начинайте и заканчивайте большинство последовательностей тоникой — это создаёт ощущение завершённости. Чередуйте тонику с субдоминантой (IV или ii) для мягкого движения или с доминантой (V) для напряжения. Классический приём: начните с тоники, уйдите в субдоминанту, создайте напряжение доминантой и вернитесь в тонику.',
      substitution: 'Тонику может заменять VI ступень (тоническая замена). В мажоре — iii ступень также несёт тоническую функцию.',
    },
    1: {
      role: 'Вторая ступень (супертоника) — субдоминантовая функция. Создаёт лёгкое напряжение, подготавливая переход к доминанте. Часто используется в джазовых гармониях (II–V–I).',
      progressions: 'Используйте ii как подготовку к V: ii → V → I — основа джазовой гармонии. Пробуйте заменять IV на ii — звучание станет более мягким и «джазовым». В миноре ii° встречается реже, чаще используют iv вместо неё.',
      substitution: 'Может заменяться IV ступенью (обе субдоминанты). В миноре — ii° используется реже, чаще iv вместо неё.',
    },
    2: {
      role: 'Третья ступень (медианта) — тоническая функция. В мажоре — минорное трезвучие (iii), в миноре — мажорное (III). Соединяет тонику и доминанту.',
      progressions: 'Пробуйте iii как тонкую замену тонике — она мягче и менее устойчива. Хорошо работает в последовательностях по терциям: iii → vi → ii → V. В миноре III (мажорное трезвучие) часто используется в кадансах как «пикардийская терция».',
      substitution: 'Часто заменяет I ступень (тоническая замена). В миноре III (мажор) используется как «пикардийская терция» в кадансах.',
    },
    3: {
      role: 'Четвёртая ступень (субдоминанта) — субдоминантовая функция. Создаёт движение от тоники, но мягче чем доминанта. Часто предшествует V ступени.',
      progressions: 'Плагальный оборот IV → I — самый мягкий каданс, часто используется в gospel и эмбиенте. Ставьте IV перед V для усиления напряжения: I → IV → V → I. В миноре iv создаёт более тёмное, «печальное» звучание.',
      substitution: 'Заменяется ii ступенью (обе субдоминанты). В миноре iv — минорная субдоминанта, создающая более тёмное звучание.',
    },
    4: {
      role: 'Пятая ступень (доминанта) — сильнейшее тяготение в тонику. Мажорное трезвучие создаёт напряжённость, разрешающуюся в I ступень. В миноре — также мажор (гармонический минор).',
      progressions: 'Главный приём: создайте напряжение V и разрешите в I — это основа тональной музыки. Для разнообразия используйте прерванный оборот V → vi вместо ожидаемого I. Добавьте септиму к V (V7) — это усилит тяготение в тонику. Перед V поставьте ii или IV для более плавного подхода.',
      substitution: 'VII ступень (вводный тон) также несёт доминантовую функцию. V7 (доминантсептаккорд) — основное доминантовое созвучие.',
    },
    5: {
      role: 'Шестая ступень (субмедианта) — тоническая функция. В мажоре — минорное трезвучие (vi), в миноре — мажорное (VI). Одна из самых выразительных ступеней.',
      progressions: 'vi — основа «золотой» поп-последовательности: vi → IV → I → V. Попробуйте начинать не с тоники, а с vi — это создаёт ощущение «не с начала». V → vi — прерванный оборот: слушатель ждёт тонику, а получает vi (эффект неожиданности).',
      substitution: 'Заменяет I ступень (тоническая замена). В миноре VI — мажорная субмедианта, заимствованная из натурального минора.',
    },
    6: {
      role: 'Седьмая ступень (вводный тон) — доминантовая функция. Уменьшённое трезвучие (vii°) с сильнейшим тяготением в тонику из-за тритона между III и VII ступенями.',
      progressions: 'Используйте vii° → I для очень сильного, напряжённого разрешения. vii°7 (уменьшённый септаккорд) — универсальный проходящий аккорд: он может разрешаться практически в любую тональность. В джазе vii° часто заменяет V7 в проходящих оборотах.',
      substitution: 'Заменяет V ступень (доминантовая функция). vii°7 используется в джазе и классике как проходящий аккорд.',
    },
  }

  return info[i]
})

const diatonicNotes = computed(() =>
  circleNotes.value.filter(n => isInScale(n.index) && tonic.value !== n.index)
)

const chromaticNotes = computed(() =>
  circleNotes.value.filter(n => !isInScale(n.index))
)
</script>

<template>
  <div class="theory-panel">
    <!-- Key info -->
    <template v-if="selection.type === 'key'">
      <h3 class="tp-title">{{ keyName }}</h3>

      <div class="tp-section">
        <span class="tp-label">Знаки при ключе</span>
        <span class="tp-value">
          <template v-if="keySignature.sharps">
            {{ keySignature.sharps }} ♯
            <span class="tp-mono">({{ keySignature.names.join(', ') }})</span>
          </template>
          <template v-else-if="keySignature.flats">
            {{ keySignature.flats }} ♭
            <span class="tp-mono">({{ keySignature.names.join(', ') }})</span>
          </template>
          <template v-else>нет</template>
        </span>
      </div>

      <div class="tp-section">
        <span class="tp-label">Параллельная тональность</span>
        <span class="tp-value">{{ relativeKey }}</span>
      </div>

      <div class="tp-section">
        <span class="tp-label">Одноимённая тональность</span>
        <span class="tp-value">{{ parallelKey }}</span>
      </div>

      <div class="tp-section">
        <span class="tp-label">Диатонические ноты</span>
        <span class="tp-value tp-mono">{{ scaleNotes.map(n => n.name).join(' — ') }}</span>
      </div>

      <div class="tp-section">
        <span class="tp-label">Хроматические ноты (вне тональности)</span>
        <span class="tp-value tp-desc">
          <span v-for="(n, i) in chromaticNotes" :key="n.index">
            <span v-if="i > 0">, </span>
            <span class="chromatic-note">{{ n.note.altName ?? n.note.name }}</span>
          </span>
          <span class="tp-hint"> — эти ноты не входят в диатоническую гамму. Они используются как проходящие, вспомогательные, альтерированные ступени, а также в модуляциях и заимствованных аккордах.</span>
        </span>
      </div>

      <div class="tp-section">
        <span class="tp-label">Гармонизация (аккорды)</span>
        <span class="tp-value tp-desc">
          Каждая ступень мажорной или минорной гаммы образует аккорд при надстройке терциями. Аккорды «скрытых» (хроматических) нот не входят в тональность и звучат более напряжённо — их используют для красок и модуляций.
        </span>
      </div>
    </template>

    <!-- Degree info -->
    <template v-else-if="selection.type === 'degree' && degree">
      <h3 class="tp-title">{{ degree.roman }} ступень — {{ degreeName }}</h3>

      <div class="tp-section">
        <span class="tp-label">Аккорд</span>
        <span class="tp-value">
          <span v-if="isMinorTonic">{{ degree.roman }}</span>
          <span v-else>{{ degree.roman }}</span>
          {{ chordTypeLabel[degree.chordType] ?? degree.chordType }} трезвучие
        </span>
      </div>

      <div class="tp-section">
        <span class="tp-label">Состав (ноты)</span>
        <span class="tp-value tp-mono">{{ degree.chordNotes.join(' — ') }}</span>
      </div>

      <div class="tp-section">
        <span class="tp-label">Интервалы</span>
        <span class="tp-value tp-mono">{{ chordIntervals.join(' — ') }}</span>
      </div>

      <div class="tp-section">
        <span class="tp-label">Гармоническая функция</span>
        <span class="tp-value">{{ chordFunction }}</span>
      </div>

      <div class="tp-section" v-if="degreeExtendedInfo">
        <span class="tp-label">Роль в тональности</span>
        <span class="tp-value tp-desc">{{ degreeExtendedInfo.role }}</span>
      </div>

      <div class="tp-section" v-if="degreeExtendedInfo">
        <span class="tp-label">Как использовать</span>
        <span class="tp-value tp-desc">{{ degreeExtendedInfo.progressions }}</span>
      </div>

      <div class="tp-section" v-if="degreeExtendedInfo">
        <span class="tp-label">Замены и альтерации</span>
        <span class="tp-value tp-desc">{{ degreeExtendedInfo.substitution }}</span>
      </div>
    </template>

    <!-- Non-scale note info -->
    <template v-else-if="selection.type === 'non-scale' && nonScale">
      <h3 class="tp-title">{{ nonScale.note.note.altName ?? nonScale.note.note.name }} — хроматическая нота</h3>

      <div class="tp-section">
        <span class="tp-label">Относительно тоники</span>
        <span class="tp-value">{{ nonScale.interval }}</span>
      </div>

      <div class="tp-section">
        <span class="tp-label">Почему её нет в тональности</span>
        <span class="tp-value tp-desc">
          Диатоническая гамма содержит 7 из 12 возможных нот. Остальные 5 — хроматические — не входят в основной звукоряд. Они создают дополнительное напряжение и используются для:
        </span>
      </div>

      <div class="tp-section">
        <span class="tp-label">Проходящие ноты</span>
        <span class="tp-value tp-desc">Соединяют соседние диатонические ступени, создавая плавное движение.</span>
      </div>

      <div class="tp-section">
        <span class="tp-label">Заимствованные аккорды</span>
        <span class="tp-value tp-desc">Аккорды из параллельной или одноимённой тональности (напр. ♭VII в мажоре из натурального минора).</span>
      </div>

      <div class="tp-section">
        <span class="tp-label">Секундарные доминанты</span>
        <span class="tp-value tp-desc">V ступень к любой не-тонической ступени. Создаёт временное отклонение в другую тональность.</span>
      </div>

      <div class="tp-section">
        <span class="tp-label">Модуляции</span>
        <span class="tp-value tp-desc">Смена тональности через общие или альтерированные аккорды.</span>
      </div>
    </template>

    <!-- Mode info -->
    <template v-else-if="selection.type === 'mode'">
      <h3 class="tp-title">{{ modeLabel[mode] }}</h3>

      <div class="tp-section">
        <span class="tp-label">Описание</span>
        <span class="tp-value tp-desc">{{ MODE_DESCRIPTION[mode] }}</span>
      </div>

      <div class="tp-section">
        <span class="tp-label">Характерный интервал</span>
        <span class="tp-value tp-desc">{{ MODE_CHAR_INTERVAL[mode] }}</span>
      </div>
    </template>
  </div>
</template>

<style scoped>
.theory-panel {
  font-size: 12px;
  line-height: 1.5;
  color: var(--muted-foreground);
}

.tp-title {
  margin: 0 0 12px;
  font-size: 14px;
  font-weight: 700;
  color: var(--foreground);
}

.tp-section {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 10px;
}

.tp-label {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--muted-foreground);
  opacity: 0.7;
}

.tp-value {
  color: var(--foreground);
  font-size: 12px;
}

.tp-mono {
  font-family: monospace;
  font-size: 11px;
  white-space: pre-line;
}

.tp-desc {
  line-height: 1.6;
  opacity: 0.85;
}

.tp-hint {
  opacity: 0.6;
}

.chromatic-note {
  font-weight: 600;
  color: var(--muted-foreground);
}
</style>
