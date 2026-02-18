import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePortfolioStore } from '../portfolioStore'
// import { useMarketDataStore } from '../marketDataStore'

// --- The Mock ---
// We are faking the marketDataStore.
// Our portfolio store's getters NEED market data to work.
// We provide a simple, static version of its state here.
vi.mock('@/stores/marketDataStore', () => ({
  useMarketDataStore: () => ({
    stocks: {
      INFY: { price: 1500.0 },
      TCS: { price: 3800.0 },
    },
  }),
}))

describe('Portfolio Store', () => {
  // This is crucial: it creates a new, fresh Pinia instance
  // for every single test, so they don't share state.
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  // Test 1: Initial State
  it('should have correct initial state', () => {
    const store = usePortfolioStore()
    // Remember, we store in paise!
    expect(store.cash).toBe(1000000)
    expect(store.holdings).toEqual({})
  })

  // Test 2: Successful Buy
  it('should successfully buy a stock', () => {
    const store = usePortfolioStore()
    const price = 1500.0 // ₹1500.00
    const quantity = 2
    const costInPaise = 150000 * 2 // 300,000 paise

    const success = store.buyStock('INFY', quantity, price)

    expect(success).toBe(true)
    // Cash should be initial (1M) minus cost (300k)
    expect(store.cash).toBe(1000000 - costInPaise)
    expect(store.holdings['INFY'].quantity).toBe(2)
  })

  // Test 3: Failed Buy (Insufficient Funds)
  it('should fail to buy stock with insufficient funds', () => {
    const store = usePortfolioStore()
    const price = 1500.0 // ₹1500.00
    const quantity = 100 // Cost = 15,000,000 (we only have 1,000,000)

    const success = store.buyStock('INFY', quantity, price)

    expect(success).toBe(false)
    // State should not have changed
    expect(store.cash).toBe(1000000)
    expect(store.holdings['INFY']).toBeUndefined()
  })

  // Test 4: Successful Sell
  it('should successfully sell a stock', () => {
    const store = usePortfolioStore()
    // Setup: Give the user some stock to sell
    store.holdings['INFY'] = { symbol: 'INFY', quantity: 10 }
    store.cash = 0 // Set cash to 0 for a clean calculation

    const price = 1500.0
    const quantity = 5
    const proceedsInPaise = 150000 * 5 // 750,000 paise

    const success = store.sellStock('INFY', quantity, price)

    expect(success).toBe(true)
    expect(store.cash).toBe(proceedsInPaise)
    expect(store.holdings['INFY'].quantity).toBe(5) // 10 - 5
  })

  // Test 5: Failed Sell (Not Enough Shares)
  it('should fail to sell with insufficient shares', () => {
    const store = usePortfolioStore()
    // Setup: Give the user 10 shares
    store.holdings['INFY'] = { symbol: 'INFY', quantity: 10 }
    store.cash = 1000000

    const price = 1500.0
    const quantity = 20 // Try to sell 20

    const success = store.sellStock('INFY', quantity, price)

    expect(success).toBe(false)
    // State should not have changed
    expect(store.cash).toBe(1000000)
    expect(store.holdings['INFY'].quantity).toBe(10)
  })

  // Test 6: Failed Sell (Stock Not Held)
  it('should fail to sell a stock the user does not own', () => {
    const store = usePortfolioStore()
    const success = store.sellStock('TCS', 10, 3800.0)
    expect(success).toBe(false)
  })

  // Test 7: `totalHoldingsValue` Getter (Tests the mock)
  it('should correctly calculate total holdings value from mocked market data', () => {
    const store = usePortfolioStore()
    // Setup: Give the user 10 INFY and 5 TCS
    store.holdings['INFY'] = { symbol: 'INFY', quantity: 10 } // 10 * 150000 = 1,500,000
    store.holdings['TCS'] = { symbol: 'TCS', quantity: 5 } // 5 * 380000 = 1,900,000

    // The getter reads from our MOCK store.
    expect(store.totalHoldingsValue).toBe(1500000 + 1900000)
    expect(store.totalHoldingsValue).toBe(3400000)
  })

  // Test 8: `totalPortfolioValue` Getter
  it('should correctly calculate total portfolio value', () => {
    const store = usePortfolioStore()
    store.cash = 1000000
    store.holdings['INFY'] = { symbol: 'INFY', quantity: 10 } // 1,500,000 from mock

    // 1,000,000 (cash) + 1,500,000 (holdings)
    expect(store.totalPortfolioValue).toBe(2500000)
  })
})
