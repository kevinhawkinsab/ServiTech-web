<script setup>
const props = defineProps({
  modelValue: String,
  placeholder: String,
  disabled: Boolean,
  rows: {
    type: Number,
    default: 3
  }
})

const emit = defineEmits(['update:modelValue'])
</script>

<template>
  <textarea
    :value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :rows="rows"
    class="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50 resize-none"
    @input="emit('update:modelValue', $event.target.value)"
  />
</template>
