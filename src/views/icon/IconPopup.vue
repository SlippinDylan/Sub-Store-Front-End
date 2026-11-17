<!-- 图标弹窗 -->
<template>
  <WorkspaceModal
    v-model:visible="isVisible"
    :title="$t(`iconCollectionPage.iconCollection`)"
    @update:visible="
      (value) => {
        if (!value) close();
      }
    "
  >
    <div class="icon-popup">
      <div class="icon-popup-content">
        <div class="icon-popup-top">
          <div class="resource-editor-fields">
            <ResourceField :label="$t('resourcePicker.iconCollection')">
              <div class="flex min-w-0 items-center gap-2">
                <USelectMenu
                  v-model="defaultIconCollectionValue[0]"
                  value-key="value"
                  :items="
                    iconCollectionColumns.map((item) => ({
                      label: item.text,
                      value: item.value,
                    }))
                  "
                  :aria-label="$t('resourcePicker.iconCollection')"
                  class="min-w-0 flex-1"
                  @update:model-value="
                    handleConfirm({ selectedValue: [$event] })
                  "
                />
                <UButton
                  icon="i-lucide-rotate-ccw"
                  color="neutral"
                  variant="outline"
                  size="sm"
                  :aria-label="
                    $t('iconCollectionPage.resetDefaultIconCollection')
                  "
                  :title="$t('iconCollectionPage.resetDefaultIconCollection')"
                  @click="handleResetDefault"
                />
              </div>
            </ResourceField>
            <ResourceField
              :label="$t('iconCollectionPage.useCustomIconCollection')"
            >
              <div class="flex justify-end">
                <USwitch
                  v-model="showCustomIconCollection"
                  :aria-label="$t('iconCollectionPage.useCustomIconCollection')"
                />
              </div>
            </ResourceField>
            <ResourceField
              v-if="showCustomIconCollection"
              :label="$t('resourcePicker.customIconUrl')"
            >
              <div class="flex min-w-0 items-center gap-2">
                <FieldInput
                  v-model.trim="form.customIconCollectionUrl"
                  class="min-w-0 flex-1"
                  :placeholder="
                    $t('iconCollectionPage.iconCollectionPlaceholder')
                  "
                  clearable
                  @clear="clearCustomIconCollectionUrl"
                  @keydown.enter.prevent="handleAddCustomIconCollection"
                />
                <UButton
                  icon="i-lucide-download"
                  color="neutral"
                  variant="outline"
                  size="sm"
                  :disabled="
                    !form.customIconCollectionUrl || fetchStatus === 'loading'
                  "
                  @click="handleAddCustomIconCollection"
                >
                  {{ $t("resourcePicker.loadIcons") }}
                </UButton>
              </div>
            </ResourceField>
            <ResourceField :label="$t('resourcePicker.iconSearch')">
              <FieldInput
                v-model="form.iconName"
                :placeholder="$t('iconCollectionPage.iconNamePlaceholder')"
                left-icon="i-lucide-search"
                clearable
                @clear="clearIconName"
              />
            </ResourceField>
          </div>
          <div
            v-if="form.iconCollectionName || form.iconCollectionDesc"
            class="settings-notice my-3 text-sm"
          >
            <p v-if="form.iconCollectionName" class="font-medium">
              {{ form.iconCollectionName }}
            </p>
            <p v-if="form.iconCollectionDesc" class="text-muted">
              {{ form.iconCollectionDesc }}
            </p>
          </div>
        </div>
        <div class="icon-list-section">
          <div v-if="fetchStatus === 'loading'" class="icon-state-wrapper">
            <div class="icon-state icon-state-loading">
              <AppIcon
                name="loading"
                size="24px"
                class="loading-icon"
              ></AppIcon>
              <p class="state-title">
                {{ $t(`iconCollectionPage.loadingTitle`) }}
              </p>
              <p class="state-desc">
                {{ $t(`iconCollectionPage.loadingDesc`) }}
              </p>
            </div>
          </div>
          <div v-else-if="fetchStatus === 'error'" class="icon-state-wrapper">
            <div class="icon-state">
              <EmptyState image="error" class="icon-empty">
                <template #description>
                  <h3>{{ $t(`iconCollectionPage.loadFailedTitle`) }}</h3>
                  <p>{{ $t(`iconCollectionPage.loadFailedDesc`) }}</p>
                </template>
              </EmptyState>
              <UButton
                icon="i-lucide-refresh-cw"
                color="primary"
                class="icon-retry-btn"
                @click="refreshIcons"
              >
                {{ $t(`iconCollectionPage.retryBtn`) }}
              </UButton>
            </div>
          </div>
          <div
            v-else-if="iconData.length"
            class="icon-list"
            :ref="(el) => { (containerProps.ref as any).value = el }"
            @scroll="containerProps.onScroll"
          >
            <div v-bind="wrapperProps">
              <div v-for="row in virtualRows" :key="row.index" class="icon-row">
                <UButton
                  v-for="(icon, iconIndex) in row.data"
                  :key="iconIndex"
                  class="icon-item"
                  color="neutral"
                  variant="ghost"
                  :title="icon.name"
                  :aria-label="icon.name"
                  :style="{
                    width: iconItemWidth,
                    marginRight:
                      iconIndex < row.data.length - 1 ? iconItemGap : '0',
                  }"
                  @click="handleIcon(icon)"
                >
                  <ResourceImage
                    :src="rewriteGithubUrl(icon.url)"
                    :fit="globalIconFit"
                    lazy-load
                    show-loading
                  />
                  <span class="block w-full truncate text-xs">
                    {{ icon.name }}
                  </span>
                </UButton>
              </div>
            </div>
          </div>
          <div v-else class="icon-state-wrapper">
            <EmptyState image="empty">
              <template #description>
                <h3>{{ $t(`iconCollectionPage.emptyCollectionTitle`) }}</h3>
                <p>{{ $t(`iconCollectionPage.emptyCollectionDesc`) }}</p>
              </template>
            </EmptyState>
          </div>
        </div>
      </div>
    </div>
  </WorkspaceModal>
