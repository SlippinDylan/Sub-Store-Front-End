<template>
  <div class="field-input">
    <div v-if="label" class="field-label-with-help">
      <label :for="id ?? inputId" class="text-sm text-muted">{{ label }}</label>
      <HelpTip v-if="help" :help="help" />
    </div>
    <slot name="input">
      <UInput
        ref="input"
        v-bind="$attrs"
        :id="id ?? (label ? inputId : undefined)"
        :model-value="modelValue"
        :type="type"
        :disabled="disabled"
        :readonly="readonly"
        :placeholder="placeholder"
        :maxlength="maxLength"
        class="w-full"
        :ui="{ base: 'w-full' }"
        @update:model-value="$emit('update:modelValue', $event)"
        @click="$emit('click-input')"
      >
        <template v-if="leftIcon" #leading>
          <button
            v-if="onClickLeftIcon"
            type="button"
            class="inline-flex"
            :disabled="disabled"
            aria-label="图标"
            @click.stop="$emit('click-left-icon')"
          >
            <img v-if="isImageIcon" :src="leftIcon" alt="" class="size-4" />
            <AppIcon v-else :name="leftIcon" />
          </button>
          <span
            v-else
            class="inline-flex pointer-events-none"
            aria-hidden="true"
          >
            <img v-if="isImageIcon" :src="leftIcon" alt="" class="size-4" />
            <AppIcon v-else :name="leftIcon" />
          </span>
        </template>
        <template v-if="$slots.button || rightIcon || clearable" #trailing>
          <slot name="button" />
          <button
            v-if="rightIcon"
            type="button"
            aria-label="选择"
            :disabled="disabled"
            class="inline-flex"
            @click.stop="$emit('click-right-icon')"
          >
            <AppIcon :name="rightIcon" />
          </button>
          <UButton
            v-else-if="clearable && modelValue !== '' && modelValue != null"
            icon="i-lucide-x"
            color="neutral"
            variant="link"
            size="xs"
            aria-label="清除"
            @click.stop="clear"
          />
        </template>
      </UInput>
    </slot>
    <p v-if="error && errorMessage" class="text-xs text-error mt-1">
      {{ errorMessage }}
    </p>
  </div>
</template>
<script setup lang="ts">
import HelpTip from "./HelpTip.vue";
import type { HelpContent } from "./help";
import { computed, ref, useId } from "vue";
import AppIcon from "./AppIcon.vue";
defineOptions({ inheritAttrs: false });
const props = withDefaults(
  defineProps<{
    modelValue?: string | number | null;
    label?: string;
    help?: HelpContent;
    id?: string;
    type?: "text" | "number" | "password" | "email" | "url" | "search" | "tel";
    disabled?: boolean;
    readonly?: boolean;
    placeholder?: string;
    leftIcon?: string;
    onClickLeftIcon?: () => void;
    rightIcon?: string;
    clearable?: boolean;
    error?: boolean;
    errorMessage?: string;
    border?: boolean;
    inputAlign?: string;
    textAlign?: string;
    maxLength?: string | number;
    rightIconSize?: string | number;
  }>(),
  { type: "text" },
);
const emit = defineEmits<{
  (e: "update:modelValue", value: string | number | undefined): void;
  (e: "clear"): void;
  (e: "click-input"): void;
  (e: "click-left-icon"): void;
  (e: "click-right-icon"): void;
}>();
const inputId = useId();
const input = ref<{ inputRef: HTMLInputElement | undefined } | null>(null);
const isImageIcon = computed(
  () => props.leftIcon?.includes("/") || props.leftIcon?.startsWith("data:"),
);
const clear = () => {
  emit("update:modelValue", "");
  emit("clear");
};
defineExpose({ focus: () => input.value?.inputRef?.focus() });
</script>
