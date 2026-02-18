<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { useUiStore } from '@/stores/uiStore'
import { useMarketDataStore } from '@/stores/marketDataStore'
import { usePortfolioStore } from '@/stores/portfolioStore'
import { useCurrency } from '@/composables/useCurrency'

const uiStore = useUiStore()
const marketStore = useMarketDataStore()
const portfolioStore = usePortfolioStore()
const { formatAsCurrency, formatPaiseAsCurrency } = useCurrency()

const quantity = ref(1)
const tradeType = ref<'BUY' | 'SELL'>('BUY')
const feedbackMessage = reactive({ text: '', type: '' })

const symbol = computed(() => uiStore.selectedSymbol)
const currentPrice = computed(() => marketStore.stocks[symbol.value]?.price ?? 0)
const estimatedTotal = computed(() => currentPrice.value * quantity.value)

const isValidTrade = computed(() => {
  if (marketStore.connectionStatus !== 'connected') return false
  if (quantity.value <= 0) return false
  if (currentPrice.value <= 0) return false

  const costInPaise = Math.round(currentPrice.value * 100) * quantity.value
  if (tradeType.value === 'BUY') {
    return costInPaise <= portfolioStore.cash
  } else {
    const holding = portfolioStore.holdings[symbol.value]
    return holding && holding.quantity >= quantity.value
  }
})

function executeTrade() {
  feedbackMessage.text = ''
  let success = false

  if (tradeType.value === 'BUY') {
    success = portfolioStore.buyStock(symbol.value, quantity.value, currentPrice.value)
  } else {
    success = portfolioStore.sellStock(symbol.value, quantity.value, currentPrice.value)
  }

  if (success) {
    feedbackMessage.text = `Successfully ${
      tradeType.value === 'BUY' ? 'bought' : 'sold'
    } ${quantity.value} shares of ${symbol.value}`
    feedbackMessage.type = 'success'
    quantity.value = 1
  } else {
    feedbackMessage.text = tradeType.value === 'BUY' ? 'Insufficient Funds' : 'Insufficient Shares'
    feedbackMessage.type = 'error'
  }

  setTimeout(() => {
    feedbackMessage.text = ''
  }, 3000)
}
</script>

<template>
  <div class="trade-panel">
    <!-- Header -->
    <header class="trade-header">
      <h2 class="trade-title">Trade {{ symbol }}</h2>
      <div class="live-price">
        <span class="label">Current Price</span>
        <span class="value">{{ formatAsCurrency(currentPrice) }}</span>
      </div>
    </header>

    <!-- Trade Controls -->
    <div class="trade-controls">
      <!-- Buy/Sell Tabs -->
      <div class="tabs">
        <button
          class="tab"
          :class="{ active: tradeType === 'BUY', buy: tradeType === 'BUY' }"
          @click="tradeType = 'BUY'"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="18 15 12 9 6 15"></polyline>
          </svg>
          Buy
        </button>
        <button
          class="tab"
          :class="{ active: tradeType === 'SELL', sell: tradeType === 'SELL' }"
          @click="tradeType = 'SELL'"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
          Sell
        </button>
      </div>

      <!-- Quantity Input -->
      <div class="input-group">
        <label for="quantity-input">Quantity</label>
        <input
          id="quantity-input"
          type="number"
          v-model.number="quantity"
          min="1"
          class="quantity-input"
        />
      </div>

      <!-- Order Summary -->
      <div class="order-summary">
        <div class="row">
          <span>Estimated Cost</span>
          <span class="total">{{ formatAsCurrency(estimatedTotal) }}</span>
        </div>
        <div class="row" v-if="tradeType === 'BUY'">
          <span>Cash Available</span>
          <span class="cash">{{ formatPaiseAsCurrency(portfolioStore.cash) }}</span>
        </div>
        <div class="row" v-if="tradeType === 'SELL'">
          <span>Shares Owned</span>
          <span class="cash">{{ portfolioStore.holdings[symbol]?.quantity ?? 0 }}</span>
        </div>
      </div>

      <!-- Execute Button -->
      <button
        class="execute-btn"
        :class="tradeType === 'BUY' ? 'btn-buy' : 'btn-sell'"
        :disabled="!isValidTrade"
        @click="executeTrade"
      >
        {{ marketStore.connectionStatus !== 'connected' ? 'Offline' : tradeType + ' ' + symbol }}
      </button>

      <!-- Feedback Message -->
      <p v-if="feedbackMessage.text" class="feedback" :class="feedbackMessage.type">
        {{ feedbackMessage.text }}
      </p>
    </div>
  </div>
</template>

<style scoped>
/* ============================================
   TRADE PANEL CONTAINER
   ============================================ */
