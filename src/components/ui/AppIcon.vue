<template>
  <UIcon
    mode="svg"
    :name="resolved"
    :style="{ width: dimension, height: dimension }"
    class="shrink-0 align-middle"
  />
</template>
<script setup lang="ts">
import { computed } from "vue";
const props = withDefaults(
  defineProps<{ name?: string; size?: string | number }>(),
  { name: "info", size: 16 },
);
const icons: Record<string, string> = {
  tips: "info",
  failure: "circle-x",
  "rect-right": "chevron-right",
  right: "chevron-right",
  "rect-down": "chevron-down",
  "rect-up": "chevron-up",
  "rect-left": "chevron-left",
  "close-little": "x",
  "mask-close": "circle-x",
  refresh: "refresh-cw",
  refresh2: "refresh-cw",
  loading: "loader-circle",
  shop: "image",
  link: "link",
  copy: "copy",
  search: "search",
  checked: "check",
  check: "check",
  setting: "settings",
  category: "folder",
  download: "download",
  upload: "upload",
  ask: "circle-help",
  issue: "circle-help",
  add: "plus",
  more: "ellipsis",
  left: "chevron-left",
};
const resolved = computed(() =>
  props.name.startsWith("i-")
    ? props.name
    : `i-lucide-${icons[props.name] || props.name}`,
);
const dimension = computed(() =>
  typeof props.size === "number" || /^\d+$/.test(props.size)
    ? `${props.size}px`
    : props.size,
);
</script>
