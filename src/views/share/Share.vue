<template>
  <div style="overflow: hidden; -webkit-user-select: none; user-select: none">
    <div v-if="hasShares" class="link-nav-action-layer">
      <UButton
        :size="isDesktop ? 'sm' : 'md'"
        type="button"
        class="workspace-button"
        :aria-label="
          isSelectionMode
            ? $t(`sharePage.selectMode.cancel`)
            : $t(`sharePage.selectMode.enter`)
        "
        :title="
          isSelectionMode
            ? $t(`sharePage.selectMode.cancel`)
            : $t(`sharePage.selectMode.enter`)
        "
        @click="toggleSelectionMode"
       color="neutral" variant="outline">
        <UIcon mode="svg" class="size-4 shrink-0 align-middle"
          :name="
            isSelectionMode ? 'i-lucide-x' : 'i-lucide-list-checks'
          "
        /><span>{{ isSelectionMode ? "取消选择" : "批量选择" }}</span>
      </UButton>
    </div>

    <!-- 浮动按钮 -->

    <!-- 页面内容 -->
    <!-- 有数据 -->
    <div
      class="subs-list-wrapper"
      :class="{ 'dual-column-mode': isDualColumnMode }"
    >
      <div ref="radioWrapperRef" class="radio-wrapper">
        <WorkspaceSegments
          :model-value="tag"
          :options="tagOptions"
          label="标签与来源"
          @update:model-value="setTag"
        />
        <WorkspaceSegments
          v-model="resourceType"
          :options="resourceTypes"
          label="资源类型"
        />
      </div>
      <WorkspaceListHeading
        v-if="
          ((resourceType === 'all' || resourceType === 'sub') &&
            subShareDataCount > 0) ||
          ((resourceType === 'all' || resourceType === 'collection') &&
            collectionShareDataCount > 0) ||
          ((resourceType === 'all' || resourceType === 'file') &&
            fileShareDataCount > 0)
        "
        label="分享名称"
      />
      <div
        v-if="hasShares"
        class="link-page-content"
        :style="{
          paddingTop: `${radioWrapperHeight}px`,
          ...(isSelectionMode
            ? { paddingBottom: `${bottomSafeArea + 96}px` }
            : {}),
        }"
      >
        <!-- 单条订阅 -->
        <div
          v-if="
            subShareDataCount > 0 &&
            (resourceType === 'all' || resourceType === 'sub')
          "
          class="link-section"
        >
          <div class="sticky-title-wrappers" v-if="isSelectionMode">
            <div class="list-title">
              <UButton
                v-if="isSelectionMode"
                type="button"
                class="link-type-selection-toggle"
                :class="{ active: isShareTypeAllSelected('sub') }"
                :aria-label="getShareTypeSelectionA11yLabel('sub')"
                :title="getShareTypeSelectionA11yLabel('sub')"
                @click.stop="toggleShareTypeSelection('sub')"
               color="neutral" variant="outline">
                {{ getShareTypeSelectionButtonLabel("sub") }}
              </UButton>
            </div>
          </div>

          <draggable
            v-model="filteredSubShareData"
            :item-key="getShareSelectionKey"
            class="draggable-list"
            :class="{ 'dual-column': isDualColumnMode }"
            :scroll-sensitivity="200"
            :force-fallback="true"
            :scroll-speed="8"
            :scroll="true"
            v-bind="{
              animation: 200,
              disabled: isSelectionMode,
              delay: 200,
              chosenClass: 'chosensub',
              handle: 'div',
            }"
            @change="changeSort('sub', subShareData)"
            @start="handleDragStart(subShareData)"
            @end="handleDragEnd"
          >
            <template #item="{ element }">
              <div :key="getShareSelectionKey(element)" class="draggable-item">
                <div
                  v-if="isSelectionMode"
                  class="link-select-item"
                  :class="{
                    selected: isShareSelected(element),
                    'is-dual-column': isDualColumnMode,
                  }"
                  @click.stop="toggleShareSelection(element)"
                >
                  <SelectionOption
                    :model-value="isShareSelected(element)"
                    class="link-select-checkbox"
                    @click.stop="toggleShareSelection(element)"
                  />
                  <div class="link-select-item-content">
                    <ShareListItem
                      :data="element"
                      :disabled="true"
                      :is-dual-column="isDualColumnMode"
                    />
                  </div>
                </div>
                <ShareListItem
                  v-else
                  :data="element"
                  :disabled="swipeDisabled"
                  :is-dual-column="isDualColumnMode"
                />
              </div>
            </template>
          </draggable>
        </div>
        <!-- 组合订阅 -->
        <div
          v-if="
            collectionShareDataCount > 0 &&
            (resourceType === 'all' || resourceType === 'collection')
          "
          class="link-section"
        >
          <div class="sticky-title-wrappers" v-if="isSelectionMode">
            <div class="list-title">
              <UButton
                v-if="isSelectionMode"
                type="button"
                class="link-type-selection-toggle"
                :class="{ active: isShareTypeAllSelected('col') }"
                :aria-label="getShareTypeSelectionA11yLabel('col')"
                :title="getShareTypeSelectionA11yLabel('col')"
                @click.stop="toggleShareTypeSelection('col')"
               color="neutral" variant="outline">
                {{ getShareTypeSelectionButtonLabel("col") }}
              </UButton>
            </div>
          </div>

          <draggable
            v-model="filteredCollectionShareData"
            :item-key="getShareSelectionKey"
            class="draggable-list"
            :class="{ 'dual-column': isDualColumnMode }"
            :scroll-sensitivity="200"
            :force-fallback="true"
            :scroll-speed="8"
            :scroll="true"
            v-bind="{
              animation: 200,
              disabled: isSelectionMode,
              delay: 200,
              chosenClass: 'chosensub',
              handle: 'div',
            }"
            @change="changeSort('col', collectionShareData)"
            @start="handleDragStart(collectionShareData)"
            @end="handleDragEnd"
          >
            <template #item="{ element }">
              <div :key="getShareSelectionKey(element)" class="draggable-item">
                <div
                  v-if="isSelectionMode"
                  class="link-select-item"
                  :class="{
                    selected: isShareSelected(element),
                    'is-dual-column': isDualColumnMode,
                  }"
                  @click.stop="toggleShareSelection(element)"
                >
                  <SelectionOption
                    :model-value="isShareSelected(element)"
                    class="link-select-checkbox"
                    @click.stop="toggleShareSelection(element)"
                  />
                  <div class="link-select-item-content">
                    <ShareListItem
                      :data="element"
                      :disabled="true"
                      :is-dual-column="isDualColumnMode"
                    />
                  </div>
                </div>
                <ShareListItem
                  v-else
                  :data="element"
                  :disabled="swipeDisabled"
                  :is-dual-column="isDualColumnMode"
                />
              </div>
            </template>
          </draggable>
        </div>
        <!-- 文件 -->
        <div
          v-if="
            fileShareDataCount > 0 &&
            (resourceType === 'all' || resourceType === 'file')
          "
          class="link-section"
        >
          <div class="sticky-title-wrappers" v-if="isSelectionMode">
            <div class="list-title">
              <UButton
                v-if="isSelectionMode"
                type="button"
                class="link-type-selection-toggle"
                :class="{ active: isShareTypeAllSelected('file') }"
                :aria-label="getShareTypeSelectionA11yLabel('file')"
                :title="getShareTypeSelectionA11yLabel('file')"
                @click.stop="toggleShareTypeSelection('file')"
               color="neutral" variant="outline">
                {{ getShareTypeSelectionButtonLabel("file") }}
              </UButton>
            </div>
          </div>

          <draggable
            v-model="filteredFileShareData"
            :item-key="getShareSelectionKey"
            class="draggable-list"
            :class="{ 'dual-column': isDualColumnMode }"
            :scroll-sensitivity="200"
            :force-fallback="true"
            :scroll-speed="8"
            :scroll="true"
            v-bind="{
              animation: 200,
              disabled: isSelectionMode,
              delay: 200,
              chosenClass: 'chosensub',
              handle: 'div',
            }"
            @change="changeSort('file', fileShareData)"
            @start="handleDragStart(fileShareData)"
            @end="handleDragEnd"
          >
            <template #item="{ element }">
              <div :key="getShareSelectionKey(element)" class="draggable-item">
                <div
                  v-if="isSelectionMode"
                  class="link-select-item"
                  :class="{
                    selected: isShareSelected(element),
                    'is-dual-column': isDualColumnMode,
                  }"
                  @click.stop="toggleShareSelection(element)"
                >
                  <SelectionOption
                    :model-value="isShareSelected(element)"
                    class="link-select-checkbox"
                    @click.stop="toggleShareSelection(element)"
                  />
                  <div class="link-select-item-content">
                    <ShareListItem
                      :data="element"
                      :disabled="true"
                      :is-dual-column="isDualColumnMode"
                    />
                  </div>
                </div>
                <ShareListItem
                  v-else
                  :data="element"
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
        hasShares &&
        !(
          ((resourceType === 'all' || resourceType === 'sub') &&
            subShareDataCount > 0) ||
          ((resourceType === 'all' || resourceType === 'collection') &&
            collectionShareDataCount > 0) ||
          ((resourceType === 'all' || resourceType === 'file') &&
            fileShareDataCount > 0)
        )
      "
      class="empty-state-wrapper"
    >
      <EmptyState image="empty" description="当前筛选下暂无数据" />
    </div>
    <!-- 没有数据 -->
    <div
      v-if="!isLoading && fetchResult && !hasShares"
      class="empty-state-wrapper"
    >
      <EmptyState image="empty">
        <template #description>
          <h3>{{ $t(`sharePage.emptyShare.title`) }}</h3>
          <p>{{ $t(`sharePage.emptyShare.desc`) }}</p>
        </template>
      </EmptyState>
    </div>

    <!-- 数据加载失败 -->
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
    <div
      v-if="hasShares && isSelectionMode"
      class="link-selection-actions"
      :style="{ bottom: `${bottomSafeArea + 12}px` }"
    >
      <div class="link-selection-summary">
        {{
          $t(`sharePage.selectMode.selectedCount`, {
            count: selectedShareCount,
          })
        }}
      </div>
      <UButton variant="outline"
        size="sm"
        color="primary"
        @click="toggleSelectAllShares"
      >
        {{
          isAllSharesSelected
            ? $t(`sharePage.selectMode.clearAll`)
            : $t(`sharePage.selectMode.selectAll`)
        }}
      </UButton>
      <UButton variant="outline"
        size="sm"
        color="primary"
        :disabled="expiredShareCount === 0"
        @click="selectExpiredShares"
      >
        {{ $t(`sharePage.selectMode.selectExpired`) }}
      </UButton>
      <UButton
        size="sm"
        color="error"
        :disabled="selectedShareCount === 0 || isDeletingSelectedShares"
        :loading="isDeletingSelectedShares"
        @click="confirmDeleteSelectedShares"
      >
        {{ $t(`sharePage.selectMode.delete`) }}
      </UButton>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useMediaQuery } from "@vueuse/core";
