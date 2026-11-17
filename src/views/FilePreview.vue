<template>
  <PreviewFrame
    :page-mode="pageMode || !!url"
    :title="String(displayName || $t(`comparePage.title`))"
    @close="closePreviewModal"
  >
    <template #actions>
      <UButton
        size="sm"
        v-if="showRefresh"
        :loading="loading || refreshing"
        type="button"
        class="workspace-button"
        icon="i-lucide-refresh-cw"
        @click="refreshPreview"
        color="neutral"
        variant="outline"
      >
        刷新
      </UButton>
      <UButton
        size="sm"
        type="button"
        class="workspace-button"
        icon="i-lucide-scroll-text"
        @click="openLogsOverlay"
        color="neutral"
        variant="outline"
      >
        运行日志
      </UButton>
    </template>
    <div class="compare-page-wrapper">
      <div
        v-if="url"
        class="flex items-center justify-between gap-3 rounded-lg border border-default bg-muted px-4 py-3 text-sm"
      >
        <span class="min-w-0 truncate text-muted">{{ displayName }}</span>
        <UButton
          size="sm"
          color="neutral"
          variant="outline"
          icon="i-lucide-link"
          @click="copyUrl"
        >
          {{ $t("previewWorkspace.copyLink") }}
        </UButton>
      </div>
      <p
        v-if="loadError"
        role="alert"
        class="rounded-lg border border-error p-4 text-sm text-error"
      >
        {{ loadError }}
      </p>
      <cmView
        :isReadOnly="true"
        id="filePreview"
        :editor-language="previewLanguage"
        :toolbar-actions="previewToolbarActions"
        toolbar-variant="preview"
        @update:editor-language="setPreviewLanguage"
      />
      <!-- <div class="compare-page-body">
        <div class="block-wrapper">
          <div class="input-wrapper">
            <FieldTextarea
              v-model="processedData"
              :rows="23"
              autosize
              placeholder=" "
              readonly
            /> 
          </div>
        </div>
      </div> -->
    </div>
  </PreviewFrame>
</template>


<script lang="ts" setup>
import PreviewFrame from "@/components/PreviewFrame.vue";
import axios from 'axios';
import { useFilesApi } from "@/api/files";
import { useSubsApi } from "@/api/subs";
import { useSubsStore } from "@/store/subs";
import { Toast } from '@/services/feedback';
import { computed, ref, watch, watchEffect, onBeforeUnmount } from "vue";
import { useI18n } from "vue-i18n";
import { copyText } from "@/utils/clipboard";
import { useAppNotifyStore } from "@/store/appNotify";
import { useLogsOverlayStore } from "@/store/logsOverlay";
import cmView from "@/views/editCode/cmView.vue";
import { useCodeStore } from "@/store/codeStore";
import { useRoute, useRouter } from 'vue-router';

const cmStore = useCodeStore();
onBeforeUnmount(() => { previewRequest?.abort(); delete cmStore.EditCode.filePreview; });
const logsOverlayStore = useLogsOverlayStore();
const { showNotify } = useAppNotifyStore();

const { t } = useI18n();
const subsStore = useSubsStore();
const filesApi = useFilesApi();
const subsApi = useSubsApi();

const route = useRoute();
const router = useRouter();
const closePreviewModal = () => { if (url) { if (window.history.state.back) router.back(); else router.push('/subs'); } else clickClose(); };
const { url } = route.query as { url: string };
const props = defineProps<{
  previewData?: any;
  name?: string;
  showRefresh?: boolean;
  pageMode?: boolean;
  refreshing?: boolean;
}>();
const emit = defineEmits(["closePreview", "refresh"]);

const processedData = ref('')
const previewToolbarActions = ["language", "search", "copy"];
const previewLanguage = ref<string | undefined>(undefined);
const isSavingPreviewLanguage = ref(false);
const loadedPreviewLanguageSources = new Set<string>();
let previewLanguageSyncToken = 0;

type PreviewSourceType = "sub" | "collection" | "file";

const getRouteQueryString = (value: unknown) => {
  if (Array.isArray(value)) return value[0];
  return typeof value === "string" ? value : undefined;
};

const parsePreviewSourceFromUrl = (): { type: PreviewSourceType; name: string } | null => {
  if (!url) return null;

  try {
    const previewUrl = new URL(url, window.location.origin);
    const segments = previewUrl.pathname
      .split("/")
      .map((segment) => decodeURIComponent(segment))
      .filter(Boolean);
    const downloadIndex = segments.findIndex((segment) => segment === "download");
    if (downloadIndex < 0) return null;

    if (segments[downloadIndex + 1] === "collection" && segments[downloadIndex + 2]) {
      return {
        type: "collection",
        name: segments[downloadIndex + 2],
      };
    }

    if (segments[downloadIndex + 1]) {
      return {
        type: "sub",
        name: segments[downloadIndex + 1],
      };
    }
  } catch (error) {
    console.warn("Failed to parse preview source from URL", error);
  }

  return null;
};

const getPreviewSource = (): { type: PreviewSourceType; name: string } | null => {
  if (!url && props.name) {
    return {
      type: "file",
      name: props.name,
    };
  }

  const sourceType = getRouteQueryString(route.query.sourceType);
  const sourceName = getRouteQueryString(route.query.sourceName);
  if (
    sourceName &&
    (sourceType === "sub" || sourceType === "collection" || sourceType === "file")
  ) {
    return {
      type: sourceType,
      name: sourceName,
    };
  }

  return parsePreviewSourceFromUrl();
};

