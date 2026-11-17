<template>
  <WorkspaceModal
    :visible="true"
    :title="entry.options.title || ''"
    :busy="busy"
    :dismissible="entry.options.closeOnClickOverlay !== false"
    :closeable="entry.options.closeable !== false"
    @update:visible="close"
    @opened="entry.options.onOpened?.()"
  >
    <p
      v-if="typeof entry.options.content === 'string'"
      class="whitespace-pre-wrap break-words text-sm leading-7"
    >
      {{ entry.options.content }}
    </p>
    <component :is="renderContent" v-else />
    <p v-if="failure" role="alert" class="mt-3 text-sm text-error">
      {{ failure }}
    </p>
    <template
      v-if="!entry.options.noCancelBtn || !entry.options.noOkBtn"
      #footer
    >
      <UButton
        size="sm"
        v-if="!entry.options.noCancelBtn"
        color="neutral"
        variant="outline"
        :disabled="busy"
        @click="act('cancel')"
        >{{ entry.options.cancelText || t("specificWord.cancel") }}</UButton
      >
      <UButton
        size="sm"
        v-if="!entry.options.noOkBtn"
        :disabled="busy || entry.options.okBtnDisabled"
        :loading="busy"
        @click="act('ok')"
        >{{ entry.options.okText || t("specificWord.confirm") }}</UButton
      >
    </template>
  </WorkspaceModal>
</template>
<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import WorkspaceModal from "./WorkspaceModal.vue";
import {
  dismissDialog,
  performDialogAction,
  type DialogEntry,
} from "@/services/feedback";
const props = defineProps<{ entry: DialogEntry }>();
const { t } = useI18n();
const busy = ref(false);
const failure = ref("");
const renderContent = () =>
  typeof props.entry.options.content === "object"
    ? props.entry.options.content
    : null;
// Dismissal must never invoke Cancel: managed deletion uses Cancel to archive data.
const close = async () => {
  if (!busy.value) await dismissDialog(props.entry);
};
const act = async (action: "ok" | "cancel") => {
  if (busy.value) return;
  busy.value = true;
  failure.value = "";
  try {
    await performDialogAction(props.entry, action);
  } catch (error) {
    failure.value = error instanceof Error ? error.message : String(error);
  } finally {
    busy.value = false;
  }
};
const popstate = () => {
  if (props.entry.options.closeOnPopstate) void close();
};
onMounted(() => window.addEventListener("popstate", popstate));
onBeforeUnmount(() => window.removeEventListener("popstate", popstate));
</script>