import WorkspaceSegments from '@/components/WorkspaceSegments.vue';
import WorkspaceListHeading from '@/components/WorkspaceListHeading.vue';
import { storeToRefs } from "pinia";
import { computed, onMounted, ref, toRaw, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import draggable from "vuedraggable";
import ShareListItem from "@/components/ShareListItem.vue";
import { useShareApi } from "@/api/share";
import { useBackend } from "@/hooks/useBackend";
import { useFilteredDraggableList } from "@/hooks/useFilteredDraggableList";
import { useListViewMode } from "@/hooks/useListViewMode";
import { useListViewModeSelectionLock } from "@/hooks/useListViewModeSelectionLock";
import { useTagBarHeight } from "@/hooks/useTagBarHeight";
import { useAppNotifyStore } from "@/store/appNotify";
import { useGlobalStore } from "@/store/global";
import { useListSearchStore } from "@/store/listSearch";
import { useSettingsStore } from "@/store/settings";
import { useSubsStore } from "@/store/subs";
import { useSystemStore } from "@/store/system";
import { getShareCreatePath } from "@/utils/share";
import { listItemMatchesSearch, shouldSearchListRemark } from "@/utils/listSearch";
import {
  ALL_SHARE_TAG,
  buildShareTagOptions,
  groupSharesByType,
  resolveShareTagFilter,
  shareMatchesTagFilter,
} from "@/utils/shareTags";
import { initStores } from "@/utils/initApp";
import { openManagedDeleteDialog } from "@/utils/archive";
const isDesktop = useMediaQuery("(min-width: 768px)");

type ShareGroupKey = "sub" | "col" | "file";

const shareTypeLabelKeyMap: Record<ShareGroupKey, "singleSub" | "collectionSub" | "file"> = {
  sub: "singleSub",
  col: "collectionSub",
  file: "file",
};

const router = useRouter();

const { env } = useBackend();
const isArchiveEnabled = computed(() => {
  return env.value?.feature?.archive;
});
const { t } = useI18n();
const shareApi = useShareApi();
const { showNotify } = useAppNotifyStore();
const subsStore = useSubsStore();
const globalStore = useGlobalStore();
const systemStore = useSystemStore();
const settingsStore = useSettingsStore();
const listSearchStore = useListSearchStore();
const { appearanceSetting } = storeToRefs(settingsStore);
const { effectiveListViewMode } = useListViewMode();
const isDualColumnMode = computed(() => {
  return effectiveListViewMode.value === "dual-column";
});

const { shares, hasShares } = storeToRefs(subsStore);
const {
  isLoading,
  fetchResult,
  bottomSafeArea,
} = storeToRefs(globalStore);
const { navBarHeight } = storeToRefs(systemStore);
const swipeDisabled = ref(false);

const refresh = () => {
  initStores(true, true, true);
};



const addShare = () => {
  router.push(getShareCreatePath());
};

const getTag = () => {
  return localStorage.getItem("share-tag") || ALL_SHARE_TAG;
};
const resourceType = ref('all');
const resourceTypes = [{'value': 'all', 'label': '全部类型'}, {'value': 'sub', 'label': '单条订阅'}, {'value': 'collection', 'label': '组合订阅'}, {'value': 'file', 'label': '文件'}];
const tag = ref(getTag());
const tagNavBarHeight = computed(() => {
  return navBarHeight.value;
});
const tagOptions = computed(() => {
  const options = buildShareTagOptions(shares.value, {
    all: t("specificWord.all"),
    untagged: t("specificWord.untagged"),
  });
  const resolvedTag = resolveShareTagFilter(tag.value, options);
  if (resolvedTag !== tag.value) {
    tag.value = resolvedTag;
    if (resolvedTag === ALL_SHARE_TAG) {
      localStorage.removeItem("share-tag");
    }
  }
  return options;
});
const showTagBar = computed(() => {
  return tagOptions.value.length > 0;
});
const { tagBarRef: radioWrapperRef, tagBarHeight: radioWrapperHeight } = useTagBarHeight([
  tag,
  () => tagOptions.value,
]);
const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
};
const setTag = (current: string) => {
  tag.value = current;
  if (current === ALL_SHARE_TAG) {
    localStorage.removeItem("share-tag");
  } else {
    localStorage.setItem("share-tag", current);
  }
  scrollToTop();
};
const shouldShowShare = (share: Share) => {
  return shareMatchesTagFilter(share, tag.value)
    && listItemMatchesSearch(share, listSearchStore.normalizedQuery, {
      includeRemark: shouldSearchListRemark(appearanceSetting.value),
    });
};

