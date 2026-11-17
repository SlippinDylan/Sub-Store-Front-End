<template>
  <FeedbackDialog v-for="entry in dialogs" :key="entry.id" :entry="entry" />
</template>
<script setup lang="ts">
import { nextTick, watch } from "vue";
import { useToast } from "@nuxt/ui/composables/useToast";
import { dialogs, notifications } from "@/services/feedback";
import FeedbackDialog from "./FeedbackDialog.vue";
const toast = useToast();
const previous = new Map<string, unknown>();
watch(
  () => [...notifications.values()],
  (values) => {
    const current = new Set(values.map((value) => value.id));
    for (const id of previous.keys()) {
      if (current.has(id)) continue;
      previous.delete(id);
      // Nuxt UI queues additions until the next tick; remove only after that queue runs.
      nextTick(() => {
        if (!notifications.has(id)) toast.remove(id);
      });
    }
    for (const value of values) {
      if (previous.get(value.id) === value) continue;
      toast.add({
        ...value,
        icon: value.loading ? "i-lucide-loader-circle" : undefined,
        ui: {
          icon: value.loading ? "animate-spin" : "",
          description: "whitespace-pre-wrap break-words",
        },
      });
      previous.set(value.id, value);
    }
  },
  { immediate: true },
);
</script>
