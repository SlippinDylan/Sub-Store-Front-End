<template>
  <div
    @touchstart="onTouchStart"
    @touchmove="onTouchMove"
    @touchend="onTouchEnd"
    style="overflow: hidden"
  >
    <div
      class="subs-list-wrapper"
      :class="{ 'dual-column-mode': isDualColumnMode }"
    >
      <div
        v-if="artifacts.length > 0 && tags.length > 0"
        ref="radioWrapperRef"
        class="radio-wrapper"
      >
        <WorkspaceSegments
          :model-value="tag"
          :options="tags"
          label="标签与来源"
          @update:model-value="setTag"
        />
      </div>

      <div
        class="subs-list-container"
        :style="{
          paddingTop: `${radioWrapperHeight ? radioWrapperHeight : radioWrapperHeight + 10}px`,
        }"
      >
        <WorkspaceListHeading label="全局同步" />
        <div class="sticky-title-wrapper sync-title workspace-sync-global-row">
          <div v-if="isNodeBackend" class="sync-title-main">
            <div class="global-cron-tip" :title="globalSyncCronText">
              <UIcon mode="svg" class="size-4 shrink-0 align-middle" name="i-lucide-clock" />
              <span>{{ globalSyncCronText }}</span>
            </div>
          </div>
          <p v-else class="list-title">{{ $t(`syncPage.title`) }}</p>
          <div class="actions-wrapper">
            <UButton
              v-if="artifacts.length > 0"
              class="upload-all-btn btn"
              color="neutral" variant="outline"
              :disabled="uploadAllIsDisabled"
              size="sm"
              :loading="uploadAllIsLoading"
              @click="uploadAll"
            >
              <UIcon mode="svg" class="size-4 shrink-0 align-middle"
                name="i-lucide-cloud-upload"
                v-if="!uploadAllIsLoading"
              />
              <span>同步全部</span>
            </UButton>
            <UButton
              v-if="syncPlatform !== 'gitlab'"
              class="upload-all-btn btn"
              color="neutral" variant="outline"
              size="sm"
              :loading="downloadAllIsLoading"
              @click="downloadAll"
            >
              <UIcon mode="svg" class="size-4 shrink-0 align-middle"
                name="i-lucide-cloud-download"
                v-if="!downloadAllIsLoading"
              />
              <span>从远端恢复任务</span>
            </UButton>
            <UButton
              class="preview-btn btn"
              color="neutral" variant="outline"
              size="sm"
              @click="preview"
            >
              <UIcon mode="svg" class="size-4 shrink-0 align-middle" name="i-lucide-eye" />
              <span>打开远端存储</span>
            </UButton>
          </div>
        </div>

        <div v-if="filteredArtifacts.length > 0">
          <WorkspaceListHeading label="任务名称" />
          <draggable
            class="sync-draggable-list"
            :class="{ 'dual-column': isDualColumnMode }"
            v-model="filteredArtifacts"
            @change="changeArtifacts"
            @start="handleDragStart"
            @end="handleDragEnd"
            itemKey="name"
            :scroll-sensitivity="200"
            :force-fallback="true"
            :scrollSpeed="8"
            :scroll="true"
            v-bind="{
              animation: 200,
              disabled: false,
              delay: 200,
              chosenClass: 'chosensub',
              handle: 'div',
            }"
          >
            <template #item="{ element }">
              <div :key="element.name" class="draggable-itemsync">
                <ArtifactsListItem
                  :name="element.name"
                  @edit="onClickEdit"
                  :disabled="swipeDisabled"
                  :is-dual-column="isDualColumnMode"
                />
              </div>
            </template>
          </draggable>
        </div>
      </div>
    </div>

    <div
      v-if="
        !isLoading &&
        fetchResult &&
        artifacts.length > 0 &&
        filteredArtifacts.length === 0
      "
      class="empty-state-wrapper"
    >
      <EmptyState image="empty" description="当前筛选下暂无数据" />
    </div>

    <!--没有数据-->
    <div
      v-if="!isLoading && fetchResult && artifacts.length === 0"
      class="empty-state-wrapper"
    >
      <EmptyState image="empty">
        <template #description>
          <h3>{{ $t(`syncPage.emptySub.title`) }}</h3>
          <p>{{ $t(`syncPage.emptySub.desc`) }}</p>
        </template>
      </EmptyState>
    </div>

    <!--数据加载失败-->
    <div v-if="!isLoading && !fetchResult" class="empty-state-wrapper">
      <EmptyState image="error" style="padding: 32px 30px">
        <template #description>
          <h3>{{ $t(`subPage.loadFailed.title`) }}</h3>
          <p>{{ $t(`subPage.loadFailed.desc`) }}</p>
          <a
            href="https://telegram.me/zhetengsha/218"
            style="color: var(--ui-primary)"
          >
            {{ $t(`magicPath.troubleshooting`) }}</a
          >
          <p>
            {{ $t(`subPage.loadFailed.about`) }}
            <a href="/aboutUs" style="color: var(--ui-primary)">
              {{ $t(`subPage.loadFailed.about`) }}
            </a>
          </p>
        </template>
      </EmptyState>
      <UButton :size="isDesktop ? 'sm' : 'md'" icon="i-lucide-refresh-cw" color="primary" @click="refresh">
        {{ $t(`subPage.loadFailed.btn`) }}
      </UButton>
      <!-- <a
        href="https://www.notion.so/Sub-Store-6259586994d34c11a4ced5c406264b46"
        target="_blank"
      >
        <span>{{ $t(`subPage.loadFailed.doc`) }}</span>
        <UIcon mode="svg" class="size-4 shrink-0 align-middle" name="i-lucide-external-link" />
      </a> -->
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useMediaQuery } from "@vueuse/core";
import WorkspaceSegments from '@/components/WorkspaceSegments.vue';
import WorkspaceListHeading from '@/components/WorkspaceListHeading.vue';
import ArtifactsListItem from "@/components/ArtifactsListItem.vue";
import { useArtifactsStore } from "@/store/artifacts";
import { storeToRefs } from "pinia";
import { useGlobalStore } from "@/store/global";
import { ref, computed, toRaw, onMounted, watch } from "vue";
import { initStores } from "@/utils/initApp";
import { useSettingsStore } from "@/store/settings";
import { useMethodStore } from '@/store/methodStore';
import draggable from "vuedraggable";
import { useSubsApi } from "@/api/subs";
import { useI18n } from "vue-i18n";
import { useAppNotifyStore } from "@/store/appNotify";
import { useBackend } from "@/hooks/useBackend";
import { useFilteredDraggableList } from "@/hooks/useFilteredDraggableList";
import { useListViewMode } from "@/hooks/useListViewMode";
import { useTagBarHeight } from "@/hooks/useTagBarHeight";
import { Dialog } from '@/services/feedback';
import { listItemMatchesSearch, shouldSearchListRemark } from "@/utils/listSearch";
import { useRouter } from "vue-router";
import { useSystemStore } from "@/store/system";
import { useListSearchStore } from "@/store/listSearch";
const isDesktop = useMediaQuery("(min-width: 768px)");

