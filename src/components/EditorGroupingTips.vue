<template>
  <HelpTip :help="openTips()" />
</template>
<script setup lang="ts">

import { useI18n } from "vue-i18n";

const { t } = useI18n();

const openTips = () => ({
  title: t("editorPage.groupingTips.title"),
  content: t("editorPage.groupingTips.content"),
  to: "/my?panel=more",
  linkLabel: t("editorPage.groupingTips.goSettings"),
});
</script>
