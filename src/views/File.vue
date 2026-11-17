<template>
  <div
    style="overflow: hidden; -webkit-user-select: none; user-select: none"
    @touchstart="onTouchStart"
    @touchmove="onTouchMove"
    @touchend="onTouchEnd"
  >
    <!-- 添加订阅弹窗 -->
    <!-- lock-scroll -->
    <div>
      <WorkspaceModal
        v-model:visible="addSubBtnIsVisible"
        :title="$t(`filePage.addFileTitle`)"
      >
        <input
          type="file"
          ref="fileInput"
          accept="application/json,text/json,.json"
          @change="fileChange"
          class="hidden"
        />
        <div class="file-create-options">
          <RouterLink
            to="/edit/files/UNTITLED"
            class="file-create-option"
            @click="addSubBtnIsVisible = false"
          >
            <span class="file-create-icon">
              <UIcon name="i-lucide-file" class="size-6" />
            </span>
            <span class="file-create-text">
              <span class="file-create-title">
                {{ $t("specificWord.file") }}
              </span>
              <span class="file-create-description">
                {{ $t("filePage.type.fileTips") }}
              </span>
            </span>
            <UIcon
              name="i-lucide-chevron-right"
              class="size-4 shrink-0 text-muted"
            />
          </RouterLink>
          <RouterLink
            to="/edit/files/UNTITLED-mihomoConfig"
            class="file-create-option"
            @click="addSubBtnIsVisible = false"
          >
            <span class="file-create-icon">
              <img src="@/assets/icons/clashmeta_color.png" alt="" />
            </span>
            <span class="file-create-text">
              <span class="file-create-title">
                {{ $t("filePage.type.mihomoConfig") }}
              </span>
              <span class="file-create-description">
                {{ $t("filePage.type.mihomoConfigTips") }}
              </span>
            </span>
            <UIcon
              name="i-lucide-chevron-right"
              class="size-4 shrink-0 text-muted"
            />
          </RouterLink>
        </div>
        <template #footer>
          <div class="flex items-center gap-1">
            <UButton
              @click="upload()"
              :loading="restoreIsLoading"
              :disabled="restoreIsLoading"
              icon="i-lucide-file-input"
              color="neutral"
              variant="outline"
              size="sm"
            >
              {{ $t("subPage.import.label") }}
            </UButton>
            <HelpTip :help="importTips()" />
          </div>
        </template>
      </WorkspaceModal>
    </div>
    <!-- 浮动按钮 -->

    <!-- 页面内容 -->
    <!-- 有数据 -->
    <div
      class="subs-list-wrapper"
      :class="{ 'dual-column-mode': isDualColumnMode }"
    >
      <div
        v-if="tags && tags.length > 0"
        ref="radioWrapperRef"
        class="radio-wrapper"
      >
        <!-- <ChoiceGroup v-model="tag" direction="horizontal"> -->
        <!-- <ChoiceOption v-for="i in tags" shape="button" :label="String(i.value)">{{ i.label }}</ChoiceOption> -->
        <WorkspaceSegments
          :model-value="tag"
          :options="tags"
          label="标签与来源"
          @update:model-value="setTag"
        />
        <!-- </ChoiceGroup> -->
      </div>
      <div
        class="subs-list-container"
        :style="{ paddingTop: `${radioWrapperHeight}px` }"
      >
        <div v-if="filteredFiles.length > 0">
          <WorkspaceListHeading label="文件名称" />
          <draggable
            class="files-draggable-list"
            :class="{ 'dual-column': isDualColumnMode }"
            v-model="filteredFiles"
            item-key="name"
            :scroll-sensitivity="200"
            :force-fallback="true"
            :scroll-speed="8"
            :scroll="true"
            v-bind="{
              animation: 200,
              disabled: false,
              delay: 200,
              chosenClass: 'chosensub',
              handle: 'div',
            }"
            @change="changeSort('files', files)"
            @start="handleDragStart(files)"
            @end="handleDragEnd(files)"
          >
            <template #item="{ element }">
              <div :key="element.name" class="draggable-item">
                <FileListItem
                  :file="element"
                  type="file"
                  :disabled="swipeDisabled"
                  :is-dual-column="isDualColumnMode"
                  @share="handleShare"
                />
              </div>
            </template>
          </draggable>
        </div>
      </div>
    </div>
    <div
      v-if="!isLoading && fetchResult && hasFiles && filteredFiles.length === 0"
      class="empty-state-wrapper"
    >
      <EmptyState image="empty" description="当前筛选下暂无数据" />
    </div>

    <!-- 没有数据 -->
    <div
      v-if="!isLoading && fetchResult && !hasFiles"
      class="empty-state-wrapper"
    >
      <EmptyState image="empty">
        <template #description>
          <h3>{{ $t(`filePage.emptySub.title`) }}</h3>
          <p>{{ $t(`filePage.emptySub.desc`) }}</p>
        </template>
      </EmptyState>
      <!-- <router-link to="/edit/files/UNTITLED" class="router-link"> -->
      <!-- </router-link> -->
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
            {{ $t(`magicPath.troubleshooting`) }}
          </a>
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
  </div>
