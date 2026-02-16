<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SignaturePad from 'signature_pad'
import { useVisitasStore } from '../../../stores/visitas'
import { useAuthStore } from '../../../stores/auth'
import Card from '../../../components/ui/Card.vue'
import Button from '../../../components/ui/Button.vue'
import Input from '../../../components/ui/Input.vue'
import Select from '../../../components/ui/Select.vue'
import {
  FileText,
  User,
  Clipboard,
  Package,
  PenTool,
  Plus,
  Trash2,
  Save
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const visitasStore = useVisitasStore()
const authStore = useAuthStore()

const tiposOptions = computed(() =>
  visitasStore.tiposInspeccion.map(t => ({ value: t, label: t }))
)

const tecnicosOptions = computed(() =>
  visitasStore.tecnicos.map(t => ({ value: t.id, label: t.nombre }))
)
// Form data (con los campos solicitados)
const form = ref({
  // A. Detalle de la Visita
  ordenId: '',            // mostrado (computed)
  tecnico: authStore.user?.name || '', // A2 técnico (input text)
  fechaAsignacion: new Date().toISOString().split('T')[0], // A3 date
  horaVisita: '',        // A4 time
  tipoVisita: '',        // A5 text
  solicitud: '',         // A6 text

  // B. Datos del Cliente
  clienteNombre: '',
  clienteTelefono: '',
  clienteContacto: '',
  clienteTipo: '',

  // C. Datos de Inspección
  direccion: '',
  descripcionProblema: '',
  horaEntrada: '',
  horaSalida: '',

  // D. Resultado de la visita
  resultadoVisita: '',
  recomendaciones: '',
  detallesFacturacion: '',

  // Inventario y firmas (mantener)
  inventario: [],
  subtotal: 0,
  iva: 0,
  total: 0,
  firmaCliente: null,
  firmaTecnico: null
})

// Orden id generado o recuperado
const ordenId = computed(() => {
  if (route.params.id) {
    const visita = visitasStore.getVisitaById(route.params.id)
    return visita?.ordenId || 'Cargando...'
  }
  return visitasStore.generateOrdenId()
})

// Inicializar ordenId en form (reactivo)
form.value.ordenId = ordenId.value

// Inventario management (sin cambios funcionales)
const addInventarioItem = () => {
  form.value.inventario.push({
    item: '',
    cantidad: 1,
    precioUnit: 0,
    total: 0
  })
}

const removeInventarioItem = (index) => {
  form.value.inventario.splice(index, 1)
  calculateTotals()
}

const updateInventarioItem = (index) => {
  const item = form.value.inventario[index]
  item.total = Number(item.cantidad || 0) * Number(item.precioUnit || 0)
  calculateTotals()
}

const calculateTotals = () => {
  form.value.subtotal = form.value.inventario.reduce((sum, item) => sum + (Number(item.total) || 0), 0)
  form.value.iva = Math.round(form.value.subtotal * 0.19)
  form.value.total = form.value.subtotal + form.value.iva
}

// Firma pads (mantener)
const clienteCanvasRef = ref(null)
const tecnicoCanvasRef = ref(null)
let clienteSignaturePad = null
let tecnicoSignaturePad = null

onMounted(() => {
  // Initialize signature pads
  if (clienteCanvasRef.value) {
    clienteSignaturePad = new SignaturePad(clienteCanvasRef.value, {
      backgroundColor: 'rgb(255, 255, 255)',
      penColor: 'rgb(0, 0, 0)'
    })
  }

  if (tecnicoCanvasRef.value) {
    tecnicoSignaturePad = new SignaturePad(tecnicoCanvasRef.value, {
      backgroundColor: 'rgb(255, 255, 255)',
      penColor: 'rgb(0, 0, 0)'
    })
  }

  // Load existing visita if editing
  if (route.params.id) {
    const visita = visitasStore.getVisitaById(route.params.id)
    if (visita) {
      // Map visitante fields into nuestro form. Si el objeto tiene campos con otros nombres,
      // esta asignación los volcará directamente; de lo contrario asigna de forma conservadora.
      form.value = {
        ...form.value,
        ...visita
      }
    }
  }

  // asegurar ordenId actualizado
  form.value.ordenId = ordenId.value
})

// Limpiar firmas
const clearClienteSignature = () => {
  clienteSignaturePad?.clear()
  form.value.firmaCliente = null
}

const clearTecnicoSignature = () => {
  tecnicoSignaturePad?.clear()
  form.value.firmaTecnico = null
}

// Watch para imprimir en consola cada vez que cambie el formulario
watch(form, (newVal) => {
  console.log('Formulario actualizado:', JSON.parse(JSON.stringify(newVal)))
}, { deep: true })

const handleSubmit = () => {
  // obtener firmas (si existen)
  if (clienteSignaturePad && !clienteSignaturePad.isEmpty()) {
    form.value.firmaCliente = clienteSignaturePad.toDataURL()
  }
  if (tecnicoSignaturePad && !tecnicoSignaturePad.isEmpty()) {
    form.value.firmaTecnico = tecnicoSignaturePad.toDataURL()
  }

  // imprimir en consola (al enviar)
  console.log('Formulario de visita técnica (submit):', JSON.parse(JSON.stringify(form.value)))

  if (route.params.id) {
    visitasStore.updateVisita(route.params.id, form.value)
  } else {
    visitasStore.addVisita(form.value)
  }

  router.push({ name: 'historial' })
}

const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0
  }).format(value)
}
</script>

