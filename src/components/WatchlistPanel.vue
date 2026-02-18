<script setup lang="ts">
import { computed } from 'vue'
import { useMarketDataStore } from '@/stores/marketDataStore'
import { useUiStore } from '@/stores/uiStore'
import { useCurrency } from '@/composables/useCurrency'

const marketStore = useMarketDataStore()
const uiStore = useUiStore()
const { formatAsCurrency } = useCurrency()

const watchlistStocks = computed(() => marketStore.stocksAsArray)

function selectStock(symbol: string) {
  uiStore.selectSymbol(symbol)

  // Close mobile menu after selection
  if (window.innerWidth < 640) {
    closeMobileMenu()
  }
}

function closeMobileMenu() {
  const dashboardLayout = document.querySelector('.dashboard-layout')
  if (dashboardLayout) {
    dashboardLayout.classList.remove('mobile-menu-open')
  }
}
</script>

<template>
  <div class="watchlist-container">
    <div class="watchlist-header">
      <h2>Watchlist</h2>
      <button class="close-btn hide-desktop" @click="closeMobileMenu" aria-label="Close menu">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>

    <ul class="stock-list">
      <li
        v-for="stock in watchlistStocks"
        :key="stock.symbol"
        @click="selectStock(stock.symbol)"
        :class="{ selected: stock.symbol === uiStore.selectedSymbol }"
        class="stock-item"
      >
        <div class="symbol-info">
          <span class="symbol">{{ stock.symbol }}</span>
          <span class="price">{{ formatAsCurrency(stock.price) }}</span>
        </div>
        <div class="change-info">
          <span class="change-badge" :class="stock.changePercent >= 0 ? 'positive' : 'negative'">
            {{ stock.changePercent >= 0 ? '+' : '' }}{{ stock.changePercent.toFixed(2) }}%
          </span>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
/* ============================================
   WATCHLIST CONTAINER
   ============================================ */
.watchlist-container {
  width: 100%;
  height: 100%;
  background-color: #1e1e1e;
  padding: 16px;
  color: #fff;
  display: flex;
  flex-direction: column;
}

/* Header */
.watchlist-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #333;
}

.watchlist-header h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.close-btn {
  display: none;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: transparent;
  border: none;
  color: #fff;
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.2s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.close-btn svg {
  pointer-events: none;
}

/* Stock List */
.stock-list {
  list-style-type: none;
  padding: 0;
  margin: 0;
  overflow-y: auto;
  flex: 1;
}

/* Stock Item */
.stock-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 68px; /* Touch-friendly minimum */
  border: 2px solid transparent;
}

.stock-item:hover {
  background-color: #2a2a2a;
}

.stock-item.selected {
  background-color: #007bff;
  border-color: #0056b3;
}

.stock-item + .stock-item {
  margin-top: 8px;
}

/* Symbol Info */
.symbol-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.symbol {
  font-weight: 700;
  font-size: 1.1rem;
  letter-spacing: 0.5px;
}

.price {
  font-size: 0.95rem;
  color: #a0a0a0;
}

/* Change Info */
.change-info {
  display: flex;
  align-items: center;
}

.change-badge {
  font-weight: 700;
  font-size: 0.95rem;
  padding: 6px 10px;
  border-radius: 6px;
  min-width: 70px;
  text-align: center;
}

.positive {
  color: #42d392;
  background-color: rgba(66, 211, 146, 0.15);
}

.negative {
  color: #ff4d4f;
  background-color: rgba(255, 77, 79, 0.15);
}

/* ============================================
   TABLET (641px - 1023px)
   ============================================ */
@media (max-width: 1023px) and (min-width: 641px) {
  .watchlist-container {
    padding: 12px;
  }

  .stock-list {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .stock-item {
    min-height: 80px;
  }
}

/* ============================================
   MOBILE (< 640px)
   ============================================ */
@media (max-width: 640px) {
  .watchlist-header {
    position: sticky;
    top: 0;
    background-color: #1e1e1e;
    z-index: 10;
    margin-bottom: 12px;
  }

  .close-btn {
    display: flex;
  }

  .stock-item {
    padding: 16px 12px;
    min-height: 72px;
  }

  .symbol {
    font-size: 1.2rem;
  }

  .price {
    font-size: 1rem;
  }

  .change-badge {
    font-size: 1rem;
    padding: 8px 12px;
    min-width: 80px;
  }
}

/* Hide elements on desktop */
.hide-desktop {
  display: none;
}

@media (max-width: 640px) {
  .hide-desktop {
    display: flex;
  }
}
</style>
