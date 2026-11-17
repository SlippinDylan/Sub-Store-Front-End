<template>
  <PreviewFrame page-mode :title="displayName || name" @close="back">
    <PreviewPanel
      :name="name"
      :display-name="displayName"
      :type="type"
      :url="url"
      page-mode
      :general="$t('subPage.panel.general')"
      :notify="$t('subPage.copyNotify.succeed')"
      :desc="$t('subPage.panel.tips.desc')"
      :include-unsupported-proxy-label="
        $t('subPage.panel.options.includeUnsupportedProxy')
      "
      :pretty-yaml-label="$t('subPage.panel.options.prettyYaml')"
      :no-flow-label="$t('subPage.panel.options.noFlow')"
      :display-preview-in-web-page-label="
        $t('moreSettingPage.displayPreviewInWebPage')
      "
    />
  </PreviewFrame>
</template>
<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import PreviewFrame from "@/components/PreviewFrame.vue";
import PreviewPanel from "@/components/PreviewPanel.vue";
const route = useRoute();
const router = useRouter();
const query = (key: string) =>
  typeof route.query[key] === "string" ? (route.query[key] as string) : "";
const name = computed(() => query("name"));
const displayName = computed(() => query("displayName"));
const type = computed(() =>
  query("type") === "collection"
    ? "collection"
    : query("type") === "share"
      ? "share"
      : "sub",
);
const url = computed(() => query("url") || undefined);
const back = () =>
  window.history.state.back
    ? router.back()
    : router.push(type.value === "share" ? "/shares" : "/subs");
</script>
