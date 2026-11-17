<template>
  <div style="overflow: hidden; -webkit-user-select: none; user-select: none">
    <div v-if="hasEntries" class="archive-nav-action-layer">
      <UButton
        :size="isDesktop ? 'sm' : 'md'"
        type="button"
        class="workspace-button"
        :aria-label="
          isSelectionMode
            ? $t('archivePage.selectMode.cancel')
            : $t('archivePage.selectMode.enter')
        "
        :title="
          isSelectionMode
            ? $t('archivePage.selectMode.cancel')
            : $t('archivePage.selectMode.enter')
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
            subEntryCount > 0) ||
          ((resourceType === 'all' || resourceType === 'collection') &&
            colEntryCount > 0) ||
          ((resourceType === 'all' || resourceType === 'file') &&
            fileEntryCount > 0) ||
          ((resourceType === 'all' || resourceType === 'artifact') &&
            artifactEntryCount > 0) ||
          ((resourceType === 'all' || resourceType === 'share') &&
            shareEntryCount > 0)
        "
        label="归档名称"
      />
      <div
        v-if="hasEntries"
        class="archive-page-content"
        :style="{
          paddingTop: `${radioWrapperHeight}px`,
          ...(isSelectionMode
            ? { paddingBottom: `${bottomSafeArea + 108}px` }
            : {}),
        }"
      >
        <div
          v-if="
            subEntryCount > 0 &&
            (resourceType === 'all' || resourceType === 'sub')
          "
          class="archive-section"
        >
          <div class="sticky-title-wrappers" v-if="isSelectionMode">
            <div class="list-title">
              <UButton
                v-if="isSelectionMode"
                type="button"
                class="archive-type-selection-toggle"
                :class="{ active: isTypeAllSelected('sub') }"
                :aria-label="getTypeSelectionA11yLabel('sub')"
                :title="getTypeSelectionA11yLabel('sub')"
                @click.stop="toggleTypeSelection('sub')"
               color="neutral" variant="outline">
                {{ getTypeSelectionButtonLabel("sub") }}
              </UButton>
            </div>
          </div>

          <draggable
            v-model="filteredSubEntries"
            item-key="id"
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
            @change="changeSort"
            @start="handleDragStart"
            @end="handleDragEnd"
          >
            <template #item="{ element }">
              <div :key="element.id" class="draggable-item">
                <div
                  v-if="isSelectionMode"
                  class="archive-select-item"
                  :class="{
                    selected: isEntrySelected(element),
                    'is-dual-column': isDualColumnMode,
                  }"
                  @click.stop="toggleEntrySelection(element)"
                >
                  <SelectionOption
                    :model-value="isEntrySelected(element)"
                    class="archive-select-checkbox"
                    @click.stop="toggleEntrySelection(element)"
                  />
                  <div class="archive-select-item-content">
                    <ArchiveListItem
                      :data="element"
                      :disabled="true"
                      :is-dual-column="isDualColumnMode"
                    />
                  </div>
                </div>
                <ArchiveListItem
                  v-else
                  :data="element"
                  :disabled="dragDisabled"
                  :is-dual-column="isDualColumnMode"
                  @restore="restoreEntry"
                  @delete="confirmDeleteEntry"
                />
              </div>
            </template>
          </draggable>
        </div>

        <div
          v-if="
            colEntryCount > 0 &&
            (resourceType === 'all' || resourceType === 'collection')
          "
          class="archive-section"
        >
          <div class="sticky-title-wrappers" v-if="isSelectionMode">
            <div class="list-title">
              <UButton
                v-if="isSelectionMode"
                type="button"
                class="archive-type-selection-toggle"
                :class="{ active: isTypeAllSelected('col') }"
                :aria-label="getTypeSelectionA11yLabel('col')"
                :title="getTypeSelectionA11yLabel('col')"
                @click.stop="toggleTypeSelection('col')"
               color="neutral" variant="outline">
                {{ getTypeSelectionButtonLabel("col") }}
              </UButton>
            </div>
          </div>

          <draggable
            v-model="filteredColEntries"
            item-key="id"
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
            @change="changeSort"
            @start="handleDragStart"
            @end="handleDragEnd"
          >
            <template #item="{ element }">
              <div :key="element.id" class="draggable-item">
                <div
                  v-if="isSelectionMode"
                  class="archive-select-item"
                  :class="{
                    selected: isEntrySelected(element),
                    'is-dual-column': isDualColumnMode,
                  }"
                  @click.stop="toggleEntrySelection(element)"
                >
                  <SelectionOption
                    :model-value="isEntrySelected(element)"
                    class="archive-select-checkbox"
                    @click.stop="toggleEntrySelection(element)"
                  />
                  <div class="archive-select-item-content">
                    <ArchiveListItem
                      :data="element"
                      :disabled="true"
                      :is-dual-column="isDualColumnMode"
                    />
                  </div>
                </div>
                <ArchiveListItem
                  v-else
                  :data="element"
                  :disabled="dragDisabled"
                  :is-dual-column="isDualColumnMode"
                  @restore="restoreEntry"
                  @delete="confirmDeleteEntry"
                />
              </div>
            </template>
          </draggable>
        </div>

        <div
          v-if="
            fileEntryCount > 0 &&
            (resourceType === 'all' || resourceType === 'file')
          "
          class="archive-section"
        >
          <div class="sticky-title-wrappers" v-if="isSelectionMode">
            <div class="list-title">
              <UButton
                v-if="isSelectionMode"
                type="button"
                class="archive-type-selection-toggle"
                :class="{ active: isTypeAllSelected('file') }"
                :aria-label="getTypeSelectionA11yLabel('file')"
                :title="getTypeSelectionA11yLabel('file')"
                @click.stop="toggleTypeSelection('file')"
               color="neutral" variant="outline">
                {{ getTypeSelectionButtonLabel("file") }}
              </UButton>
            </div>
          </div>

          <draggable
            v-model="filteredFileEntries"
            item-key="id"
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
            @change="changeSort"
            @start="handleDragStart"
            @end="handleDragEnd"
          >
            <template #item="{ element }">
              <div :key="element.id" class="draggable-item">
                <div
                  v-if="isSelectionMode"
                  class="archive-select-item"
                  :class="{
                    selected: isEntrySelected(element),
                    'is-dual-column': isDualColumnMode,
                  }"
                  @click.stop="toggleEntrySelection(element)"
                >
                  <SelectionOption
                    :model-value="isEntrySelected(element)"
                    class="archive-select-checkbox"
                    @click.stop="toggleEntrySelection(element)"
                  />
                  <div class="archive-select-item-content">
                    <ArchiveListItem
                      :data="element"
                      :disabled="true"
                      :is-dual-column="isDualColumnMode"
                    />
                  </div>
                </div>
                <ArchiveListItem
                  v-else
                  :data="element"
                  :disabled="dragDisabled"
                  :is-dual-column="isDualColumnMode"
                  @restore="restoreEntry"
                  @delete="confirmDeleteEntry"
                />
              </div>
            </template>
          </draggable>
        </div>

        <div
          v-if="
            artifactEntryCount > 0 &&
            (resourceType === 'all' || resourceType === 'artifact')
          "
          class="archive-section"
        >
          <div class="sticky-title-wrappers" v-if="isSelectionMode">
            <div class="list-title">
              <UButton
                v-if="isSelectionMode"
                type="button"
                class="archive-type-selection-toggle"
                :class="{ active: isTypeAllSelected('artifact') }"
                :aria-label="getTypeSelectionA11yLabel('artifact')"
                :title="getTypeSelectionA11yLabel('artifact')"
                @click.stop="toggleTypeSelection('artifact')"
               color="neutral" variant="outline">
                {{ getTypeSelectionButtonLabel("artifact") }}
              </UButton>
            </div>
          </div>

          <draggable
            v-model="filteredArtifactEntries"
            item-key="id"
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
            @change="changeSort"
            @start="handleDragStart"
            @end="handleDragEnd"
          >
            <template #item="{ element }">
              <div :key="element.id" class="draggable-item">
                <div
                  v-if="isSelectionMode"
                  class="archive-select-item"
                  :class="{
                    selected: isEntrySelected(element),
                    'is-dual-column': isDualColumnMode,
                  }"
                  @click.stop="toggleEntrySelection(element)"
                >
                  <SelectionOption
                    :model-value="isEntrySelected(element)"
                    class="archive-select-checkbox"
                    @click.stop="toggleEntrySelection(element)"
                  />
                  <div class="archive-select-item-content">
                    <ArchiveListItem
                      :data="element"
                      :disabled="true"
                      :is-dual-column="isDualColumnMode"
                    />
                  </div>
                </div>
                <ArchiveListItem
                  v-else
                  :data="element"
                  :disabled="dragDisabled"
                  :is-dual-column="isDualColumnMode"
                  @restore="restoreEntry"
                  @delete="confirmDeleteEntry"
                />
              </div>
            </template>
          </draggable>
        </div>

        <div
          v-if="
            shareEntryCount > 0 &&
            (resourceType === 'all' || resourceType === 'share')
          "
          class="archive-section"
        >
          <div class="sticky-title-wrappers" v-if="isSelectionMode">
            <div class="list-title">
              <UButton
                v-if="isSelectionMode"
                type="button"
                class="archive-type-selection-toggle"
                :class="{ active: isTypeAllSelected('share') }"
                :aria-label="getTypeSelectionA11yLabel('share')"
                :title="getTypeSelectionA11yLabel('share')"
                @click.stop="toggleTypeSelection('share')"
               color="neutral" variant="outline">
                {{ getTypeSelectionButtonLabel("share") }}
              </UButton>
            </div>
          </div>

          <draggable
            v-model="filteredShareEntries"
            item-key="id"
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
            @change="changeSort"
            @start="handleDragStart"
            @end="handleDragEnd"
          >
            <template #item="{ element }">
              <div :key="element.id" class="draggable-item">
                <div
                  v-if="isSelectionMode"
                  class="archive-select-item"
                  :class="{
                    selected: isEntrySelected(element),
                    'is-dual-column': isDualColumnMode,
                  }"
                  @click.stop="toggleEntrySelection(element)"
                >
                  <SelectionOption
                    :model-value="isEntrySelected(element)"
                    class="archive-select-checkbox"
                    @click.stop="toggleEntrySelection(element)"
                  />
                  <div class="archive-select-item-content">
                    <ArchiveListItem
                      :data="element"
                      :disabled="true"
                      :is-dual-column="isDualColumnMode"
                    />
                  </div>
                </div>
                <ArchiveListItem
                  v-else
                  :data="element"
                  :disabled="dragDisabled"
                  :is-dual-column="isDualColumnMode"
                  @restore="restoreEntry"
                  @delete="confirmDeleteEntry"
                />
              </div>
            </template>
          </draggable>
        </div>
      </div>
    </div>

    <div
      v-if="
        !pageLoading &&
        pageFetchResult &&
        hasEntries &&
        !(
          ((resourceType === 'all' || resourceType === 'sub') &&
            subEntryCount > 0) ||
          ((resourceType === 'all' || resourceType === 'collection') &&
            colEntryCount > 0) ||
          ((resourceType === 'all' || resourceType === 'file') &&
            fileEntryCount > 0) ||
          ((resourceType === 'all' || resourceType === 'artifact') &&
            artifactEntryCount > 0) ||
          ((resourceType === 'all' || resourceType === 'share') &&
            shareEntryCount > 0)
        )
      "
      class="empty-state-wrapper"
    >
      <EmptyState image="empty" description="当前筛选下暂无数据" />
    </div>
    <div
      v-if="!pageLoading && pageFetchResult && !hasEntries"
      class="empty-state-wrapper"
    >
      <EmptyState image="empty">
        <template #description>
          <h3>{{ $t("archivePage.empty.title") }}</h3>
          <p>{{ $t("archivePage.empty.desc") }}</p>
        </template>
      </EmptyState>
    </div>

    <div v-if="!pageLoading && !pageFetchResult" class="empty-state-wrapper">
      <EmptyState image="error" style="padding: 32px 30px">
        <template #description>
          <h3>{{ $t("subPage.loadFailed.title") }}</h3>
          <p>{{ $t("subPage.loadFailed.desc") }}</p>
        </template>
      </EmptyState>
      <UButton :size="isDesktop ? 'sm' : 'md'" icon="i-lucide-refresh-cw" color="primary" @click="init">
        {{ $t("subPage.loadFailed.btn") }}
      </UButton>
    </div>

    <div
      v-if="hasEntries && isSelectionMode"
      class="archive-selection-actions"
      :style="{ bottom: `${bottomSafeArea + 12}px` }"
    >
      <div class="archive-selection-summary">
        {{
          $t("archivePage.selectMode.selectedCount", {
            count: selectedEntryCount,
          })
        }}
      </div>
      <UButton variant="outline"
        size="sm"
        color="primary"
        @click="toggleSelectAllEntries"
      >
        {{
          isAllEntriesSelected
            ? $t("archivePage.selectMode.clearAll")
            : $t("archivePage.selectMode.selectAll")
        }}
      </UButton>
      <UButton variant="outline"
        size="sm"
        color="primary"
        :disabled="selectedEntryCount === 0 || isRestoringSelectedEntries"
        :loading="isRestoringSelectedEntries"
        @click="restoreSelectedEntries"
      >
        {{ $t("archivePage.selectMode.restore") }}
      </UButton>
      <UButton
        size="sm"
        color="error"
        :disabled="selectedEntryCount === 0 || isDeletingSelectedEntries"
        :loading="isDeletingSelectedEntries"
        @click="confirmDeleteSelectedEntries"
      >
        {{ $t("archivePage.selectMode.delete") }}
      </UButton>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useMediaQuery } from "@vueuse/core";
