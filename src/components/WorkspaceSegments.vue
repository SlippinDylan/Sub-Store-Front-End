<template>
  <UTabs
    :model-value="modelValue"
    :items="
      disabled
        ? options.map((option) => ({ ...option, disabled: true }))
        : options
    "
    :content="false"
    color="neutral"
    size="sm"
    :aria-label="label"
    :class="fullWidth ? 'w-full max-w-full' : 'w-auto max-w-full'"
    :ui="{
      list: fullWidth
        ? 'grid w-full grid-flow-col auto-cols-fr'
        : 'overflow-x-auto',
      trigger: fullWidth ? 'w-full min-w-0 justify-center' : 'shrink-0',
    }"
    @update:model-value="$emit('update:modelValue', String($event))"
  />
</template>

<script setup lang="ts">
defineProps<{
  modelValue: string;
  options: { value: string; label: string }[];
  label: string;
  fullWidth?: boolean;
  disabled?: boolean;
}>();
defineEmits<{ (event: "update:modelValue", value: string): void }>();
</script>