const subShareData = ref<Share[]>([]);
const collectionShareData = ref<Share[]>([]);
const fileShareData = ref<Share[]>([]);
const filteredSubShareData = useFilteredDraggableList(subShareData, shouldShowShare);
const filteredCollectionShareData = useFilteredDraggableList(collectionShareData, shouldShowShare);
const filteredFileShareData = useFilteredDraggableList(fileShareData, shouldShowShare);
const isSelectionMode = ref(false);
const selectedShareKeys = ref<string[]>([]);
const isDeletingSelectedShares = ref(false);
useListViewModeSelectionLock(isSelectionMode);

const subShareDataCount = computed(() => subShareData.value.filter(shouldShowShare).length);
const collectionShareDataCount = computed(() => collectionShareData.value.filter(shouldShowShare).length);
const fileShareDataCount = computed(() => fileShareData.value.filter(shouldShowShare).length);
const allShareData = computed(() => [
  ...subShareData.value,
  ...collectionShareData.value,
  ...fileShareData.value,
].filter((item) => shouldShowShare(item)));
const selectedShareKeySet = computed(() => new Set(selectedShareKeys.value));
const selectedShares = computed(() =>
  allShareData.value.filter((item) =>
    selectedShareKeySet.value.has(getShareSelectionKey(item)),
  ),
);
const expiredShares = computed(() =>
  allShareData.value.filter((item) => isShareExpired(item)),
);
const selectedShareCount = computed(() => selectedShares.value.length);
const expiredShareCount = computed(() => expiredShares.value.length);
const isAllSharesSelected = computed(
  () =>
    allShareData.value.length > 0
    && selectedShareCount.value === allShareData.value.length,
);

