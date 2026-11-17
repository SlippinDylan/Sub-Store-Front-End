<template>
  <UButton
    v-if="help.href && !help.content"
    :to="help.href"
    target="_blank"
    rel="noopener noreferrer"
    icon="i-lucide-external-link"
    :aria-label="$t('help.openPage')"
    :title="$t('help.openPage')"
    color="neutral"
    variant="ghost"
    size="xs"
    class="help-tip-trigger"
    @click.stop
  />
  <UPopover
    v-else
    arrow
    :content="{ side: 'bottom', align: 'start', sideOffset: 8 }"
    :ui="{
      content: 'help-tip-popover z-[40000] w-[380px] max-w-[calc(100vw-2rem)]',
    }"
  >
    <UButton
      icon="i-lucide-circle-help"
      :aria-label="help.title || $t('workspace.help')"
      color="neutral"
      variant="ghost"
      size="xs"
      class="help-tip-trigger"
      @click.stop
    />
    <template #content>
      <div
        class="help-tip-content max-h-[min(60dvh,480px)] overflow-y-auto p-4 text-sm leading-6"
      >
        <p v-if="help.title" class="mb-2 font-medium text-default">
          {{ help.title }}
        </p>
        <p
          v-if="help.content"
          class="whitespace-pre-wrap break-words text-muted"
        >
          {{ help.content }}
        </p>
        <UButton
          v-if="help.href || help.to"
          :to="help.href || help.to"
          :target="help.href ? '_blank' : undefined"
          :rel="help.href ? 'noopener noreferrer' : undefined"
          :icon="help.href ? 'i-lucide-external-link' : 'i-lucide-arrow-right'"
          color="neutral"
          variant="link"
          size="sm"
          class="mt-2 p-0"
        >
          {{ help.linkLabel || $t("help.openPage") }}
        </UButton>
      </div>
    </template>
  </UPopover>
</template>
<script setup lang="ts">
import type { HelpContent } from "./help";
defineProps<{ help: HelpContent }>();
</script>
<style scoped>
.help-tip-trigger {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  padding: 4px;
  vertical-align: middle;
}
</style>
