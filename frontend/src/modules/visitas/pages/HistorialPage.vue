<script setup>
import { ref, computed } from 'vue'
import html2pdf from 'html2pdf.js'
import { useVisitasStore } from '../../../stores/visitas'
import Card from '../../../components/ui/Card.vue'
import Button from '../../../components/ui/Button.vue'
import Input from '../../../components/ui/Input.vue'
import Select from '../../../components/ui/Select.vue'
import Badge from '../../../components/ui/Badge.vue'
import Modal from '../../../components/ui/Modal.vue'
import {
  Search,
  FileText,
  Download,
  Eye,
  Calendar,
  User,
  Wrench
} from 'lucide-vue-next'

const visitasStore = useVisitasStore()

// Filters
const searchQuery = ref('')
const filterFechaInicio = ref('')
const filterFechaFin = ref('')
const filterTecnico = ref('')
const filterTipo = ref('')
const filterEstado = ref('')

// Preview Modal
const showPreview = ref(false)
const selectedVisita = ref(null)

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
  { value: 'completada', label: 'Completada' },
  { value: 'pendiente', label: 'Pendiente' }
]

const filteredVisitas = computed(() => {
  return visitasStore.visitas.filter(visita => {
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      const matchSearch = 
        visita.ordenId.toLowerCase().includes(query) ||
        visita.clienteNombre.toLowerCase().includes(query)
      if (!matchSearch) return false
    }
    
    if (filterFechaInicio.value && visita.fecha < filterFechaInicio.value) return false
    if (filterFechaFin.value && visita.fecha > filterFechaFin.value) return false
    if (filterTecnico.value && visita.tecnicoId !== filterTecnico.value) return false
    if (filterTipo.value && visita.tipo !== filterTipo.value) return false
    if (filterEstado.value && visita.estado !== filterEstado.value) return false
    
    return true
  })
})

const openPreview = (visita) => {
  selectedVisita.value = visita
  showPreview.value = true
}

