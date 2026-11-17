<template>
  <UDashboardNavbar
    :ui="route.path === '/my' ? { right: 'min-w-0 flex-1 justify-end' } : {}"
  >
    <template #leading><UDashboardSidebarCollapse /></template>
    <template #title>
      <div class="flex items-center gap-1">
        <UBreadcrumb
          :items="breadcrumbs"
          :aria-label="t('workspace.location')"
        />
        <HelpTip
          v-if="route.path === '/sync'"
          :help="{
            title: t('navBar.pagesTitle.askWhat.sync.title'),
            content: t('navBar.pagesTitle.askWhat.sync.content'),
          }"
        />
      </div>
    </template>
    <template #right>
      <div
        v-if="isSubscriptionEditor"
        id="subscription-editor-actions"
        class="flex items-center gap-2"
      />
      <div
        v-else-if="isPageEditor"
        id="resource-editor-actions"
        class="flex flex-wrap items-center justify-end gap-2"
      />
      <div
        v-if="route.path === '/my'"
        id="settings-tabs-host"
        class="settings-tabs-host"
      />
      <UButton
        size="sm"
        :ui="toolbarButtonUi"
        v-if="route.path === '/preview'"
        icon="i-lucide-arrow-left"
        :label="t('workspace.back')"
        color="neutral"
        variant="ghost"
        @click="back"
      />
      <UButton
        size="sm"
        :ui="toolbarButtonUi"
        v-if="isListPage"
        icon="i-lucide-refresh-cw"
        :loading="refreshing"
        :label="t('workspace.refresh')"
        color="neutral"
        variant="outline"
        @click="refresh"
      />
      <UDropdownMenu
        v-if="route.path === '/subs'"
        :items="subscriptionCreateItems"
        v-model:open="subscriptionMenuOpen"
      >
        <UButton
          size="sm"
          :ui="toolbarButtonUi"
          icon="i-lucide-plus"
          trailing-icon="i-lucide-chevron-down"
          :label="t('workspace.add')"
        />
        <template #content-bottom>
          <div class="flex items-center gap-1 border-t border-default p-2">
            <UButton
              icon="i-lucide-file-input"
              color="neutral"
              variant="ghost"
              size="sm"
              @click="importSubscription"
            >
              {{ t("subPage.import.label") }}
            </UButton>
            <HelpTip
              :help="{
                title: t('subPage.import.tipsTitle'),
                content: t('subPage.import.tipsContent'),
              }"
            />
          </div>
        </template>
      </UDropdownMenu>
      <UButton
        v-else-if="canAdd"
        size="sm"
        :ui="toolbarButtonUi"
        icon="i-lucide-plus"
        :label="t('workspace.add')"
        @click="add"
      />
      <UButton
        size="sm"
        :ui="toolbarButtonUi"
        v-if="isListPage"
        icon="i-lucide-search"
        :label="t('workspace.search')"
        color="neutral"
        :variant="search.isSearchOpen || search.hasQuery ? 'soft' : 'outline'"
        @click="openSearch"
      />
    </template>
  </UDashboardNavbar>
  <UDashboardToolbar
    v-if="isListPage && search.isSearchOpen"
    :ui="{ root: 'py-2' }"
  >
    <div class="flex w-full max-w-sm items-center gap-2">
      <FieldInput
        ref="searchInput"
        v-model="query"
        type="search"
        :placeholder="t('navBar.listSearch.placeholder')"
        :aria-label="t('workspace.searchList')"
        @keydown.esc="search.close()"
      />
      <UButton
        size="sm"
        :ui="toolbarButtonUi"
        icon="i-lucide-x"
        :aria-label="t('workspace.closeSearch')"
        color="neutral"
        variant="ghost"
        @click="search.close()"
      />
    </div>
  </UDashboardToolbar>
</template>
<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useEditorModal } from "@/hooks/useEditorModal";
import { useSystemStore } from "@/store/system";
import { useMethodStore } from "@/store/methodStore";
import { useListSearchStore } from "@/store/listSearch";
import { initStores } from "@/utils/initApp";
import { getShareCreatePath } from "@/utils/share";

