<template>
  <UAvatar
    :src="url"
    :icon="
      icon
        ? `i-lucide-${icon === 'github' ? 'github' : 'user'}`
        : 'i-lucide-image'
    "
    :style="{ width: `${size}px`, height: `${size}px` }"
    :ui="{ image: 'resource-avatar-image' }"
    @error="$emit('on-error', $event)"
    ><slot
  /></UAvatar>
</template>
<script setup lang="ts">
withDefaults(
  defineProps<{
    url?: string;
    size?: string | number;
    icon?: string;
    bgColor?: string;
  }>(),
  { size: 32 },
);
defineEmits<{ (event: "on-error", error: Event): void }>();
</script>
