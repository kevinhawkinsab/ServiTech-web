<script setup>
import { ref, computed, watch } from 'vue'
import { useVisitasStore } from '../../../stores/visitas'
import Modal from '../../../components/ui/Modal.vue'
import Button from '../../../components/ui/Button.vue'
import Input from '../../../components/ui/Input.vue'
import Select from '../../../components/ui/Select.vue'
import Textarea from '../../../components/ui/Textarea.vue'

const props = defineProps({
  modelValue: Boolean,
  cita: Object,
  prefillDate: String,
  prefillTime: String
})

const emit = defineEmits(['update:modelValue', 'save'])

const visitasStore = useVisitasStore()

const form = ref({
  tipo: '',
  asunto: '',
  clienteId: '',
  clienteNombre: '',
  tecnicoId: '',
  tecnicoNombre: '',
  tanqueId: '',
  fecha: '',
  hora: '',
  observaciones: ''
})

const tiposOptions = computed(() => 
  visitasStore.tiposInspeccion.map(t => ({ value: t, label: t }))
)

const clientesOptions = computed(() => 
  visitasStore.clientes.map(c => ({ value: c.id, label: c.nombre }))
)

const tecnicosOptions = computed(() => 
  visitasStore.tecnicos.map(t => ({ value: t.id, label: t.nombre }))
)

watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    if (props.cita) {
      form.value = { ...props.cita }
    } else {
      form.value = {
        tipo: '',
        asunto: '',
        clienteId: '',
        clienteNombre: '',
        tecnicoId: '',
        tecnicoNombre: '',
        tanqueId: '',
        fecha: props.prefillDate || '',
        hora: props.prefillTime || '09:00',
        observaciones: ''
      }
    }
  }
})

watch(() => form.value.clienteId, (newId) => {
  const cliente = visitasStore.getClienteById(newId)
  if (cliente) {
    form.value.clienteNombre = cliente.nombre
  }
})

watch(() => form.value.tecnicoId, (newId) => {
  const tecnico = visitasStore.getTecnicoById(newId)
  if (tecnico) {
    form.value.tecnicoNombre = tecnico.nombre
  }
})

const handleSubmit = () => {
  console.log('Formulario de cita:', form.value)
  emit('save', { ...form.value })
}

const isEdit = computed(() => !!props.cita?.id)
</script>

<template>
  <Modal
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    :title="isEdit ? 'Editar Cita' : 'Nueva Cita'"
    size="lg"
  >
    <form @submit.prevent="handleSubmit" class="space-y-4" data-testid="cita-form">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-zinc-700 mb-1.5">Tipo de Inspección *</label>
          <Select
            v-model="form.tipo"
            :options="tiposOptions"
            placeholder="Seleccionar tipo"
            data-testid="cita-tipo"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-zinc-700 mb-1.5">Asunto *</label>
          <Input
            v-model="form.asunto"
            placeholder="Descripción breve"
            data-testid="cita-asunto"
          />
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-zinc-700 mb-1.5">Cliente *</label>
          <Select
            v-model="form.clienteId"
            :options="clientesOptions"
            placeholder="Seleccionar cliente"
            data-testid="cita-cliente"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-zinc-700 mb-1.5">Técnico *</label>
          <Select
            v-model="form.tecnicoId"
            :options="tecnicosOptions"
            placeholder="Seleccionar técnico"
            data-testid="cita-tecnico"
          />
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label class="block text-sm font-medium text-zinc-700 mb-1.5">Fecha *</label>
          <Input
            v-model="form.fecha"
            type="date"
            data-testid="cita-fecha"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-zinc-700 mb-1.5">Hora *</label>
          <Input
            v-model="form.hora"
            type="time"
            data-testid="cita-hora"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-zinc-700 mb-1.5">ID Tanque (opcional)</label>
          <Input
            v-model="form.tanqueId"
            placeholder="TNK-XXX"
            data-testid="cita-tanque"
          />
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-zinc-700 mb-1.5">Observaciones</label>
        <Textarea
          v-model="form.observaciones"
          placeholder="Notas adicionales..."
          :rows="3"
          data-testid="cita-observaciones"
        />
      </div>
    </form>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button variant="outline" @click="$emit('update:modelValue', false)">
          Cancelar
        </Button>
        <Button @click="handleSubmit" data-testid="save-cita-btn">
          {{ isEdit ? 'Guardar Cambios' : 'Crear Cita' }}
        </Button>
      </div>
    </template>
  </Modal>
</template>
