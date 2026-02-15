<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from './stores/auth'
import MainLayout from './components/layout/MainLayout.vue'

const route = useRoute()
const authStore = useAuthStore()

const showLayout = computed(() => {
  return authStore.isAuthenticated && route.name !== 'login'
})
</script>

<template>
  <MainLayout v-if="showLayout">
    <RouterView />
  </MainLayout>
  <RouterView v-else />
</template>
