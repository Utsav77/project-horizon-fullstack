import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useMarketDataStore } from '../marketDataStore'

describe('Market Data Store', () => {
  let store: ReturnType<typeof useMarketDataStore>

  // Setup a new store before each test
  beforeEach(() => {
    setActivePinia(createPinia())
    store = useMarketDataStore()
  })

  // Test 1: Initial State
  it('should have correct initial state', () => {
    expect(store.stocks).toEqual({})
    expect(store.connectionStatus).toBe('connecting')
  })

  // Test 2: `setConnectionStatus` Action
  it('should correctly set the connection status', () => {
    store.setConnectionStatus('connected')
    expect(store.connectionStatus).toBe('connected')

    store.setConnectionStatus('disconnected')
    expect(store.connectionStatus).toBe('disconnected')

    store.setConnectionStatus('failed')
    expect(store.connectionStatus).toBe('failed')
  })

  // Test 3: `processIncomingMessage` (New Stock)
  it('should process a message for a new stock', () => {
    const msg = { symbol: 'INFY', price: 1500 }
    store.processIncomingMessage(msg)

    expect(store.stocks['INFY']).toBeDefined()
    expect(store.stocks['INFY'].price).toBe(1500)
    expect(store.stocks['INFY'].history).toEqual([1500])
  })

  // Test 4: `processIncomingMessage` (Update Existing Stock)
  it('should process a message for an existing stock', () => {
    store.processIncomingMessage({ symbol: 'INFY', price: 1500 })
    store.processIncomingMessage({ symbol: 'INFY', price: 1501 })

    expect(store.stocks['INFY'].price).toBe(1501)
    expect(store.stocks['INFY'].history).toEqual([1500, 1501])
  })

  // Test 5: `processIncomingMessage` (Sliding History Window)
  it('should maintain the history array length at 50 (MAX_HISTORY_LENGTH)', () => {
    const MAX_HISTORY_LENGTH = 50
    // Send 55 messages
    for (let i = 1; i <= 55; i++) {
      store.processIncomingMessage({ symbol: 'TCS', price: 3800 + i })
    }

    expect(store.stocks['TCS'].history).toBeDefined()
    // Check that the array was capped at 50
    expect(store.stocks['TCS'].history.length).toBe(MAX_HISTORY_LENGTH)
    // Check that the *first* item is 3806 (price 3801-3805 were shifted off)
    expect(store.stocks['TCS'].history[0]).toBe(3800 + 6)
    // Check that the *last* item is the latest price
    expect(store.stocks['TCS'].history[MAX_HISTORY_LENGTH - 1]).toBe(3800 + 55)
    expect(store.stocks['TCS'].price).toBe(3800 + 55)
  })

  // Test 6: `getStockHistory` Getter
  it('should return correct history with getStockHistory', () => {
    store.processIncomingMessage({ symbol: 'INFY', price: 1500 })
    store.processIncomingMessage({ symbol: 'INFY', price: 1501 })

    expect(store.getStockHistory('INFY')).toEqual([1500, 1501])
    expect(store.getStockHistory('TCS')).toEqual([]) // Test for empty
  })

  // Test 7: `stocksAsArray` Getter (Change Percentage)
  it('should correctly calculate changePercent in stocksAsArray', () => {
    // Setup state
    store.processIncomingMessage({ symbol: 'INFY', price: 100 }) // openPrice = 100
    store.processIncomingMessage({ symbol: 'INFY', price: 110 }) // currentPrice = 110
    store.processIncomingMessage({ symbol: 'TCS', price: 200 }) // openPrice = 200
    store.processIncomingMessage({ symbol: 'TCS', price: 190 }) // currentPrice = 190

    const arr = store.stocksAsArray

    const infy = arr.find((s) => s.symbol === 'INFY')
    const tcs = arr.find((s) => s.symbol === 'TCS')

    expect(infy).toBeDefined()
    expect(tcs).toBeDefined()

    // (110 - 100) / 100 * 100 = 10%
    expect(infy?.price).toBe(110)
    expect(infy?.changePercent).toBe(10)

    // (190 - 200) / 200 * 100 = -5%
    expect(tcs?.price).toBe(190)
    expect(tcs?.changePercent).toBe(-5)
  })

  // Test 8: `stocksAsArray` Getter (Zero Open Price)
  it('should handle zero open price in changePercent calculation', () => {
    // This simulates an edge case
    store.$state.stocks['ZERO'] = { price: 10, history: [0, 10] }

    const arr = store.stocksAsArray
    const zero = arr.find((s) => s.symbol === 'ZERO')

    expect(zero).toBeDefined()
    expect(zero?.changePercent).toBe(0) // Should not divide by zero
  })
})
