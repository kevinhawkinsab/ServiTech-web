<script setup>
import { computed } from 'vue'
import { cva } from 'class-variance-authority'

const props = defineProps({
  variant: {
    type: String,
    default: 'default'
  }
})

const badgeVariants = cva(
  'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary/10 text-primary',
        secondary: 'bg-secondary text-secondary-foreground',
        success: 'bg-green-100 text-green-700',
        warning: 'bg-yellow-100 text-yellow-700',
        destructive: 'bg-red-100 text-red-700',
        outline: 'border border-input'
      }
    },
    defaultVariants: {
      variant: 'default'
    }
  }
)

const classes = computed(() => badgeVariants({ variant: props.variant }))
</script>

<template>
  <span :class="classes">
    <slot />
  </span>
</template>
