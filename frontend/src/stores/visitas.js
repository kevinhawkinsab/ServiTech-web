import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const INITIAL_VISITAS = [
  {
    id: 'VIS-001',
    ordenId: 'ORD-2026-001',
    tipo: 'Mantenimiento Preventivo',
    clienteId: 'CLI-001',
    clienteNombre: 'Industrias Acme S.A.',
    clienteDireccion: 'Av. Industrial 1234, Santiago',
    clienteTelefono: '+56 2 1234 5678',
    clienteEmail: 'contacto@acme.cl',
    tecnicoId: 'TEC-001',
    tecnicoNombre: 'Juan Técnico',
    fecha: '2026-02-15',
    horaEntrada: '09:00',
    horaSalida: '12:30',
    diagnostico: 'Se realizó mantenimiento preventivo según protocolo. Equipo en buen estado.',
    inventario: [
      { item: 'Filtro de aire', cantidad: 2, precioUnit: 15000, total: 30000 },
      { item: 'Aceite lubricante 5L', cantidad: 1, precioUnit: 25000, total: 25000 }
    ],
    subtotal: 55000,
    iva: 10450,
    total: 65450,
    firmaCliente: null,
    firmaTecnico: null,
    estado: 'completada',
    createdAt: '2026-02-15T09:00:00'
  },
  {
    id: 'VIS-002',
    ordenId: 'ORD-2026-002',
    tipo: 'Reparación',
    clienteId: 'CLI-002',
    clienteNombre: 'Metalúrgica del Norte',
    clienteDireccion: 'Parque Industrial Norte 567',
    clienteTelefono: '+56 2 9876 5432',
    clienteEmail: 'servicio@metalurgica.cl',
    tecnicoId: 'TEC-002',
    tecnicoNombre: 'Pedro Martínez',
    fecha: '2026-02-14',
    horaEntrada: '14:00',
    horaSalida: '17:45',
    diagnostico: 'Reparación de válvula con fuga. Se reemplazó empaquetadura.',
    inventario: [
      { item: 'Empaquetadura válvula', cantidad: 1, precioUnit: 45000, total: 45000 },
      { item: 'Mano de obra (hrs)', cantidad: 3, precioUnit: 20000, total: 60000 }
    ],
    subtotal: 105000,
    iva: 19950,
    total: 124950,
    firmaCliente: 'data:image/png;base64,mock',
    firmaTecnico: 'data:image/png;base64,mock',
    estado: 'completada',
    createdAt: '2026-02-14T14:00:00'
  },
  {
    id: 'VIS-003',
    ordenId: 'ORD-2026-003',
    tipo: 'Inspección',
    clienteId: 'CLI-003',
    clienteNombre: 'Química Industrial',
    clienteDireccion: 'Zona Franca 890',
    clienteTelefono: '+56 2 5555 1234',
    clienteEmail: 'operaciones@quimica.cl',
    tecnicoId: 'TEC-001',
    tecnicoNombre: 'Juan Técnico',
    fecha: '2026-02-13',
    horaEntrada: '10:00',
    horaSalida: '11:30',
    diagnostico: 'Inspección de rutina. Sin observaciones.',
    inventario: [],
    subtotal: 0,
    iva: 0,
    total: 0,
    firmaCliente: 'data:image/png;base64,mock',
    firmaTecnico: 'data:image/png;base64,mock',
    estado: 'completada',
    createdAt: '2026-02-13T10:00:00'
  }
]

const TECNICOS = [
  { id: 'TEC-001', nombre: 'Juan Técnico', especialidad: 'Mantenimiento General' },
  { id: 'TEC-002', nombre: 'Pedro Martínez', especialidad: 'Reparaciones' },
  { id: 'TEC-003', nombre: 'Ana García', especialidad: 'Instalaciones' }
]

const CLIENTES = [
  { id: 'CLI-001', nombre: 'Industrias Acme S.A.', direccion: 'Av. Industrial 1234, Santiago', telefono: '+56 2 1234 5678', email: 'contacto@acme.cl' },
  { id: 'CLI-002', nombre: 'Metalúrgica del Norte', direccion: 'Parque Industrial Norte 567', telefono: '+56 2 9876 5432', email: 'servicio@metalurgica.cl' },
  { id: 'CLI-003', nombre: 'Química Industrial', direccion: 'Zona Franca 890', telefono: '+56 2 5555 1234', email: 'operaciones@quimica.cl' },
  { id: 'CLI-004', nombre: 'Transportes Unidos', direccion: 'Terminal de Carga 123', telefono: '+56 2 7777 8888', email: 'logistica@transportes.cl' },
  { id: 'CLI-005', nombre: 'Alimentos del Sur', direccion: 'Planta Sur Km 45', telefono: '+56 2 3333 4444', email: 'planta@alimentos.cl' }
]

const TIPOS_INSPECCION = [
  'Mantenimiento Preventivo',
  'Mantenimiento Correctivo',
  'Reparación',
  'Inspección',
  'Instalación',
  'Certificación'
]

export const useVisitasStore = defineStore('visitas', () => {
  const visitas = ref([...INITIAL_VISITAS])
  const tecnicos = ref([...TECNICOS])
  const clientes = ref([...CLIENTES])
  const tiposInspeccion = ref([...TIPOS_INSPECCION])

  const visitasCompletadas = computed(() => 
    visitas.value.filter(v => v.estado === 'completada')
  )

  const getVisitaById = (id) => {
    return visitas.value.find(v => v.id === id)
  }

  const getTecnicoById = (id) => {
    return tecnicos.value.find(t => t.id === id)
  }

  const getClienteById = (id) => {
    return clientes.value.find(c => c.id === id)
  }

  const generateOrdenId = () => {
    const year = new Date().getFullYear()
    const num = visitas.value.length + 1
    return `ORD-${year}-${String(num).padStart(3, '0')}`
  }

  const addVisita = (visitaData) => {
    const newId = `VIS-${String(visitas.value.length + 1).padStart(3, '0')}`
    const newVisita = {
      id: newId,
      ordenId: generateOrdenId(),
      ...visitaData,
      estado: 'completada',
      createdAt: new Date().toISOString()
    }
    visitas.value.push(newVisita)
    console.log('Nueva visita registrada:', newVisita)
    return newVisita
  }

  const updateVisita = (id, updates) => {
    const index = visitas.value.findIndex(v => v.id === id)
    if (index !== -1) {
      visitas.value[index] = { ...visitas.value[index], ...updates }
      console.log('Visita actualizada:', visitas.value[index])
      return visitas.value[index]
    }
    return null
  }

  return {
    visitas,
    tecnicos,
    clientes,
    tiposInspeccion,
    visitasCompletadas,
    getVisitaById,
    getTecnicoById,
    getClienteById,
    generateOrdenId,
    addVisita,
    updateVisita
  }
}, {
  persist: true
})