function getShareTypeLabel(type: ShareGroupKey) {
  return t(`specificWord.${shareTypeLabelKeyMap[type]}`);
}

function getShareSelectionKey(item: Share) {
  return `${item.type || ""}-${item.name || ""}-${item.token || ""}`;
}

function getVisibleSharesByType(type: ShareGroupKey) {
  const sharesByType: Record<ShareGroupKey, Share[]> = {
    sub: subShareData.value,
    col: collectionShareData.value,
    file: fileShareData.value,
  };
  return sharesByType[type].filter((item) => shouldShowShare(item));
}

function getVisibleShareKeysByType(type: ShareGroupKey) {
  return getVisibleSharesByType(type).map((item) => getShareSelectionKey(item));
}

function getSelectedShareCountByType(type: ShareGroupKey) {
  const selectedKeys = selectedShareKeySet.value;
  return getVisibleShareKeysByType(type).filter((key) => selectedKeys.has(key)).length;
}

function isShareTypeAllSelected(type: ShareGroupKey) {
  const visibleShares = getVisibleSharesByType(type);
  return visibleShares.length > 0
    && getSelectedShareCountByType(type) === visibleShares.length;
}

function getShareTypeSelectionButtonLabel(type: ShareGroupKey) {
  return isShareTypeAllSelected(type)
    ? t("sharePage.selectMode.clearAll")
    : t("sharePage.selectMode.selectAll");
}

