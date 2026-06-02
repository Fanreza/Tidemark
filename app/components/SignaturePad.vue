<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      @click.self="$emit('cancel')"
    >
      <div class="bg-card border border-border rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
        <div class="px-5 py-4 border-b border-border">
          <p class="font-semibold text-sm">Draw your signature</p>
          <p class="text-xs text-muted-foreground mt-0.5">Use your mouse or finger to sign in the box below</p>
        </div>

        <div class="px-4 pt-4 pb-2">
          <div class="relative rounded-lg overflow-hidden border-2 border-dashed border-border bg-white" style="height: 140px">
            <canvas
              ref="canvas"
              width="600"
              height="280"
              class="absolute inset-0 w-full h-full touch-none cursor-crosshair"
              @mousedown="startDraw"
              @mousemove="draw"
              @mouseup="stopDraw"
              @mouseleave="stopDraw"
              @touchstart.prevent="startDrawTouch"
              @touchmove.prevent="drawTouch"
              @touchend.prevent="stopDraw"
            />
            <div v-if="isEmpty" class="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
              <p class="text-gray-300 text-base">Sign here</p>
            </div>
          </div>
          <div class="flex items-center gap-2 mt-2 px-1">
            <div class="flex-1 h-px bg-border" />
            <p class="text-xs text-muted-foreground">signature</p>
            <div class="flex-1 h-px bg-border" />
          </div>
        </div>

        <div class="px-4 pb-4 flex items-center justify-between">
          <Button variant="ghost" size="sm" class="text-muted-foreground" @click="clear">Clear</Button>
          <div class="flex gap-2">
            <Button variant="outline" size="sm" @click="$emit('cancel')">Cancel</Button>
            <Button size="sm" :disabled="isEmpty" @click="confirm">Confirm</Button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
const emit = defineEmits<{ confirm: [dataUrl: string]; cancel: [] }>()

const canvas = ref<HTMLCanvasElement | null>(null)
const isDrawing = ref(false)
const isEmpty = ref(true)
let ctx: CanvasRenderingContext2D | null = null

onMounted(() => {
  const el = canvas.value
  if (!el) return
  ctx = el.getContext('2d')!
  ctx.strokeStyle = '#111827'
  ctx.lineWidth = 3.5
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
})

function getXY(e: MouseEvent) {
  const el = canvas.value!
  const rect = el.getBoundingClientRect()
  return {
    x: (e.clientX - rect.left) * (el.width / rect.width),
    y: (e.clientY - rect.top) * (el.height / rect.height),
  }
}

function getTouchXY(e: TouchEvent) {
  const t = e.touches[0]!
  const el = canvas.value!
  const rect = el.getBoundingClientRect()
  return {
    x: (t.clientX - rect.left) * (el.width / rect.width),
    y: (t.clientY - rect.top) * (el.height / rect.height),
  }
}

function startDraw(e: MouseEvent) {
  if (!ctx) return
  isDrawing.value = true
  isEmpty.value = false
  const { x, y } = getXY(e)
  ctx.beginPath()
  ctx.moveTo(x, y)
}

function draw(e: MouseEvent) {
  if (!isDrawing.value || !ctx) return
  const { x, y } = getXY(e)
  ctx.lineTo(x, y)
  ctx.stroke()
}

function stopDraw() {
  isDrawing.value = false
}

function startDrawTouch(e: TouchEvent) {
  if (!ctx) return
  isDrawing.value = true
  isEmpty.value = false
  const { x, y } = getTouchXY(e)
  ctx.beginPath()
  ctx.moveTo(x, y)
}

function drawTouch(e: TouchEvent) {
  if (!isDrawing.value || !ctx) return
  const { x, y } = getTouchXY(e)
  ctx.lineTo(x, y)
  ctx.stroke()
}

function clear() {
  const el = canvas.value!
  ctx!.clearRect(0, 0, el.width, el.height)
  isEmpty.value = true
}

function confirm() {
  if (isEmpty.value) return
  emit('confirm', canvas.value!.toDataURL('image/png'))
}
</script>
