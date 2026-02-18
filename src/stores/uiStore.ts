// src/stores/uiStore.ts
import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useUiStore = defineStore('ui', () => {
  // --- STATE ---
  // Set a default selected stock
  const selectedSymbol = ref('INFY')

  // --- ACTIONS ---
  function selectSymbol(symbol: string) {
    selectedSymbol.value = symbol
  }

  return { selectedSymbol, selectSymbol }
})
