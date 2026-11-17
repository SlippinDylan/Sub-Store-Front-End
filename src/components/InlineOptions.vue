<template>
  <div class="inline-options" role="radiogroup" :aria-label="label">
    <UButton
      :size="isDesktop ? 'sm' : 'md'"
      v-for="option in columns"
      :key="option.value"
      type="button"
      role="radio"
      :aria-checked="modelValue[0] === option.value"
      @click="select(option)"
     :color="modelValue[0] === option.value ? 'primary' : 'neutral'" :variant="modelValue[0] === option.value ? 'soft' : 'outline'">
      {{ option.text }}
    </UButton>
    <slot v-if="!columns.length" />
  </div>
</template>
<script setup lang="ts">
import { useMediaQuery } from "@vueuse/core";
const isDesktop = useMediaQuery("(min-width: 768px)");
type Option = { value: string | number; text: string };
defineProps<{
  modelValue: (string | number)[];
  columns: Option[];
  label: string;
}>();
const emit = defineEmits<{
  (event: "update:modelValue", value: (string | number)[]): void;
  (
    event: "confirm",
    value: { selectedValue: (string | number)[]; selectedOptions: Option[] },
  ): void;
}>();
const select = (option: Option) => {
  const selectedValue = [option.value];
  emit("update:modelValue", selectedValue);
  emit("confirm", { selectedValue, selectedOptions: [option] });
};
</script>