import WorkspaceSegments from '@/components/WorkspaceSegments.vue';
import WorkspaceListHeading from '@/components/WorkspaceListHeading.vue';
import { storeToRefs } from 'pinia';
import { computed, createVNode, onMounted, onUnmounted, ref, toRaw, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import draggable from 'vuedraggable';

import ArchiveListItem from '@/components/ArchiveListItem.vue';
import { useFilteredDraggableList } from '@/hooks/useFilteredDraggableList';
import { useListViewMode } from '@/hooks/useListViewMode';
import { useListViewModeSelectionLock } from '@/hooks/useListViewModeSelectionLock';
import { useTagBarHeight } from '@/hooks/useTagBarHeight';
import { useAppNotifyStore } from '@/store/appNotify';
import { useGlobalStore } from '@/store/global';
import { useArchiveStore } from '@/store/archive';
import { useListSearchStore } from '@/store/listSearch';
import { useSettingsStore } from '@/store/settings';
import { useMethodStore } from '@/store/methodStore';
import { useSystemStore } from '@/store/system';
import {
  ALL_SHARE_TAG as ALL_ARCHIVE_TAG,
  buildShareTagOptions as buildArchiveTagOptions,
  resolveShareTagFilter as resolveArchiveTagFilter,
  shareMatchesTagFilter as archiveEntryMatchesTagFilter,
} from '@/utils/shareTags';
import {
  getArchiveEntryDisplayName,
  groupArchiveEntriesByType,
  openClosableDialog,
} from '@/utils/archive';
import { listItemMatchesSearch, shouldSearchListRemark } from '@/utils/listSearch';
const isDesktop = useMediaQuery("(min-width: 768px)");

type ArchiveGroupKey = ArchiveItemType;
const ARCHIVE_TAG_STORAGE_KEY = 'archive-tag';

const archiveTypeLabelKeyMap: Record<ArchiveGroupKey, string> = {
  sub: 'singleSub',
  col: 'collectionSub',
  file: 'file',
  artifact: 'syncConfig',
  share: 'share',
};

const { t } = useI18n();
const { showNotify } = useAppNotifyStore();
const archiveStore = useArchiveStore();
const globalStore = useGlobalStore();
const systemStore = useSystemStore();
const settingsStore = useSettingsStore();
const listSearchStore = useListSearchStore();
const { effectiveListViewMode } = useListViewMode();

const { entries, hasEntries } = storeToRefs(archiveStore);
const { bottomSafeArea } = storeToRefs(globalStore);
const { navBarHeight } = storeToRefs(systemStore);
const { appearanceSetting } = storeToRefs(settingsStore);
const isDualColumnMode = computed(() => {
  return effectiveListViewMode.value === 'dual-column';
});

const pageLoading = ref(false);
const pageFetchResult = ref(true);
const dragDisabled = ref(false);
const sortFailed = ref(false);
const isSelectionMode = ref(false);
const selectedEntryIds = ref<string[]>([]);
const isDeletingSelectedEntries = ref(false);
const isRestoringSelectedEntries = ref(false);
useListViewModeSelectionLock(isSelectionMode);

const getTag = () => {
  return localStorage.getItem(ARCHIVE_TAG_STORAGE_KEY) || ALL_ARCHIVE_TAG;
};

const resourceType = ref('all');
const resourceTypes = [{'value': 'all', 'label': '全部类型'}, {'value': 'sub', 'label': '单条订阅'}, {'value': 'collection', 'label': '组合订阅'}, {'value': 'file', 'label': '文件'}, {'value': 'artifact', 'label': '同步任务'}, {'value': 'share', 'label': '分享'}];
const tag = ref(getTag());
const tagNavBarHeight = computed(() => {
  return navBarHeight.value;
});
const tagOptions = computed(() => {
  const options = buildArchiveTagOptions(entries.value, {
    all: t('specificWord.all'),
    untagged: t('specificWord.untagged'),
  });
  const resolvedTag = resolveArchiveTagFilter(tag.value, options);

  if (resolvedTag !== tag.value) {
    tag.value = resolvedTag;
    if (resolvedTag === ALL_ARCHIVE_TAG) {
      localStorage.removeItem(ARCHIVE_TAG_STORAGE_KEY);
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
    behavior: 'smooth',
  });
};
const setTag = (current: string) => {
  tag.value = current;
  if (current === ALL_ARCHIVE_TAG) {
    localStorage.removeItem(ARCHIVE_TAG_STORAGE_KEY);
  } else {
    localStorage.setItem(ARCHIVE_TAG_STORAGE_KEY, current);
  }
  scrollToTop();
};
const shouldShowEntry = (entry: ArchiveEntry) => {
  return archiveEntryMatchesTagFilter(entry, tag.value)
    && listItemMatchesSearch(entry, listSearchStore.normalizedQuery, {
      includeRemark: shouldSearchListRemark(appearanceSetting.value),
    });
};

const subEntries = ref<ArchiveEntry[]>([]);
const colEntries = ref<ArchiveEntry[]>([]);
const fileEntries = ref<ArchiveEntry[]>([]);
const artifactEntries = ref<ArchiveEntry[]>([]);
const shareEntries = ref<ArchiveEntry[]>([]);

const filteredSubEntries = useFilteredDraggableList(subEntries, shouldShowEntry);
const filteredColEntries = useFilteredDraggableList(colEntries, shouldShowEntry);
const filteredFileEntries = useFilteredDraggableList(fileEntries, shouldShowEntry);
const filteredArtifactEntries = useFilteredDraggableList(artifactEntries, shouldShowEntry);
const filteredShareEntries = useFilteredDraggableList(shareEntries, shouldShowEntry);

const subEntryCount = computed(() => subEntries.value.filter(shouldShowEntry).length);
const colEntryCount = computed(() => colEntries.value.filter(shouldShowEntry).length);
const fileEntryCount = computed(() => fileEntries.value.filter(shouldShowEntry).length);
const artifactEntryCount = computed(() => artifactEntries.value.filter(shouldShowEntry).length);
const shareEntryCount = computed(() => shareEntries.value.filter(shouldShowEntry).length);

const allEntries = computed(() => [
  ...subEntries.value,
  ...colEntries.value,
  ...fileEntries.value,
  ...artifactEntries.value,
  ...shareEntries.value,
].filter((entry) => shouldShowEntry(entry)));

const selectedEntryIdSet = computed(() => new Set(selectedEntryIds.value));
const selectedEntries = computed(() =>
  allEntries.value.filter((entry) => selectedEntryIdSet.value.has(entry.id)),
);
const selectedEntryCount = computed(() => selectedEntries.value.length);
const isAllEntriesSelected = computed(
  () =>
    allEntries.value.length > 0
    && selectedEntryCount.value === allEntries.value.length,
);



const getTypeLabel = (type: ArchiveGroupKey) => {
  return t(`specificWord.${archiveTypeLabelKeyMap[type]}`);
};

const getVisibleEntriesByType = (type: ArchiveGroupKey) => {
  const entriesByType: Record<ArchiveGroupKey, ArchiveEntry[]> = {
    sub: filteredSubEntries.value,
    col: filteredColEntries.value,
    file: filteredFileEntries.value,
    artifact: filteredArtifactEntries.value,
    share: filteredShareEntries.value,
  };

  return entriesByType[type];
};

const getVisibleEntryIdsByType = (type: ArchiveGroupKey) => {
  return getVisibleEntriesByType(type).map((entry) => entry.id);
};

const getSelectedEntryCountByType = (type: ArchiveGroupKey) => {
  const selectedIds = selectedEntryIdSet.value;
  return getVisibleEntryIdsByType(type).filter((id) => selectedIds.has(id)).length;
};

const isTypeAllSelected = (type: ArchiveGroupKey) => {
  const visibleEntries = getVisibleEntriesByType(type);
  return visibleEntries.length > 0
    && getSelectedEntryCountByType(type) === visibleEntries.length;
};

const getTypeSelectionButtonLabel = (type: ArchiveGroupKey) => {
  return isTypeAllSelected(type)
    ? t('archivePage.selectMode.clearAll')
    : t('archivePage.selectMode.selectAll');
};

const getTypeSelectionA11yLabel = (type: ArchiveGroupKey) => {
  return isTypeAllSelected(type)
    ? t('archivePage.selectMode.clearTypeAll', {
      type: getTypeLabel(type),
    })
    : t('archivePage.selectMode.selectTypeAll', {
      type: getTypeLabel(type),
    });
};

const clearSelectedEntries = () => {
  selectedEntryIds.value = [];
};

const exitSelectionMode = () => {
  clearSelectedEntries();
  isSelectionMode.value = false;
};

const toggleSelectionMode = () => {
  if (isSelectionMode.value) {
    exitSelectionMode();
    return;
  }

  isSelectionMode.value = true;
};

const isEntrySelected = (entry: ArchiveEntry) => {
  return selectedEntryIdSet.value.has(entry.id);
};

const toggleEntrySelection = (entry: ArchiveEntry) => {
  if (selectedEntryIdSet.value.has(entry.id)) {
    selectedEntryIds.value = selectedEntryIds.value.filter((id) => id !== entry.id);
    return;
  }

  selectedEntryIds.value = [...selectedEntryIds.value, entry.id];
};

const toggleSelectAllEntries = () => {
  if (isAllEntriesSelected.value) {
    clearSelectedEntries();
    return;
  }

  selectedEntryIds.value = allEntries.value.map((entry) => entry.id);
};

const toggleTypeSelection = (type: ArchiveGroupKey) => {
  const typeIds = getVisibleEntryIdsByType(type);
  if (typeIds.length === 0) {
    return;
  }

  if (isTypeAllSelected(type)) {
    const typeIdSet = new Set(typeIds);
    selectedEntryIds.value = selectedEntryIds.value.filter((id) => !typeIdSet.has(id));
    return;
  }

  const nextSelectedIdSet = new Set(selectedEntryIds.value);
  typeIds.forEach((id) => {
    nextSelectedIdSet.add(id);
  });
  selectedEntryIds.value = Array.from(nextSelectedIdSet);
};

watch(
  () => entries.value,
  (value) => {
    const groupedEntries = groupArchiveEntriesByType(value);
    subEntries.value = [...groupedEntries.sub];
    colEntries.value = [...groupedEntries.col];
    fileEntries.value = [...groupedEntries.file];
    artifactEntries.value = [...groupedEntries.artifact];
    shareEntries.value = [...groupedEntries.share];
  },
  { immediate: true, deep: true },
);

watch(
  allEntries,
  (value) => {
    const validIds = new Set(value.map((entry) => entry.id));
    selectedEntryIds.value = selectedEntryIds.value.filter((id) => validIds.has(id));
    if (!value.length) {
      exitSelectionMode();
    }
  },
  { immediate: true, deep: true },
);

const init = async () => {
  pageLoading.value = true;
  pageFetchResult.value = await archiveStore.fetchEntries();
  pageLoading.value = false;
};

const changeSort = async () => {
  const ids = [
    ...subEntries.value,
    ...colEntries.value,
    ...fileEntries.value,
    ...artifactEntries.value,
    ...shareEntries.value,
  ].map((entry) => entry.id);

  const isSucceed = await archiveStore.sortEntries(
    JSON.parse(JSON.stringify(toRaw(ids))),
  );

  if (!isSucceed) {
    sortFailed.value = true;
    showNotify({
      title: t('notify.sortsub.failed'),
      type: 'danger',
    });
  }
};

const handleDragStart = () => {
  dragDisabled.value = true;
};

const handleDragEnd = async () => {
  if (sortFailed.value) {
    await archiveStore.fetchEntries();
    sortFailed.value = false;
  }
  dragDisabled.value = false;
};

const restoreEntry = async (entry: ArchiveEntry) => {
  await archiveStore.restoreEntry(entry);
};

const deleteEntry = async (entry: ArchiveEntry) => {
  await archiveStore.deleteEntry(entry.id);
};

const confirmDeleteEntry = (entry: ArchiveEntry) => {
  openClosableDialog({
    title: t('archivePage.delete.title'),
    content: createVNode(
      'span',
      { style: 'white-space: pre-line;' },
      t('archivePage.delete.desc', {
        displayName: getArchiveEntryDisplayName(entry),
      }),
    ),
    onCancel: () => {},
    onOk: () => deleteEntry(entry),
    popClass: 'auto-dialog',
    cancelText: t('archivePage.delete.btn.cancel'),
    okText: t('archivePage.delete.btn.confirm'),
    closeOnPopstate: true,
    lockScroll: false,
    closeable: true,
    closeIcon: 'close-little',
  });
};

const restoreSelectedEntries = async () => {
  if (selectedEntryCount.value === 0 || isRestoringSelectedEntries.value) {
    return;
  }

  isRestoringSelectedEntries.value = true;
  const restoreTargets = [
    ...selectedEntries.value.filter((entry) => entry.itemType !== 'share'),
    ...selectedEntries.value.filter((entry) => entry.itemType === 'share'),
  ];
  const restoredTypes: ArchiveItemType[] = [];
  const results: boolean[] = [];

  for (const entry of restoreTargets) {
    const isSucceed = await archiveStore.restoreEntry(entry, {
      showNotify: false,
      reloadEntries: false,
      refreshRelatedData: false,
    });

    if (isSucceed) {
      restoredTypes.push(entry.itemType);
    }

    results.push(isSucceed);
  }

  if (restoredTypes.length > 0) {
    await Promise.all([
      archiveStore.fetchEntries(),
      archiveStore.refreshRelatedData(restoredTypes),
    ]);
  }

  const successCount = results.filter(Boolean).length;
  const failedCount = results.length - successCount;

  if (failedCount === 0) {
    showNotify({
      type: 'success',
      title: t('archivePage.restore.succeedNotify'),
    });
    exitSelectionMode();
  } else {
    showNotify({
      type: 'danger',
      title: t('archivePage.restore.failNotify'),
      content: t('archivePage.restore.result', {
        success: successCount,
        failed: failedCount,
      }),
    });
  }

  isRestoringSelectedEntries.value = false;
};

const deleteSelectedEntries = async () => {
  if (selectedEntryCount.value === 0 || isDeletingSelectedEntries.value) {
    return;
  }

  isDeletingSelectedEntries.value = true;
  const deleteTargets = [...selectedEntries.value];
  const results = await Promise.all(
    deleteTargets.map((entry) =>
      archiveStore.deleteEntry(entry.id, {
        showNotify: false,
        reloadEntries: false,
      })),
  );

  await archiveStore.fetchEntries();

  const successCount = results.filter(Boolean).length;
  const failedCount = results.length - successCount;

  if (failedCount === 0) {
    showNotify({
      type: 'danger',
      title: t('archivePage.delete.succeedNotify'),
    });
    exitSelectionMode();
  } else {
    showNotify({
      type: 'danger',
      title: t('archivePage.delete.failNotify'),
      content: t('archivePage.delete.result', {
        success: successCount,
        failed: failedCount,
      }),
    });
  }

  isDeletingSelectedEntries.value = false;
};

const confirmDeleteSelectedEntries = () => {
  if (selectedEntryCount.value === 0 || isDeletingSelectedEntries.value) {
    return;
  }

  openClosableDialog({
    title: t('archivePage.delete.batchTitle'),
    content: createVNode(
      'span',
      { style: 'white-space: pre-line;' },
      t('archivePage.delete.batchDesc', {
        count: selectedEntryCount.value,
      }),
    ),
    onCancel: () => {},
    onOk: deleteSelectedEntries,
    popClass: 'auto-dialog',
    cancelText: t('archivePage.delete.btn.cancel'),
    okText: t('archivePage.delete.btn.confirm'),
    closeOnPopstate: true,
    lockScroll: false,
    closeable: true,
    closeIcon: 'close-little',
  });
};

onMounted(() => {
  useMethodStore().registerMethod('refreshArchive', init);
  init();
});
onUnmounted(() => useMethodStore().removeMethod('refreshArchive'));
</script>
