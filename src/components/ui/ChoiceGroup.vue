<template>
  <div role="radiogroup" class="flex flex-wrap items-center gap-2">
    <slot />
  </div>
</template>
<script setup lang="ts">
import { provide, toRef } from "vue";
import { choiceKey } from "./choice";
const props = defineProps<{
  modelValue?: string | number | boolean;
  direction?: string;
}>();
const emit = defineEmits<{
  (e: "update:modelValue", value: string | number | boolean): void;
  (e: "change", value: string | number | boolean): void;
}>();
provide(choiceKey, {
  value: toRef(props, "modelValue"),
  select: (value) => {
    emit("update:modelValue", value);
    emit("change", value);
  },
});
</script>
