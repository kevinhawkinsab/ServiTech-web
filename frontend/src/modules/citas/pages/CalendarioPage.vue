<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin, { Draggable } from '@fullcalendar/interaction'
import { useCitasStore } from '../../../stores/citas'
import { useVisitasStore } from '../../../stores/visitas'
import { useAuthStore } from '../../../stores/auth'
import Card from '../../../components/ui/Card.vue'
import Badge from '../../../components/ui/Badge.vue'
import CitaModal from '../components/CitaModal.vue'
import {
  GripVertical,
  AlertCircle,
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  Users,
  TrendingUp,
  MoreVertical
} from 'lucide-vue-next'

const citasStore = useCitasStore()
const visitasStore = useVisitasStore()
const authStore = useAuthStore()

const showCitaModal = ref(false)
const selectedCita = ref(null)
const prefillDate = ref('')
const prefillTime = ref('')
const tempTaskId = ref(null)
const externalEventsRef = ref(null)
let draggableInstance = null

const kpis = computed(() => {
  const hoy = new Date().toISOString().split('T')[0]
  return [
    {
      label: 'Citas Programadas',
      value: citasStore.citas.length,
      icon: CalendarIcon,
      color: 'text-blue-600',
      bg: 'bg-blue-50'
    },
    {
      label: 'Tareas en Backlog',
      value: citasStore.tareasPendientes.length,
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50'
    },
    {
      label: 'Citas para Hoy',
      value: citasStore.citas.filter(c => c.fecha === hoy).length,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50'
    },
    {
      label: 'Técnicos Activos',
      value: visitasStore.tecnicos.length,
      icon: Users,
      color: 'text-purple-600',
      bg: 'bg-purple-50'
    },
    {
      label: 'Citas para Hoy',
      value: citasStore.citas.filter(c => c.fecha === hoy).length,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50'
    },
    {
      label: 'Técnicos Activos',
      value: visitasStore.tecnicos.length,
      icon: Users,
      color: 'text-purple-600',
      bg: 'bg-purple-50'
    }
  ]
})

const getEventColor = (estado) => {
  const colors = {
    pendiente: '#fbbf24',
    confirmada: '#3b82f6',
    completada: '#22c55e',
    cancelada: '#ef4444'
  }
  return colors[estado] || '#71717a'
}

const getPrioridadBadge = (prioridad) => {
  if (!prioridad) return 'secondary'
  const p = String(prioridad).toLowerCase()
  if (p === 'alta') return 'destructive'
  if (p === 'media') return 'warning'
  return 'secondary'
}

const calendarEvents = computed(() =>
  citasStore.citas.map(cita => ({
    id: cita.id,
    title: cita.asunto,
    start: `${cita.fecha}T${cita.hora}`,
    extendedProps: { ...cita },
    backgroundColor: getEventColor(cita.estado),
    borderColor: getEventColor(cita.estado)
  }))
)

const tareasPendientes = computed(() => citasStore.tareasPendientes)

const handleDateClick = (info) => {
  const dateStr = info.dateStr || (info.date && info.date.toISOString().split('T')[0]) || ''
  prefillDate.value = dateStr
  prefillTime.value = '09:00'
  selectedCita.value = null
  tempTaskId.value = null
  showCitaModal.value = true
}

const handleEventClick = (info) => {
  const cita = citasStore.getCitaById(info.event.id)
  if (cita) {
    selectedCita.value = { ...cita }
    tempTaskId.value = null
    showCitaModal.value = true
  }
}

const handleEventDrop = (info) => {
  const start = info.event.start
  const newDate = start ? start.toISOString().split('T')[0] : info.event.startStr.split('T')[0]
  const newTime = start ? start.toISOString().split('T')[1].substring(0, 5) : (info.event.startStr?.split('T')[1]?.substring(0, 5) || '09:00')
  citasStore.updateCita(info.event.id, { fecha: newDate, hora: newTime })
}

const handleExternalDrop = (info) => {
  try {
    const dt = info.jsEvent?.dataTransfer
    if (dt) {
      const raw = dt.getData('text/plain')
      if (raw) {
        const parsed = JSON.parse(raw)
        const fecha = info.date ? info.date.toISOString().split('T')[0] : (info.dateStr || '')
        const hora = parsed.hora || '09:00'
        tempTaskId.value = parsed.taskId || null
        const tarea = citasStore.tareasPendientes.find(t => t.id === parsed.taskId)
        selectedCita.value = {
          asunto: parsed.title || tarea?.titulo || '',
          fecha,
          hora,
          clienteNombre: tarea?.clienteNombre || '',
          tipo: tarea?.tipo || '',
          prioridad: tarea?.prioridad || '',
          tecnicoId: visitasStore.tecnicos[0]?.id || '',
          tecnicoNombre: visitasStore.tecnicos[0]?.nombre || ''
        }
        prefillDate.value = fecha
        prefillTime.value = hora
        showCitaModal.value = true
      }
    }
  } catch (err) {
    console.warn(err)
  }
}

