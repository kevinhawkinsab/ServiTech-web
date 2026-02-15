import DashboardPage from '../modules/dashboard/pages/DashboardPage.vue'
import CitasPage from '../modules/citas/pages/CitasPage.vue'
import CalendarioPage from '../modules/citas/pages/CalendarioPage.vue'
import RegistroVisitaPage from '../modules/visitas/pages/RegistroVisitaPage.vue'
import HistorialPage from '../modules/visitas/pages/HistorialPage.vue'

export default [
  {
    path: '/dashboard',
    name: 'dashboard',
    component: DashboardPage,
    meta: { requiresAuth: true, roles: ['admin', 'tecnico', 'supervisor'] }
  },
  {
    path: '/citas',
    name: 'citas',
    component: CitasPage,
    meta: { requiresAuth: true, roles: ['admin', 'tecnico', 'supervisor'] }
  },
  {
    path: '/calendario',
    name: 'calendario',
    component: CalendarioPage,
    meta: { requiresAuth: true, roles: ['admin', 'tecnico', 'supervisor'] }
  },
  {
    path: '/visita/nueva',
    name: 'nueva-visita',
    component: RegistroVisitaPage,
    meta: { requiresAuth: true, roles: ['admin', 'tecnico'] }
  },
  {
    path: '/visita/:id',
    name: 'editar-visita',
    component: RegistroVisitaPage,
    meta: { requiresAuth: true, roles: ['admin', 'tecnico'] }
  },
  {
    path: '/historial',
    name: 'historial',
    component: HistorialPage,
    meta: { requiresAuth: true, roles: ['admin', 'supervisor'] }
  }
]
