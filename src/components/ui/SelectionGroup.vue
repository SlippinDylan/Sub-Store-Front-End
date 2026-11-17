<template>
  <div role="group" class="selection-group"><slot /></div>
</template>
<script setup lang="ts">
import { provide, toRef } from "vue";
import { selectionKey, type ChoiceValue } from "./choice";
const props = withDefaults(defineProps<{ modelValue?: ChoiceValue[] }>(), {
  modelValue: () => [],
});
const emit = defineEmits<{
  (e: "update:modelValue", value: ChoiceValue[]): void;
  (e: "change", value: ChoiceValue[]): void;
}>();
provide(selectionKey, {
  value: toRef(props, "modelValue"),
  select: (value, checked) => {
    const values = checked
      ? [...props.modelValue.filter((item) => item !== value), value]
      : props.modelValue.filter((item) => item !== value);
    emit("update:modelValue", values);
    emit("change", values);
  },
});
</script>
