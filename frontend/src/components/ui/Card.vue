<script setup>
defineProps({
  title: String,
  description: String
})
</script>

<template>
  <div class="rounded-md border border-zinc-200 bg-white shadow-sm" data-testid="card">
    <div v-if="title || $slots.header" class="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
      <div>
        <h3 v-if="title" class="font-heading font-semibold text-zinc-900">{{ title }}</h3>
        <p v-if="description" class="text-sm text-zinc-500 mt-0.5">{{ description }}</p>
      </div>
      <slot name="header-actions" />
    </div>
    <div class="p-4">
      <slot />
    </div>
    <div v-if="$slots.footer" class="px-4 py-3 border-t border-zinc-100 bg-zinc-50">
      <slot name="footer" />
    </div>
  </div>
</template>
