import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// Dummy data
const INITIAL_CITAS = [
  {
    id: 'CIT-001',
    tipo: 'Mantenimiento Preventivo',
    asunto: 'Revisión anual de tanque principal',
    clienteId: 'CLI-001',
    clienteNombre: 'Industrias Acme S.A.',
    tecnicoId: 'TEC-001',
    tecnicoNombre: 'Juan Técnico',
    tanqueId: 'TNK-001',
    fecha: '2026-02-18',
    hora: '09:00',
    estado: 'pendiente',
    observaciones: 'Cliente solicita inspección completa'
  },
  {
    id: 'CIT-002',
    tipo: 'Reparación',
    asunto: 'Fuga detectada en válvula',
    clienteId: 'CLI-002',
    clienteNombre: 'Metalúrgica del Norte',
    tecnicoId: 'TEC-002',
    tecnicoNombre: 'Pedro Martínez',
    tanqueId: 'TNK-005',
    fecha: '2026-02-19',
    hora: '14:00',
    estado: 'confirmada',
    observaciones: 'Urgente - producción detenida'
  },
  {
    id: 'CIT-003',
    tipo: 'Inspección',
    asunto: 'Certificación anual',
    clienteId: 'CLI-003',
    clienteNombre: 'Química Industrial',
    tecnicoId: 'TEC-001',
    tecnicoNombre: 'Juan Técnico',
    tanqueId: null,
    fecha: '2026-02-20',
    hora: '10:30',
    estado: 'pendiente',
    observaciones: ''
  },
  {
    id: 'CIT-004',
    tipo: 'Instalación',
    asunto: 'Instalación de nuevo medidor',
    clienteId: 'CLI-004',
    clienteNombre: 'Transportes Unidos',
    tecnicoId: 'TEC-003',
    tecnicoNombre: 'Ana García',
    tanqueId: 'TNK-012',
    fecha: '2026-02-17',
    hora: '08:00',
    estado: 'completada',
    observaciones: 'Equipo entregado al cliente'
  },
  {
    id: 'CIT-005',
    tipo: 'Mantenimiento Correctivo',
    asunto: 'Cambio de filtros',
    clienteId: 'CLI-005',
    clienteNombre: 'Alimentos del Sur',
    tecnicoId: 'TEC-002',
    tecnicoNombre: 'Pedro Martínez',
    tanqueId: 'TNK-008',
    fecha: '2026-02-21',
    hora: '11:00',
    estado: 'cancelada',
    observaciones: 'Cliente reprogramó para siguiente semana'
  }
]

const TAREAS_PENDIENTES = [
  {
    id: 'TASK-001',
    tipo: 'Mantenimiento',
    titulo: 'Revisión bomba hidráulica',
    clienteNombre: 'Petrolera Central',
    prioridad: 'alta'
  },
  {
    id: 'TASK-002',
    tipo: 'Inspección',
    titulo: 'Inspección semestral',
    clienteNombre: 'Gas Natural SA',
    prioridad: 'media'
  },
  {
    id: 'TASK-003',
    tipo: 'Reparación',
    titulo: 'Reemplazo de juntas',
    clienteNombre: 'Industria Pesada',
    prioridad: 'baja'
  }
]

export const useCitasStore = defineStore('citas', () => {
  const citas = ref([...INITIAL_CITAS])
  const tareasPendientes = ref([...TAREAS_PENDIENTES])

  const citasPendientes = computed(() => 
    citas.value.filter(c => c.estado === 'pendiente')
  )

  const citasConfirmadas = computed(() => 
    citas.value.filter(c => c.estado === 'confirmada')
  )

  const citasCompletadas = computed(() => 
    citas.value.filter(c => c.estado === 'completada')
  )

  const citasCanceladas = computed(() => 
    citas.value.filter(c => c.estado === 'cancelada')
  )

  const getCitaById = (id) => {
    return citas.value.find(c => c.id === id)
  }

  const getCitasByFecha = (fecha) => {
    return citas.value.filter(c => c.fecha === fecha)
  }

  const getCitasByTecnico = (tecnicoId) => {
    return citas.value.filter(c => c.tecnicoId === tecnicoId)
  }

  const addCita = (citaData) => {
    const newId = `CIT-${String(citas.value.length + 1).padStart(3, '0')}`
    const newCita = {
      id: newId,
      ...citaData,
      estado: citaData.estado || 'pendiente'
    }
    citas.value.push(newCita)
    console.log('Nueva cita creada:', newCita)
    return newCita
  }

  const updateCita = (id, updates) => {
    const index = citas.value.findIndex(c => c.id === id)
    if (index !== -1) {
      citas.value[index] = { ...citas.value[index], ...updates }
      console.log('Cita actualizada:', citas.value[index])
      return citas.value[index]
    }
    return null
  }

  const deleteCita = (id) => {
    const index = citas.value.findIndex(c => c.id === id)
    if (index !== -1) {
      const deleted = citas.value.splice(index, 1)[0]
      console.log('Cita eliminada:', deleted)
      return deleted
    }
    return null
  }

  const removeTareaPendiente = (taskId) => {
    const index = tareasPendientes.value.findIndex(t => t.id === taskId)
    if (index !== -1) {
      return tareasPendientes.value.splice(index, 1)[0]
    }
    return null
  }

  const convertTareaToCita = (tarea, fecha, hora, tecnicoId, tecnicoNombre) => {
    const citaData = {
      tipo: tarea.tipo,
      asunto: tarea.titulo,
      clienteId: `CLI-${Date.now()}`,
      clienteNombre: tarea.clienteNombre,
      tecnicoId,
      tecnicoNombre,
      tanqueId: null,
      fecha,
      hora,
      observaciones: `Convertido desde tarea ${tarea.id}`
    }
    const newCita = addCita(citaData)
    removeTareaPendiente(tarea.id)
    return newCita
  }

  return {
    citas,
    tareasPendientes,
    citasPendientes,
    citasConfirmadas,
    citasCompletadas,
    citasCanceladas,
    getCitaById,
    getCitasByFecha,
    getCitasByTecnico,
    addCita,
    updateCita,
    deleteCita,
    removeTareaPendiente,
    convertTareaToCita
  }
}, {
  persist: true
})