const { env } = useBackend();
const subsApi = useSubsApi();
const router = useRouter();
const globalStore = useGlobalStore();
const artifactsStore = useArtifactsStore();
const settingsStore = useSettingsStore();
const systemStore = useSystemStore();
const methodStore = useMethodStore();
const listSearchStore = useListSearchStore();
const { effectiveListViewMode } = useListViewMode();

const {
  // isSimpleMode,
  isLoading,
  fetchResult,
  // showFloatingRefreshButton,
} = storeToRefs(globalStore);
const { artifacts } = storeToRefs(artifactsStore);
const { navBarHeight } = storeToRefs(systemStore);
const isDualColumnMode = computed(() => {
  return effectiveListViewMode.value === "dual-column";
});
const {
  appearanceSetting,
  artifactStore: artifactStoreUrl,
  artifactStoreStatus,
  syncPlatform,
} = storeToRefs(settingsStore);
const { showNotify } = useAppNotifyStore();
const swipeDisabled = ref(false);
const sortFailed = ref(false);
const touchStartY = ref(null);
const touchStartX = ref(null);
const { t } = useI18n();
const isNodeBackend = computed(() => env.value?.backend === "Node");
const globalSyncCron = computed(() => {
  return `${env.value?.meta?.node?.env?.SUB_STORE_BACKEND_SYNC_CRON || ""}`.trim();
});
const globalSyncCronText = computed(() => {
  return globalSyncCron.value
    ? t("syncPage.globalCronTip", { cron: globalSyncCron.value })
    : t("syncPage.globalCronUnsetTip");
});
const getTag = () => {
  return localStorage.getItem("artifact-tag") || "all";
};
const tag = ref(getTag());
const tagNavBarHeight = computed(() => navBarHeight.value);
const tags = computed(() => {
  if (artifacts.value.length === 0) return [];

  let hasUntagged = false;
  const set = new Set<string>();
  artifacts.value.forEach(artifact => {
    if (Array.isArray(artifact.tag) && artifact.tag.length > 0) {
      artifact.tag.forEach(item => {
        set.add(item);
      });
    } else {
      hasUntagged = true;
    }
  });

  const customTags = Array.from(set).map((item: string) => ({
    label: item,
    value: item,
  }));
  const result = [{ label: t("specificWord.all"), value: "all" }, ...customTags];
  if (customTags.length > 0 && hasUntagged) {
    result.push({ label: t("specificWord.untagged"), value: "untagged" });
  }

  if (!result.find(item => item.value === tag.value)) {
    tag.value = "all";
  }

  return result;
});
const { tagBarRef: radioWrapperRef, tagBarHeight: radioWrapperHeight } = useTagBarHeight([
  tag,
  () => tags.value,
]);

