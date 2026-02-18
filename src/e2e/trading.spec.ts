import { test, expect } from '@playwright/test'

test.describe('Trading Dashboard - Smoke Test', () => {
  test('should load the page and connect to the WebSocket server', async ({ page }) => {
    // 1. Go to the app
    // This uses the baseURL from playwright.config.ts (which now reads from .env)
    await page.goto('/')

    // 2. Wait for the WebSocket to connect
    // If the .env variables are correctly setting VITE_WS_URL and WS_PORT,
    // the app will successfully connect to the server and the
    // "Connecting..." banner will disappear.
    await expect(page.locator('.status-banner')).toBeHidden({ timeout: 15000 })
  })
})
