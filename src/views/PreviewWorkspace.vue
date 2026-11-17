<template>
  <CompareTable
    v-if="session?.kind === 'nodes' && session.data"
    :name="session.name"
    :compare-data="session.data"
    :loading="loading"
    page-mode
    :show-refresh="true"
    @close-compare="back"
    @refresh="refresh"
  />
  <FilePreview
    v-else-if="session?.kind === 'file' && session.data"
    :name="session.name"
    :preview-data="session.data"
    :refreshing="loading"
    page-mode
    :show-refresh="true"
    @close-preview="back"
    @refresh="refresh"
  />
  <PreviewFrame v-else page-mode :title="$t('comparePage.title')" @close="back">
    <UCard>
      <p class="text-sm text-muted">
        {{
          $t(
            loading ? "comparePage.nodeInfo.ipApi.loading" : session
              ? "previewWorkspace.loadFailed"
              : "previewWorkspace.expired",
          )
        }}
      </p>
      <UButton
        v-if="session"
        size="sm"
        class="mt-4"
        icon="i-lucide-refresh-cw"
        :loading="loading"
        @click="refresh"
      >
        {{ $t("comparePage.nodeInfo.ipApi.retry") }}
      </UButton>
    </UCard>
  </PreviewFrame>
</template>
<script setup lang="ts">
import { storeToRefs } from "pinia";
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useSubsApi } from "@/api/subs";
import { useFilesApi } from "@/api/files";
import CompareTable from "./CompareTable.vue";
import FilePreview from "./FilePreview.vue";
import PreviewFrame from "@/components/PreviewFrame.vue";
import { usePreviewSession } from "@/store/previewSession";
import { getEditorPath } from "@/utils/editorRoute";
const router = useRouter();
const route = useRoute();
const previewStore = usePreviewSession();
const { session: storedSession, loading } = storeToRefs(previewStore);
const session = computed(() => {
  const parentPath = route.meta.editorPreview ? getEditorPath(route) : undefined;
  return parentPath && storedSession.value?.returnPath !== parentPath ? undefined : storedSession.value;
});
const refresh = () => previewStore.refresh();
const back = () =>
  router.push(
    session.value?.returnPath ||
      (route.meta.editorPreview ? getEditorPath(route) : "/subs"),
  );
const sourceType = route.query.sourceType;
const sourceName = route.query.sourceName;
if (
  (sourceType === "sub" ||
    sourceType === "collection" ||
    sourceType === "file") &&
  typeof sourceName === "string" &&
  (session.value?.source?.name !== sourceName ||
    session.value?.source?.type !== sourceType)
) {
  const subsApi = useSubsApi();
  const filesApi = useFilesApi();
  previewStore.open({
    kind: sourceType === "file" ? "file" : "nodes",
    source: { type: sourceType, name: sourceName },
    name: sourceName,
    returnPath: sourceType === "file" ? "/files" : "/subs",
    data: null,
    refresh: async (isCurrent) => {
      try {
        const sourceResponse =
          sourceType === "file"
            ? await filesApi.getWholeFile(sourceName)
            : await subsApi.getOne(sourceType, sourceName);
        if (!isCurrent() || sourceResponse.data.status !== "success") return null;
        const response = await subsApi.compareSub(
          sourceType,
          sourceResponse.data.data,
        );
        return isCurrent() && response.data.status === "success" ? response.data.data : null;
      } catch {
        return null;
      }
    },
  });
  void previewStore.refresh();
}
</script>
