<template>
  <img
    :src="src"
    :alt="alt"
    :loading="lazyLoad ? 'lazy' : 'eager'"
    :style="{ objectFit: fit }"
    class="resource-image"
  />
</template>
<script setup lang="ts">
import type { CSSProperties } from "vue";
withDefaults(
  defineProps<{
    src?: string;
    alt?: string;
    fit?: CSSProperties["objectFit"];
    lazyLoad?: boolean;
    showLoading?: boolean;
  }>(),
  { alt: "" },
);
</script>
