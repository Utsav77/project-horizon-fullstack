<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import * as echarts from 'echarts/core'
import { LineChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

import { useMarketDataStore } from '@/stores/marketDataStore'
import { useUiStore } from '@/stores/uiStore'

echarts.use([
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  LineChart,
  CanvasRenderer,
])

const marketStore = useMarketDataStore()
const uiStore = useUiStore()
const chartDom = ref<HTMLElement | null>(null)
const chartInstance = ref<echarts.ECharts | null>(null)

const chartSymbol = computed(() => uiStore.selectedSymbol)
const currentStockData = computed(() => {
  return marketStore.stocks[chartSymbol.value]
})

const currentStockChange = computed(() => {
  if (!currentStockData.value || !currentStockData.value.history.length) {
    return { percent: 0, absolute: 0 }
  }

  const openPrice = currentStockData.value.history[0]
  const currentPrice = currentStockData.value.price

  if (openPrice === 0) {
    return { percent: 0, absolute: 0 }
  }

  const absolute = currentPrice - openPrice
  const percent = (absolute / openPrice) * 100

  return { percent, absolute }
})

// Initialize chart with responsive configuration
function initChart() {
  if (chartDom.value) {
    chartInstance.value = echarts.init(chartDom.value, 'dark')

    // Responsive grid configuration
    const isMobile = window.innerWidth < 640
    const isTablet = window.innerWidth >= 640 && window.innerWidth < 1024

    chartInstance.value.setOption({
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#2a2a2a',
        borderColor: '#333',
        textStyle: {
          color: '#fff',
          fontSize: isMobile ? 12 : 14
        },
      },
      xAxis: {
        type: 'category',
        data: [],
        axisLine: { lineStyle: { color: '#a0a0a0' } },
        axisLabel: {
          color: '#a0a0a0',
          fontSize: isMobile ? 10 : 12,
          interval: isMobile ? 'auto' : 0
        },
      },
      yAxis: {
        type: 'value',
        scale: true,
        axisLine: { lineStyle: { color: '#a0a0a0' } },
        axisLabel: {
          color: '#a0a0a0',
          fontSize: isMobile ? 10 : 12
        },
        splitLine: { lineStyle: { color: '#333' } },
      },
      series: [
        {
          name: chartSymbol.value,
          data: [],
          type: 'line',
          smooth: true,
          showSymbol: false,
          lineStyle: { color: '#007bff', width: isMobile ? 2 : 3 },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(0, 123, 255, 0.3)' },
                { offset: 1, color: 'rgba(0, 123, 255, 0.05)' }
              ]
            }
          }
        },
      ],
      grid: {
        left: isMobile ? '40px' : '50px',
        right: isMobile ? '10px' : '20px',
        bottom: isMobile ? '30px' : '50px',
        top: isMobile ? '10px' : '20px'
      },
    })
  }
}

// Handle window resize
const handleResize = () => {
  if (chartInstance.value) {
    chartInstance.value.resize()
    // Update grid configuration on resize
    initChart()
  }
}

onMounted(() => {
  initChart()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chartInstance.value?.dispose()
})

// Watch history changes
watch(
  () => marketStore.getStockHistory(chartSymbol.value),
  (newHistory) => {
    if (!chartInstance.value) {
      return
    }

    chartInstance.value.setOption({
      xAxis: {
        data: newHistory.map((_, index) => index),
      },
      series: [
        {
          name: chartSymbol.value,
          data: newHistory,
        },
      ],
    })
  },
  {
    deep: true,
    immediate: true,
  },
)
</script>

<template>
  <div class="chart-view-container">
    <header class="chart-header">
      <div class="asset-info">
        <h2 class="asset-symbol">{{ chartSymbol }}</h2>
        <p class="asset-name">Live Stock Chart</p>
      </div>
      <div class="asset-price">
        <h2 class="current-price">
          {{ currentStockData?.price.toFixed(2) ?? 'Loading...' }}
        </h2>

        <p
          class="price-change"
          :class="currentStockChange.percent >= 0 ? 'text-success' : 'text-danger'"
        >
          {{ currentStockChange.absolute >= 0 ? '+' : '' }}{{ currentStockChange.absolute.toFixed(2) }}
          ({{ currentStockChange.percent >= 0 ? '+' : '' }}{{ currentStockChange.percent.toFixed(2) }}%)
        </p>
      </div>
    </header>

    <div ref="chartDom" class="chart-main"></div>
  </div>
</template>

<style scoped>
/* ============================================
   CHART CONTAINER
   ============================================ */
.chart-view-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background-color: #1e1e1e;
  color: #fff;
  padding: 24px;
  border-radius: 8px;
}

/* Header */
.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.asset-info {
  flex: 1;
  min-width: 200px;
}

.asset-symbol {
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 0.25rem 0;
  letter-spacing: 1px;
}

.asset-name {
  font-size: 1rem;
  color: #a0a0a0;
  margin: 0;
}

.asset-price {
  text-align: right;
  min-width: 150px;
}

.current-price {
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 0.25rem 0;
  font-variant-numeric: tabular-nums;
}

.price-change {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
  font-variant-numeric: tabular-nums;
}

.text-success {
  color: #42d392;
}

.text-danger {
  color: #ff4d4f;
}

/* Chart Element */
.chart-main {
  width: 100%;
  height: 450px;
  background-color: #1e1e1e;
  border-radius: 8px;
  margin-bottom: 1rem;
}

/* ============================================
   TABLET (641px - 1023px)
   ============================================ */
@media (max-width: 1023px) and (min-width: 641px) {
  .chart-view-container {
    padding: 20px;
  }

  .chart-main {
    height: 380px;
  }

  .asset-symbol {
    font-size: 1.75rem;
  }

  .current-price {
    font-size: 1.75rem;
  }
}

/* ============================================
   MOBILE (< 640px)
   ============================================ */
@media (max-width: 640px) {
  .chart-view-container {
    padding: 16px;
  }

  .chart-header {
    flex-direction: column;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .asset-price {
    text-align: left;
    width: 100%;
  }

  .asset-symbol {
    font-size: 1.5rem;
  }

  .asset-name {
    font-size: 0.875rem;
  }

  .current-price {
    font-size: 1.75rem;
  }

  .price-change {
    font-size: 0.95rem;
  }

  .chart-main {
    height: 300px;
    margin-bottom: 0.5rem;
  }
}

/* ============================================
   LANDSCAPE MOBILE
   ============================================ */
@media (max-height: 640px) and (orientation: landscape) {
  .chart-main {
    height: 250px;
  }

  .chart-header {
    margin-bottom: 0.75rem;
  }
}
</style>