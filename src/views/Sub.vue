<template>
  <div
    style="overflow: hidden"
    @touchstart="onTouchStart"
    @touchmove="onTouchMove"
    @touchend="onTouchEnd"
  >
    <input
      ref="fileInput"
      type="file"
      accept="application/json,text/json,.json"
      hidden
      @change="fileChange"
    />
    <!-- 浮动按钮 -->

    <!-- 页面内容 -->
    <!-- 有数据 -->
    <div
      class="subs-list-wrapper"
      :class="{ 'dual-column-mode': isDualColumnMode }"
    >
      <div ref="radioWrapperRef" class="radio-wrapper">
        <!-- <ChoiceGroup v-model="tag" direction="horizontal"> -->
        <!-- <ChoiceOption v-for="i in tags" shape="button" :label="String(i.value)">{{ i.label }}</ChoiceOption> -->
        <WorkspaceSegments
          :model-value="tag"
          :options="tags"
          label="标签与来源"
          @update:model-value="setTag"
        />
        <!-- </ChoiceGroup> -->
        <WorkspaceSegments
          v-model="resourceType"
          :options="resourceTypes"
          label="资源类型"
        />
      </div>
      <WorkspaceListHeading
        v-if="
          ((resourceType === 'all' || resourceType === 'sub') &&
            filterdSubsCount > 0) ||
          ((resourceType === 'all' || resourceType === 'collection') &&
            filterdColsCount > 0)
        "
        label="订阅名称"
      />
      <div
        class="subs-list-container"
        :style="{ paddingTop: `${radioWrapperHeight}px` }"
      >
        <div
          v-if="
            filterdSubsCount > 0 &&
            (resourceType === 'all' || resourceType === 'sub')
          "
          class="subs-list-content"
        >
          <draggable
            class="list-draggable"
            :class="{ 'dual-column': isDualColumnMode }"
            v-model="filteredSubs"
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
            @change="changeSort('subs', subs)"
            @start="handleDragStart(subs)"
            @end="handleDragEnd(subs)"
          >
            <template #item="{ element }">
              <div :key="element.name" class="draggable-item">
                <SubListItem
                  :sub="element"
                  type="sub"
                  :disabled="swipeDisabled"
                  :is-dual-column="isDualColumnMode"
                  @share="handleShare"
                />
              </div>
            </template>
          </draggable>
        </div>
        <div
          v-if="
            filterdColsCount > 0 &&
            (resourceType === 'all' || resourceType === 'collection')
          "
          class="subs-list-content"
        >
          <draggable
            class="list-draggable"
            :class="{ 'dual-column': isDualColumnMode }"
            v-model="filteredCollections"
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
            @change="changeSort('collections', collections)"
            @start="handleDragStart(collections)"
            @end="handleDragEnd(collections)"
          >
            <template #item="{ element }">
              <div :key="element.name" class="draggable-item">
                <SubListItem
                  :collection="element"
                  type="collection"
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
      v-if="
        !isLoading &&
        fetchResult &&
        (hasSubs || hasCollections) &&
        !(
          ((resourceType === 'all' || resourceType === 'sub') &&
            filterdSubsCount > 0) ||
          ((resourceType === 'all' || resourceType === 'collection') &&
            filterdColsCount > 0)
        )
      "
      class="empty-state-wrapper"
    >
      <EmptyState image="empty" description="当前筛选下暂无数据" />
    </div>
    <!-- 没有数据 -->
    <div
      v-if="!isLoading && fetchResult && !hasSubs && !hasCollections"
      class="empty-state-wrapper"
    >
      <EmptyState image="empty">
        <template #description>
          <h3>{{ $t(`subPage.emptySub.title`) }}</h3>
          <p>{{ $t(`subPage.emptySub.desc`) }}</p>
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
import WorkspaceSegments from '@/components/WorkspaceSegments.vue';
import WorkspaceListHeading from '@/components/WorkspaceListHeading.vue';