function getShareTypeSelectionA11yLabel(type: ShareGroupKey) {
  return isShareTypeAllSelected(type)
    ? t("sharePage.selectMode.clearTypeAll", {
      type: getShareTypeLabel(type),
    })
    : t("sharePage.selectMode.selectTypeAll", {
      type: getShareTypeLabel(type),
    });
}

function clearSelectedShares() {
  selectedShareKeys.value = [];
}

function exitSelectionMode() {
  clearSelectedShares();
  isSelectionMode.value = false;
}

function toggleSelectionMode() {
  if (isSelectionMode.value) {
    exitSelectionMode();
    return;
  }
  isSelectionMode.value = true;
}

function isShareSelected(item: Share) {
  return selectedShareKeySet.value.has(getShareSelectionKey(item));
}

function toggleShareSelection(item: Share) {
  const selectionKey = getShareSelectionKey(item);
  if (selectedShareKeySet.value.has(selectionKey)) {
    selectedShareKeys.value = selectedShareKeys.value.filter(
      (key) => key !== selectionKey,
    );
    return;
  }
  selectedShareKeys.value = [...selectedShareKeys.value, selectionKey];
}

function toggleSelectAllShares() {
  if (isAllSharesSelected.value) {
    clearSelectedShares();
    return;
  }
  selectedShareKeys.value = allShareData.value.map((item) =>
    getShareSelectionKey(item),
  );
}

function toggleShareTypeSelection(type: ShareGroupKey) {
  const typeKeys = getVisibleShareKeysByType(type);
  if (typeKeys.length === 0) {
    return;
  }

  if (isShareTypeAllSelected(type)) {
    const typeKeySet = new Set(typeKeys);
    selectedShareKeys.value = selectedShareKeys.value.filter((key) =>
      !typeKeySet.has(key),
    );
    return;
  }

  const nextSelectedKeySet = new Set(selectedShareKeys.value);
  typeKeys.forEach((key) => {
    nextSelectedKeySet.add(key);
  });
  selectedShareKeys.value = Array.from(nextSelectedKeySet);
}

function isShareExpired(item: Share) {
  return typeof item.exp === "number" && item.exp <= Date.now();
}

function selectExpiredShares() {
  if (expiredShareCount.value === 0) {
    return;
  }
  selectedShareKeys.value = expiredShares.value.map((item) =>
    getShareSelectionKey(item),
  );
}