const getPreviewSourceData = (source = getPreviewSource()) => {
  if (!source) return null;

  if (source.type === "file") {
    return subsStore.getOneFile(source.name);
  }
  if (source.type === "collection") {
    return subsStore.getOneCollection(source.name);
  }
  return subsStore.getOneSub(source.name);
};

const getPreviewStoreType = (type: PreviewSourceType) => {
  if (type === "file") return "files";
  if (type === "collection") return "collections";
  return "subs";
};

const getPreviewSourceKey = (source: { type: PreviewSourceType; name: string }) =>
  `${source.type}:${source.name}`;

const syncPreviewLanguageFromSource = async () => {
  if (isSavingPreviewLanguage.value) return;

  const token = ++previewLanguageSyncToken;
  const source = getPreviewSource();
  if (!source) {
    previewLanguage.value = undefined;
    return;
  }

  const sourceKey = getPreviewSourceKey(source);
  let sourceData = getPreviewSourceData(source);
  if (!sourceData && !loadedPreviewLanguageSources.has(sourceKey)) {
    loadedPreviewLanguageSources.add(sourceKey);
    await subsStore.fetchSubsData();

    const currentSource = getPreviewSource();
    if (
      token !== previewLanguageSyncToken ||
      isSavingPreviewLanguage.value ||
      !currentSource ||
      getPreviewSourceKey(currentSource) !== sourceKey
    ) {
      return;
    }

    sourceData = getPreviewSourceData(source);
  }

  previewLanguage.value = sourceData?.previewLanguage || undefined;
};

watchEffect(() => {
  void syncPreviewLanguageFromSource();
});

const setPreviewLanguage = async (language?: string) => {
  previewLanguage.value = language;

  const source = getPreviewSource();
  if (!source) return;

  isSavingPreviewLanguage.value = true;

  try {
    let sourceData = getPreviewSourceData(source);
    if (!sourceData) {
      await subsStore.fetchSubsData();
      sourceData = getPreviewSourceData(source);
    }
    if (!sourceData) return;

    const nextLanguage = language || null;
    if ((sourceData.previewLanguage || null) === nextLanguage) return;

    const data = {
      previewLanguage: nextLanguage,
    };

    const res =
      source.type === "file"
        ? await filesApi.editFile(source.name, data)
        : await subsApi.editSub(source.type, source.name, data as any);

    if (res?.data?.status !== "success") {
      throw new Error("Save preview language failed");
    }

    const nextSourceData = res?.data?.data || {
      ...sourceData,
      previewLanguage: nextLanguage,
    };
    if (!nextLanguage) {
      delete nextSourceData.previewLanguage;
    }

    subsStore.setOneData(
      getPreviewStoreType(source.type),
      source.name,
      nextSourceData
    );
  } catch (error) {
    console.error("Failed to save preview language", error);
    showNotify({
      type: "warning",
      title: "语言选择保存失败",
    });
  } finally {
    isSavingPreviewLanguage.value = false;
  }
};

let previewRequest: AbortController | undefined;
const loadError = ref("");
const loading = ref(false);
const loadUrl = async () => {
  if (url) {
    previewRequest?.abort();
    const request = new AbortController();
    previewRequest = request;
    loading.value = true;
    loadError.value = "";
    try {
      cmStore.setEditCode('filePreview', 'Loading...')
      const response = await axios.get(url as string, {
        signal: request.signal,
        responseType: 'text',
        transformResponse: [(data) => data],
      })
      if (request.signal.aborted) return;
      processedData.value = response.data
      cmStore.setEditCode('filePreview', processedData.value || '')
    } catch (error) {
      if (request.signal.aborted) return;
      let data = error.response?.data
      if (data) {
        try {
          data = JSON.stringify(JSON.parse(error.response?.data), null, 2)
        } catch (e) {
          
        }
      }
      loadError.value = t('previewWorkspace.loadFailed');
      cmStore.setEditCode('filePreview', `Error: ${
      error.response ? `${error.response.status} ${error.response.statusText}\n\n${data}` : error.message
      }`)
    } finally {
      if (previewRequest === request) loading.value = false;
    }
  }
  if (route.query.name) {
    document.title = `${route.query.name} - Sub-Store`
  }
};
void loadUrl();
const refreshPreview = () => url ? loadUrl() : emit('refresh');

const showRefresh = computed(() => props.showRefresh !== false);

const isOriginalVisible = ref(true);
const isProcessedVisible = ref(true);

const displayName = computed(() => {
  if(route.query.name) return route.query.name
  const sub = subsStore.getOneFile(props.name);
  return sub?.displayName || sub?.["display-name"] || props.name;
});

watch(() => props.previewData?.processed, (val) => {
  if (!url && val != null) {
    cmStore.setEditCode('filePreview', val)
  }
}, { immediate: true });

 
const clickClose = () => {
  emit("closePreview");
};
const openLogsOverlay = () => {
  logsOverlayStore.open();
};
const copyUrl = async () => {
  try {
    await copyText(url);
    showNotify({ title: t("previewWorkspace.linkCopied") });
  } catch (error) {
    Toast.fail(t("globalNotify.copyFailed", { e: error?.message ?? String(error) }));
  }
};
</script>

<style scoped>
.compare-page-wrapper { width: 100%; min-width: 0; display: flex; flex-direction: column; gap: 12px; }
.compare-page-wrapper :deep(.cmviewRef) { width: 100%; height: 48dvh; border: 1px solid var(--ui-border); border-radius: var(--ui-radius); overflow: hidden; }
.preview-workspace .compare-page-wrapper :deep(.cmviewRef) { height: max(480px, calc(100dvh - 230px)); }
</style>
