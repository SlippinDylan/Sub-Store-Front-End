<template>
  <UCheckbox
    :model-value="indeterminate ? 'indeterminate' : checked"
    :disabled="disabled"
    @update:model-value="update"
    ><template v-if="$slots.default" #label><slot /></template
  ></UCheckbox>
</template>
<script setup lang="ts">
import { computed, inject } from "vue";
import { selectionKey, type ChoiceValue } from "./choice";
const props = withDefaults(
  defineProps<{
    modelValue?: boolean;
    label?: ChoiceValue;
    disabled?: boolean;
    indeterminate?: boolean;
    shape?: string;
  }>(),
  { modelValue: false },
);
const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "change", value: boolean): void;
}>();
const group = inject(selectionKey, null);
const checked = computed(() =>
  group && props.label !== undefined
    ? group.value.value.includes(props.label)
    : props.modelValue,
);
const update = (value: boolean | "indeterminate") => {
  const checked = value === true;
  if (group && props.label !== undefined) group.select(props.label, checked);
  else emit("update:modelValue", checked);
  emit("change", checked);
};
</script>