const onTouchStart = (event: TouchEvent) => {
  touchStartY.value = Math.abs(event.touches[0].clientY);
  touchStartX.value = Math.abs(event.touches[0].clientX);
};

const onTouchMove = (event: TouchEvent) => {
  const deltaY = Math.abs(event.changedTouches[0].clientY - touchStartY.value);
  const deltaX = Math.abs(event.changedTouches[0].clientX - touchStartX.value);

  const isScrollingUp = deltaX > 2;
  const isScrollingUps = deltaY < 10;

  if (isScrollingUp && isScrollingUps) {
    event.preventDefault();
  }
};

const onTouchEnd = () => {
  touchStartY.value = null;
  touchStartX.value = null;
};

const uploadAllIsDisabled = computed(() => {
  return artifacts.value.length === 0;
});
const uploadAllIsLoading = ref(false);
const uploadAll = async () => {
  uploadAllIsLoading.value = true;
  await artifactsStore.syncAllArtifact();
  await settingsStore.fetchSettings();
  uploadAllIsLoading.value = false;
};
const downloadAllIsLoading = ref(false);
const downloadAll = async () => {
  downloadAllIsLoading.value = true;
  Dialog({
    popClass: "auto-dialog",
    title: t(`syncPage.preview.title`),
    content: artifactStoreUrl.value
      ? `${t("syncPage.download.content")}\n\n${t("syncPage.preview.content", {
          status: artifactStoreStatus.value || "VALID",
        })}\n${t("syncPage.preview.url")}`
      : `${t("syncPage.download.content")}\n\n${t("syncPage.preview.content", {
          status: artifactStoreStatus.value || "-",
        })}\n${t("syncPage.preview.noUrl")}`,
    noOkBtn: !artifactStoreUrl.value,
    okText: t(`syncPage.download.confirm`),
    cancelText: t(`syncPage.preview.cancel`),
    // @ts-ignore
    closeOnClickOverlay: true,
    onOk: async () => {
      try {
        await artifactsStore.restoreArtifacts();
      } catch (e) {
        showNotify({
          title: t("myPage.notify.restore.failed"),
          type: "danger",
          content: `${e.message ?? e}`,
        });
      } finally {
        downloadAllIsLoading.value = false;
      }
    },
    onCancel: async () => {
      downloadAllIsLoading.value = false;
    },
  });
};