<template>
  <div class="space-y-4 max-w-5xl mx-auto" data-testid="registro-visita-page">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="font-heading text-lg font-bold text-zinc-900">Registro de Visita Técnica</h1>
        <p class="text-sm text-zinc-500">Complete el formulario de la visita realizada</p>
      </div>
    </div>

    <!-- A. Detalle de la Visita -->
    <Card data-testid="section-orden">
      <template #default>
        <div class="flex items-center gap-3 mb-4">
          <div class="p-2 bg-primary/10 rounded-lg">
            <FileText class="w-5 h-5 text-primary" />
          </div>
          <h2 class="font-heading font-semibold text-lg">Detalle de la Visita</h2>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-zinc-700 mb-1.5">Número de Orden</label>
            <Input :model-value="ordenId" disabled class="bg-zinc-50 font-mono" data-testid="orden-id" />
          </div>
          <div>
            <label class="block text-sm font-medium text-zinc-700 mb-1.5">Técnico Asignado</label>
            <Select v-model="form.tecnico" :options="tecnicosOptions" data-testid="visita-tecnico" />
          </div>

          <div>
            <label class="block text-sm font-medium text-zinc-700 mb-1.5">Fecha de Asignación</label>
            <Input v-model="form.fechaAsignacion" type="date" data-testid="visita-fecha-asignacion" />
          </div>

          <div>
            <label class="block text-sm font-medium text-zinc-700 mb-1.5">Hora de Visita</label>
            <Input v-model="form.horaVisita" type="time" data-testid="visita-hora-visita" />
          </div>
          <div>
            <label class="block text-sm font-medium text-zinc-700 mb-1.5">Tipo de Inspección *</label>
            <Select v-model="form.tipoVisita" :options="tiposOptions" placeholder="Seleccionar"
              data-testid="visita-tipo" />
          </div>

          <div class="sm:col-span-3">
            <label class="block text-sm font-medium text-zinc-700 mb-1.5">Solicitud</label>
            <Input v-model="form.solicitud" type="text" placeholder="Breve descripción de la solicitud"
              data-testid="visita-solicitud" />
          </div>
        </div>
      </template>
    </Card>

    <!-- B. Datos del Cliente -->
    <Card data-testid="section-cliente">
      <template #default>
        <div class="flex items-center gap-3 mb-4">
          <div class="p-2 bg-blue-100 rounded-lg">
            <User class="w-5 h-5 text-blue-600" />
          </div>
          <h2 class="font-heading font-semibold text-lg">Datos del Cliente</h2>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-zinc-700 mb-1.5">Nombre del Cliente</label>
            <Input v-model="form.clienteNombre" type="text" placeholder="Nombre completo"
              data-testid="cliente-nombre" />
          </div>

          <div>
            <label class="block text-sm font-medium text-zinc-700 mb-1.5">Teléfono</label>
            <Input v-model="form.clienteTelefono" type="text" placeholder="Teléfono" data-testid="cliente-telefono" />
          </div>

          <div>
            <label class="block text-sm font-medium text-zinc-700 mb-1.5">Contácto</label>
            <Input v-model="form.clienteContacto" type="text" placeholder="Nombre de contacto"
              data-testid="cliente-contacto" />
          </div>

          <div>
            <label class="block text-sm font-medium text-zinc-700 mb-1.5">Tipo de cliente</label>
            <Input v-model="form.clienteTipo" type="text" placeholder="Particular / Empresa / Otro"
              data-testid="cliente-tipo" />
          </div>

          <div class="sm:col-span-2">
            <label class="block text-sm font-medium text-zinc-700 mb-1.5">Dirección</label>
            <Input v-model="form.direccion" type="text" placeholder="Dirección del cliente"
              data-testid="cliente-direccion" />
          </div>
        </div>
      </template>
    </Card>

    <!-- C. Datos de Inspección -->
    <Card data-testid="section-inspeccion">
      <template #default>
        <div class="flex items-center gap-3 mb-4">
          <div class="p-2 bg-green-100 rounded-lg">
            <Clipboard class="w-5 h-5 text-green-600" />
          </div>
          <h2 class="font-heading font-semibold text-lg">Datos de Inspección</h2>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div class="sm:col-span-3">
            <label class="block text-sm font-medium text-zinc-700 mb-1.5">Descripción del Problema</label>
            <Input v-model="form.descripcionProblema" type="text" placeholder="Descripción del problema reportado"
              data-testid="inspeccion-descripcion" />
          </div>

          <div>
            <label class="block text-sm font-medium text-zinc-700 mb-1.5">Hora Entrada</label>
            <Input v-model="form.horaEntrada" type="time" data-testid="inspeccion-hora-entrada" />
          </div>

          <div>
            <label class="block text-sm font-medium text-zinc-700 mb-1.5">Hora Salida</label>
            <Input v-model="form.horaSalida" type="time" data-testid="inspeccion-hora-salida" />
          </div>
        </div>
      </template>
    </Card>

    <!-- D. Resultado de la visita -->
    <Card data-testid="section-resultado">
      <template #default>
        <div class="flex items-center gap-3 mb-4">
          <div class="p-2 bg-indigo-100 rounded-lg">
            <FileText class="w-5 h-5 text-indigo-600" />
          </div>
          <h2 class="font-heading font-semibold text-lg">Resultado de la Visita</h2>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="sm:col-span-2">
            <label class="block text-sm font-medium text-zinc-700 mb-1.5">Resultado de la visita</label>
            <Input v-model="form.resultadoVisita" type="text"
              placeholder="Ej: Solucionado / Pendiente / Requiere repuestos" data-testid="resultado-visita" />
          </div>

          <div class="sm:col-span-2">
            <label class="block text-sm font-medium text-zinc-700 mb-1.5">Recomendaciones</label>
            <Input v-model="form.recomendaciones" type="text" placeholder="Recomendaciones al cliente"
              data-testid="recomendaciones" />
          </div>

          <div class="sm:col-span-2">
            <label class="block text-sm font-medium text-zinc-700 mb-1.5">Detalles de facturación</label>
            <Input v-model="form.detallesFacturacion" type="text" placeholder="Detalle para facturación"
              data-testid="detalles-facturacion" />
          </div>
        </div>
      </template>
    </Card>

    <!-- Section: Inventario (mantener tal cual) -->
    <Card data-testid="section-inventario">
      <template #default>
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-yellow-100 rounded-lg">
              <Package class="w-5 h-5 text-yellow-600" />
            </div>
            <h2 class="font-heading font-semibold text-lg">Inventario / Materiales</h2>
          </div>
          <Button variant="outline" size="sm" @click="addInventarioItem" data-testid="add-item-btn">
            <Plus class="w-4 h-4 mr-1" />
            Agregar Item
          </Button>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full" v-if="form.inventario.length > 0">
            <thead>
              <tr class="border-b border-zinc-200">
                <th class="text-left text-xs font-medium text-zinc-500 uppercase py-2 px-2">Descripción</th>
                <th class="text-center text-xs font-medium text-zinc-500 uppercase py-2 px-2 w-24">Cant.</th>
                <th class="text-right text-xs font-medium text-zinc-500 uppercase py-2 px-2 w-32">P. Unit</th>
                <th class="text-right text-xs font-medium text-zinc-500 uppercase py-2 px-2 w-32">Total</th>
                <th class="w-12"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-zinc-100">
              <tr v-for="(item, index) in form.inventario" :key="index">
                <td class="py-2 px-2">
                  <Input v-model="item.item" placeholder="Nombre del item" class="text-sm"
                    :data-testid="`item-desc-${index}`" />
                </td>
                <td class="py-2 px-2">
                  <Input v-model.number="item.cantidad" type="number" min="1" class="text-sm text-center"
                    @input="updateInventarioItem(index)" :data-testid="`item-cant-${index}`" />
                </td>
                <td class="py-2 px-2">
                  <Input v-model.number="item.precioUnit" type="number" min="0" class="text-sm text-right"
                    @input="updateInventarioItem(index)" :data-testid="`item-precio-${index}`" />
                </td>
                <td class="py-2 px-2 text-right font-medium text-sm">
                  {{ formatCurrency(item.total) }}
                </td>
                <td class="py-2 px-2">
                  <button class="p-1 hover:bg-red-50 rounded" @click="removeInventarioItem(index)"
                    :data-testid="`remove-item-${index}`">
                    <Trash2 class="w-4 h-4 text-red-500" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>

          <p v-else class="text-center py-8 text-zinc-500 text-sm">
            No hay items en el inventario. Click en "Agregar Item" para comenzar.
          </p>
        </div>
      </template>
    </Card>

    <!-- Section: Firmas (mantener tal cual) -->
    <Card data-testid="section-firmas">
      <template #default>
        <div class="flex items-center gap-3 mb-4">
          <div class="p-2 bg-red-100 rounded-lg">
            <PenTool class="w-5 h-5 text-red-600" />
          </div>
          <h2 class="font-heading font-semibold text-lg">Firmas</h2>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <!-- Firma Cliente -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <label class="text-sm font-medium text-zinc-700">Firma del Cliente</label>
              <Button variant="ghost" size="sm" @click="clearClienteSignature">Limpiar</Button>
            </div>
            <div class="border border-zinc-200 rounded-lg overflow-hidden bg-white">
              <canvas ref="clienteCanvasRef" width="400" height="150" class="w-full"
                data-testid="firma-cliente"></canvas>
            </div>
          </div>

          <!-- Firma Técnico -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <label class="text-sm font-medium text-zinc-700">Firma del Técnico</label>
              <Button variant="ghost" size="sm" @click="clearTecnicoSignature">Limpiar</Button>
            </div>
            <div class="border border-zinc-200 rounded-lg overflow-hidden bg-white">
              <canvas ref="tecnicoCanvasRef" width="400" height="150" class="w-full"
                data-testid="firma-tecnico"></canvas>
            </div>
          </div>
        </div>
      </template>
    </Card>

    <!-- Footer Actions -->
    <div class="flex justify-end gap-3 pt-4">
      <Button variant="outline" @click="router.back()">Cancelar</Button>
      <Button @click="handleSubmit" data-testid="submit-visita-btn">
        <Save class="w-4 h-4 mr-2" />
        Guardar y Finalizar
      </Button>
    </div>
  </div>
</template>
