<script setup lang="ts">
import { useMarketDataStore } from '@/stores/marketDataStore'
import { computed } from 'vue'
import { useCurrency } from '@/composables/useCurrency'

const marketStore = useMarketDataStore()
const { formatAsCurrency } = useCurrency()

const tickerStocks = computed(() => marketStore.stocksAsArray)
</script>

<template>
  <div class="ticker-bar-container">
    <div class="ticker-track">
      <div v-for="stock in tickerStocks" :key="stock.symbol" class="ticker-item">
        <span class="symbol">{{ stock.symbol }}</span>
        <span class="price">{{ formatAsCurrency(stock.price) }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ticker-bar-container {
  width: 100%;
  background-color: #222;
  color: #fff;
  padding: 0.5rem 0;
  overflow: hidden;
  white-space: nowrap;
  position: relative;
}

.ticker-track {
  display: inline-block;
  white-space: nowrap;
  /* Apply the animation */
  animation: ticker-scroll 60s linear infinite;
}

.ticker-track:hover {
  animation-play-state: paused;
}

.ticker-item {
  display: inline-block;
  padding: 0 2rem; /* Add more spacing between items */
}

.symbol {
  font-weight: 600;
  margin-right: 0.5rem;
  color: #42d392;
}

/* Define the animation */
@keyframes ticker-scroll {
  0% {
    /* Start completely off-screen to the right */
    transform: translateX(100%);
  }
  100% {
    /* End completely off-screen to the left */
    transform: translateX(-100%);
  }
}
</style>
