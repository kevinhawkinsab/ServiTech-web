<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCitasStore } from '../../../stores/citas'
import { useVisitasStore } from '../../../stores/visitas'
import Card from '../../../components/ui/Card.vue'
import Button from '../../../components/ui/Button.vue'
import Input from '../../../components/ui/Input.vue'
import Select from '../../../components/ui/Select.vue'
import Badge from '../../../components/ui/Badge.vue'
import Modal from '../../../components/ui/Modal.vue'
import CitaModal from '../components/CitaModal.vue'
import {
  Search,
  Filter,
  Plus,
  Eye,
  Pencil,
  Trash2,
  Calendar
} from 'lucide-vue-next'

const router = useRouter()
const citasStore = useCitasStore()
const visitasStore = useVisitasStore()

// Filters
const searchQuery = ref('')
const filterFechaInicio = ref('')
const filterFechaFin = ref('')
const filterTecnico = ref('')
const filterTipo = ref('')
const filterEstado = ref('')

// Modal
const showCitaModal = ref(false)
const selectedCita = ref(null)

const tecnicosOptions = computed(() => [
  { value: '', label: 'Todos los técnicos' },
  ...visitasStore.tecnicos.map(t => ({ value: t.id, label: t.nombre }))
])

const tiposOptions = computed(() => [
  { value: '', label: 'Todos los tipos' },
  ...visitasStore.tiposInspeccion.map(t => ({ value: t, label: t }))
])

const estadosOptions = [
  { value: '', label: 'Todos los estados' },
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'confirmada', label: 'Confirmada' },
  { value: 'completada', label: 'Completada' },
  { value: 'cancelada', label: 'Cancelada' }
]

const filteredCitas = computed(() => {
  return citasStore.citas.filter(cita => {
    // Search
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      const matchSearch = 
        cita.asunto.toLowerCase().includes(query) ||
        cita.clienteNombre.toLowerCase().includes(query) ||
        cita.id.toLowerCase().includes(query)
      if (!matchSearch) return false
    }
    
    // Fecha
    if (filterFechaInicio.value && cita.fecha < filterFechaInicio.value) return false
    if (filterFechaFin.value && cita.fecha > filterFechaFin.value) return false
    
    // Técnico
    if (filterTecnico.value && cita.tecnicoId !== filterTecnico.value) return false
    
    // Tipo
    if (filterTipo.value && cita.tipo !== filterTipo.value) return false
    
    // Estado
    if (filterEstado.value && cita.estado !== filterEstado.value) return false
    
    return true
  })
})

const getEstadoBadge = (estado) => {
  const variants = {
    pendiente: 'warning',
    confirmada: 'default',
    completada: 'success',
    cancelada: 'destructive'
  }
  return variants[estado] || 'secondary'
}

const openNewCita = () => {
  selectedCita.value = null
  showCitaModal.value = true
}

const openEditCita = (cita) => {
  selectedCita.value = { ...cita }
  showCitaModal.value = true
}

const handleSaveCita = (citaData) => {
  if (selectedCita.value?.id) {
    citasStore.updateCita(selectedCita.value.id, citaData)
  } else {
    citasStore.addCita(citaData)
  }
  showCitaModal.value = false
}

const handleDeleteCita = (id) => {
  if (confirm('¿Estás seguro de eliminar esta cita?')) {
    citasStore.deleteCita(id)
  }
}

const clearFilters = () => {
  searchQuery.value = ''
  filterFechaInicio.value = ''
  filterFechaFin.value = ''
  filterTecnico.value = ''
  filterTipo.value = ''
  filterEstado.value = ''
}
</script>

