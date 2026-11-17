<template>
  <div
    class="settings-row"
    :class="{ 'settings-row-field': title || $slots.title }"
  >
    <slot name="icon" />
    <div v-if="title || $slots.title" class="min-w-0 flex-1">
      <slot name="title">{{ title }}</slot>
      <p v-if="subTitle" class="text-xs text-muted mt-1">{{ subTitle }}</p>
    </div>
    <span v-if="desc" class="text-sm text-muted">{{ desc }}</span
    ><slot /><slot name="link" />
  </div>
</template>
<script setup lang="ts">
defineProps<{
  title?: string;
  desc?: string | number;
  subTitle?: string;
  isLink?: boolean;
  center?: boolean;
}>();
</script>
