<script setup lang="ts">
import WatchlistPanel from '@/components/WatchlistPanel.vue'
import MainChartView from '@/components/MainChartView.vue'
import PortfolioSummary from '@/components/PortfolioSummary.vue'
import TradeExecutionPanel from '@/components/TradeExecutionPanel.vue'

function closeMenu() {
  const layout = document.querySelector('.dashboard-layout')
  if (layout) {
    layout.classList.remove('mobile-menu-open')
  }
}
</script>

<template>
  <main class="dashboard-layout">
    <!-- Mobile Overlay (closes menu when clicked) -->
    <div class="mobile-overlay" @click="closeMenu"></div>

    <!-- Watchlist Panel (Left Sidebar on desktop) -->
    <aside class="panel-watchlist">
      <WatchlistPanel />
    </aside>

    <!-- Center Content (Portfolio + Chart) -->
    <div class="center-content">
      <PortfolioSummary />
      <MainChartView />
    </div>

    <!-- Trade Execution Panel (Right Sidebar on desktop) -->
    <aside class="panel-trade">
      <TradeExecutionPanel />
    </aside>
  </main>
</template>

<style scoped>
/* ============================================
   DESKTOP LAYOUT (default)
   ============================================ */
.dashboard-layout {
  display: flex;
  flex-direction: row;
  height: 100%;
  width: 100%;
  background-color: #121212;
  overflow: hidden;
  position: relative; /* For absolute positioning of overlay */
}

/* Mobile Overlay (hidden by default) */
.mobile-overlay {
  display: none;
  position: fixed;
  top: 60px; /* Below mobile header */
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 998;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;
}

/* Show overlay when mobile menu is open */
.mobile-menu-open .mobile-overlay {
  display: block;
  opacity: 1;
  pointer-events: auto;
}

/* Left Panel - Watchlist */
.panel-watchlist {
  width: 300px;
  flex-shrink: 0;
  background-color: #1e1e1e;
  border-right: 1px solid #333;
  overflow-y: auto;
  transition: transform 0.3s ease;
}

/* Center Content - Main Chart & Portfolio Summary */
.center-content {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  padding: 24px;
  overflow-y: auto;
  background-color: #1e1e1e;
}

/* Right Panel - Trade Execution */
.panel-trade {
  width: 300px;
  flex-shrink: 0;
  background-color: #1e1e1e;
  border-left: 1px solid #333;
  overflow-y: auto;
}

/* ============================================
   TABLET LAYOUT (641px - 1023px)
   ============================================ */
@media (max-width: 1023px) {
  .dashboard-layout {
    flex-direction: column;
    height: auto;
    overflow: visible;
  }

  /* Watchlist becomes horizontal scrolling ticker */
  .panel-watchlist {
    width: 100%;
    height: auto;
    max-height: 250px;
    border-right: none;
    border-bottom: 1px solid #333;
    order: 1;
  }

  /* Center content takes full width */
  .center-content {
    width: 100%;
    padding: 16px;
    border-right: none;
    overflow: visible;
    order: 2;
  }

  /* Trade panel takes full width */
  .panel-trade {
    width: 100%;
    border-left: none;
    border-top: 1px solid #333;
    padding: 16px;
    order: 3;
  }
}

/* ============================================
   MOBILE LAYOUT (< 640px)
   ============================================ */
@media (max-width: 640px) {
  /* Mobile Menu - Watchlist as Drawer */
  .panel-watchlist {
    position: fixed;
    top: 60px; /* Below mobile header */
    left: -100%;
    width: 280px;
    height: calc(100vh - 60px);
    max-height: none;
    z-index: 999;
    transition: left 0.3s ease;
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.5);
  }

  /* Show watchlist when menu is open */
  .mobile-menu-open .panel-watchlist {
    left: 0;
  }

  /* Center content adjustments */
  .center-content {
    padding: 12px;
    min-height: 60vh;
  }

  /* Trade panel as bottom sheet */
  .panel-trade {
    position: sticky;
    bottom: 0;
    padding: 12px;
    border-radius: 16px 16px 0 0;
    box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.3);
  }
}

/* ============================================
   LANDSCAPE MOBILE (< 640px height)
   ============================================ */
@media (max-height: 640px) and (orientation: landscape) {
  .center-content {
    min-height: auto;
  }

  .panel-trade {
    position: relative;
    border-radius: 8px;
  }
}
</style>
