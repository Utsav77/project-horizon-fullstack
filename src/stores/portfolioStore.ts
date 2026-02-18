import { defineStore } from 'pinia'
import { useMarketDataStore } from './marketDataStore'
import { validateTrade, isValidationError } from '@/utils/validation'

// ============================================
// TYPE DEFINITIONS
// ============================================

// 1. Define the shape of a single holding
export interface Holding {
  symbol: string
  quantity: number
  // We can add average cost basis later if we want to track profit/loss per trade
}

// 2. Define the shape of our portfolio state
export interface PortfolioState {
  cash: number // This will now be in paise
  holdings: Record<string, Holding>
  error: string | null // Add error state for validation failures
  isLoading: boolean // Add loading state
}

// ============================================
// STORE DEFINITION
// ============================================

export const usePortfolioStore = defineStore('portfolio', {
  state: (): PortfolioState => ({
    // Store ₹10,000.00 as 1,000,000 paise
    cash: 1000000,
    holdings: {},
    error: null,
    isLoading: false,
  }),

  getters: {
    // This getter now returns an integer (paise)
    totalHoldingsValue(state): number {
      const marketStore = useMarketDataStore()

      return Object.values(state.holdings).reduce((total, holding) => {
        const currentPrice = marketStore.stocks[holding.symbol]?.price ?? 0
        // Convert price to paise for calculation
        const priceInPaise = Math.round(currentPrice * 100)
        return total + holding.quantity * priceInPaise
      }, 0)
    },

    // This getter also returns an integer (paise)
    totalPortfolioValue(state): number {
      return state.cash + this.totalHoldingsValue
    },

    /**
     * Get holdings as an array for easier iteration in components
     */
    holdingsArray(state): Holding[] {
      return Object.values(state.holdings)
    },
  },

  actions: {
    /**
     * BUY Action with Validation
     *
     * @param symbol - Stock symbol (e.g., 'AAPL')
     * @param quantity - Number of shares to buy
     * @param currentPrice - Current price in rupees (will be converted to paise)
     * @returns true if successful, false otherwise
     */
    buyStock(symbol: string, quantity: number, currentPrice: number): boolean {
      // Reset error state
      this.error = null
      this.isLoading = true

      try {
        // Convert price to paise for validation and calculation
        const priceInPaise = Math.round(currentPrice * 100)

        // ✅ STEP 1: Validate inputs
        // This will throw ValidationError if invalid
        validateTrade(symbol, quantity, priceInPaise)

        // ✅ STEP 2: Business logic validation
        const costInPaise = priceInPaise * quantity

        if (costInPaise > this.cash) {
          this.error = `Insufficient funds. Required: ₹${(costInPaise / 100).toFixed(2)}, Available: ₹${(this.cash / 100).toFixed(2)}`
          console.error('Trade failed: Insufficient funds.')
          return false
        }

        // ✅ STEP 3: Execute trade
        this.cash -= costInPaise

        if (this.holdings[symbol]) {
          this.holdings[symbol].quantity += quantity
        } else {
          this.holdings[symbol] = {
            symbol: symbol,
            quantity: quantity,
          }
        }

        console.log(
          `✅ Buy successful: ${quantity} shares of ${symbol} at ₹${currentPrice.toFixed(2)} (₹${(costInPaise / 100).toFixed(2)} total)`,
        )
        return true
      } catch (error) {
        // Handle validation errors
        if (isValidationError(error)) {
          this.error = error.message
          console.error('❌ Validation error:', error.message)
        } else if (error instanceof Error) {
          this.error = error.message
          console.error('❌ Error:', error.message)
        } else {
          this.error = 'An unknown error occurred'
          console.error('❌ Unknown error:', error)
        }
        return false
      } finally {
        this.isLoading = false
      }
    },

    /**
     * SELL Action with Validation
     *
     * Validates ownership and updates cash/holdings.
     *
     * @param symbol - Stock symbol (e.g., 'AAPL')
     * @param quantity - Number of shares to sell
     * @param currentPrice - Current price in rupees (will be converted to paise)
     * @returns true if successful, false otherwise
     */
    sellStock(symbol: string, quantity: number, currentPrice: number): boolean {
      // Reset error state
      this.error = null
      this.isLoading = true

      try {
        // Convert price to paise for validation and calculation
        const priceInPaise = Math.round(currentPrice * 100)

        // ✅ STEP 1: Validate inputs
        // This will throw ValidationError if invalid
        validateTrade(symbol, quantity, priceInPaise)

        // ✅ STEP 2: Business logic validation
        // Check 1: Do we own this stock?
        if (!this.holdings[symbol]) {
          this.error = `You don't own any shares of ${symbol}`
          console.error('Trade failed: Stock not held.')
          return false
        }

        // Check 2: Do we have enough shares?
        if (quantity > this.holdings[symbol].quantity) {
          this.error = `Insufficient shares. You own ${this.holdings[symbol].quantity} shares of ${symbol}`
          console.error('Trade failed: Not enough shares to sell.')
          return false
        }

        // ✅ STEP 3: Execute Trade
        const proceedsInPaise = priceInPaise * quantity
        this.cash += proceedsInPaise
        this.holdings[symbol].quantity -= quantity

        // Remove holding if quantity reaches zero
        if (this.holdings[symbol].quantity === 0) {
          delete this.holdings[symbol]
        }

        console.log(
          `✅ Sell successful: ${quantity} shares of ${symbol} at ₹${currentPrice.toFixed(2)} (₹${(proceedsInPaise / 100).toFixed(2)} total)`,
        )
        return true
      } catch (error) {
        // Handle validation errors
        if (isValidationError(error)) {
          this.error = error.message
          console.error('❌ Validation error:', error.message)
        } else if (error instanceof Error) {
          this.error = error.message
          console.error('❌ Error:', error.message)
        } else {
          this.error = 'An unknown error occurred'
          console.error('❌ Unknown error:', error)
        }
        return false
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Clear error message
     */
    clearError(): void {
      this.error = null
    },

    /**
     * Reset portfolio to initial state (useful for testing)
     */
    resetPortfolio(): void {
      this.cash = 1000000
      this.holdings = {}
      this.error = null
      this.isLoading = false
    },
  },
})
