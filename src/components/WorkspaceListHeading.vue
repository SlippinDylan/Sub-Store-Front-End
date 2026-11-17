<template>
  <div class="workspace-list-heading">
    <span>{{ label }}</span>
    <span class="workspace-list-action-heading">操作</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{ label: string }>();
</script>
