<template>
  <USelectMenu
    :model-value="selected"
    :items="items"
    :disabled="disabled"
    :placeholder="$t('syncPage.selectSource.title')"
    :aria-label="$t('syncPage.selectSource.title')"
    :search-input="{ placeholder: $t('workspace.search') }"
    :filter-fields="['label', 'name', 'groupLabel']"
    class="w-full"
    @update:model-value="select"
  />
</template>
<script setup lang="ts">
import { computed } from "vue";
type SourceGroup = {
  value: string;
  text: string;
  children: { value: string; text: string }[];
};
type SourceOption = {
  label: string;
  name: string;
  group: string;
  groupLabel: string;
};
const props = defineProps<{
  modelValue: string[];
  options: SourceGroup[];
  disabled?: boolean;
}>();
const emit = defineEmits<{
  (event: "update:modelValue", value: string[]): void;
  (event: "change", value: string[]): void;
}>();
const options = computed(() =>
  props.options.flatMap((group) =>
    group.children.map((option) => ({
      label: option.text,
      name: option.value,
      group: group.value,
      groupLabel: group.text,
    })),
  ),
);
const items = computed(() =>
  props.options
    .filter((group) => group.children.length)
    .map((group) => [
      { type: "label" as const, label: group.text },
      ...options.value.filter((option) => option.group === group.value),
    ]),
);
const selected = computed(() =>
  options.value.find(
    (option) =>
      option.group === props.modelValue[0] &&
      option.name === props.modelValue[1],
  ),
);
const select = (option: SourceOption) => {
  const value = [option.group, option.name];
  emit("update:modelValue", value);
  emit("change", value);
};
</script>
