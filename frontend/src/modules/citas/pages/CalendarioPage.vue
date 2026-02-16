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
import { GripVertical, AlertCircle } from 'lucide-vue-next'

const citasStore = useCitasStore()
const visitasStore = useVisitasStore()
const authStore = useAuthStore()

// Refs / estado
const showCitaModal = ref(false)
const selectedCita = ref(null)
const prefillDate = ref('')
const prefillTime = ref('')
const tempTaskId = ref(null)

// Referencia al contenedor de eventos externos (para Draggable)
const externalEventsRef = ref(null)
let draggableInstance = null

// Helpers
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
  // Ajusta según tus variantes reales (este devuelve 'destructive'/'warning' según tu store/ui)
  if (!prioridad) return 'secondary'
  const p = String(prioridad).toLowerCase()
  if (p === 'alta') return 'destructive'
  if (p === 'media') return 'warning'
  return 'secondary'
}

// Eventos del calendario (reactivos)
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

// ---- Handlers (deben estar definidos antes de usar en calendarOptions) ----
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

  citasStore.updateCita(info.event.id, {
    fecha: newDate,
    hora: newTime
  })

  console.log('Cita movida:', { id: info.event.id, nuevaFecha: newDate, nuevaHora: newTime })
}

const handleExternalDrop = (info) => {
  // Fallback (si algún navegador no integra Draggable de FullCalendar)
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
    console.warn('handleExternalDrop fallback error:', err)
  }
}

const handleEventReceive = (info) => {
  // FullCalendar ha convertido el elemento externo a evento y lo entrega aquí
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

    // también actualizar prefill (por si el modal usa esos props)
    prefillDate.value = fecha
    prefillTime.value = hora

    showCitaModal.value = true

    // removemos el evento temporal (recrearemos al guardar)
    try { info.event.remove() } catch (e) { /* ignore */ }
  } else {
    // sin taskId: abrir modal con los datos mínimos
    selectedCita.value = {
      asunto: info.event.title || '',
      fecha,
      hora,
      clienteNombre: '',
      tipo: '',
      prioridad: '',
      tecnicoId: visitasStore.tecnicos[0]?.id || '',
      tecnicoNombre: visitasStore.tecnicos[0]?.nombre || ''
    }
    tempTaskId.value = null
    prefillDate.value = fecha
    prefillTime.value = hora
    showCitaModal.value = true
    try { info.event.remove() } catch (e) { /* ignore */ }
  }
}

const handleSaveCita = (citaData) => {
  if (selectedCita.value && selectedCita.value.id) {
    citasStore.updateCita(selectedCita.value.id, citaData)
    tempTaskId.value = null
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
      // Si quieres que se copien otros campos (clienteNombre, prioridad, etc.)
      // asegúrate de que convertTareaToCita lo soporte, o busca la cita creada y actualízala.
    }
    tempTaskId.value = null
  } else {
    citasStore.addCita(citaData)
  }

  showCitaModal.value = false
  selectedCita.value = null
}

const handleDragStart = (event, tarea) => {
  try {
    event.dataTransfer.setData('text/plain', JSON.stringify({
      taskId: tarea.id,
      title: tarea.titulo,
      tipo: tarea.tipo,
      hora: tarea.hora || '09:00'
    }))
  } catch (e) {
    // ignore
  }
}

// ---- Ahora definimos calendarOptions (usa los handlers ya declarados) ----
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
  buttonText: {
    today: 'Hoy',
    month: 'Mes',
    week: 'Semana',
    day: 'Día'
  }
}))

// Inicializar Draggable para FullCalendar (external events)
onMounted(() => {
  if (externalEventsRef.value) {
    try {
      draggableInstance = new Draggable(externalEventsRef.value, {
        itemSelector: '.fc-event',
        eventData: (eventEl) => {
          const raw = eventEl.getAttribute('data-event')
          if (!raw) {
            return { title: eventEl.innerText.trim() }
          }
          try {
            return JSON.parse(raw)
          } catch (e) {
            return { title: eventEl.innerText.trim() }
          }
        }
      })
    } catch (err) {
      console.warn('Draggable init failed:', err)
    }
  }
})

onUnmounted(() => {
  try {
    if (draggableInstance && typeof draggableInstance.destroy === 'function') {
      draggableInstance.destroy()
    }
  } catch (e) { /* ignore */ }
})
</script>

<template>
  <div class="space-y-4" data-testid="calendario-page">
    <!-- Header -->
    <div>
      <h1 class="font-heading text-lg font-bold text-zinc-900">Calendario de Citas</h1>
      <p class="text-sm text-zinc-500">Arrastra tareas pendientes al calendario para programar citas</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-4 gap-4">
      <!-- Tareas Pendientes - Sidebar -->
      <Card title="Tareas Pendientes" class="lg:col-span-1" data-testid="tareas-pendientes">
        <template #header-actions>
          <Badge>{{ tareasPendientes.length }}</Badge>
        </template>

        <!-- Contenedor con ref para Draggable -->
        <div ref="externalEventsRef" class="space-y-2">
          <p v-if="tareasPendientes.length === 0" class="text-sm text-zinc-500 text-center py-4">
            No hay tareas pendientes
          </p>

          <div v-for="tarea in tareasPendientes" :key="tarea.id"
            class="fc-event p-3 bg-zinc-50 border border-zinc-200 rounded-lg cursor-grab hover:bg-zinc-100 hover:border-primary/50 transition-all"
            draggable="true" @dragstart="handleDragStart($event, tarea)"
            :data-event="JSON.stringify({ title: tarea.titulo, taskId: tarea.id, duration: '01:00' })"
            :data-testid="`tarea-${tarea.id}`">
            <div class="flex items-start gap-2">
              <GripVertical class="w-4 h-4 text-zinc-400 mt-0.5 flex-shrink-0" />
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-zinc-900 truncate">{{ tarea.titulo }}</p>
                <p class="text-xs text-zinc-500 truncate">{{ tarea.clienteNombre }}</p>
                <div class="flex items-center gap-2 mt-1.5">
                  <Badge variant="outline" class="text-xs">{{ tarea.tipo }}</Badge>
                  <Badge :variant="getPrioridadBadge(tarea.prioridad)" class="text-xs">
                    {{ tarea.prioridad }}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-4 p-3 bg-blue-50 rounded-lg">
          <div class="flex gap-2">
            <AlertCircle class="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <p class="text-xs text-blue-700">
              Arrastra las tareas al calendario para crear citas automáticamente
            </p>
          </div>
        </div>
      </Card>

      <!-- Calendar -->
      <Card class="lg:col-span-3" data-testid="fullcalendar">
        <FullCalendar :options="calendarOptions" />
      </Card>
    </div>

    <!-- Modal -->
    <CitaModal v-model="showCitaModal" :cita="selectedCita" :prefill-date="prefillDate" :prefill-time="prefillTime"
      @save="handleSaveCita" />
  </div>
</template>

<style>
/* FullCalendar overrides */
.fc .fc-toolbar-title {
  font-family: 'Manrope', sans-serif;
  font-size: 1.25rem;
  font-weight: 600;
}

.fc .fc-button {
  font-size: 0.875rem;
  padding: 0.375rem 0.75rem;
}

.fc .fc-daygrid-day-number {
  font-size: 0.875rem;
  padding: 0.5rem;
}

.fc .fc-event {
  font-size: 0.75rem;
  padding: 2px 4px;
  cursor: pointer;
}

.fc .fc-event:hover {
  opacity: 0.9;
}
</style>