</template>


<script setup lang="ts">
import WorkspaceModal from "@/components/WorkspaceModal.vue";
import { Toast } from '@/services/feedback';
import { useDebounceFn, useVirtualList } from "@vueuse/core";
import axios from "axios";
import { storeToRefs } from "pinia";
import { computed, reactive, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

import { useGlobalStore } from "@/store/global";
import { useSettingsStore } from "@/store/settings";
import { createGithubProxyUrlRewriter } from "@/utils/githubProxy";
import { normalizeImageFit } from "@/utils/iconFit";
import { getApiRequestTimeout } from "@/utils/requestTimeout";
import { useWideScreenNarrowMode } from "@/hooks/useWideScreenNarrowMode";

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
});
const emit = defineEmits(["update:visible", "setIcon"]);
const { t } = useI18n();
const globalStore = useGlobalStore();
const settingsStore = useSettingsStore();
const { customIconCollections, defaultIconCollections, defaultIconCollection } =
  storeToRefs(globalStore);
const { appearanceSetting, githubProxy, githubProxyRegex } = storeToRefs(settingsStore);

const form = reactive({
  iconName: "",
  iconCollectionName: "",
  iconCollectionUrl: "",
  customIconCollectionUrl: "",
  iconCollectionDesc: "",
  iconListKey: "",
  iconItemUrlKey: "",
});

type IconCollectionFetchStatus = "idle" | "loading" | "success" | "error";

const fetchStatus = ref<IconCollectionFetchStatus>("idle");
const iconList = ref([]);
const searchResult = ref([]);

