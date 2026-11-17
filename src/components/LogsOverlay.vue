<template>
  <WorkspaceModal
    v-if="isOpen"
    :visible="true"
    :title="$t('navBar.pagesTitle.logs')"
    @update:visible="logsOverlayStore.close()"
  >
    <LogsPanel mode="page" />
  </WorkspaceModal>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import LogsPanel from "@/components/LogsPanel.vue";
import WorkspaceModal from "@/components/WorkspaceModal.vue";
import { useLogsOverlayStore } from "@/store/logsOverlay";
const logsOverlayStore = useLogsOverlayStore();
const { isOpen } = storeToRefs(logsOverlayStore);
</script>