</template>
<script lang="ts" setup>
import { useMediaQuery } from "@vueuse/core";
import WorkspaceModal from "@/components/WorkspaceModal.vue";
import WorkspaceSegments from '@/components/WorkspaceSegments.vue';
import WorkspaceListHeading from '@/components/WorkspaceListHeading.vue';
import { storeToRefs } from "pinia";
import { ref, toRaw, onMounted, computed, watch } from "vue";
import draggable from "vuedraggable";

import { useAppNotifyStore } from "@/store/appNotify";
import { Toast } from '@/services/feedback';

import { useSubsApi } from "@/api/subs";
import { useFilesApi } from '@/api/files';
import FileListItem from "@/components/FileListItem.vue";
import { useGlobalStore } from "@/store/global";
import { useListSearchStore } from "@/store/listSearch";
import { useSubsStore } from "@/store/subs";
import { useSettingsStore } from '@/store/settings';
import { useSystemStore } from "@/store/system";
import { useMethodStore } from '@/store/methodStore';
import { initStores } from "@/utils/initApp";
import { useI18n } from "vue-i18n";
import { useBackend } from "@/hooks/useBackend";
import { useFilteredDraggableList } from "@/hooks/useFilteredDraggableList";
import { useListViewMode } from "@/hooks/useListViewMode";
import { useTagBarHeight } from "@/hooks/useTagBarHeight";
import { getShareCreatePath } from "@/utils/share";
import { listItemMatchesSearch, shouldSearchListRemark } from "@/utils/listSearch";

import { useRouter } from "vue-router";
const isDesktop = useMediaQuery("(min-width: 768px)");
const router = useRouter();
const methodStore = useMethodStore();

const editFile = () => {
  addSubBtnIsVisible.value = true;
};

const { env } = useBackend();
const { showNotify } = useAppNotifyStore();
const subApi = useSubsApi();
const filesApi = useFilesApi();
const { t } = useI18n();
const fileInput = ref(null);
const uploadIsLoading = ref(false);
const restoreIsLoading = ref(false);
const addSubBtnIsVisible = ref(false);
const subsStore = useSubsStore();
const globalStore = useGlobalStore();
const systemStore = useSystemStore();
const settingsStore = useSettingsStore();
const listSearchStore = useListSearchStore();
const { appearanceSetting } = storeToRefs(settingsStore);
const { effectiveListViewMode } = useListViewMode();
const { navBarHeight } = storeToRefs(systemStore);
const { hasFiles, files } = storeToRefs(subsStore);
const {
  // isSimpleMode,
  isLoading,
  fetchResult,
  bottomSafeArea,
  // showFloatingRefreshButton,
} = storeToRefs(globalStore);
const swipeDisabled = ref(false);
const isDualColumnMode = computed(() => {
  return effectiveListViewMode.value === "dual-column";
});
const touchStartY = ref(null);
const touchStartX = ref(null);
const sortFailed = ref(false);
const hasUntagged = ref(false);
const getTag = () => {
    return localStorage.getItem('file-tag') || 'all';
  };
const tag = ref(getTag());
const tags = computed(() => {
  if(!hasFiles.value) return [];
  const set = new Set();
  files.value.forEach(sub => {
    
    if (Array.isArray(sub.tag) && sub.tag.length > 0) {
      sub.tag.forEach(i => {
        set.add(i);
      });
    } else {
      hasUntagged.value = true;
    }
  });

  let tags: any[] = Array.from(set);
  // if(tags.length === 0) return [];
  tags = tags.map(i => ({ label: i, value: i }));
  
  const result = [{ label: t("specificWord.all"), value: "all" }, ...tags];
  if(tags.length > 0 && hasUntagged.value) result.push({ label: t("specificWord.untagged"), value: "untagged" });

  if (!result.find(i => i.value === tag.value)) {
    tag.value = 'all';
  }
  return result;
});
const { tagBarRef: radioWrapperRef, tagBarHeight: radioWrapperHeight } = useTagBarHeight([
  tag,
  () => tags.value,
]);

const tagNavBarHeight = computed(() => {
  return navBarHeight.value;
});

