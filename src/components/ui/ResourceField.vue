<template>
  <UFormField
    :name="prop"
    :data-resource-field="prop"
    :data-invalid="!!error"
    :label="label"
    :required="required"
    :error="error"
    class="resource-field"
    :orientation="label || $slots.label ? 'horizontal' : 'vertical'"
    :ui="{ root: 'w-full', wrapper: 'min-w-0', container: 'w-full min-w-0' }"
  >
    <template v-if="$slots.label || help" #label>
      <span class="field-label-with-help">
        <slot name="label">{{ label }}</slot>
        <HelpTip v-if="help" :help="help" />
      </span>
    </template>
    <slot />
  </UFormField>
</template>
<script setup lang="ts">
import HelpTip from "./HelpTip.vue";
import type { HelpContent } from "./help";
import { computed, inject, onBeforeUnmount } from "vue";
import { formContextKey, type FieldRule } from "./form";
const props = withDefaults(
  defineProps<{
    prop?: string;
    label?: string;
    help?: HelpContent;
    required?: boolean;
    rules?: FieldRule[];
  }>(),
  { prop: "", rules: () => [] },
);
const form = inject(formContextKey, null);
const id = Symbol("field");
form?.register(id, () => ({ name: props.prop, rules: props.rules }));
onBeforeUnmount(() => form?.unregister(id));
const error = computed(
  () => form?.errors.value.find((error) => error.prop === props.prop)?.message,
);
</script>
