<template>
  <UForm
    ref="form"
    :state="modelValue"
    :validate="validateFields"
    class="resource-form"
    @submit.prevent
  >
    <slot />
  </UForm>
</template>
<script setup lang="ts">
import { nextTick, provide, ref } from "vue";
import { formContextKey, type FieldDefinition, type FieldError } from "./form";
import { validateResourceFields } from "./formValidation";
const props = withDefaults(
  defineProps<{ modelValue?: Record<string, unknown> }>(),
  { modelValue: () => ({}) },
);
const form = ref<{ $el: HTMLElement } | null>(null);
const focusFirstError = async () => {
  await nextTick();
  const field = form.value?.$el.querySelector<HTMLElement>(
    '[data-resource-field][data-invalid="true"]',
  );
  if (!field) return;
  const container = field.querySelector('[data-slot="container"]') || field;
  container
    .querySelector<HTMLElement>(
      'input:not([type="hidden"]), textarea, [role="combobox"], button:not(.help-tip-trigger)',
    )
    ?.focus();
  field.scrollIntoView({ behavior: "smooth", block: "center" });
};
const setErrors = async (next: FieldError[], focus = true) => {
  errors.value = next;
  if (focus) await focusFirstError();
};
const fields = new Map<symbol, () => FieldDefinition>();
const errors = ref<FieldError[]>([]);
provide(formContextKey, {
  register: (id, field) => fields.set(id, field),
  unregister: (id) => fields.delete(id),
  errors,
});
const validate = async (name?: string, focus = !name) => {
  const next = await validateResourceFields(
    props.modelValue,
    Array.from(fields.values(), (getField) => getField()),
    name,
  );
  errors.value = name
    ? [...errors.value.filter((error) => error.prop !== name), ...next]
    : next;
  if (focus && next.length) await focusFirstError();
  return { valid: next.length === 0, errors: next };
};
const validateFields = async () =>
  (await validate(undefined, false)).errors.map((error) => ({
    name: error.prop,
    message: error.message,
  }));
defineExpose({ validate, setErrors, focusFirstError });
</script>
