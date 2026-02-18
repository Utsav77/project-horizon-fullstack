<script setup lang="ts">
import { computed } from 'vue'
import { usePortfolioStore } from '@/stores/portfolioStore'
import { useCurrency } from '@/composables/useCurrency'

const portfolioStore = usePortfolioStore()
const { formatPaiseAsCurrency } = useCurrency()

const totalValue = computed(() => portfolioStore.totalPortfolioValue)
const cashBalance = computed(() => portfolioStore.cash)
const holdingsValue = computed(() => portfolioStore.totalHoldingsValue)

// Calculate P&L (if you track initial investment)
// const profitLoss = computed(() => {
//   // This is a placeholder - implement based on your logic
//   return holdingsValue.value // Replace with actual P&L calculation
// })

const plPercentage = computed(() => {
  const initial = 1000000 // Initial cash (10 lakh paise)
  // if (initial === 0) return 0
  return ((totalValue.value - initial) / initial) * 100
})
</script>

<template>
  <div class="portfolio-summary">
    <!-- Main Total (Full Width on Mobile) -->
    <div class="summary-item total-value">
      <div class="item-content">
        <h3 class="item-label">Net Worth</h3>
        <p class="item-value big">{{ formatPaiseAsCurrency(totalValue) }}</p>
        <p class="item-change" :class="plPercentage >= 0 ? 'positive' : 'negative'">
          {{ plPercentage >= 0 ? '+' : '' }}{{ plPercentage.toFixed(2) }}%
        </p>
      </div>
    </div>

    <!-- Stats Grid (2 columns on mobile) -->
    <div class="stats-grid">
      <div class="summary-item">
        <div class="item-content">
          <h3 class="item-label">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <line x1="12" y1="1" x2="12" y2="23"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
            Cash
          </h3>
          <p class="item-value">{{ formatPaiseAsCurrency(cashBalance) }}</p>
        </div>
      </div>

      <div class="summary-item">
        <div class="item-content">
          <h3 class="item-label">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
            </svg>
            Holdings
          </h3>
          <p class="item-value">{{ formatPaiseAsCurrency(holdingsValue) }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ============================================
   PORTFOLIO SUMMARY CONTAINER
   ============================================ */
.portfolio-summary {
  display: grid;
  gap: 1rem;
  background-color: #2c2c2c;
  padding: 1.5rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

/* ============================================
   TOTAL VALUE (FEATURED)
   ============================================ */
.total-value {
  grid-column: 1 / -1;
  background: linear-gradient(135deg, #1e3a5f 0%, #2c2c2c 100%);
  border: 1px solid #3a5a7a;
  border-radius: 10px;
  padding: 1.5rem;
}

.total-value .item-value {
  font-size: 2.5rem;
  color: #42d392;
  margin: 0.5rem 0;
}

.total-value .item-label {
  font-size: 0.95rem;
}

.item-change {
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0.25rem 0 0 0;
  font-variant-numeric: tabular-nums;
}

.item-change.positive {
  color: #42d392;
}

.item-change.negative {
  color: #ff4d4f;
}

/* ============================================
   STATS GRID
   ============================================ */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.summary-item {
  background-color: #252525;
  border-radius: 10px;
  padding: 1.25rem;
  border: 1px solid #333;
  transition: all 0.2s ease;
}

.summary-item:hover {
  border-color: #007bff;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 123, 255, 0.2);
}

.item-content {
  display: flex;
  flex-direction: column;
}

.item-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #a0a0a0;
  margin: 0 0 0.75rem 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
}

.item-label svg {
  opacity: 0.7;
}

.item-value {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
  color: #fff;
  font-variant-numeric: tabular-nums;
}

.item-value.big {
  font-size: 2.5rem;
  line-height: 1.2;
}

/* ============================================
   TABLET (641px - 1023px)
   ============================================ */
@media (max-width: 1023px) and (min-width: 641px) {
  .portfolio-summary {
    padding: 1.25rem;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .total-value .item-value {
    font-size: 2.25rem;
  }

  .item-value {
    font-size: 1.35rem;
  }
}

/* ============================================
   MOBILE (< 640px)
   ============================================ */
@media (max-width: 640px) {
  .portfolio-summary {
    padding: 1rem;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .total-value {
    padding: 1.25rem;
  }

  .total-value .item-label {
    font-size: 0.875rem;
  }

  .total-value .item-value {
    font-size: 2rem;
  }

  .item-change {
    font-size: 1rem;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }

  .summary-item {
    padding: 1rem;
  }

  .item-label {
    font-size: 0.75rem;
    margin-bottom: 0.5rem;
  }

  .item-label svg {
    width: 16px;
    height: 16px;
  }

  .item-value {
    font-size: 1.25rem;
  }
}

/* ============================================
   VERY SMALL MOBILE (< 375px)
   ============================================ */
@media (max-width: 374px) {
  .total-value .item-value {
    font-size: 1.75rem;
  }

  .item-value {
    font-size: 1.1rem;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
