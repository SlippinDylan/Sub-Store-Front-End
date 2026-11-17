<template>
  <ResourceField :prop="prop">
    <template #label>
      <span class="image-fit-label">
        {{ labelText }}
        <HelpTip :help="openTips()" />
      </span>
    </template>
    <USelect
      v-if="compact"
      :model-value="currentPickerValue"
      :items="
        columns.map((option) => ({ label: option.text, value: option.value }))
      "
      :aria-label="labelText"
      class="w-full"
      @update:model-value="confirm({ selectedValue: [$event] })"
    />
    <InlineOptions
      v-else
      :model-value="[currentPickerValue]"
      :columns="columns"
      :label="labelText"
      @confirm="confirm"
    />
  </ResourceField>
</template>
<script setup lang="ts">

import { computed } from "vue";
import { useI18n } from "vue-i18n";

import InlineOptions from "@/components/InlineOptions.vue";
import { IMAGE_FIT_OPTIONS, isImageFit, type ImageFit } from "@/utils/iconFit";

const INHERIT_IMAGE_FIT = "__inherit__";
type ImageFitPickerValue = ImageFit | typeof INHERIT_IMAGE_FIT;

const props = withDefaults(
  defineProps<{
    modelValue?: ImageFit | string | null;
    fallbackValue?: ImageFit | string | null;
    label?: string;
    prop?: string;
    compact?: boolean;
  }>(),
  {
    label: "",
    prop: "iconFit",
  },
);

const emit = defineEmits<{
  (event: "update:modelValue", value: ImageFit | undefined): void;
  (event: "change", value: ImageFit | undefined): void;
}>();

const { t } = useI18n();
const labelText = computed(
  () => props.label || t("editorPage.subConfig.basic.iconFit.label"),
);
const currentPickerValue = computed<ImageFitPickerValue>(() => {
  return isImageFit(props.modelValue) ? props.modelValue : INHERIT_IMAGE_FIT;
});
const columns = computed(() => {
  return [
    {
      text: t("imageFit.inherit"),
      value: INHERIT_IMAGE_FIT,
    },
    ...IMAGE_FIT_OPTIONS.map((value) => ({
      text: t(`imageFit.${value}`),
      value,
    })),
  ];
});
const confirm = ({ selectedValue }: { selectedValue?: unknown[] }) => {
  const selected = selectedValue?.[0];
  const next = isImageFit(selected) ? selected : undefined;
  emit("update:modelValue", next);
  emit("change", next);
};
const openTips = () => ({
  title: t("imageFit.tips.title"),
  content: t("imageFit.tips.content"),
});
</script>

<style scoped lang="scss">
.image-fit-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
</style>
