import { defineConfig } from '@playwright/test'

const baseURL = 'http://localhost:5173'

export default defineConfig({
  testDir: './src/e2e', // You've already fixed this, which is good

  // ...other settings like timeout, retries...

  // This block tells Playwright to start your dev server
  webServer: {
    command: 'npm run dev',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
  },

  // This block is what fixes your "invalid URL" error
  // It tells page.goto('/') to navigate to http://localhost:5173/
  use: {
    baseURL: baseURL,
    trace: 'on-first-retry',
  },

  // ...other settings like projects
})
