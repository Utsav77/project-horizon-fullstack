import { onMounted, onUnmounted } from 'vue'
import { useMarketDataStore } from '@/stores/marketDataStore'

// Define the shape of the data we EXPECT from the server
export interface StockMessagePayload {
  symbol: string
  price: number
  timestamp: number
}

// Helper interface for the raw WebSocket message
export interface WebSocketMessage {
  type: string
  payload: StockMessagePayload
}

// Connection configuration interface
export interface WebSocketConfig {
  url?: string
  baseReconnectDelay?: number
  maxReconnectDelay?: number
  maxReconnectAttempts?: number
}

// ✅ SECURITY: Get WebSocket URL from environment variable
const getWebSocketUrl = (): string => {
  const envUrl = import.meta.env.VITE_WS_URL

  // Validate that environment variable exists
  if (!envUrl) {
    const errorMsg =
      '❌ VITE_WS_URL is not defined in environment variables.\n' +
      'Please check your .env file and ensure VITE_WS_URL is set.\n' +
      'Example: VITE_WS_URL=ws://localhost:8080'

    console.error(errorMsg)
    throw new Error('WebSocket URL not configured. Check environment variables.')
  }

  // Validate WebSocket URL format
  if (!envUrl.startsWith('ws://') && !envUrl.startsWith('wss://')) {
    const errorMsg =
      `❌ Invalid WebSocket URL format: ${envUrl}\n` + 'URL must start with "ws://" or "wss://"'

    console.error(errorMsg)
    throw new Error('Invalid WebSocket URL format')
  }

  // Log in development mode only
  if (import.meta.env.DEV) {
    console.log(`🔌 Using WebSocket URL: ${envUrl}`)
  }

  return envUrl
}

// Default reconnection configuration
const DEFAULT_CONFIG = {
  baseReconnectDelay: 1000, // 1 second
  maxReconnectDelay: 30000, // 30 seconds
  maxReconnectAttempts: 10, // Maximum retry attempts
}

// ============================================
// COMPOSABLE
// ============================================

/**
 * Composable for managing WebSocket connection with automatic reconnection
 *
 * Features:
 * - Environment-based URL configuration
 * - Exponential backoff with jitter
 * - Max reconnection attempts
 * - Proper cleanup on unmount
 * - Connection status tracking
 *
 * @param config - Optional configuration overrides
 */