const handleEventReceive = (info) => {
  const taskId = info.event.extendedProps?.taskId || null
  const start = info.event.start
  const fecha = start ? start.toISOString().split('T')[0] : (info.event.startStr?.split('T')[0] || '')
  const hora = start ? start.toISOString().split('T')[1].substring(0, 5) : (info.event.startStr?.split('T')[1]?.substring(0, 5) || '09:00')

  if (taskId) {
    const tarea = citasStore.tareasPendientes.find(t => t.id === taskId)
    selectedCita.value = {
      asunto: tarea?.titulo || info.event.title || '',
      fecha,
      hora,
      clienteNombre: tarea?.clienteNombre || '',
      tipo: tarea?.tipo || '',
      prioridad: tarea?.prioridad || '',
      estado: 'pendiente',
      tecnicoId: visitasStore.tecnicos[0]?.id || '',
      tecnicoNombre: visitasStore.tecnicos[0]?.nombre || ''
    }
    tempTaskId.value = taskId
    prefillDate.value = fecha
    prefillTime.value = hora
    showCitaModal.value = true
    try { info.event.remove() } catch (e) { }
  }
}

const handleSaveCita = (citaData) => {
  if (selectedCita.value && selectedCita.value.id) {
    citasStore.updateCita(selectedCita.value.id, citaData)
  } else if (tempTaskId.value) {
    const tarea = citasStore.tareasPendientes.find(t => t.id === tempTaskId.value)
    if (tarea) {
      citasStore.convertTareaToCita(
        tarea,
        citaData.fecha,
        citaData.hora,
        citaData.tecnicoId || visitasStore.tecnicos[0]?.id || 'TEC-001',
        citaData.tecnicoNombre || visitasStore.tecnicos[0]?.nombre || 'Técnico Asignado'
      )
    }
  } else {
    citasStore.addCita(citaData)
  }
  showCitaModal.value = false
  selectedCita.value = null
  tempTaskId.value = null
}

const handleDragStart = (event, tarea) => {
  try {
    event.dataTransfer.setData('text/plain', JSON.stringify({
      taskId: tarea.id,
      title: tarea.titulo,
      tipo: tarea.tipo,
      hora: tarea.hora || '09:00'
    }))
  } catch (e) { }
}

const calendarOptions = computed(() => ({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
  initialView: 'dayGridMonth',
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,timeGridDay'
  },
  locale: 'es',
  events: calendarEvents.value,
  editable: true,
  droppable: true,
  eventDrop: handleEventDrop,
  eventClick: handleEventClick,
  dateClick: handleDateClick,
  drop: handleExternalDrop,
  eventReceive: handleEventReceive,
  height: 'auto',
  buttonText: { today: 'Hoy', month: 'Mes', week: 'Semana', day: 'Día' }
}))

onMounted(() => {
  if (externalEventsRef.value) {
    draggableInstance = new Draggable(externalEventsRef.value, {
      itemSelector: '.fc-event',
      eventData: (eventEl) => {
        const raw = eventEl.getAttribute('data-event')
        return raw ? JSON.parse(raw) : { title: eventEl.innerText.trim() }
      }
    })
  }
})

onUnmounted(() => {
  if (draggableInstance && typeof draggableInstance.destroy === 'function') {
    draggableInstance.destroy()
  }
})
</script>