onMounted(() => {
  methodStore.registerMethod("addFile", editFile);
});
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

const refresh = () => {
  initStores(true, true, true);
};

let dragData = null;
const changeSort = async (subColl: "files", dataValue: any[]) => {
  try {
    let sortDataRes: any;

    const nameSortArray = dataValue.map((k: { name: string }) => k.name);
    // console.log(nameSortArray);
    sortDataRes = await subApi.newSortSub(
      subColl,
      JSON.parse(JSON.stringify(toRaw(nameSortArray)))
    );
    // console.log(JSON.stringify(sortDataRes))
    if (sortDataRes?.data?.status !== "success") {
      sortFailed.value = true;
      showNotify({
        title: t("notify.sortsub.failed"),
        type: "danger",
        content: JSON.stringify(sortDataRes),
      });
    }
  } catch (error) {
    sortFailed.value = true;
  }
};

const handleDragStart = (dataValue: any) => {
  swipeDisabled.value = true;
  dragData = dataValue.value;
};

const handleDragEnd = (dataValue: any) => {
  if (sortFailed.value) {
    dataValue.value = dragData;
  } else {
    dragData = null;
  }
  swipeDisabled.value = false;
};

const handleShare = (element) => {
  router.push(getShareCreatePath("file", element.name));
};
const upload = async() => {
  try {
    fileInput.value.click()
  } catch (e) {
    console.error(e);
  }
}

const fileChange = async (event) => {
  const file = event.target.files[0];
  if(!file) return
  try {
    restoreIsLoading.value = true;
    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload = async () => {
      const item = JSON.parse(String(reader.result))
      const suffix = new Date().getTime()
      item.name += `_${suffix}`
      item.displayName += `_${suffix}`
      item['display-name'] = item.displayName
      const res = await filesApi.createFile(item);
      // await subsStore.fetchSubsData();
      
      // const res = await useSettingsApi().restoreSettings({ content: String(reader.result) });
      if (res?.data?.status === "success") {
        await initStores(false, true, true);
        showNotify({
          type: "success",
          title: t(`subPage.import.succeed`),
        });
        addSubBtnIsVisible.value = false
      } else {
        throw new Error('restore failed')
      }
    }

    reader.onerror = e => {
      throw e
    }
    
  } catch (e) {
    showNotify({
      type: "danger",
      title: t(`subPage.import.failed`, { e: e.message ?? e }),
    });
    console.error(e);
  } finally {
    restoreIsLoading.value = false;
  }
};
const importTips = () => ({
  title: t(`filePage.importFileTitle`),
  content: t(`filePage.importFileTips`),
});
const scrollToTop = () => {
  const scrollPosition = 0;
  
  window.scrollTo({
    top: scrollPosition,
    behavior: "smooth"
  });
};

const setTag = (current) => {
  tag.value = current;
  if (current === 'all') {
    localStorage.removeItem('file-tag');
  } else {
    localStorage.setItem('file-tag', current);
  }
  // 增加滚动到顶部
  scrollToTop();
};
const shouldShowElementByTag = (element) => {
  if(tag.value === 'all') return true;
  if(tag.value === 'untagged') return !Array.isArray(element.tag) || element.tag.length === 0;
  return element.tag?.includes(tag.value);
};
const shouldShowElement = (element) => {
  return shouldShowElementByTag(element)
    && listItemMatchesSearch(element, listSearchStore.normalizedQuery, {
      includeRemark: shouldSearchListRemark(appearanceSetting.value),
    });
};
const filteredFiles = useFilteredDraggableList(files, shouldShowElement);
</script>

<style scoped>
.file-create-options {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
.file-create-option {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 104px;
  padding: 16px;
  border: 1px solid var(--ui-border);
  border-radius: var(--ui-radius);
  transition: background-color 150ms, border-color 150ms;
}
.file-create-option:hover {
  background: var(--ui-bg-muted);
  border-color: var(--ui-primary);
}
.file-create-option:focus-visible {
  outline: 2px solid var(--ui-primary);
  outline-offset: 2px;
}
.file-create-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  border-radius: var(--ui-radius);
  background: var(--ui-bg-muted);
  color: var(--ui-text-toned);
}
.file-create-icon img { width: 28px; height: 28px; object-fit: contain; }
.file-create-text { display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 0; }
.file-create-title { font-size: 14px; font-weight: 500; }
.file-create-description { font-size: 13px; color: var(--ui-text-muted); line-height: 1.5; }
@media (max-width: 600px) {
  .file-create-options { grid-template-columns: minmax(0, 1fr); }
}
</style>