// 创建一个单独的搜索函数
const performSearch = () => {
  if (!form.iconName.trim()) {
    searchResult.value = iconList.value;
  } else {
    const lowercaseTerm = form.iconName.toLowerCase();
    searchResult.value = iconList.value.filter((item) =>
      item.name.toLowerCase().includes(lowercaseTerm),
    );
  }
  // 搜索后滚动到顶部
  scrollToRow(0);
};

// 使用 useDebounceFn 创建防抖搜索函数
const debouncedSearch = useDebounceFn(performSearch, 500);

const iconData = computed(() => {
  return searchResult.value;
});
// 宽屏（>=768px）每行显示 8 个，窄屏每行显示 4 个
const { isWideScreen } = useWideScreenNarrowMode();
const iconsPerRow = computed(() => (isWideScreen.value ? 8 : 4));
const iconItemWidth = computed(() => `${(96 / iconsPerRow.value).toFixed(4)}%`);
const iconItemGap = computed(() => `calc(4% / ${iconsPerRow.value - 1})`);
// 将图标数据按每行数量分组
const iconRows = computed(() => {
  const rows: { name: string; url: string }[][] = [];
  const icons = iconData.value;
  const perRow = iconsPerRow.value;
  for (let i = 0; i < icons.length; i += perRow) {
    rows.push(icons.slice(i, i + perRow));
  }
  return rows;
});
// 使用 useVirtualList 进行虚拟滚动
const {
  list: virtualRows,
  containerProps,
  wrapperProps,
  scrollTo: scrollToRow,
} = useVirtualList(iconRows, {
  itemHeight: 90,
  overscan: 5,
});

const globalIconFit = computed(() => normalizeImageFit(appearanceSetting.value.iconFit));
const githubUrlRewriter = computed(() => {
  return createGithubProxyUrlRewriter(githubProxy.value, githubProxyRegex.value);
});
const rewriteGithubUrl = (url?: string | null) => {
  return githubUrlRewriter.value(url);
};

// 监听 form.iconName 变化以触发搜索
watch(
  () => form.iconName,
  (newValue) => {
    debouncedSearch();
  },
);

// 图标仓库列表
const iconCollectionColumns = computed(() => {
  // 合并自定义和默认图标仓库
  const mergedCollections = [
    ...customIconCollections.value,
    ...defaultIconCollections.value,
  ];
  return mergedCollections;
});

// 默认图标仓库
const defaultIconCollectionValue = ref([""]);


const showCustomIconCollection = ref(false);

const setDefaultIconCollection = (url: string) => {
  globalStore.setDefaultIconCollection(url);
};

const setCustomIconCollections = (collection: any[]) => {
  globalStore.setCustomIconCollections(collection);
};

const fetchIcons = async () => {
  try {
    Toast.loading(t(`globalNotify.refresh.loading`), {
      cover: true,
      id: "icon-collection",
    });
    fetchStatus.value = "loading";
    const { data } = await axios.get(rewriteGithubUrl(form.iconCollectionUrl), {
      timeout: getApiRequestTimeout(),
    });
    const collectionKey = form.iconListKey || "icons";
    const iconUrlKey = form.iconItemUrlKey || "url";
    iconList.value = data[collectionKey];
    form.iconCollectionName = data.name || "";
    form.iconCollectionDesc = data.description || "";
    const { name } = data;
    if (iconList.value && iconList.value.length > 0) {
      iconList.value = iconList.value.map((item) => {
        const iconItem = {
          name: item.name || "",
          url: item[iconUrlKey] || "",
        };
        return iconItem;
      });
      // 添加自定义图标仓库，
      const hasCollection = iconCollectionColumns.value.some(
        (item) => item.value === form.iconCollectionUrl,
      );
      console.log("hasCollection", hasCollection);
      if (!hasCollection) {
        const list = [
          {
            text: name,
            value: form.iconCollectionUrl,
          },
          ...customIconCollections.value,
        ];
        setCustomIconCollections(list);
        setDefaultIconCollection(form.iconCollectionUrl);
        defaultIconCollectionValue.value[0] = form.iconCollectionUrl;
      } else {
        setDefaultIconCollection(form.iconCollectionUrl);
        defaultIconCollectionValue.value[0] = form.iconCollectionUrl;
      }
    } else {
      iconList.value = [];
    }
    // 新图标集加载完成后，沿用当前筛选条件重新计算结果。
    performSearch();
    fetchStatus.value = "success";
    Toast.hide("icon-collection");
  } catch (error) {
    Toast.hide("icon-collection");
    iconList.value = [];
    searchResult.value = [];
    fetchStatus.value = "error";
    console.error("Error fetching icons:", error);
  }
};

