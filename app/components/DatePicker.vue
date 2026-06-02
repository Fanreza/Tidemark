<template>
  <Popover>
    <PopoverTrigger as-child>
      <button
        class="flex items-center gap-2 h-9 px-3 rounded-lg border border-border bg-background text-sm text-left w-full hover:bg-muted/50 transition-colors"
        :class="!modelValue ? 'text-muted-foreground' : 'text-foreground'"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 shrink-0 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>
        </svg>
        <span>{{ displayValue }}</span>
      </button>
    </PopoverTrigger>
    <PopoverContent class="w-auto p-0" align="end">
      <Calendar
        :model-value="calendarValue"
        @update:model-value="onDateSelect"
      />
    </PopoverContent>
  </Popover>
</template>

<script setup lang="ts">
import { CalendarDate, parseDate, today, getLocalTimeZone } from '@internationalized/date'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

const props = defineProps<{ modelValue?: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const calendarValue = computed(() => {
  if (!props.modelValue) return undefined
  try {
    return parseDate(props.modelValue.split('T')[0]!)
  } catch {
    return undefined
  }
})

const displayValue = computed(() => {
  if (!props.modelValue) return 'No expiry'
  try {
    return new Date(props.modelValue).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    })
  } catch {
    return 'Select date'
  }
})

function onDateSelect(val: any) {
  if (!val) {
    emit('update:modelValue', '')
    return
  }
  emit('update:modelValue', val.toString() + 'T23:59')
}
</script>
