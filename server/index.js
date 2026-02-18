// server/index.js
import { WebSocketServer } from 'ws'

// ============================================
// CONFIGURATION
// ============================================

// ✅ Use environment variable for port (Render provides PORT automatically)
const PORT = process.env.PORT || 8080
const PRICE_UPDATE_INTERVAL = 1000 // 1 second

// ============================================
// STOCK DATA (15 Stocks - Added 10 more)
// ============================================

// Indian stock market stocks with base prices
const stocks = {
  RELIANCE: { symbol: 'RELIANCE', price: 2850.0, basePrice: 2850.0 },
  TCS: { symbol: 'TCS', price: 3800.0, basePrice: 3800.0 },
  HDFCBANK: { symbol: 'HDFCBANK', price: 1500.0, basePrice: 1500.0 },
  INFY: { symbol: 'INFY', price: 1600.0, basePrice: 1600.0 },
  ICICIBANK: { symbol: 'ICICIBANK', price: 950.0, basePrice: 950.0 },
  SBIN: { symbol: 'SBIN', price: 780.0, basePrice: 780.0 },
  BHARTIARTL: { symbol: 'BHARTIARTL', price: 1580.0, basePrice: 1580.0 },
  ITC: { symbol: 'ITC', price: 465.0, basePrice: 465.0 },
  HINDUNILVR: { symbol: 'HINDUNILVR', price: 2385.0, basePrice: 2385.0 },
  KOTAKBANK: { symbol: 'KOTAKBANK', price: 1720.0, basePrice: 1720.0 },
  AXISBANK: { symbol: 'AXISBANK', price: 1085.0, basePrice: 1085.0 },
  LT: { symbol: 'LT', price: 3650.0, basePrice: 3650.0 },
  MARUTI: { symbol: 'MARUTI', price: 12500.0, basePrice: 12500.0 },
  WIPRO: { symbol: 'WIPRO', price: 575.0, basePrice: 575.0 },
  SUNPHARMA: { symbol: 'SUNPHARMA', price: 1685.0, basePrice: 1685.0 },
}

// ============================================
// WEBSOCKET SERVER SETUP
// ============================================

const wss = new WebSocketServer({
  port: PORT,
  // ✅ Verify client origin (for security)
  verifyClient: (info) => {
    // Log connection attempts
    console.log(`📡 Connection attempt from: ${info.origin || 'unknown origin'}`)

    // In production, you could validate specific origins here
    // For now, accept all connections
    return true
  },
})

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Update stock prices with realistic random fluctuations
 * Keeps prices within ±20% of base price
 */
function updateStockPrices() {
  Object.keys(stocks).forEach((symbol) => {
    const stock = stocks[symbol]

    // Random change between -0.5% and +0.5%
    const changePercent = (Math.random() - 0.5) * 0.01
    const newPrice = stock.price * (1 + changePercent)

    // Keep price within ±20% of base price
    stock.price = Math.max(
      stock.basePrice * 0.8, // Minimum: 20% below base
      Math.min(
        stock.basePrice * 1.2, // Maximum: 20% above base
        newPrice,
      ),
    )

    // Round to 2 decimal places
    stock.price = parseFloat(stock.price.toFixed(2))
  })
}

/**
 * Broadcast stock updates to all connected clients
 */
function broadcastStockUpdates() {
  // Update prices first
  updateStockPrices()

  // Send updates to each connected client
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      // WebSocket.OPEN
      // Send all stock prices
      Object.values(stocks).forEach((stock) => {
        const message = {
          type: 'stock_update',
          payload: {
            symbol: stock.symbol,
            price: stock.price,
            timestamp: Date.now(),
          },
        }

        try {
          client.send(JSON.stringify(message))
        } catch (error) {
          console.error(`❌ Error sending to client:`, error.message)
        }
      })
    }
  })
}

// ============================================
// CONNECTION HANDLERS
// ============================================

