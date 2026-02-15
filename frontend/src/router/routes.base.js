import LoginPage from '../modules/auth/pages/LoginPage.vue'

export default [
  {
    path: '/login',
    name: 'login',
    component: LoginPage,
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    redirect: '/dashboard'
  }
]
