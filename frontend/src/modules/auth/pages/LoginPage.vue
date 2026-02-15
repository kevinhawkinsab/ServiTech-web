<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../../stores/auth'
import Button from '../../../components/ui/Button.vue'
import Input from '../../../components/ui/Input.vue'
import { Wrench, Eye, EyeOff } from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const error = ref('')
const loading = ref(false)

const handleSubmit = async () => {
  error.value = ''
  loading.value = true

  const result = await authStore.login(email.value, password.value)

  if (result.success) {
    router.push({ name: 'dashboard' })
  } else {
    error.value = result.error
  }

  loading.value = false
}

// Demo accounts info
const demoAccounts = [
  { email: 'admin@servicio.com', password: 'admin123', role: 'Administrador' },
  { email: 'tecnico@servicio.com', password: 'tecnico123', role: 'Técnico' },
  { email: 'supervisor@servicio.com', password: 'super123', role: 'Supervisor' }
]

const fillDemo = (account) => {
  email.value = account.email
  password.value = account.password
}
</script>

<template>
  <div class="min-h-screen flex" data-testid="login-page">
    <!-- Left Panel - Image -->
    <div class="hidden lg:flex lg:w-1/2 bg-zinc-900 relative overflow-hidden">
      <img
        src="https://images.unsplash.com/photo-1581092160562-40aa08e78837?q=80&w=1920&auto=format&fit=crop"
        alt="Technical Service"
        class="absolute inset-0 w-full h-full object-cover opacity-60"
      />
      <div class="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/50 to-transparent" />
      <div class="relative z-10 flex flex-col justify-end p-12">
        <div class="flex items-center gap-3 mb-6">
          <div class="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
            <Wrench class="w-6 h-6 text-white" />
          </div>
          <span class="font-heading text-2xl font-bold text-white">Servicio Técnico</span>
        </div>
        <h1 class="font-heading text-4xl font-bold text-white mb-4">
          Gestión de Mantenimiento y Visitas en Terreno
        </h1>
        <p class="text-zinc-400 text-lg">
          Sistema integral para la administración de citas, visitas técnicas e historial de servicios.
        </p>
      </div>
    </div>

    <!-- Right Panel - Form -->
    <div class="flex-1 flex items-center justify-center p-8 bg-white">
      <div class="w-full max-w-md">
        <!-- Mobile Logo -->
        <div class="lg:hidden flex items-center gap-3 mb-8">
          <div class="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Wrench class="w-5 h-5 text-white" />
          </div>
          <span class="font-heading text-xl font-bold">Servicio Técnico</span>
        </div>

        <div class="mb-8">
          <h2 class="font-heading text-2xl font-bold text-zinc-900 mb-2">Iniciar Sesión</h2>
          <p class="text-zinc-500">Ingresa tus credenciales para acceder al sistema</p>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-zinc-700 mb-1.5">Email</label>
            <Input
              v-model="email"
              type="email"
              placeholder="correo@ejemplo.com"
              data-testid="login-email"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-zinc-700 mb-1.5">Contraseña</label>
            <div class="relative">
              <Input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="••••••••"
                data-testid="login-password"
              />
              <button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                @click="showPassword = !showPassword"
              >
                <Eye v-if="!showPassword" class="w-4 h-4" />
                <EyeOff v-else class="w-4 h-4" />
              </button>
            </div>
          </div>

          <div v-if="error" class="p-3 bg-red-50 border border-red-200 rounded-md">
            <p class="text-sm text-red-600">{{ error }}</p>
          </div>

          <Button
            type="submit"
            class="w-full"
            :disabled="loading"
            data-testid="login-submit"
          >
            {{ loading ? 'Ingresando...' : 'Ingresar' }}
          </Button>
        </form>

        <!-- Demo Accounts -->
        <div class="mt-8 pt-6 border-t border-zinc-200">
          <p class="text-sm text-zinc-500 mb-3">Cuentas de demostración:</p>
          <div class="space-y-2">
            <button
              v-for="account in demoAccounts"
              :key="account.email"
              class="w-full text-left px-3 py-2 rounded-md border border-zinc-200 hover:bg-zinc-50 transition-colors"
              @click="fillDemo(account)"
              :data-testid="`demo-${account.role.toLowerCase()}`"
            >
              <span class="text-sm font-medium text-zinc-700">{{ account.role }}</span>
              <span class="text-xs text-zinc-400 ml-2">{{ account.email }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
