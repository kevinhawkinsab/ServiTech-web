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
  Save,
  ChevronLeft,
  Calendar,
  Clock,
  Info
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

const form = ref({
  ordenId: '',
  tecnico: authStore.user?.name || '',
  fechaAsignacion: new Date().toISOString().split('T')[0],
  horaVisita: new Date().toISOString().split('T')[1].substring(0, 5),
  tipoVisita: '',
  solicitud: '',
  clienteNombre: '',
  clienteTelefono: '',
  clienteContacto: '',
  clienteTipo: '',
  direccion: '',
  descripcionProblema: '',
  horaEntrada: new Date().toISOString().split('T')[1].substring(0, 5),
  horaSalida: new Date().toISOString().split('T')[1].substring(0, 5),
  resultadoVisita: '',
  recomendaciones: '',
  detallesFacturacion: '',
  inventario: [],
  subtotal: 0,
  iva: 0,
  total: 0,
  firmaCliente: null,
  firmaTecnico: null
})

const ordenId = computed(() => {
  if (route.params.id) {
    const visita = visitasStore.getVisitaById(route.params.id)
    return visita?.ordenId || 'Cargando...'
  }
  return visitasStore.generateOrdenId()
})

form.value.ordenId = ordenId.value

const addInventarioItem = () => {
  form.value.inventario.push({
    descripcion: '',
    cantidad: 1,
    modelo: '',
    serie: '',
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

const clienteCanvasRef = ref(null)
const tecnicoCanvasRef = ref(null)
let clienteSignaturePad = null
let tecnicoSignaturePad = null

onMounted(() => {
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

  if (route.params.id) {
    const visita = visitasStore.getVisitaById(route.params.id)
    if (visita) {
      form.value = { ...form.value, ...visita }
    }
  }
  form.value.ordenId = ordenId.value
})

const clearClienteSignature = () => {
  clienteSignaturePad?.clear()
  form.value.firmaCliente = null
}

const clearTecnicoSignature = () => {
  tecnicoSignaturePad?.clear()
  form.value.firmaTecnico = null
}

watch(form, (newVal) => {
  console.log('Formulario actualizado:', JSON.parse(JSON.stringify(newVal)))
}, { deep: true })

const handleSubmit = () => {
  if (clienteSignaturePad && !clienteSignaturePad.isEmpty()) {
    form.value.firmaCliente = clienteSignaturePad.toDataURL()
  }
  if (tecnicoSignaturePad && !tecnicoSignaturePad.isEmpty()) {
    form.value.firmaTecnico = tecnicoSignaturePad.toDataURL()
  }

  console.log('Formulario de visita técnica (submit):', JSON.parse(JSON.stringify(form.value)))

  if (route.params.id) {
    visitasStore.updateVisita(route.params.id, form.value)
  } else {
    visitasStore.addVisita(form.value)
  }

  router.push({ name: 'historial' })
}
</script>

<template>
  <div class="min-h-screen bg-zinc-50/50 p-4 lg:p-8 w-full max-w-screen-2xl mx-auto" data-testid="registro-visita-page">
    
    <header class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <div class="flex items-center gap-4">
        <Button variant="ghost" size="icon" @click="router.back()" class="rounded-full bg-white shadow-sm border border-zinc-200">
          <ChevronLeft class="w-5 h-5 text-zinc-600" />
        </Button>
        <div>
          <h1 class="text-2xl font-black text-zinc-900 tracking-tight">Registro de Visita Técnica</h1>
          <div class="flex items-center gap-2 text-zinc-500 text-sm">
            <span class="font-mono px-2 py-0.5 rounded text-primary font-bold">#{{ ordenId }}</span>
            <span>•</span>
            <p>Complete los detalles del servicio realizado</p>
          </div>
        </div>
      </div>
      
      <div class="flex items-center gap-3">
        <Button variant="outline" @click="router.back()" class="font-bold border-zinc-300">Descartar</Button>
        <Button @click="handleSubmit" class="bg-zinc-900 text-white font-bold hover:bg-zinc-800" data-testid="submit-visita-btn">
          <Save class="w-4 h-4 mr-2" />
          Finalizar Servicio
        </Button>
      </div>
    </header>

    <div class="grid grid-cols-1 xl:grid-cols-12 gap-8">
      
      <div class="xl:col-span-8 space-y-8">
        
        <Card class="border-none shadow-sm overflow-hidden">
          <div class="p-6">
            <div class="flex items-center gap-3 mb-6 border-b border-zinc-100 pb-4">
              <div class="p-2.5 bg-zinc-900 rounded-xl">
                <FileText class="w-5 h-5 text-white" />
              </div>
              <h2 class="text-lg font-bold text-zinc-800 uppercase tracking-wider">Información General</h2>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div class="space-y-1.5">
                <label class="text-[11px] font-black text-zinc-400 uppercase tracking-widest ml-1">Técnico Responsable</label>
                <Select v-model="form.tecnico" :options="tecnicosOptions" data-testid="visita-tecnico" />
              </div>
              <div class="space-y-1.5">
                <label class="text-[11px] font-black text-zinc-400 uppercase tracking-widest ml-1">Fecha Programada</label>
                <div class="relative">
                  <Calendar class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <Input v-model="form.fechaAsignacion" type="date" class="pl-10" data-testid="visita-fecha-asignacion" />
                </div>
              </div>
              <div class="space-y-1.5">
                <label class="text-[11px] font-black text-zinc-400 uppercase tracking-widest ml-1">Hora Estimada</label>
                <div class="relative">
                  <Clock class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <Input v-model="form.horaVisita" type="time" class="pl-10" data-testid="visita-hora-visita" />
                </div>
              </div>
              <div class="space-y-1.5 md:col-span-2 lg:col-span-1">
                <label class="text-[11px] font-black text-zinc-400 uppercase tracking-widest ml-1">Tipo de Servicio</label>
                <Select v-model="form.tipoVisita" :options="tiposOptions" placeholder="Seleccionar tipo..." data-testid="visita-tipo" />
              </div>
              <div class="md:col-span-2 space-y-1.5">
                <label class="text-[11px] font-black text-zinc-400 uppercase tracking-widest ml-1">Motivo de Solicitud</label>
                <Input v-model="form.solicitud" placeholder="¿Qué solicitó el cliente?" data-testid="visita-solicitud" />
              </div>
            </div>
          </div>
        </Card>

        <Card class="border-none shadow-sm">
          <div class="p-6">
            <div class="flex items-center gap-3 mb-6 border-b border-zinc-100 pb-4">
              <div class="p-2.5 bg-emerald-100 rounded-xl">
                <Clipboard class="w-5 h-5 text-emerald-600" />
              </div>
              <h2 class="text-lg font-bold text-zinc-800 uppercase tracking-wider">Hallazgos Técnicos</h2>
            </div>

            <div class="space-y-6">
              <div class="space-y-1.5">
                <label class="text-[11px] font-black text-zinc-400 uppercase tracking-widest ml-1">Descripción del Problema Detectado</label>
                <textarea v-model="form.descripcionProblema" rows="3" 
                  class="w-full rounded-sm border focus:ring-emerald-500/20 transition-all p-3 text-sm"
                  placeholder="Detalle el estado actual del equipo o instalación..." data-testid="inspeccion-descripcion"></textarea>
              </div>

              <div class="grid grid-cols-2 gap-6">
                <div class="space-y-1.5">
                  <label class="text-[11px] font-black text-zinc-400 uppercase tracking-widest ml-1">Hora de Inicio</label>
                  <Input v-model="form.horaEntrada" type="time" data-testid="inspeccion-hora-entrada" />
                </div>
                <div class="space-y-1.5">
                  <label class="text-[11px] font-black text-zinc-400 uppercase tracking-widest ml-1">Hora de Cierre</label>
                  <Input v-model="form.horaSalida" type="time" data-testid="inspeccion-hora-salida" />
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card class="border-none shadow-sm bg-zinc-900 text-white">
          <div class="p-6">
            <div class="flex items-center gap-3 mb-6">
              <div class="p-2.5 bg-white/10 rounded-xl">
                <Info class="w-5 h-5 text-white" />
              </div>
              <h2 class="text-lg font-bold uppercase tracking-wider">Conclusión del Servicio</h2>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-1.5">
                <label class="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Resultado de visita</label>
                <Input v-model="form.resultadoVisita" class="bg-white/5 border-white/10 text-white placeholder:text-zinc-500" 
                  placeholder="Ej: Operativo / Pendiente repuesto" />
              </div>
              <div class="space-y-1.5">
                <label class="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Observaciones de Facturación</label>
                <Input v-model="form.detallesFacturacion" class="bg-white/5 border-white/10 text-white placeholder:text-zinc-500" 
                  placeholder="Indique si aplica cargos extra..." />
              </div>
              <div class="md:col-span-2 space-y-1.5">
                <label class="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Recomendaciones al Cliente</label>
                <textarea v-model="form.recomendaciones" rows="2" 
                  class="w-full bg-white/5 border-white/10 rounded-xl p-3 text-sm focus:ring-emerald-500/50"
                  placeholder="Sugerencias de mantenimiento..."></textarea>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div class="xl:col-span-4 space-y-8">
        
        <Card class="border-none shadow-sm sticky top-8">
          <div class="p-6">
            <div class="flex items-center gap-3 mb-6 border-b border-zinc-100 pb-4">
              <div class="p-2.5 bg-blue-100 rounded-xl">
                <User class="w-5 h-5 text-blue-600" />
              </div>
              <h2 class="text-lg font-bold text-zinc-800 uppercase tracking-wider">Datos del Cliente</h2>
            </div>

            <div class="space-y-5">
              <div class="space-y-1.5">
                <label class="text-[11px] font-black text-zinc-400 uppercase tracking-widest ml-1">Nombre / Razón Social</label>
                <Input v-model="form.clienteNombre" placeholder="Juan Pérez o Empresa S.A." data-testid="cliente-nombre" />
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-1.5">
                  <label class="text-[11px] font-black text-zinc-400 uppercase tracking-widest ml-1">Teléfono</label>
                  <Input v-model="form.clienteTelefono" placeholder="+56 9..." />
                </div>
                <div class="space-y-1.5">
                  <label class="text-[11px] font-black text-zinc-400 uppercase tracking-widest ml-1">Tipo</label>
                  <Input v-model="form.clienteTipo" placeholder="Empresa/Particular" />
                </div>
              </div>
              <div class="space-y-1.5">
                <label class="text-[11px] font-black text-zinc-400 uppercase tracking-widest ml-1">Persona de Contacto</label>
                <Input v-model="form.clienteContacto" placeholder="Nombre de quien recibe" />
              </div>
              <div class="space-y-1.5">
                <label class="text-[11px] font-black text-zinc-400 uppercase tracking-widest ml-1">Dirección de Servicio</label>
                <Input v-model="form.direccion" placeholder="Calle, Número, Ciudad" />
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div class="xl:col-span-12">
        <Card class="border-none shadow-sm">
          <div class="p-6">
            <div class="flex items-center justify-between mb-6 border-b border-zinc-100 pb-4">
              <div class="flex items-center gap-3">
                <div class="p-2.5 bg-amber-100 rounded-xl">
                  <Package class="w-5 h-5 text-amber-600" />
                </div>
                <h2 class="text-lg font-bold text-zinc-800 uppercase tracking-wider">Materiales y Repuestos</h2>
              </div>
              <Button variant="outline" size="sm" @click="addInventarioItem" class="rounded-lg font-bold border-zinc-300">
                <Plus class="w-4 h-4 mr-1.5" /> Agregar Item
              </Button>
            </div>

            <div class="overflow-hidden border border-zinc-100 rounded-xl">
              <table class="w-full text-left">
                <thead class="bg-zinc-50 border-b border-zinc-100">
                  <tr>
                    <th class="p-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Descripción</th>
                    <th class="p-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest w-32 text-center">Cantidad</th>
                    <th class="p-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Modelo</th>
                    <th class="p-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Serie</th>
                    <th class="p-4 w-16"></th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-zinc-50">
                  <tr v-for="(item, index) in form.inventario" :key="index" class="hover:bg-zinc-50/50 transition-colors">
                    <td class="p-3">
                      <Input v-model="item.descripcion" placeholder="Ej: Cable UTP Cat6" class="border-transparent bg-transparent focus:bg-white" />
                    </td>
                    <td class="p-3">
                      <Input v-model.number="item.cantidad" type="number" @input="updateInventarioItem(index)" class="text-center" />
                    </td>
                    <td class="p-3 text-right">
                     <Input v-model="item.modelo" placeholder="Modelo JKL 10" class="border-transparent bg-transparent focus:bg-white" />
                    </td>
                    <td class="p-3 text-right text-zinc-700">
                      <Input v-model="item.serie" placeholder="Serie X4K52" class="border-transparent bg-transparent focus:bg-white" />
                    </td>
                    <td class="p-3 text-right text-zinc-700">
                      <button @click="removeInventarioItem(index)" class="text-zinc-300 hover:text-red-500 transition-colors">
                        <Trash2 class="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                  <tr v-if="form.inventario.length === 0">
                    <td colspan="5" class="p-12 text-center text-zinc-400 italic text-sm">No se han registrado materiales para este servicio.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      </div>

      <div class="xl:col-span-12">
        <Card class="border-none shadow-sm">
          <div class="p-6">
            <div class="flex items-center gap-3 mb-8 border-b border-zinc-100 pb-4">
              <div class="p-2.5 bg-red-100 rounded-xl">
                <PenTool class="w-5 h-5 text-red-600" />
              </div>
              <h2 class="text-lg font-bold text-zinc-800 uppercase tracking-wider">Formalización</h2>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div class="space-y-3">
                <div class="flex justify-between items-end px-1">
                  <label class="text-[11px] font-black text-zinc-400 uppercase tracking-widest">Firma del Cliente</label>
                  <Button variant="ghost" size="sm" @click="clearClienteSignature" class="text-red-500 hover:bg-red-50 h-7 text-[10px] font-bold">REINICIAR</Button>
                </div>
                <div class="border-2 border-dashed border-zinc-200 rounded-2xl overflow-hidden bg-white">
                  <canvas ref="clienteCanvasRef" height="180" class="w-full cursor-crosshair"></canvas>
                </div>
                <p class="text-center text-[10px] text-zinc-400 italic">Al firmar, el cliente acepta el servicio realizado</p>
              </div>

              <div class="space-y-3">
                <div class="flex justify-between items-end px-1">
                  <label class="text-[11px] font-black text-zinc-400 uppercase tracking-widest">Firma del Técnico</label>
                  <Button variant="ghost" size="sm" @click="clearTecnicoSignature" class="text-red-500 hover:bg-red-50 h-7 text-[10px] font-bold">REINICIAR</Button>
                </div>
                <div class="border-2 border-dashed border-zinc-200 rounded-2xl overflow-hidden bg-white">
                  <canvas ref="tecnicoCanvasRef" height="180" class="w-full cursor-crosshair"></canvas>
                </div>
                <p class="text-center text-[10px] text-zinc-400 italic">Firma de validación interna</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>

    <div class="flex justify-end gap-4 mt-12 pb-12">
      <Button variant="outline" size="lg" @click="router.back()" class="font-bold border-zinc-300 px-8">Cancelar</Button>
      <Button size="lg" @click="handleSubmit" class="bg-primary text-white font-bold hover:bg-zinc-800 hover:translate-y-[-2px] transition-all">
        <Save class="w-5 h-5 mr-2" />
        GUARDAR
      </Button>
    </div>
  </div>
</template>

<style scoped>
/* Eliminar spinners de inputs numéricos */
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

canvas {
  touch-action: none; /* Mejor soporte para tablets/móviles */
}

.sticky {
  position: sticky;
  top: 2rem;
}
</style>