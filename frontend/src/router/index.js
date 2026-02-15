import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import baseRoutes from './routes.base'
import moduleRoutes from './routes.modules'

const routes = [...baseRoutes, ...moduleRoutes]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'login' })
  } else if (to.name === 'login' && authStore.isAuthenticated) {
    next({ name: 'dashboard' })
  } else if (to.meta.roles && !to.meta.roles.includes(authStore.user?.role)) {
    next({ name: 'dashboard' })
  } else {
    next()
  }
})

export default router