watch(
  () => shares.value,
  (val) => {
    const groupedShares = groupSharesByType(val);
    subShareData.value = [...groupedShares.sub];
    collectionShareData.value = [...groupedShares.col];
    fileShareData.value = [...groupedShares.file];
  },
  { immediate: true, deep: true }
);

watch(
  allShareData,
  (val) => {
    const validKeys = new Set(val.map((item) => getShareSelectionKey(item)));
    selectedShareKeys.value = selectedShareKeys.value.filter((item) =>
      validKeys.has(item),
    );
    if (!val.length) {
      exitSelectionMode();
    }
  },
  { immediate: true, deep: true },
);

const sortFailed = ref(false);
let dragData: any = null;

const changeSort = async (type: string, dataValue: any[]) => {
  try {
    const allTokensKeySortArray = [
      ...subShareData.value,
      ...collectionShareData.value,
      ...fileShareData.value,
    ].map((item) => `${item.type}-${item.name}-${item.token}`);
    
    const sortRes = await shareApi.sortShares(
      JSON.parse(JSON.stringify(toRaw(allTokensKeySortArray)))
    );
    if (sortRes?.data?.status !== "success") {
      sortFailed.value = true;
      showNotify({
        title: t("notify.sortsub.failed"),
        type: "danger",
        content: JSON.stringify(sortRes),
      });
    }
  } catch (error) {
    sortFailed.value = true;
  }
};

const handleDragStart = (dataValue: any) => {
  swipeDisabled.value = true;
  dragData = dataValue;
};

const handleDragEnd = () => {
  if (sortFailed.value) {
    subsStore.fetchShareData();
    sortFailed.value = false;
  }
  dragData = null;
  swipeDisabled.value = false;
};

const init = async () => {
  await subsStore.fetchShareData();
}

onMounted(() => {
  init();
});

const deleteSelectedShares = async (mode: DeleteMode = "permanent") => {
  if (selectedShareCount.value === 0 || isDeletingSelectedShares.value) {
    return;
  }
  isDeletingSelectedShares.value = true;
  const deleteTargets = [...selectedShares.value];
  const results = await Promise.all(
    deleteTargets.map(async (item) => {
      if (!item.token || !item.type || !item.name) {
        return false;
      }
      try {
        const { data } = await shareApi.deleteShare(item.token, item.type, item.name, mode);
        return data?.status === "success";
      } catch (error) {
        console.log("batch deleteShare error", error);
        return false;
      }
    }),
  );

  await subsStore.fetchShareData();

  const successCount = results.filter(Boolean).length;
  const failedCount = results.length - successCount;

  if (failedCount === 0) {
    showNotify({
      type: mode === "archive" ? "success" : "danger",
      title:
        mode === "archive"
          ? t("archivePage.liveDelete.succeedNotify")
          : t("sharePage.batchDelete.succeedNotify"),
    });
    exitSelectionMode();
  } else {
    showNotify({
      type: "danger",
      title: t("sharePage.batchDelete.failNotify"),
      content: t("sharePage.batchDelete.result", {
        success: successCount,
        failed: failedCount,
      }),
    });
  }

  isDeletingSelectedShares.value = false;
};

const confirmDeleteSelectedShares = () => {
  if (selectedShareCount.value === 0 || isDeletingSelectedShares.value) {
    return;
  }
  openManagedDeleteDialog({
    enabled: isArchiveEnabled.value,
    managedTitle: t("archivePage.liveDelete.title"),
    managedContent: t("archivePage.liveDelete.batchDesc", {
      count: selectedShareCount.value,
      type: t("specificWord.share"),
    }),
    managedCancelText: t("archivePage.liveDelete.btn.archive"),
    managedOkText: t("archivePage.liveDelete.btn.permanent"),
    legacyTitle: t("sharePage.batchDelete.title"),
    legacyContent: t("sharePage.batchDelete.desc", {
      count: selectedShareCount.value,
    }),
    legacyCancelText: t("sharePage.deleteShare.btn.cancel"),
    legacyOkText: t("sharePage.deleteShare.btn.confirm"),
    onArchive: () => deleteSelectedShares("archive"),
    onPermanent: () => deleteSelectedShares("permanent"),
  });
};

</script>
