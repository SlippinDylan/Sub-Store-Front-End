<template>
  <div class="flex items-center gap-2 min-w-0">
    <UInputDate v-model="dateTime" granularity="minute" :hour-cycle="24" hide-time-zone :disabled="disabled" class="flex-1" @blur="$emit('blur')" />
    <UPopover v-model:open="open" @update:open="value => { if (!value) $emit('closed'); }">
      <UButton icon="i-lucide-calendar-days" color="neutral" variant="outline" :disabled="disabled" :aria-label="placeholder" />
      <template #content><UCalendar v-model="calendarDate" class="p-2" /></template>
    </UPopover>
    <UButton v-if="modelValue != null" icon="i-lucide-x" color="neutral" variant="ghost" :disabled="disabled" :aria-label="clearText" @click="$emit('update:modelValue', null)" />
  </div>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue';
import { fromDate, getLocalTimeZone, toCalendarDate, toZoned, today, type DateValue } from '@internationalized/date';
const props = withDefaults(defineProps<{ modelValue?: number | null; placeholder?: string; locale?: string; confirmText?: string; cancelText?: string; darkTheme?: boolean; disabled?: boolean }>(), { modelValue: null, placeholder: '', locale: 'en-US' });
const emit = defineEmits<{ (event: 'update:modelValue', value: number | null): void; (event: 'blur'): void; (event: 'closed'): void }>();
const timezone = getLocalTimeZone();
const open = ref(false);
const clearText = computed(() => props.locale.startsWith('zh') ? '清空日期时间' : props.locale.startsWith('ru') ? 'Очистить дату и время' : 'Clear date and time');
const dateTime = computed({
  get: () => props.modelValue == null ? undefined : fromDate(new Date(props.modelValue), timezone),
  set: (value: DateValue | undefined) => emit('update:modelValue', value ? toZoned(value, timezone).toDate().getTime() : null),
});
const calendarDate = computed({
  get: () => dateTime.value ? toCalendarDate(dateTime.value) : undefined,
  set: (value: DateValue | undefined) => {
    if (!value) return;
    const base = dateTime.value || toZoned(today(timezone), timezone);
    dateTime.value = base.set({ year: value.year, month: value.month, day: value.day });
    open.value = false;
  },
});
</script>