.trade-panel {
  width: 100%;
  height: 100%;
  background-color: #1e1e1e;
  padding: 1.5rem;
  color: #fff;
  display: flex;
  flex-direction: column;
}

/* Header */
.trade-header {
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #333;
}

.trade-title {
  margin: 0 0 0.75rem 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.live-price {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.95rem;
}

.live-price .label {
  color: #a0a0a0;
}

.live-price .value {
  font-weight: 700;
  font-size: 1.1rem;
  color: #42d392;
}

/* ============================================
   TABS (BUY/SELL)
   ============================================ */
.tabs {
  display: flex;
  background-color: #2a2a2a;
  border-radius: 8px;
  padding: 4px;
  margin-bottom: 1.5rem;
  gap: 4px;
}

.tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: transparent;
  border: none;
  color: #a0a0a0;
  padding: 12px 16px;
  cursor: pointer;
  font-weight: 600;
  font-size: 1rem;
  border-radius: 6px;
  transition: all 0.2s;
  min-height: 48px; /* Touch-friendly */
}

.tab.active.buy {
  background-color: #42d392;
  color: #000;
}

.tab.active.sell {
  background-color: #ff4d4f;
  color: #fff;
}

.tab:not(.active):hover {
  background-color: rgba(255, 255, 255, 0.05);
}

/* ============================================
   INPUT GROUP
   ============================================ */
.input-group {
  margin-bottom: 1.5rem;
}

.input-group label {
  display: block;
  color: #a0a0a0;
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.quantity-input {
  width: 100%;
  padding: 14px 16px;
  background-color: #2a2a2a;
  border: 2px solid #333;
  border-radius: 8px;
  color: #fff;
  font-size: 1.1rem;
  font-weight: 600;
  min-height: 52px; /* Touch-friendly */
  transition: all 0.2s ease;
}

.quantity-input:focus {
  outline: none;
  border-color: #007bff;
  background-color: #252525;
}

/* ============================================
   ORDER SUMMARY
   ============================================ */
.order-summary {
  background-color: #252525;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  border: 1px solid #333;
}

.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  font-size: 0.95rem;
  color: #ccc;
}

.row + .row {
  border-top: 1px solid #333;
}

.row:first-child {
  padding-top: 0;
}

.row:last-child {
  padding-bottom: 0;
}

.total {
  font-weight: 700;
  font-size: 1.1rem;
  color: #fff;
}

.cash {
  font-weight: 600;
  color: #42d392;
}

/* ============================================
   EXECUTE BUTTON
   ============================================ */
.execute-btn {
  width: 100%;
  padding: 16px;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 56px; /* Touch-friendly */
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.execute-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-buy {
  background-color: #42d392;
  color: #000;
}

.btn-buy:not(:disabled):hover {
  background-color: #38c082;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(66, 211, 146, 0.3);
}

.btn-sell {
  background-color: #ff4d4f;
  color: #fff;
}

.btn-sell:not(:disabled):hover {
  background-color: #e63946;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 77, 79, 0.3);
}

.execute-btn:active:not(:disabled) {
  transform: translateY(0);
}

/* ============================================
   FEEDBACK MESSAGE
   ============================================ */
.feedback {
  margin-top: 1rem;
  text-align: center;
  font-size: 0.95rem;
  font-weight: 600;
  padding: 12px;
  border-radius: 8px;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.feedback.success {
  background-color: rgba(66, 211, 146, 0.15);
  color: #42d392;
  border: 1px solid rgba(66, 211, 146, 0.3);
}

.feedback.error {
  background-color: rgba(255, 77, 79, 0.15);
  color: #ff4d4f;
  border: 1px solid rgba(255, 77, 79, 0.3);
}

/* ============================================
   TABLET (641px - 1023px)
   ============================================ */
@media (max-width: 1023px) and (min-width: 641px) {
  .trade-panel {
    padding: 1.25rem;
  }

  .tabs {
    margin-bottom: 1.25rem;
  }
}

/* ============================================
   MOBILE (< 640px)
   ============================================ */
@media (max-width: 640px) {
  .trade-panel {
    padding: 1rem;
  }

  .trade-title {
    font-size: 1.25rem;
  }

  .live-price {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .live-price .value {
    font-size: 1.5rem;
  }

  .tabs {
    padding: 6px;
    margin-bottom: 1.25rem;
  }

  .tab {
    padding: 14px;
    font-size: 1.05rem;
  }

  .quantity-input {
    padding: 16px;
    font-size: 1.2rem;
    min-height: 56px;
  }

  .order-summary {
    padding: 1.25rem;
  }

  .row {
    font-size: 1rem;
    padding: 10px 0;
  }

  .total {
    font-size: 1.25rem;
  }

  .execute-btn {
    padding: 18px;
    font-size: 1.15rem;
    min-height: 60px;
  }
}
</style>