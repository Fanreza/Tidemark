<template>
  <span :class="['inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium', style.bg, style.text]">
    <span :class="['w-1.5 h-1.5 rounded-full', style.dot]" />
    {{ style.label }}
  </span>
</template>

<script setup lang="ts">
const props = defineProps<{ status: string }>()

const style = computed(() => {
  switch (props.status) {
    case 'completed':
      return { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', dot: 'bg-green-500', label: 'Completed' }
    case 'signing':
      return { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', dot: 'bg-amber-500', label: 'In Progress' }
    case 'shared':
      return { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', dot: 'bg-blue-500', label: 'Shared' }
    case 'signed':
      return { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', dot: 'bg-green-500', label: 'Signed' }
    case 'pending':
      return { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', dot: 'bg-amber-500', label: 'Pending' }
    case 'declined':
      return { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', dot: 'bg-red-500', label: 'Declined' }
    default:
      return { bg: 'bg-muted', text: 'text-muted-foreground', dot: 'bg-muted-foreground/50', label: 'Draft' }
  }
})
</script>
