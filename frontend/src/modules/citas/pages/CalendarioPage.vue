<script setup>
import { ref, computed, onMounted } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { useCitasStore } from '../../../stores/citas'
import { useVisitasStore } from '../../../stores/visitas'
import { useAuthStore } from '../../../stores/auth'
import Card from '../../../components/ui/Card.vue'
import Badge from '../../../components/ui/Badge.vue'
import CitaModal from '../components/CitaModal.vue'
import { GripVertical, AlertCircle } from 'lucide-vue-next'
import draggable from 'vuedraggable'

const citasStore = useCitasStore()
const visitasStore = useVisitasStore()
const authStore = useAuthStore()

// Modal state
const showCitaModal = ref(false)
const selectedCita = ref(null)
const prefillDate = ref('')
const prefillTime = ref('')

// Calendar events
const calendarEvents = computed(() => {
  return citasStore.citas.map(cita => ({
    id: cita.id,
    title: cita.asunto,
    start: `${cita.fecha}T${cita.hora}`,
    extendedProps: { ...cita },
    backgroundColor: getEventColor(cita.estado),
    borderColor: getEventColor(cita.estado)
  }))
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

// Calendar options
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

// Tareas pendientes para drag & drop
const tareasPendientes = computed(() => citasStore.tareasPendientes)

// Handlers
const handleDateClick = (info) => {
  // Click en día vacío -> abrir modal con fecha prellenada
  prefillDate.value = info.dateStr
  prefillTime.value = '09:00'
  selectedCita.value = null
  showCitaModal.value = true
}

const handleEventClick = (info) => {
  // Click en evento -> abrir modal con datos
  const cita = citasStore.getCitaById(info.event.id)
  if (cita) {
    selectedCita.value = { ...cita }
    showCitaModal.value = true
  }
}

const handleEventDrop = (info) => {
  // Arrastrar evento existente a nueva fecha
  const newDate = info.event.startStr.split('T')[0]
  const newTime = info.event.startStr.split('T')[1]?.substring(0, 5) || '09:00'
  
  citasStore.updateCita(info.event.id, {
    fecha: newDate,
    hora: newTime
  })
  
  console.log('Cita movida:', {
    id: info.event.id,
    nuevaFecha: newDate,
    nuevaHora: newTime
  })
}

const handleExternalDrop = (info) => {
  // Tarea soltada en calendario
  console.log('Drop externo detectado:', info)
}

const handleEventReceive = (info) => {
  // Cuando se recibe un evento externo
  const taskId = info.event.extendedProps?.taskId
  if (taskId) {
    const tarea = citasStore.tareasPendientes.find(t => t.id === taskId)
    if (tarea) {
      const fecha = info.event.startStr.split('T')[0]
      const hora = info.event.startStr.split('T')[1]?.substring(0, 5) || '09:00'
      
      // Convertir tarea a cita
      citasStore.convertTareaToCita(
        tarea,
        fecha,
        hora,
        visitasStore.tecnicos[0]?.id || 'TEC-001',
        visitasStore.tecnicos[0]?.nombre || 'Técnico Asignado'
      )
      
      // Remover el evento temporal creado por FullCalendar
      info.event.remove()
    }
  }
}

const handleSaveCita = (citaData) => {
  if (selectedCita.value?.id) {
    citasStore.updateCita(selectedCita.value.id, citaData)
  } else {
    citasStore.addCita(citaData)
  }
  showCitaModal.value = false
}

const getPrioridadBadge = (prioridad) => {
  const variants = {
    alta: 'destructive',
    media: 'warning',
    baja: 'secondary'
  }
  return variants[prioridad] || 'secondary'
}

// Drag start for external events
const handleDragStart = (event, tarea) => {
  event.dataTransfer.setData('text/plain', JSON.stringify({
    taskId: tarea.id,
    title: tarea.titulo,
    tipo: tarea.tipo
  }))
}
</script>

<template>
  <div class="space-y-4" data-testid="calendario-page">
    <!-- Header -->
    <div>
      <h1 class="font-heading text-2xl font-bold text-zinc-900">Calendario de Citas</h1>
      <p class="text-sm text-zinc-500">Arrastra tareas pendientes al calendario para programar citas</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-4 gap-4">
      <!-- Tareas Pendientes - Sidebar -->
      <Card title="Tareas Pendientes" class="lg:col-span-1" data-testid="tareas-pendientes">
        <template #header-actions>
          <Badge>{{ tareasPendientes.length }}</Badge>
        </template>
        
        <div class="space-y-2">
          <p v-if="tareasPendientes.length === 0" class="text-sm text-zinc-500 text-center py-4">
            No hay tareas pendientes
          </p>
          
          <div
            v-for="tarea in tareasPendientes"
            :key="tarea.id"
            class="fc-event p-3 bg-zinc-50 border border-zinc-200 rounded-lg cursor-grab hover:bg-zinc-100 hover:border-primary/50 transition-all"
            draggable="true"
            @dragstart="handleDragStart($event, tarea)"
            :data-event="JSON.stringify({ title: tarea.titulo, taskId: tarea.id, duration: '01:00' })"
            :data-testid="`tarea-${tarea.id}`"
          >
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
    <CitaModal
      v-model="showCitaModal"
      :cita="selectedCita"
      :prefill-date="prefillDate"
      :prefill-time="prefillTime"
      @save="handleSaveCita"
    />
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
