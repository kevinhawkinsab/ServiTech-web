<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  tabs: {
    type: Array,
    required: true
  },
  modelValue: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue'])

const activeTab = computed({
  get: () => props.modelValue || props.tabs[0]?.value,
  set: (value) => emit('update:modelValue', value)
})
</script>

<template>
  <div>
    <div class="flex border-b border-zinc-200" data-testid="nav-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        :class="[
          'px-4 py-2 text-sm font-medium transition-colors relative',
          activeTab === tab.value
            ? 'text-primary'
            : 'text-zinc-500 hover:text-zinc-900'
        ]"
        @click="activeTab = tab.value"
        :data-testid="`tab-${tab.value}`"
      >
        {{ tab.label }}
        <span
          v-if="activeTab === tab.value"
          class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
        />
      </button>
    </div>
    <div class="mt-4">
      <slot :name="activeTab" />
    </div>
  </div>
</template>
