<template>
  <section class="settings-section">
    <UCard :ui="{ header: 'px-4 sm:px-4', body: 'p-0 sm:p-0 divide-y divide-default', footer: 'px-4 sm:px-4' }">
      <template v-if="title || desc" #header>
        <div class="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
          <h3 v-if="title" class="shrink-0 text-sm font-semibold">{{ title }}</h3>
          <p v-if="desc" class="ml-auto text-right text-xs text-muted">{{ desc }}</p>
        </div>
      </template>
      <slot />
      <template v-if="$slots.footer" #footer><slot name="footer" /></template>
    </UCard>
  </section>
</template>
<script setup lang="ts">
defineProps<{ title?: string; desc?: string }>();
</script>
