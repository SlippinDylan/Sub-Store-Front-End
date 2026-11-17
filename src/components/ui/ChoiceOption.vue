<template>
  <UButton
    :size="isDesktop ? 'sm' : 'md'"
    type="button"
    role="radio"
    :aria-checked="selected"
    :variant="selected ? 'soft' : 'outline'"
    :color="selected ? 'primary' : 'neutral'"
    :disabled="disabled"
    @click="group?.select(label)"
    ><slot
  /></UButton>
</template>
<script setup lang="ts">
import { useMediaQuery } from "@vueuse/core";
import { computed, inject } from "vue";
import { choiceKey, type ChoiceValue } from "./choice";
const isDesktop = useMediaQuery("(min-width: 768px)");
const props = defineProps<{
  label: ChoiceValue;
  disabled?: boolean;
  shape?: string;
}>();
const group = inject(choiceKey, null);
const selected = computed(() => group?.value.value === props.label);
</script>
