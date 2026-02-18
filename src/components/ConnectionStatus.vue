<script setup lang="ts">
import { useMarketDataStore } from '@/stores/marketDataStore'
import { computed } from 'vue'

const marketStore = useMarketDataStore()

const status = computed(() => marketStore.connectionStatus)
const message = computed(() => {
  switch (status.value) {
    case 'connecting':
      return 'Connecting to market data...'
    case 'disconnected':
      return 'Connection lost. Attempting to reconnect...'
    case 'failed':
      return 'Failed to connect to market data. Please refresh the page.'
    default:
      return ''
  }
})

const bannerClass = computed(() => {
  switch (status.value) {
    case 'connecting':
      return 'is-connecting'
    case 'disconnected':
      return 'is-disconnected'
    case 'failed':
      return 'is-failed'
    default:
      return ''
  }
})

const icon = computed(() => {
  switch (status.value) {
    case 'connecting':
      return '🔄'
    case 'disconnected':
      return '⚠️'
    case 'failed':
      return '🛑' // Stop sign icon
    default:
      return ''
  }
})
</script>

<template>
  <Transition name="slide-down">
    <div v-if="status !== 'connected'" class="status-banner" :class="bannerClass">
      <span class="icon">{{ icon }}</span>
      {{ message }}
    </div>
  </Transition>
</template>

<style scoped>
.status-banner {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  padding: 8px;
  text-align: center;
  font-size: 0.9rem;
  font-weight: 600;
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
}

.is-disconnected {
  background-color: #ff4d4f; /* Red */
  color: white;
}

.is-connecting {
  background-color: #e6a23c; /* Orange/Yellow */
  color: white;
}

.is-failed {
  background-color: #b30000; /* Darker, more permanent red */
  color: white;
}

.icon {
  font-size: 1.1rem;
}

/* Vue Transition Styles */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: transform 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  transform: translateY(-100%);
}
</style>
