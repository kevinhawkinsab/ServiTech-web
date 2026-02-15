<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import {
  LayoutDashboard,
  CalendarDays,
  ClipboardList,
  History,
  FileEdit,
  ChevronLeft,
  ChevronRight,
  X,
  Wrench
} from 'lucide-vue-next'

const props = defineProps({
  collapsed: Boolean,
  mobileOpen: Boolean
})

const emit = defineEmits(['toggle', 'close-mobile'])

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const menuItems = computed(() => {
  const items = [
    {
      name: 'Dashboard',
      icon: LayoutDashboard,
      route: 'dashboard',
      roles: ['admin', 'tecnico', 'supervisor']
    },
    {
      name: 'Citas',
      icon: ClipboardList,
      route: 'citas',
      roles: ['admin', 'tecnico', 'supervisor']
    },
    {
      name: 'Calendario',
      icon: CalendarDays,
      route: 'calendario',
      roles: ['admin', 'tecnico', 'supervisor']
    },
    {
      name: 'Nueva Visita',
      icon: FileEdit,
      route: 'nueva-visita',
      roles: ['admin', 'tecnico']
    },
    {
      name: 'Historial',
      icon: History,
      route: 'historial',
      roles: ['admin', 'supervisor']
    }
  ]

  return items.filter(item => 
    item.roles.includes(authStore.user?.role)
  )
})

const isActive = (routeName) => {
  return route.name === routeName
}

const navigate = (routeName) => {
  router.push({ name: routeName })
  emit('close-mobile')
}
</script>

<template>
  <aside
    :class="[
      'fixed top-0 left-0 z-50 h-full bg-white border-r border-zinc-200 transition-all duration-300',
      collapsed ? 'w-16' : 'w-64',
      mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
    ]"
    data-testid="sidebar"
  >
    <!-- Header -->
    <div class="flex items-center justify-between h-14 px-4 border-b border-zinc-200">
      <div class="flex items-center gap-2 overflow-hidden">
        <div class="flex-shrink-0 w-8 h-8 bg-primary rounded-md flex items-center justify-center">
          <Wrench class="w-4 h-4 text-white" />
        </div>
        <span
          v-if="!collapsed"
          class="font-heading font-bold text-zinc-900 whitespace-nowrap"
        >
          Servicio Técnico
        </span>
      </div>
      
      <!-- Mobile Close -->
      <button
        class="lg:hidden p-1 hover:bg-zinc-100 rounded"
        @click="$emit('close-mobile')"
        data-testid="close-mobile-menu"
      >
        <X class="w-5 h-5" />
      </button>
      
      <!-- Desktop Toggle -->
      <button
        class="hidden lg:flex p-1 hover:bg-zinc-100 rounded"
        @click="$emit('toggle')"
        data-testid="toggle-sidebar"
      >
        <ChevronLeft v-if="!collapsed" class="w-5 h-5" />
        <ChevronRight v-else class="w-5 h-5" />
      </button>
    </div>

    <!-- Navigation -->
    <nav class="p-2 space-y-1">
      <button
        v-for="item in menuItems"
        :key="item.route"
        :class="[
          'w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors',
          isActive(item.route)
            ? 'bg-primary text-white'
            : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
        ]"
        @click="navigate(item.route)"
        :data-testid="`nav-${item.route}`"
        :title="collapsed ? item.name : ''"
      >
        <component :is="item.icon" class="w-5 h-5 flex-shrink-0" />
        <span v-if="!collapsed" class="text-sm font-medium">{{ item.name }}</span>
      </button>
    </nav>
  </aside>
</template>