export function useWebSocket(config: WebSocketConfig = {}) {
  const marketDataStore = useMarketDataStore()

  // Get URL from environment or config override (for testing)
  const url = config.url || getWebSocketUrl()

  // Merge config with defaults
  const {
    baseReconnectDelay = DEFAULT_CONFIG.baseReconnectDelay,
    maxReconnectDelay = DEFAULT_CONFIG.maxReconnectDelay,
    maxReconnectAttempts = DEFAULT_CONFIG.maxReconnectAttempts,
  } = config

  // ============================================
  // STATE
  // ============================================

  let socket: WebSocket | null = null
  let reconnectAttempts = 0
  let reconnectTimer: number | null = null
  let shouldReconnect = true

  // ============================================
  // HELPER FUNCTIONS
  // ============================================

  /**
   * Calculate reconnection delay with exponential backoff and jitter
   */
  const calculateReconnectDelay = (): number => {
    const exponentialDelay = Math.min(
      baseReconnectDelay * Math.pow(2, reconnectAttempts),
      maxReconnectDelay,
    )

    // Add jitter (randomness) to prevent thundering herd
    const jitter = Math.random() * 1500
    return exponentialDelay + jitter
  }

  /**
   * Log connection attempts (only in development)
   */
  const logReconnectAttempt = (delayMs: number): void => {
    if (import.meta.env.DEV) {
      console.log(
        `🔄 Reconnect attempt #${reconnectAttempts + 1}/${maxReconnectAttempts} ` +
          `in ${(delayMs / 1000).toFixed(1)}s...`,
      )
    }
  }

  // ============================================
  // WEBSOCKET HANDLERS
  // ============================================

  const handleOpen = (): void => {
    console.log('✅ WebSocket connection established.')
    marketDataStore.setConnectionStatus('connected')
    reconnectAttempts = 0 // Reset attempts on successful connection
  }

  const handleMessage = (event: MessageEvent): void => {
    try {
      const message: WebSocketMessage = JSON.parse(event.data)

      // Handle different message types
      if (message.type === 'stock_update') {
        marketDataStore.processIncomingMessage({
          symbol: message.payload.symbol,
          price: message.payload.price,
        })
      }
      // Add more message type handlers here as needed
    } catch (error) {
      console.error('❌ Error parsing WebSocket message:', error)

      // Log the raw message in development for debugging
      if (import.meta.env.DEV) {
        console.error('Raw message data:', event.data)
      }
    }
  }

  const handleError = (error: Event): void => {
    console.error('❌ WebSocket Error:', error)
    // Error details are handled in onclose
  }

  const handleClose = (): void => {
    console.log('ℹ️ WebSocket connection closed.')
    socket = null // Clear the socket reference

    // Check if this was an intentional disconnect
    if (!shouldReconnect) {
      console.log('ℹ️ Intentional disconnect. Not reconnecting.')
      marketDataStore.setConnectionStatus('disconnected')
      return
    }

    // Check if max reconnection attempts reached
    if (reconnectAttempts >= maxReconnectAttempts) {
      console.error(
        `🛑 Max reconnect attempts (${maxReconnectAttempts}) reached. ` +
          'Connection failed permanently.',
      )
      marketDataStore.setConnectionStatus('failed')
      return
    }

    // Update status to disconnected
    marketDataStore.setConnectionStatus('disconnected')

    // Calculate delay with exponential backoff and jitter
    const reconnectDelay = calculateReconnectDelay()
    logReconnectAttempt(reconnectDelay)

    // Increment attempts for next retry
    reconnectAttempts++

    // Schedule reconnection
    reconnectTimer = setTimeout(connect, reconnectDelay) as unknown as number
  }

  // ============================================
  // CONNECTION MANAGEMENT
  // ============================================

  /**
   * Establish WebSocket connection
   */
  const connect = (): void => {
    // Clear any existing reconnection timer
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }

    // Log connection attempt
    if (import.meta.env.DEV) {
      console.log(`🔌 Attempting to connect to ${url}...`)
    }

    marketDataStore.setConnectionStatus('connecting')

    try {
      // Create new WebSocket connection
      socket = new WebSocket(url)

      // Attach event handlers
      socket.onopen = handleOpen
      socket.onmessage = handleMessage
      socket.onerror = handleError
      socket.onclose = handleClose
    } catch (error) {
      console.error('❌ Failed to create WebSocket connection:', error)
      marketDataStore.setConnectionStatus('failed')
    }
  }

  /**
   * Intentionally disconnect WebSocket (prevents auto-reconnect)
   */
  const disconnect = (): void => {
    if (import.meta.env.DEV) {
      console.log('ℹ️ Disconnecting WebSocket intentionally...')
    }

    // Disable auto-reconnect
    shouldReconnect = false

    // Clear reconnection timer
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }

    // Close socket if exists
    if (socket) {
      // Remove onclose handler to prevent reconnection logic
      socket.onclose = null
      socket.close()
      socket = null
    }

    // Update store status
    marketDataStore.setConnectionStatus('disconnected')
  }

  /**
   * Manually trigger reconnection (useful for retry buttons)
   */
  const reconnect = (): void => {
    if (import.meta.env.DEV) {
      console.log('🔄 Manual reconnection triggered...')
    }

    // Reset reconnection state
    shouldReconnect = true
    reconnectAttempts = 0

    // Close existing connection if any
    if (socket) {
      socket.onclose = null
      socket.close()
      socket = null
    }

    // Clear any pending reconnection
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }

    // Initiate new connection
    connect()
  }

  // ============================================
  // LIFECYCLE HOOKS
  // ============================================

  onMounted(() => {
    shouldReconnect = true
    connect()
  })

  onUnmounted(() => {
    disconnect()
  })

  // ============================================
  // RETURN PUBLIC API
  // ============================================

  return {
    connect,
    disconnect,
    reconnect,
    // Expose socket status for debugging (read-only)
    get isConnected() {
      return socket?.readyState === WebSocket.OPEN
    },
    get connectionState() {
      return marketDataStore.connectionStatus
    },
  }
}
