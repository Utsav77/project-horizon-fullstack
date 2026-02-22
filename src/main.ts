import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { authService } from './services/authService'
import './assets/styles/responsive.css'

const pinia = createPinia()
const app = createApp(App)
app.use(pinia)
app.use(router)

// We must restore session BEFORE mounting so the router guard
// has auth state available on first navigation
authService.tryRestoreSession().finally(() => {
  app.mount('#app')
})
