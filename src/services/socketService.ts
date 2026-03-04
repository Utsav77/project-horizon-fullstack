import { io, Socket } from 'socket.io-client'
import { useAuthStore } from '@/stores/authStore'
import { useMarketDataStore } from '@/stores/marketDataStore'

class SocketService {
  private socket: Socket | null = null
  private subscribedSymbols: Set<string> = new Set()

  connect(): void {
    if (this.socket?.connected) return

    const authStore = useAuthStore()

    this.socket = io(import.meta.env.VITE_WS_URL, {
      auth: { token: authStore.accessToken },
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000,
    })

    this.socket.on('connect', () => {
      console.log('Socket.io connected')
      const marketStore = useMarketDataStore()
      marketStore.setConnectionStatus('connected')

      // Resubscribe to symbols after reconnection
      this.subscribedSymbols.forEach((symbol) => {
        this.socket?.emit('subscribe', { symbol })
      })
    })

    this.socket.on('disconnect', () => {
      console.log('Socket.io disconnected')
      const marketStore = useMarketDataStore()
      marketStore.setConnectionStatus('disconnected')
    })

    this.socket.on('connect_error', (err) => {
      console.error('Socket.io connection error:', err.message)
      const marketStore = useMarketDataStore()
      marketStore.setConnectionStatus('failed')
    })

    this.socket.on('price_update', (quote: { symbol: string; price: number }) => {
      const marketStore = useMarketDataStore()
      marketStore.processIncomingMessage({
        symbol: quote.symbol,
        price: quote.price,
      })
    })
  }

  subscribe(symbol: string): void {
    this.subscribedSymbols.add(symbol)
    this.socket?.emit('subscribe', { symbol })
  }

  unsubscribe(symbol: string): void {
    this.subscribedSymbols.delete(symbol)
    this.socket?.emit('unsubscribe', { symbol })
  }

  disconnect(): void {
    this.subscribedSymbols.clear()
    this.socket?.disconnect()
    this.socket = null
  }

  get isConnected(): boolean {
    return this.socket?.connected ?? false
  }
}

// Singleton — one socket for the entire app
export const socketService = new SocketService()