import { storeToRefs } from "pinia";
import { computed, onBeforeUnmount, onMounted, ref, toRaw, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from 'vue-router';
import draggable from "vuedraggable";

import { useSubsApi } from "@/api/subs";
import SubListItem from "@/components/SubListItem.vue";
import { useBackend } from "@/hooks/useBackend";
import { useFilteredDraggableList } from "@/hooks/useFilteredDraggableList";
import { useListViewMode } from "@/hooks/useListViewMode";
import { useTagBarHeight } from "@/hooks/useTagBarHeight";
import { useAppNotifyStore } from "@/store/appNotify";
import { useGlobalStore } from "@/store/global";
import { useSystemStore } from "@/store/system";
import { useListSearchStore } from "@/store/listSearch";
import { useMethodStore } from '@/store/methodStore';
import { useSettingsStore } from '@/store/settings';
import { useSubsStore } from "@/store/subs";
import { getShareCreatePath } from "@/utils/share";
import { initStores } from "@/utils/initApp";
import { listItemMatchesSearch, shouldSearchListRemark } from "@/utils/listSearch";
const isDesktop = useMediaQuery("(min-width: 768px)");
const { env } = useBackend();
const { showNotify } = useAppNotifyStore();
const subsApi = useSubsApi();
const { t } = useI18n();
const fileInput = ref(null);
const restoreIsLoading = ref(false);
// const isSubFold = ref(localStorage.getItem('sub-fold') === '1');
// const isColFold = ref(localStorage.getItem('col-fold') === '1');
const methodStore = useMethodStore();
const subsStore = useSubsStore();
const globalStore = useGlobalStore();
const systemStore = useSystemStore();
const settingsStore = useSettingsStore();
const listSearchStore = useListSearchStore();
const router = useRouter();
const { hasSubs, hasCollections, subs, collections } = storeToRefs(subsStore);
const { appearanceSetting } = storeToRefs(settingsStore);
const { effectiveListViewMode } = useListViewMode();
const {
  // isSimpleMode,
  isLoading,
  fetchResult,
  bottomSafeArea,
  // showFloatingRefreshButton,
} = storeToRefs(globalStore);
const { navBarHeight } = storeToRefs(systemStore);
const isDualColumnMode = computed(() => {
  return effectiveListViewMode.value === "dual-column";
});
const swipeDisabled = ref(false);
const touchStartY = ref(null);
const touchStartX = ref(null);
const sortFailed = ref(false);
const hasUntagged = ref(false);
const hasLocal = ref(false);
const hasRemote = ref(false);
const tagNavBarHeight = computed(() => {
  return navBarHeight.value;
});
const getTag = () => {
    return localStorage.getItem('sub-tag') || 'all';
  };
const resourceType = ref('all');
const resourceTypes = [{'value': 'all', 'label': '全部类型'}, {'value': 'sub', 'label': '单条订阅'}, {'value': 'collection', 'label': '组合订阅'}];
const tag = ref(getTag());
const tags = computed(() => {
  if(!hasSubs.value && !hasCollections.value) return [];
  // 从 subs 和 collections 中获取所有的 tag, 去重
  const set = new Set();
  subs.value.forEach(sub => {
    if(sub.source === 'remote') {
      hasRemote.value = true;
    } else {
      hasLocal.value = true;
    }
    if (Array.isArray(sub.tag) && sub.tag.length > 0) {
      sub.tag.forEach(i => {
        set.add(i);
      });
    } else {
      hasUntagged.value = true;
    }
  });
  collections.value.forEach(col => {
    if (Array.isArray(col.tag) && col.tag.length > 0) {
      col.tag.forEach(i => {
        set.add(i);
      });
    } else {
      hasUntagged.value = true;
    }
  });

  let tags: any[] = Array.from(set);
  if(tags.length === 0 && !hasRemote.value && !hasLocal.value) return [];
  tags = tags.map(i => ({ label: i, value: i }));
  
  const result = [{ label: t("specificWord.all"), value: "all" }, ...tags];
  if(hasRemote.value) result.push({ label: t("editorPage.subConfig.basic.source.remote"), value: "remote" });
  if(hasLocal.value) result.push({ label: t("editorPage.subConfig.basic.source.local"), value: "local" });
  if(tags.length > 0 && hasUntagged.value) result.push({ label: t("specificWord.untagged"), value: "untagged" });

  if (!result.find(i => i.value === tag.value)) {
    tag.value = 'all';
  }
  return result;
});
const handleShare = (element, type) => {
  const shareType = type === "collection" ? "col" : "sub";
  router.push(getShareCreatePath(shareType, element.name));
};
const filterdSubsCount = computed(() => {
  return subs.value.filter(shouldShowElement).length;
});
const filterdColsCount = computed(() => {
  return collections.value.filter(shouldShowElement).length;
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

const addSub = () => router.push("/edit/subs/UNTITLED");

const route = useRoute();
const { tagBarRef: radioWrapperRef, tagBarHeight: radioWrapperHeight } = useTagBarHeight([
  tag,
  () => tags.value,
]);

onMounted(() => {
  methodStore.registerMethod("addSub", addSub);
  methodStore.registerMethod("importSub", upload);
  refreshMissingFlows();
});

onBeforeUnmount(() => {
  methodStore.removeMethod('addSub');
  methodStore.removeMethod('importSub');
});

const refreshMissingFlows = async () => {
  if (route.path !== "/subs" || isLoading.value || !fetchResult.value) return;
  try {
    await subsStore.fetchFlows(undefined, { missingOnly: true });
  } catch (error) {
    console.error(error);
  }
};

let dragData = null;
const changeSort = async (
  subColl: "subs" | "collections",
  dataValue: any[]
) => {
  try {
    let sortDataRes: any;
    if (env.value.version > "2.14.48") {
      console.log(`new sort > v2.14.48`);
      const nameSortArray = dataValue.map((k: { name: string }) => k.name);
      // console.log(nameSortArray);
      sortDataRes = await subsApi.newSortSub(
        subColl,
        JSON.parse(JSON.stringify(toRaw(nameSortArray)))
      );
    } else {
      console.log(`old sort < v2.14.48 `);
      sortDataRes = await subsApi.sortSub(
        subColl,
        JSON.parse(JSON.stringify(toRaw(dataValue)))
      );
    }
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
// const toggleSubFold = () => {
//   isSubFold.value = !isSubFold.value;
//   if (isSubFold.value) {
//     localStorage.setItem('sub-fold', '1')  
//   } else {
//     localStorage.removeItem('sub-fold')
//   }
// };
// const toggleColFold = () => {
//   isColFold.value = !isColFold.value;
//   if (isColFold.value) {
//     localStorage.setItem('col-fold', '1')  
//   } else {
//     localStorage.removeItem('col-fold')
//   }
// };

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
    localStorage.removeItem('sub-tag');
  } else {
    localStorage.setItem('sub-tag', current);
  }
  // 增加滚动到顶部
  scrollToTop();
};

const shouldShowElementByTag = (element) => {
  if(tag.value === 'all') return true;
  if(tag.value === 'untagged') return !Array.isArray(element.tag) || element.tag.length === 0;
  if(tag.value === 'remote') return element.source === 'remote';
  if(tag.value === 'local') return element.source === 'local';
  return element.tag?.includes(tag.value);
};
const shouldShowElement = (element) => {
  return shouldShowElementByTag(element)
    && listItemMatchesSearch(element, listSearchStore.normalizedQuery, {
      includeRemark: shouldSearchListRemark(appearanceSetting.value),
    });
};
const filteredSubs = useFilteredDraggableList(subs, shouldShowElement);
const filteredCollections = useFilteredDraggableList(collections, shouldShowElement);
const upload = async() => {
  try {
    fileInput.value.click();
  } catch (e) {
    console.error(e);
  }
};

const fileChange = async (event) => {
  const file = event.target.files[0];
  if(!file) return;
  try {
    restoreIsLoading.value = true;
    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload = async () => {
      const item = JSON.parse(String(reader.result));
      const suffix = new Date().getTime();
      item.name += `_${suffix}`;
      item.displayName += `_${suffix}`;
      item['display-name'] = item.displayName;
      const res = await subsApi.createSub(item.subscriptions ? 'collections' : 'subs', item);
      // await subsStore.fetchSubsData();
      
      // const res = await useSettingsApi().restoreSettings({ content: String(reader.result) });
      if (res?.data?.status === "success") {
        await initStores(false, true, true);
        showNotify({
          type: "success",
          title: t(`subPage.import.succeed`),
        });
      } else {
        throw new Error('restore failed');
      }
    };

    reader.onerror = e => {
      throw e;
    };
    
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
</script>