<template>
  <div class="p-6 space-y-8 bg-zinc-50/50 min-h-screen font-sans">

    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-lg font-black text-zinc-900 tracking-tight">Agenda de Visitas</h1>
        <p class="text-sm text-zinc-500">Panel administrativo y programación técnica</p>
      </div>
      <div class="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-zinc-200 shadow-sm">
        <div class="flex -space-x-2">
          <div v-for="i in 3" :key="i" class="w-8 h-8 rounded-full border-2 border-white bg-zinc-200 flex items-center justify-center text-[10px] font-bold text-zinc-600">
            TEC
          </div>
        </div>
        <span class="text-xs text-zinc-500 ml-2 font-medium">Equipo activo</span>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      <div class="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div v-for="kpi in kpis" :key="kpi.label"
        class="bg-white px-4 py-3 rounded-xl border border-zinc-200 shadow-sm hover:shadow-md transition-all duration-300 group">
        <div class="flex justify-between items-start mb-2">
          <div>
            <h3 class="text-2xl font-black text-zinc-800 group-hover:text-zinc-900 transition-colors">
              {{ kpi.value }}
            </h3>
            <p class="text-xs font-semibold text-zinc-500 mt-1 uppercase tracking-tight">
              {{ kpi.label }}
            </p>
          </div>

          <div :class="[
            kpi.bg,
            kpi.color,
            'p-3 rounded-xl shadow-sm group-hover:scale-110 transition-transform duration-300'
          ]">
            <component :is="kpi.icon" class="w-4 h-4" />
          </div>
        </div>

        <div class="mt-5 pt-4 border-t border-zinc-100 flex justify-between items-center">
          <div class="flex items-center gap-1.5">
            <span class="text-xs font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">
              +12%
            </span>
            <span class="text-[11px] text-zinc-400 font-medium">vs último mes</span>
          </div>
        </div>
      </div>
      </div>

      <div class="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm flex flex-col justify-between">
        <div class="flex justify-between items-center mb-6">
          <h4 class="text-sm font-bold text-zinc-800 uppercase tracking-tight">Rendimiento Semanal</h4>
          <Badge variant="outline" class="text-[10px] uppercase font-bold text-zinc-400">Esta semana</Badge>
        </div>
        
        <div class="space-y-4 flex-1 flex flex-col justify-center">
          <div v-for="(stat, idx) in [
            { name: 'Citas', val: 85, color: 'bg-blue-500' },
            { name: 'Completadas', val: 62, color: 'bg-emerald-500' },
            { name: 'Pendientes', val: 45, color: 'bg-amber-500' }
          ]" :key="idx">
            <div class="flex justify-between text-[11px] font-bold text-zinc-500 mb-1.5 uppercase tracking-tighter">
              <span>{{ stat.name }}</span>
              <span>{{ stat.val }}%</span>
            </div>
            <div class="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
              <div :class="[stat.color, 'h-full rounded-full transition-all duration-1000']" :style="{ width: stat.val + '%' }"></div>
            </div>
          </div>
        </div>

        <div class="mt-6 pt-4 border-t border-zinc-50 flex items-center justify-between">
          <p class="text-[11px] text-zinc-400 font-medium">Eficiencia operativa aumentada un <span class="text-emerald-500 font-bold">+15%</span></p>
        </div>
      </div>
    </div>

    <section class="space-y-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <h2 class="text-base font-extrabold text-zinc-800 tracking-tight">Tareas Pendientes</h2>
          <span class="bg-zinc-800 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg shadow-zinc-200">
            {{ tareasPendientes.length }}
          </span>
        </div>
        <div class="flex items-center gap-2">
          <div class="flex items-center gap-1.5 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
            <AlertCircle class="w-3.5 h-3.5 text-blue-600" />
            <span class="text-[11px] text-blue-800 font-bold font-sans">Arrastra al calendario</span>
          </div>
        </div>
      </div>

      <div ref="externalEventsRef" class="flex gap-4 overflow-x-auto pb-6 scrollbar-hide px-1">
        <div v-if="tareasPendientes.length === 0"
          class="w-full py-10 flex flex-col items-center justify-center bg-white rounded-2xl border-2 border-dashed border-zinc-100 text-zinc-400">
          <AlertCircle class="w-8 h-8 mb-2 opacity-20" />
          <p class="text-sm font-medium">No hay tareas en el backlog</p>
        </div>

        <div v-for="tarea in tareasPendientes" :key="tarea.id"
          class="fc-event flex-shrink-0 w-72 bg-white rounded-xl shadow-sm border border-zinc-200 transition-all duration-200 hover:shadow-md hover:border-blue-400 cursor-grab active:cursor-grabbing group relative overflow-hidden"
          draggable="true" @dragstart="handleDragStart($event, tarea)"
          :data-event="JSON.stringify({ title: tarea.titulo, taskId: tarea.id, duration: '01:00' })">
          
          <div :class="[
            tarea.prioridad === 'Alta' ? 'bg-red-500' :
              tarea.prioridad === 'Media' ? 'bg-amber-500' : 'bg-emerald-500',
            'absolute left-0 top-0 bottom-0 w-1.5'
          ]"></div>

          <div class="p-4 pl-5">
            <div class="flex justify-between items-start mb-2">
              <div class="min-w-0 flex-1">
                <p class="text-[13px] font-black text-zinc-900 leading-tight truncate group-hover:text-blue-600 transition-colors">
                  {{ tarea.titulo }}
                </p>
              </div>
              <GripVertical class="w-4 h-4 text-zinc-300 group-hover:text-zinc-400 transition-colors flex-shrink-0 ml-2" />
            </div>

            <div class="flex items-center gap-2 mb-4">
              <div class="w-6 h-6 rounded-full bg-zinc-100 flex items-center justify-center border border-zinc-200 flex-shrink-0 overflow-hidden">
                <div class="w-full h-full bg-zinc-200 animate-pulse" v-if="false"></div>
                <span class="text-[10px] font-bold text-zinc-500 uppercase">{{ tarea.clienteNombre.charAt(0) }}</span>
              </div>
              <p class="text-xs text-zinc-600 font-semibold truncate">{{ tarea.clienteNombre }}</p>
            </div>

            <div class="flex items-center justify-between pt-3 border-t border-zinc-50">
              <Badge variant="secondary" class="bg-zinc-100 text-zinc-500 border-none text-[9px] px-1.5 py-0 font-bold uppercase tracking-tighter">
                {{ tarea.tipo }}
              </Badge>
              <div class="flex items-center gap-1">
                <div :class="[
                  tarea.prioridad === 'Alta' ? 'bg-red-100 text-red-600' : 
                  tarea.prioridad === 'Media' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600',
                  'text-[9px] font-black italic px-1.5 rounded uppercase'
                ]">
                  {{ tarea.prioridad }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <div class="bg-white p-6 rounded-3xl border border-zinc-100 shadow-xl shadow-zinc-200/50 overflow-hidden transition-all duration-500">
      <FullCalendar :options="calendarOptions" />
    </div>

    <CitaModal v-model="showCitaModal" :cita="selectedCita" :prefill-date="prefillDate" :prefill-time="prefillTime"
      @save="handleSaveCita" />
  </div>
</template>

<style>
/* --- Estilos Globales de FullCalendar Refinados --- */
.fc {
  --fc-border-color: #f1f1f4; /* Bordes muy sutiles */
  --fc-daygrid-event-dot-width: 5px;
  --fc-today-bg-color: #f8fafc; /* Azul casi imperceptible */
  --fc-page-bg-color: #ffffff;
  --fc-neutral-bg-color: #ffffff;
  --fc-list-event-hover-bg-color: #f4f4f5;
  font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
}

/* 1. Limpieza de Bordes y Contenedor Principal */
.fc-theme-standard td, 
.fc-theme-standard th,
.fc-theme-standard .fc-scrollgrid {
  border: 1px solid #f1f1f4 !important;
}

.fc-scrollgrid {
  border-radius: 12px;
  overflow: hidden;
  border: none !important;
}

/* 2. Cabecera (Título y Navegación) */
.fc .fc-toolbar {
  margin-bottom: 2rem !important;
  display: flex;
  align-items: center;
}

.fc .fc-toolbar-title {
  font-size: 1.25rem !important;
  font-weight: 700 !important;
  color: #1e293b;
  text-transform: lowercase; /* Como en tu imagen de referencia */
}

/* 3. Botones (Estilo Minimalista Moderno) */
.fc .fc-button {
  background: #ffffff !important;
  border: 1px solid #e2e8f0 !important;
  color: #64748b !important;
  font-weight: 500 !important;
  font-size: 0.8rem !important;
  padding: 0.5rem 1rem !important;
  border-radius: 10px !important; /* Más redondeados */
  transition: all 0.2s ease;
  box-shadow: none !important;
  text-transform: capitalize !important;
}

.fc .fc-button:hover {
  background: #f8fafc !important;
  color: #1e293b !important;
}

.fc .fc-button-active {
  background: #f1f5f9 !important; /* Gris muy suave para el estado activo */
  color: #0f172a !important;
  border-color: #e2e8f0 !important;
  font-weight: 700 !important;
}

/* 4. Cabeceras de los Días (lun, mar, mié...) */
.fc th {
  border: none !important;
  padding: 1rem 0 !important;
}

.fc-col-header-cell-cushion {
  color: #94a3b8 !important; /* Gris suave */
  font-weight: 500 !important;
  font-size: 0.85rem !important;
  text-decoration: none !important;
  text-transform: lowercase;
}

/* 5. Celdas de Días y Números */
.fc-daygrid-day-number {
  color: #64748b !important;
  font-size: 0.8rem !important;
  font-weight: 500 !important;
  padding: 8px 12px !important;
  text-decoration: none !important;
}

.fc-event-title {
  font-weight: 600 !important;
  font-size: 0.75rem !important;
  padding: 0 4px;
}

/* --- Tus utilidades previas --- */
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

.scrollbar-hide {
  -ms-overflow-style: none;
  scroll-width: none;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.fc-event, .bg-white {
  animation: fadeIn 0.4s ease-out forwards;
}
</style>