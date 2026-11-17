<template>
  <UDashboardSidebar
    id="navigation"
    collapsible
    resizable
    :default-size="240"
    :min-size="200"
    :max-size="320"
    :collapsed-size="64"
    mode="modal"
    :menu="{ fullscreen: false }"
    :ui="{
      root: 'bg-muted/50',
      footer: 'flex-col items-stretch gap-1 border-t border-default',
      content: 'w-80 max-w-[calc(100vw-2rem)] max-h-[70dvh] sm:max-h-[70dvh]',
    }"
    :aria-label="t('workspace.mainNavigation')"
  >
    <template #header="{ collapsed }">
      <ULink
        to="/subs"
        class="flex min-w-0 items-center gap-2.5 font-semibold text-highlighted"
        aria-label="Sub-Store"
      >
        <img src="@/assets/icons/logo.svg" alt="" class="size-7 shrink-0" />
        <span v-if="!collapsed" class="truncate">Sub-Store</span>
      </ULink>
    </template>
    <template #default="{ collapsed }">
      <UNavigationMenu
        :items="navigation"
        :collapsed="collapsed"
        :ui="navigationUi"
        orientation="vertical"
        :aria-label="t('workspace.resources')"
      />
      <UNavigationMenu
        :items="tools"
        :collapsed="collapsed"
        :ui="navigationUi"
        orientation="vertical"
        class="mt-auto"
        :aria-label="t('workspace.tools')"
      />
    </template>
    <template #footer="{ collapsed }">
      <div
        class="flex min-w-0 w-full items-center gap-2 px-2.5 py-2 text-xs text-muted"
        role="status"
        :aria-label="connectionLabel"
      >
        <UIcon
          :name="
            globalStore.fetchResult
              ? 'i-lucide-circle-check'
              : 'i-lucide-circle-alert'
          "
          class="size-4 shrink-0"
          :class="globalStore.fetchResult ? 'text-success' : 'text-error'"
        />
        <template v-if="!collapsed">
          <span class="truncate">{{ connectionLabel }}</span>
          <small v-if="globalStore.fetchResult" class="ms-auto">{{
            globalStore.env.version
          }}</small>
        </template>
      </div>
    </template>
  </UDashboardSidebar>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import type { NavigationMenuItem } from "@nuxt/ui";
import { useGlobalStore } from "@/store/global";
import { useEditorModal } from "@/hooks/useEditorModal";


const navigationUi = {
  list: "space-y-1",
  link: "py-2",
  linkLeadingIcon: "size-3.5",
};
const { t } = useI18n();
const route = useRoute();
const globalStore = useGlobalStore();
const { parentPath } = useEditorModal();
const connectionLabel = computed(() =>
  t(globalStore.fetchResult ? "workspace.connected" : "workspace.disconnected"),
);
const navigation = computed<NavigationMenuItem[]>(() => {
  const items: NavigationMenuItem[] = [
    { label: t("workspace.workspace"), type: "label" },
    { to: "/subs", label: t("workspace.subscriptions"), icon: "i-lucide-link" },
    { to: "/files", label: t("workspace.files"), icon: "i-lucide-folder" },
    { to: "/sync", label: t("workspace.sync"), icon: "i-lucide-refresh-cw" },
    ...(globalStore.env.feature?.share
      ? [{ to: "/shares", label: t("workspace.shares"), icon: "i-lucide-share-2" }]
      : []),
    ...(globalStore.env.feature?.archive
      ? [{ to: "/archives", label: t("workspace.archives"), icon: "i-lucide-archive" }]
      : []),
  ];
  return items.map((item) =>
    item.to
      ? { ...item, active: item.to === (parentPath.value || route.path) }
      : item,
  );
});
const tools = computed<NavigationMenuItem[]>(() => [
  { to: "/my", label: t("workspace.preferences"), icon: "i-lucide-settings", active: route.path === "/my" },
]);
</script>