<template>
  <div class="space-y-4" data-testid="citas-page">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="font-heading text-2xl font-bold text-zinc-900">Gestión de Citas</h1>
        <p class="text-sm text-zinc-500">Administra todas las citas y visitas programadas</p>
      </div>
      <div class="flex gap-2">
        <Button @click="() => router.push({ name: 'calendario' })" variant="outline">
          <Calendar class="w-4 h-4 mr-2" />
          Ver Calendario
        </Button>
        <Button @click="openNewCita" data-testid="new-cita-btn">
          <Plus class="w-4 h-4 mr-2" />
          Nueva Cita
        </Button>
      </div>
    </div>

    <!-- Filters -->
    <Card>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        <div class="lg:col-span-2 relative">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <Input
            v-model="searchQuery"
            placeholder="Buscar por ID, asunto o cliente..."
            class="pl-9"
            data-testid="search-input"
          />
        </div>
        <Input
          v-model="filterFechaInicio"
          type="date"
          placeholder="Fecha inicio"
          data-testid="filter-fecha-inicio"
        />
        <Input
          v-model="filterFechaFin"
          type="date"
          placeholder="Fecha fin"
          data-testid="filter-fecha-fin"
        />
        <Select
          v-model="filterTecnico"
          :options="tecnicosOptions"
          data-testid="filter-tecnico"
        />
        <Select
          v-model="filterTipo"
          :options="tiposOptions"
          data-testid="filter-tipo"
        />
      </div>
      <div class="flex items-center gap-3 mt-3">
        <Select
          v-model="filterEstado"
          :options="estadosOptions"
          class="w-48"
          data-testid="filter-estado"
        />
        <Button variant="ghost" size="sm" @click="clearFilters">
          Limpiar filtros
        </Button>
      </div>
    </Card>

    <!-- Table -->
    <Card>
      <div class="overflow-x-auto">
        <table class="w-full" data-testid="citas-table">
          <thead>
            <tr class="border-b border-zinc-200">
              <th class="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider py-3 px-4">ID</th>
              <th class="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider py-3 px-4">Tipo</th>
              <th class="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider py-3 px-4">Asunto</th>
              <th class="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider py-3 px-4">Cliente</th>
              <th class="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider py-3 px-4">Técnico</th>
              <th class="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider py-3 px-4">Fecha</th>
              <th class="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider py-3 px-4">Estado</th>
              <th class="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider py-3 px-4">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-100">
            <tr
              v-for="cita in filteredCitas"
              :key="cita.id"
              class="hover:bg-zinc-50 transition-colors"
              :data-testid="`cita-row-${cita.id}`"
            >
              <td class="py-3 px-4">
                <span class="font-mono text-sm text-zinc-900">{{ cita.id }}</span>
              </td>
              <td class="py-3 px-4">
                <span class="text-sm text-zinc-600">{{ cita.tipo }}</span>
              </td>
              <td class="py-3 px-4">
                <span class="text-sm font-medium text-zinc-900">{{ cita.asunto }}</span>
              </td>
              <td class="py-3 px-4">
                <span class="text-sm text-zinc-600">{{ cita.clienteNombre }}</span>
              </td>
              <td class="py-3 px-4">
                <span class="text-sm text-zinc-600">{{ cita.tecnicoNombre }}</span>
              </td>
              <td class="py-3 px-4">
                <span class="text-sm text-zinc-600">{{ cita.fecha }} {{ cita.hora }}</span>
              </td>
              <td class="py-3 px-4">
                <Badge :variant="getEstadoBadge(cita.estado)">{{ cita.estado }}</Badge>
              </td>
              <td class="py-3 px-4">
                <div class="flex items-center gap-1">
                  <button
                    class="p-1.5 hover:bg-zinc-100 rounded transition-colors"
                    @click="openEditCita(cita)"
                    :data-testid="`edit-${cita.id}`"
                  >
                    <Pencil class="w-4 h-4 text-zinc-500" />
                  </button>
                  <button
                    class="p-1.5 hover:bg-red-50 rounded transition-colors"
                    @click="handleDeleteCita(cita.id)"
                    :data-testid="`delete-${cita.id}`"
                  >
                    <Trash2 class="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="filteredCitas.length === 0" class="text-center py-12 text-zinc-500">
          No se encontraron citas con los filtros aplicados
        </div>
      </div>
    </Card>

    <!-- Modal Nueva/Editar Cita -->
    <CitaModal
      v-model="showCitaModal"
      :cita="selectedCita"
      @save="handleSaveCita"
    />
  </div>
</template>
