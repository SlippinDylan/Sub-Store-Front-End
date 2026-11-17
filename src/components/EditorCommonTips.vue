<template>
  <HelpTip :help="openTips()" />
</template>
<script setup lang="ts">

import { useI18n } from "vue-i18n";

const { t } = useI18n();

const openTips = () => ({
  title: t("editorPage.commonTips.title"),
  content: t("editorPage.commonTips.content"),
  to: "/my?panel=more",
  linkLabel: t("editorPage.commonTips.goSettings"),
});
</script>
