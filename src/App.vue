<script setup lang="ts">
import { RouterView } from 'vue-router'
import TickerBar from '@/components/TickerBar.vue'
import ConnectionStatus from '@/components/ConnectionStatus.vue'
import { useWebSocket } from '@/composables/useWebSocket'

useWebSocket()
</script>

<template>
  <div class="app-container">
    <ConnectionStatus />

    <!-- Mobile Header (shows only on mobile/tablet) -->
    <header class="mobile-header hide-desktop">
      <div class="mobile-header-left">
        <button
          class="hamburger-btn"
          @click="toggleMobileMenu"
          aria-label="Toggle menu"
          id="mobile-menu-btn"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        <h1 class="mobile-logo">Project Horizon</h1>
      </div>
    </header>

    <!-- Ticker Bar (full width on all screens) -->
    <header class="ticker-header">
      <TickerBar />
    </header>

    <RouterView />
  </div>
</template>

<script lang="ts">
// Simple mobile menu toggle (no Vue component needed for this basic version)
export default {
  methods: {
    toggleMobileMenu() {
      const dashboardLayout = document.querySelector('.dashboard-layout')
      dashboardLayout?.classList.toggle('mobile-menu-open')
    }
  }
}
</script>

<style scoped>
/* App Container */
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

/* Ticker Header */
.ticker-header {
  width: 100%;
  flex-shrink: 0;
}

/* Mobile Header Styles */
.mobile-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: #1e1e1e;
  border-bottom: 1px solid #333;
  position: sticky;
  top: 0;
  z-index: 100;
}

.mobile-header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.mobile-logo {
  font-size: 1.25rem;
  font-weight: 700;
  color: #42d392;
  margin: 0;
}

/* Hamburger Button */
.hamburger-btn {
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  width: 48px;
  height: 48px;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 12px;
  border-radius: 6px;
  transition: background 0.2s ease;
}

.hamburger-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.hamburger-btn span {
  width: 24px;
  height: 2px;
  background: #ffffff;
  border-radius: 2px;
  transition: all 0.3s ease;
}

/* Hamburger animation when menu is open */
.mobile-menu-open .hamburger-btn span:nth-child(1) {
  transform: rotate(45deg) translate(5px, 5px);
}

.mobile-menu-open .hamburger-btn span:nth-child(2) {
  opacity: 0;
}

.mobile-menu-open .hamburger-btn span:nth-child(3) {
  transform: rotate(-45deg) translate(7px, -6px);
}

/* Hide mobile header on desktop */
.hide-desktop {
  display: flex;
}

@media (min-width: 1024px) {
  .hide-desktop {
    display: none;
  }
}

/* Mobile responsive adjustments */
@media (max-width: 1024px) {
  .app-container {
    height: auto;
    min-height: 100vh;
    overflow-y: auto;
    overflow-x: hidden;
  }
}
</style>