const handleAddCustomIconCollection = () => {
  form.iconCollectionUrl = form.customIconCollectionUrl;
  refreshIcons();
};

const handleIcon = (icon) => {
  console.log("icon", icon);
  hide();
  emit("setIcon", icon);
};

const handleConfirm = ({ selectedValue }) => {
  form.iconCollectionUrl = selectedValue[0];
  form.customIconCollectionUrl = "";
  showCustomIconCollection.value = false;
  setDefaultIconCollection(form.iconCollectionUrl);
  refreshIcons();
};

const syncIconCollectionState = () => {
  if (defaultIconCollection.value) {
    form.iconCollectionUrl = defaultIconCollection.value;
    defaultIconCollectionValue.value[0] = defaultIconCollection.value;
  } else {
    form.iconCollectionUrl = defaultIconCollections.value[0].value;
    defaultIconCollectionValue.value[0] = defaultIconCollections.value[0].value;
  }
};

const clearIconName = () => {
  form.iconName = "";
};

const clearCustomIconCollectionUrl = () => {
  form.customIconCollectionUrl = "";
};

const refreshIcons = () => {
  if (!form.iconCollectionUrl) {
    return Toast.warn(t(`iconCollectionPage.errorIconCollectionUrlTips`));
  }
  if (form.iconCollectionUrl && !/^(http|https)/.test(form.iconCollectionUrl)) {
    return Toast.warn(t(`iconCollectionPage.errorIconCollectionUrlTips`));
  }
  if (form.iconCollectionUrl) {
    fetchIcons();
  }
};

const handleResetDefault = () => {
  setCustomIconCollections([]);
  showCustomIconCollection.value = false;
  form.customIconCollectionUrl = "";
  form.iconCollectionUrl = defaultIconCollections.value[0].value;
  defaultIconCollectionValue.value[0] = defaultIconCollections.value[0].value;
  refreshIcons();
};

const isVisible = ref(props.visible);

watch(
  () => props.visible,
  (newValue) => {
    isVisible.value = newValue;
    if (newValue) {
      syncIconCollectionState();
      refreshIcons();
    }
  },
  { immediate: true },
);

const show = () => {
  isVisible.value = true;
  emit("update:visible", true);
};
const close = () => {
  clearIconName();
  hide();
};
const hide = () => {
  isVisible.value = false;
  emit("update:visible", false);
};
// 暴露方法给父组件
defineExpose({ show, hide, close });
</script>

<style lang="scss" scoped>
.icon-popup-top { min-width: 0; }
.icon-list { height: min(32dvh, 300px); overflow-y: auto; }
.icon-row { display: flex; height: 90px; }
.icon-item {
  display: inline-flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 6px;
  height: 90px;
  min-width: 0;
  padding: 8px 4px;
}
.icon-item :deep(.resource-image) { width: 40px; height: 40px; flex-shrink: 0; }
.icon-state-wrapper { display: flex; align-items: center; justify-content: center; min-height: 180px; }
.icon-state { text-align: center; color: var(--ui-text-muted); }
.state-title { margin: 12px 0 4px; font-size: 14px; font-weight: 600; }
.state-desc { font-size: 13px; }
.icon-retry-btn { margin-top: 12px; }
.loading-icon { animation: rotation 1.2s linear infinite; }
@keyframes rotation { to { transform: rotate(360deg); } }
</style>