const downloadPDF = async (visita) => {
  selectedVisita.value = visita
  showPreview.value = true
  
  // Wait for modal to render and Vue to update DOM
  await new Promise(resolve => setTimeout(resolve, 500))
  
  const element = document.getElementById('pdf-content')
  if (!element) {
    console.error('PDF content element not found')
    return
  }
  
  const opt = {
    margin: 10,
    filename: `${visita.ordenId}-reporte.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  }
  
  try {
    await html2pdf().set(opt).from(element).save()
    console.log('PDF generado:', visita.ordenId)
  } catch (error) {
    console.error('Error generando PDF:', error)
  }
}

const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0
  }).format(value || 0)
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
  <div class="space-y-4" data-testid="historial-page">
    <!-- Header -->
    <div>
      <h1 class="font-heading text-2xl font-bold text-zinc-900">Historial de Visitas</h1>
      <p class="text-sm text-zinc-500">Consulta y descarga reportes de visitas técnicas</p>
    </div>

    <!-- Filters -->
    <Card>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        <div class="lg:col-span-2 relative">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <Input
            v-model="searchQuery"
            placeholder="Buscar por orden o cliente..."
            class="pl-9"
            data-testid="search-historial"
          />
        </div>
        <Input
          v-model="filterFechaInicio"
          type="date"
          data-testid="filter-fecha-inicio"
        />
        <Input
          v-model="filterFechaFin"
          type="date"
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
        <table class="w-full" data-testid="historial-table">
          <thead>
            <tr class="border-b border-zinc-200">
              <th class="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider py-3 px-4">ID Orden</th>
              <th class="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider py-3 px-4">Tipo</th>
              <th class="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider py-3 px-4">Cliente</th>
              <th class="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider py-3 px-4">Técnico</th>
              <th class="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider py-3 px-4">Fecha</th>
              <th class="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider py-3 px-4">Total</th>
              <th class="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider py-3 px-4">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-100">
            <tr
              v-for="visita in filteredVisitas"
              :key="visita.id"
              class="hover:bg-zinc-50 transition-colors"
              :data-testid="`visita-row-${visita.id}`"
            >
              <td class="py-3 px-4">
                <span class="font-mono text-sm font-medium text-zinc-900">{{ visita.ordenId }}</span>
              </td>
              <td class="py-3 px-4">
                <Badge variant="outline">{{ visita.tipo }}</Badge>
              </td>
              <td class="py-3 px-4">
                <span class="text-sm text-zinc-600">{{ visita.clienteNombre }}</span>
              </td>
              <td class="py-3 px-4">
                <span class="text-sm text-zinc-600">{{ visita.tecnicoNombre }}</span>
              </td>
              <td class="py-3 px-4">
                <span class="text-sm text-zinc-600">{{ visita.fecha }}</span>
              </td>
              <td class="py-3 px-4">
                <span class="text-sm font-medium text-zinc-900">{{ formatCurrency(visita.total) }}</span>
              </td>
              <td class="py-3 px-4">
                <div class="flex items-center gap-1">
                  <button
                    class="p-1.5 hover:bg-zinc-100 rounded transition-colors"
                    @click="openPreview(visita)"
                    title="Ver PDF"
                    :data-testid="`view-${visita.id}`"
                  >
                    <Eye class="w-4 h-4 text-zinc-500" />
                  </button>
                  <button
                    class="p-1.5 hover:bg-primary/10 rounded transition-colors"
                    @click="downloadPDF(visita)"
                    title="Descargar PDF"
                    :data-testid="`download-${visita.id}`"
                  >
                    <Download class="w-4 h-4 text-primary" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="filteredVisitas.length === 0" class="text-center py-12 text-zinc-500">
          No se encontraron visitas con los filtros aplicados
        </div>
      </div>
    </Card>

    <!-- Preview Modal -->
    <Modal
      v-model="showPreview"
      :title="`Reporte ${selectedVisita?.ordenId}`"
      size="xl"
    >
      <div v-if="selectedVisita" id="pdf-content" class="bg-white p-6 space-y-6">
        <!-- Header -->
        <div class="flex items-start justify-between border-b border-zinc-200 pb-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
              <Wrench class="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 class="font-heading text-xl font-bold text-zinc-900">Servicio Técnico</h2>
              <p class="text-sm text-zinc-500">Reporte de Visita</p>
            </div>
          </div>
          <div class="text-right">
            <p class="font-mono font-bold text-lg text-primary">{{ selectedVisita.ordenId }}</p>
            <p class="text-sm text-zinc-500">{{ selectedVisita.fecha }}</p>
          </div>
        </div>

        <!-- Info Grid -->
        <div class="grid grid-cols-2 gap-6">
          <!-- Cliente -->
          <div class="space-y-2">
            <h3 class="font-semibold text-zinc-900 flex items-center gap-2">
              <User class="w-4 h-4" /> Cliente
            </h3>
            <div class="text-sm text-zinc-600 space-y-1">
              <p><strong>Nombre:</strong> {{ selectedVisita.clienteNombre }}</p>
              <p><strong>Dirección:</strong> {{ selectedVisita.clienteDireccion }}</p>
              <p><strong>Teléfono:</strong> {{ selectedVisita.clienteTelefono }}</p>
            </div>
          </div>

          <!-- Servicio -->
          <div class="space-y-2">
            <h3 class="font-semibold text-zinc-900 flex items-center gap-2">
              <Calendar class="w-4 h-4" /> Servicio
            </h3>
            <div class="text-sm text-zinc-600 space-y-1">
              <p><strong>Tipo:</strong> {{ selectedVisita.tipo }}</p>
              <p><strong>Técnico:</strong> {{ selectedVisita.tecnicoNombre }}</p>
              <p><strong>Horario:</strong> {{ selectedVisita.horaEntrada }} - {{ selectedVisita.horaSalida }}</p>
            </div>
          </div>
        </div>

        <!-- Diagnóstico -->
        <div class="space-y-2">
          <h3 class="font-semibold text-zinc-900">Diagnóstico</h3>
          <p class="text-sm text-zinc-600 bg-zinc-50 p-3 rounded-lg">{{ selectedVisita.diagnostico }}</p>
        </div>

        <!-- Inventario -->
        <div v-if="selectedVisita.inventario?.length > 0" class="space-y-2">
          <h3 class="font-semibold text-zinc-900">Materiales Utilizados</h3>
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-zinc-200">
                <th class="text-left py-2">Descripción</th>
                <th class="text-center py-2">Cant.</th>
                <th class="text-right py-2">P. Unit</th>
                <th class="text-right py-2">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, i) in selectedVisita.inventario" :key="i" class="border-b border-zinc-100">
                <td class="py-2">{{ item.item }}</td>
                <td class="py-2 text-center">{{ item.cantidad }}</td>
                <td class="py-2 text-right">{{ formatCurrency(item.precioUnit) }}</td>
                <td class="py-2 text-right font-medium">{{ formatCurrency(item.total) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Totales -->
        <div class="flex justify-end">
          <div class="w-64 space-y-1 text-sm">
            <div class="flex justify-between">
              <span class="text-zinc-500">Subtotal:</span>
              <span>{{ formatCurrency(selectedVisita.subtotal) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-zinc-500">IVA (19%):</span>
              <span>{{ formatCurrency(selectedVisita.iva) }}</span>
            </div>
            <div class="flex justify-between font-bold text-lg border-t border-zinc-200 pt-2">
              <span>Total:</span>
              <span class="text-primary">{{ formatCurrency(selectedVisita.total) }}</span>
            </div>
          </div>
        </div>

        <!-- Firmas -->
        <div class="grid grid-cols-2 gap-6 pt-4 border-t border-zinc-200">
          <div class="text-center">
            <div class="h-20 border-b border-zinc-300 mb-2 flex items-end justify-center">
              <img v-if="selectedVisita.firmaCliente && selectedVisita.firmaCliente !== 'data:image/png;base64,mock'" :src="selectedVisita.firmaCliente" alt="Firma Cliente" class="max-h-16" />
            </div>
            <p class="text-sm text-zinc-500">Firma del Cliente</p>
          </div>
          <div class="text-center">
            <div class="h-20 border-b border-zinc-300 mb-2 flex items-end justify-center">
              <img v-if="selectedVisita.firmaTecnico && selectedVisita.firmaTecnico !== 'data:image/png;base64,mock'" :src="selectedVisita.firmaTecnico" alt="Firma Técnico" class="max-h-16" />
            </div>
            <p class="text-sm text-zinc-500">Firma del Técnico</p>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <Button variant="outline" @click="showPreview = false">Cerrar</Button>
          <Button @click="downloadPDF(selectedVisita)" data-testid="download-pdf-btn">
            <Download class="w-4 h-4 mr-2" />
            Descargar PDF
          </Button>
        </div>
      </template>
    </Modal>
  </div>
</template>
