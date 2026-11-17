<template>
  <section v-if="pageMode" class="preview-workspace min-w-0 space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex min-w-0 items-center gap-3">
        <UButton
          icon="i-lucide-arrow-left"
          size="sm"
          color="neutral"
          variant="outline"
          @click="$emit('close')"
        >
          {{ $t("workspace.back") }}
        </UButton>
        <h1 class="min-w-0 truncate text-base font-semibold">{{ title }}</h1>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <slot name="actions" />
      </div>
    </div>
    <slot />
  </section>
  <WorkspaceModal
    v-else
    :visible="true"
    :title="title"
    @update:visible="$emit('close')"
  >
    <template #actions><slot name="actions" /></template>
    <slot />
  </WorkspaceModal>
</template>
<script setup lang="ts">
import WorkspaceModal from "./WorkspaceModal.vue";
defineProps<{ title: string; pageMode?: boolean }>();
defineEmits<{ (event: "close"): void }>();
</script>