const toolbarButtonUi = { leadingIcon: "size-4", trailingIcon: "size-4" };
const route = useRoute();
const { parentPath, isSubscriptionEditor, isPageEditor } = useEditorModal();
const router = useRouter();
const { t } = useI18n();
const methods = useMethodStore();
const search = useListSearchStore();
const subscriptionCreateItems = computed(() => [
  [
    { label: t('specificWord.singleSub'), icon: 'i-lucide-link', to: '/edit/subs/UNTITLED' },
    { label: t('specificWord.collectionSub'), icon: 'i-lucide-layers', to: '/edit/collections/UNTITLED' },
  ],
]);
const subscriptionMenuOpen = ref(false);
const importSubscription = () => {
  subscriptionMenuOpen.value = false;
  methods.invokeMethod('importSub');
};
const refreshing = ref(false);
const searchInput = ref<{ focus: () => void } | null>(null);
const pages: Record<string, { title: string; add?: string }> = {
  "/subs": {
    title: "workspace.subscriptions",
    add: "addSub",
  },
  "/files": {
    title: "workspace.files",
    add: "addFile",
  },
  "/sync": {
    title: "workspace.sync",
    add: "addSync",
  },
  "/shares": {
    title: "workspace.shares",
  },
  "/archives": {
    title: "workspace.archives",
  },
};
const page = computed(() => pages[parentPath.value || route.path]);
const isListPage = computed(() => !isPageEditor.value && Boolean(page.value));
const canAdd = computed(
  () => !isPageEditor.value && (Boolean(page.value?.add) || route.path === "/shares"),
);
const title = computed(
  () =>
    (page.value ? t(page.value.title) : "") ||
    {
      "/my": t("workspace.preferences"),
      "/gist": t("workspace.backup"),
      "/backup": t("workspace.backup"),
      "/settings/api": t("workspace.api"),
      "/settings/more": t("workspace.appearance"),
      "/aboutUs": t("workspace.about"),
      "/logs": t("workspace.logs"),
    }[route.path] ||
    (route.meta.title
      ? t(`navBar.pagesTitle.${route.meta.title}`)
      : "Sub-Store"),
);
const subscriptionEditorTitle = computed(() => t(`subscriptionEditor.${route.params.id === 'UNTITLED' ? 'create' : 'edit'}${route.params.editType === 'collections' ? 'Collection' : 'Subscription'}`));
const breadcrumbs = computed(() => isSubscriptionEditor.value ? [
  { label: t('workspace.subscriptions'), to: '/subs' },
  { label: subscriptionEditorTitle.value },
] : isPageEditor.value ? [
  { label: page.value ? t(page.value.title) : '', to: parentPath.value },
  { label: t(`resourceEditor.${route.path.startsWith('/edit/files/') ? (['UNTITLED', 'UNTITLED-mihomoConfig', 'UNTITLED-mihomoProfile'].includes(String(route.params.id)) ? 'createFile' : 'editFile') : route.path.startsWith('/edit/sync/') ? (route.params.id === 'UNTITLED' ? 'createSync' : 'editSync') : (route.query.token ? 'editShare' : 'createShare')}`) },
] : [
  { label: "substore", to: "/subs" },
  { label: title.value },
]);
const query = computed({
  get: () => search.query,
  set: (value: string) => search.setQuery(value),
});
watch(
  () => route.path,
  () => search.syncRoute(route.path, Boolean(route.meta.supportsListSearch)),
  { immediate: true },
);
onMounted(() => useSystemStore().initSystemState());
const openSearch = async () => {
  search.open(route.path);
  await nextTick();
  searchInput.value?.focus();
};
const add = () => {
  if (route.path === "/shares") {
    router.push(getShareCreatePath());
  } else if (page.value?.add) {
    methods.invokeMethod(page.value.add, {});
  }
};
const refresh = async () => {
  refreshing.value = true;
  try {
    if (route.path === "/archives") {
      await methods.methods.refreshArchive();
    } else {
      await initStores(true, true, true);
    }
  } finally {
    refreshing.value = false;
  }
};
const back = () =>
  router.options.history.state.back ? router.back() : router.push("/subs");
</script>