const refresh = () => {
  initStores(true, true, false);
};

const preview = () => {
  if (
    artifactStoreUrl.value &&
    (!artifactStoreStatus.value || artifactStoreStatus.value === "VALID")
  ) {
    window.open(artifactStoreUrl.value);
  } else {
    Dialog({
      popClass: "auto-dialog",
      title: t(`syncPage.preview.title`),
      content: artifactStoreUrl.value
        ? `${t("syncPage.preview.content", {
            status: artifactStoreStatus.value || "VALID",
          })}\n${t("syncPage.preview.url")}`
        : `${t("syncPage.preview.content", {
            status: artifactStoreStatus.value || "-",
          })}\n${t("syncPage.preview.noUrl")}`,
      noOkBtn: !artifactStoreUrl.value,
      okText: t(`syncPage.preview.confirm`),
      cancelText: t(`syncPage.preview.cancel`),
      // @ts-ignore
      closeOnClickOverlay: true,
      onOk: () => {
        window.open(artifactStoreUrl.value);
      },
    });
  }
};

const onClickEdit = (artifact: Artifact) => {
  router.push(`/edit/sync/${artifact.name}`);
};

const onclickAddArtifact = () => {
  router.push("/edit/sync/UNTITLED");
};

onMounted(() => {
  methodStore.registerMethod("addSync", onclickAddArtifact);
});

// const sortArtifacts = (newCollections: any) => {
//   artifacts.value = newCollections;
// };
let dragData = null;
const changeArtifacts = async () => {
  try {
    let sortArtifacts: any;
    if (env.value.version > "2.14.48") {
      console.log("new sort > v2.14.48");
      const nameSortArray = artifacts.value.map((k) => k.name);
      // console.log(nameSortArray);
      sortArtifacts = await subsApi.newSortSub(
        "artifacts",
        JSON.parse(JSON.stringify(toRaw(nameSortArray)))
      );
      // console.log(JSON.stringify(sortArtifacts));
    } else {
      console.log("old sort < v2.14.48");
      sortArtifacts = await subsApi.sortSub(
        "artifacts",
        JSON.parse(JSON.stringify(toRaw(artifacts.value)))
      );
    }
    if (sortArtifacts?.data?.status !== "success") {
      sortFailed.value = true;
      showNotify({
        title: t("notify.sortsub.failed"),
        type: "danger",
        content: JSON.stringify(sortArtifacts),
      });
    }
  } catch (error) {
    sortFailed.value = true;
  }
};

const handleDragStart = () => {
  dragData = artifacts.value;
  swipeDisabled.value = true;
};

const handleDragEnd = () => {
  console.log("禁用禁止拖动");
  if (sortFailed.value) {
    artifacts.value = dragData;
  } else {
    dragData = null;
  }
  swipeDisabled.value = false;
};

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
};

const setTag = (current: string) => {
  tag.value = current;
  if (current === "all") {
    localStorage.removeItem("artifact-tag");
  } else {
    localStorage.setItem("artifact-tag", current);
  }
  scrollToTop();
};

const shouldShowElementByTag = (element: Artifact) => {
  if (tag.value === "all") return true;
  if (tag.value === "untagged") {
    return !Array.isArray(element.tag) || element.tag.length === 0;
  }
  return element.tag?.includes(tag.value);
};
const shouldShowElement = (element: Artifact) => {
  return shouldShowElementByTag(element)
    && listItemMatchesSearch(element, listSearchStore.normalizedQuery, {
      includeRemark: shouldSearchListRemark(appearanceSetting.value),
    });
};
const filteredArtifacts = useFilteredDraggableList(artifacts, shouldShowElement);
</script>
