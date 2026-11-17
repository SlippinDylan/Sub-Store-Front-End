<template>
  <UTextarea
    v-bind="$attrs"
    :model-value="modelValue"
    :rows="Number(rows)"
    :autoresize="!!autosize"
    :maxlength="maxLength"
    :style="sizing"
    class="w-full"
    @update:model-value="$emit('update:modelValue', $event)"
  />
</template>
<script setup lang="ts">
import { computed } from "vue";
defineOptions({ inheritAttrs: false });
const props = withDefaults(
  defineProps<{
    modelValue?: string;
    rows?: number | string;
    autosize?: boolean | { minHeight?: number; maxHeight?: number };
    maxLength?: string | number;
  }>(),
  { rows: 3 },
);
defineEmits<{ (event: "update:modelValue", value: string): void }>();
const sizing = computed(() =>
  typeof props.autosize === "object"
    ? {
        minHeight: props.autosize.minHeight
          ? `${props.autosize.minHeight}px`
          : undefined,
        maxHeight: props.autosize.maxHeight
          ? `${props.autosize.maxHeight}px`
          : undefined,
      }
    : {},
);
</script>
