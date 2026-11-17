<template>
  <div class="app-layout-wrapper">
    <component :is="backgroundPage" v-if="backgroundPage" :key="parentPath" />
    <router-view v-slot="{ Component }">
      <component v-if="isPageEditor" :is="Component" :key="editorRouteKey" />
      <WorkspaceModal
        v-else-if="parentPath"
        :visible="true"
        :title="t(`navBar.pagesTitle.${route.meta.title}`)"
        footer-target="workspace-editor-footer"
        @update:visible="closeEditor"
      >
        <component :is="Component" :key="route.fullPath" />
      </WorkspaceModal>
      <component :is="Component" v-else />
    </router-view>
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import WorkspaceModal from "@/components/WorkspaceModal.vue";
import { useEditorModal } from "@/hooks/useEditorModal";
import { getEditorPath } from "@/utils/editorRoute";
import Sub from "@/views/Sub.vue";
import File from "@/views/File.vue";
import Sync from "@/views/Sync.vue";
const Share = defineAsyncComponent(() => import("@/views/share/Share.vue"));
const pages = { "/subs": Sub, "/files": File, "/sync": Sync, "/shares": Share };
const { parentPath, isPageEditor } = useEditorModal();
const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const editorRouteKey = computed(() => getEditorPath(route));
const backgroundPage = computed(() =>
  parentPath.value && !isPageEditor.value ? pages[parentPath.value] : null,
);
const closeEditor = () => {
  if (parentPath.value) router.push(parentPath.value);
};
</script>

<style scoped>
.app-layout-wrapper {
  flex: 1;
  min-width: 0;
  padding: 16px 24px;
}
@media (max-width: 767px) {
  .app-layout-wrapper {
    padding: 14px;
  }
}
</style>
