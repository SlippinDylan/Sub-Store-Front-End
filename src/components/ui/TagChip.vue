<template>
  <UBadge variant="subtle" :color="color" class="gap-1"
    ><slot /><UButton
      v-if="closeable"
      icon="i-lucide-x"
      size="xs"
      color="neutral"
      variant="link"
      aria-label="删除"
      class="p-0"
      @click.stop="$emit('close')"
  /></UBadge>
</template>
<script setup lang="ts">
withDefaults(
  defineProps<{ closeable?: boolean; color?: "neutral" | "primary" }>(),
  { color: "neutral" },
);
defineEmits<{ (event: "close"): void }>();
</script>
