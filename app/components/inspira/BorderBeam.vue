<template>
  <div class="pointer-events-none absolute inset-0 rounded-[inherit] overflow-hidden">
    <div class="beam-spinner" :style="spinnerVars" />
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  duration?: number
  delay?: number
  colorFrom?: string
  colorTo?: string
}>(), {
  duration: 4,
  delay: 0,
  colorFrom: '#52b6ff',
  colorTo: '#70f0c8',
})

const spinnerVars = computed(() => ({
  '--from': props.colorFrom,
  '--to': props.colorTo,
  '--duration': `${props.duration}s`,
  '--delay': `${props.delay}s`,
}))
</script>

<style scoped>
.beam-spinner {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 200%;
  height: 200%;
  transform: translate(-50%, -50%) rotate(0deg);
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    var(--from) 60deg,
    var(--to) 90deg,
    transparent 120deg,
    transparent 360deg
  );
  animation: beam-spin var(--duration, 4s) linear var(--delay, 0s) infinite;
}

@keyframes beam-spin {
  from { transform: translate(-50%, -50%) rotate(0deg); }
  to   { transform: translate(-50%, -50%) rotate(360deg); }
}
</style>
