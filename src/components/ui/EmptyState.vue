<template>
  <UEmpty
    :icon="image === 'error' ? 'i-lucide-triangle-alert' : 'i-lucide-inbox'"
    :ui="{ root: 'flex-1 min-h-48 justify-center border-0', avatar: 'mb-3' }"
    ><template #description
      ><slot name="description">{{ description || "暂无数据" }}</slot></template
    ><slot
  /></UEmpty>
</template>
<script setup lang="ts">
defineProps<{ image?: string; description?: string }>();
</script>
