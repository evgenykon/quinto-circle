<template>
  <div class="page">
    <header class="header">
      <div>
        <h1 class="title">quinto-circle</h1>
        <p class="subtitle">Квинтовый круг — интерактивный инструмент для создания музыки</p>
      </div>
      <NuxtLink to="/chords" class="nav-link">Определить аккорд →</NuxtLink>
    </header>

    <div class="layout">
      <div class="sidebar sidebar--left">
        <KeySelector />
        <ScaleInfo />
      </div>
      <div class="main">
        <div class="main-inner">
          <CircleOfFifths />
          <MidiPlayer />
        </div>
      </div>
      <div class="sidebar sidebar--right">
        <TheoryPanel />
      </div>
    </div>
  </div>
</template>

<style scoped>
.page {
  width: 100%;
  padding: 32px 24px;
}

.header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 32px;
}

.nav-link {
  font-size: 13px;
  color: var(--muted-foreground);
  text-decoration: none;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 7px 12px;
  white-space: nowrap;
  transition: all 0.15s;
}

.nav-link:hover {
  color: var(--foreground);
  background: var(--muted);
}

.title {
  margin: 0;
  font-size: 24px;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.subtitle {
  margin: 4px 0 0;
  font-size: 14px;
  color: var(--muted-foreground);
}

.layout {
  display: flex;
  gap: 32px;
  align-items: flex-start;
}

.sidebar {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.sidebar--left {
  flex: 0 0 240px;
}

.sidebar--right {
  flex: 0 0 260px;
}

.main {
  flex: 1;
  display: flex;
  justify-content: center;
}

.main-inner {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  justify-content: center;
  gap: 24px;
  flex-wrap: wrap;
}
</style>
