<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import {
  Menu,
  Bell,
  LogOut,
  User,
  ChevronDown
} from 'lucide-vue-next'
import { ref } from 'vue'

const props = defineProps({
  sidebarCollapsed: Boolean
})

const emit = defineEmits(['toggle-sidebar', 'toggle-mobile-menu'])

const router = useRouter()
const authStore = useAuthStore()
const showUserMenu = ref(false)

const roleLabels = {
  admin: 'Administrador',
  tecnico: 'Técnico',
  supervisor: 'Supervisor'
}

const handleLogout = () => {
  authStore.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <header
    class="sticky top-0 z-30 h-14 bg-white border-b border-zinc-200 flex items-center justify-between px-4"
    data-testid="navbar"
  >
    <!-- Left -->
    <div class="flex items-center gap-2">
      <button
        class="lg:hidden p-2 hover:bg-zinc-100 rounded-md"
        @click="$emit('toggle-mobile-menu')"
        data-testid="mobile-menu-button"
      >
        <Menu class="w-5 h-5" />
      </button>
    </div>

    <!-- Right -->
    <div class="flex items-center gap-2">
      <!-- Notifications -->
      <button
        class="relative p-2 hover:bg-zinc-100 rounded-md"
        data-testid="notifications-button"
      >
        <Bell class="w-5 h-5 text-zinc-600" />
        <span class="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
      </button>

      <!-- User Menu -->
      <div class="relative">
        <button
          class="flex items-center gap-2 p-2 hover:bg-zinc-100 rounded-md"
          @click="showUserMenu = !showUserMenu"
          data-testid="user-menu-button"
        >
          <div class="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <span class="text-xs font-bold text-white">{{ authStore.user?.avatar }}</span>
          </div>
          <div class="hidden sm:block text-left">
            <p class="text-sm font-medium text-zinc-900">{{ authStore.user?.name }}</p>
            <p class="text-xs text-zinc-500">{{ roleLabels[authStore.user?.role] }}</p>
          </div>
          <ChevronDown class="w-4 h-4 text-zinc-400" />
        </button>

        <!-- Dropdown -->
        <Transition
          enter-active-class="transition ease-out duration-100"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition ease-in duration-75"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <div
            v-if="showUserMenu"
            class="absolute right-0 mt-2 w-48 bg-white border border-zinc-200 rounded-md shadow-lg py-1 z-50"
            data-testid="user-menu-dropdown"
          >
            <div class="px-4 py-2 border-b border-zinc-100">
              <p class="text-sm font-medium">{{ authStore.user?.name }}</p>
              <p class="text-xs text-zinc-500">{{ authStore.user?.email }}</p>
            </div>
            <button
              class="w-full flex items-center gap-2 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
              data-testid="profile-button"
            >
              <User class="w-4 h-4" />
              Perfil
            </button>
            <button
              class="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              @click="handleLogout"
              data-testid="logout-button"
            >
              <LogOut class="w-4 h-4" />
              Cerrar Sesión
            </button>
          </div>
        </Transition>
      </div>
    </div>
  </header>
</template>
