<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import Sidebar from './Sidebar.vue'
import Navbar from './Navbar.vue'

const sidebarCollapsed = ref(false)
const mobileMenuOpen = ref(false)

const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value
}

const closeMobileMenu = () => {
  mobileMenuOpen.value = false
}
</script>

<template>
  <div class="min-h-screen bg-zinc-50" data-testid="main-layout">
    <!-- Mobile Menu Overlay -->
    <div
      v-if="mobileMenuOpen"
      class="fixed inset-0 bg-black/50 z-40 lg:hidden"
      @click="closeMobileMenu"
    />

    <!-- Sidebar -->
    <Sidebar
      :collapsed="sidebarCollapsed"
      :mobile-open="mobileMenuOpen"
      @toggle="toggleSidebar"
      @close-mobile="closeMobileMenu"
    />

    <!-- Main Content -->
    <div
      :class="[
        'transition-all duration-300',
        sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
      ]"
    >
      <Navbar
        :sidebar-collapsed="sidebarCollapsed"
        @toggle-sidebar="toggleSidebar"
        @toggle-mobile-menu="toggleMobileMenu"
      />
      
      <main class="p-4 lg:p-6">
        <slot />
      </main>
    </div>
  </div>
</template>
