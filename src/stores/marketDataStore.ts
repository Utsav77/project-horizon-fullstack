import { defineStore } from 'pinia'

export interface StockData {
  price: number
  history: number[]
}

export interface MarketDataState {
  stocks: Record<string, StockData>
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'failed'
}

export const useMarketDataStore = defineStore('marketData', {
  state: (): MarketDataState => ({
    stocks: {},
    connectionStatus: 'connecting',
  }),

  actions: {
    processIncomingMessage(data: { symbol: string; price: number }) {
      const { symbol, price } = data

      if (!this.stocks[symbol]) {
        this.stocks[symbol] = {
          price: price,
          history: [price],
        }
      } else {
        this.stocks[symbol].price = price
        this.stocks[symbol].history.push(price)
        if (this.stocks[symbol].history.length > 50) {
          // MAX_HISTORY_LENGTH
          this.stocks[symbol].history.shift()
        }
      }
    },

    // 3. Add action to update status
    setConnectionStatus(status: 'connecting' | 'connected' | 'disconnected' | 'failed') {
      this.connectionStatus = status
    },
  },

  getters: {
    getStock: (state) => {
      return (symbol: string): StockData | undefined => state.stocks[symbol]
    },
    getStockHistory: (state) => {
      return (symbol: string): number[] => {
        return state.stocks[symbol]?.history || []
      }
    },

    // This transforms our state object into an array for components like TickerBar
    stocksAsArray: (state) => {
      return Object.entries(state.stocks).map(([symbol, data]) => {
        const openPrice = data.history[0] ?? 0
        const currentPrice = data.price
        let changePercent = 0

        if (openPrice > 0) {
          changePercent = ((currentPrice - openPrice) / openPrice) * 100
        }

        return {
          symbol: symbol,
          price: data.price,
          changePercent: changePercent,
        }
      })
    },

    // 4. Helper getter
    isConnected: (state) => state.connectionStatus === 'connected',
  },
})