wss.on('connection', (ws, req) => {
  const clientIp = req.socket.remoteAddress
  const clientOrigin = req.headers.origin || 'unknown'

  console.log(`✅ New client connected`)
  console.log(`   IP: ${clientIp}`)
  console.log(`   Origin: ${clientOrigin}`)
  console.log(`   Total clients: ${wss.clients.size}`)

  // Send initial stock prices immediately upon connection
  Object.values(stocks).forEach((stock) => {
    const message = {
      type: 'stock_update',
      payload: {
        symbol: stock.symbol,
        price: stock.price,
        timestamp: Date.now(),
      },
    }

    try {
      ws.send(JSON.stringify(message))
    } catch (error) {
      console.error(`❌ Error sending initial data:`, error.message)
    }
  })

  // Handle messages from client (optional, for future features)
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString())
      console.log(`📩 Received from client:`, data)

      // You could add features here like:
      // - Subscribe to specific stocks
      // - Request historical data
      // - etc.
    } catch (error) {
      console.error(`❌ Error parsing client message:`, error.message)
    }
  })

  // Handle client disconnect
  ws.on('close', () => {
    console.log(`❌ Client disconnected`)
    console.log(`   Total clients: ${wss.clients.size}`)
  })

  // Handle errors
  ws.on('error', (error) => {
    console.error(`❌ WebSocket error:`, error.message)
  })
})

// ============================================
// SERVER ERROR HANDLING
// ============================================

wss.on('error', (error) => {
  console.error(`🔥 WebSocket Server Error:`, error)
})

// ============================================
// START PRICE BROADCASTING
// ============================================

// Broadcast updates to all clients every second
const broadcastInterval = setInterval(() => {
  if (wss.clients.size > 0) {
    broadcastStockUpdates()
  }
}, PRICE_UPDATE_INTERVAL)

// ============================================
// SERVER STARTUP
// ============================================

console.log('========================================')
console.log('🚀 WebSocket Server Started')
console.log('========================================')
console.log(`📡 Port: ${PORT}`)
console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`)
console.log(`🔗 Local URL: ws://localhost:${PORT}`)
console.log(`📊 Total Stocks: ${Object.keys(stocks).length}`) // Updated to show count
console.log(`📈 Stocks: ${Object.keys(stocks).join(', ')}`)
console.log(`⏱️  Update Interval: ${PRICE_UPDATE_INTERVAL}ms`)
console.log('========================================')
console.log('Waiting for connections...')
console.log('')

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

/**
 * Handle graceful shutdown on SIGTERM (Render sends this when redeploying)
 */
process.on('SIGTERM', () => {
  console.log('')
  console.log('========================================')
  console.log('⚠️  SIGTERM signal received')
  console.log('Closing WebSocket server gracefully...')
  console.log('========================================')

  // Stop broadcasting
  clearInterval(broadcastInterval)

  // Close all client connections
  wss.clients.forEach((client) => {
    client.close()
  })

  // Close the server
  wss.close(() => {
    console.log('✅ WebSocket server closed successfully')
    process.exit(0)
  })

  // Force shutdown after 10 seconds if graceful shutdown fails
  setTimeout(() => {
    console.error('❌ Forced shutdown after timeout')
    process.exit(1)
  }, 10000)
})

/**
 * Handle SIGINT (Ctrl+C in development)
 */
process.on('SIGINT', () => {
  console.log('')
  console.log('========================================')
  console.log('⚠️  SIGINT signal received (Ctrl+C)')
  console.log('Shutting down...')
  console.log('========================================')

  clearInterval(broadcastInterval)

  wss.close(() => {
    console.log('✅ Server closed')
    process.exit(0)
  })
})

/**
 * Handle uncaught exceptions
 */
process.on('uncaughtException', (error) => {
  console.error('🔥 Uncaught Exception:', error)
  process.exit(1)
})

/**
 * Handle unhandled promise rejections
 */
process.on('unhandledRejection', (reason, promise) => {
  console.error('🔥 Unhandled Rejection at:', promise, 'reason:', reason)
  process.exit(1)
})
