<template>
  <div ref="containerRef" class="absolute inset-0" @mousemove="onMouseMove">
    <div
      class="pointer-events-none absolute inset-0"
      :style="spotlightStyle"
    />
  </div>
</template>

<script setup lang="ts">
const containerRef = ref<HTMLElement>()
const mouseX = ref(600)
const mouseY = ref(300)
const active = ref(false)

const props = withDefaults(defineProps<{
  color?: string
  size?: number
}>(), {
  color: '82, 182, 255',
  size: 600,
})

function onMouseMove(e: MouseEvent) {
  if (!containerRef.value) return
  const rect = containerRef.value.getBoundingClientRect()
  mouseX.value = e.clientX - rect.left
  mouseY.value = e.clientY - rect.top
  active.value = true
}

const spotlightStyle = computed(() => ({
  background: `radial-gradient(${props.size}px circle at ${mouseX.value}px ${mouseY.value}px, rgba(${props.color}, 0.12) 0%, transparent 80%)`,
}))
</script>
