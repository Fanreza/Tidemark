<template>
  <svg
    class="pointer-events-none absolute inset-0 h-full w-full"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <pattern
        :id="patternId"
        :width="size"
        :height="size"
        patternUnits="userSpaceOnUse"
      >
        <path
          :d="`M ${size} 0 L 0 0 0 ${size}`"
          fill="none"
          :stroke="stroke"
          :stroke-width="strokeWidth"
        />
      </pattern>
    </defs>
    <rect width="100%" height="100%" :fill="`url(#${patternId})`" />
  </svg>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  size?: number
  stroke?: string
  strokeWidth?: number
}>(), {
  size: 40,
  stroke: 'rgba(255, 255, 255, 0.07)',
  strokeWidth: 1,
})

const patternId = `grid-${useId()}`
</script>
