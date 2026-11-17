<template>
  <div class="resource-row">
    <div
      class="sub-item-wrapper"
      :class="{ 'is-dual-column': props.isDualColumn }"
      :style="{ padding: itemPadding, '--icon-fit': iconFit }"
      @click="handleContentClick"
    >
      <div class="sub-img-wrappers" @click.stop="openUrl">
        <ResourceAvatar
          v-if="appearanceSetting.isShowIcon"
          :class="{ 'sub-item-customer-icon': !isIconColor }"
          :size="avatarSize"
          :url="displayIcon"
          bg-color=""
        ></ResourceAvatar>
      </div>
      <div class="sub-item-content">
        <div class="workspace-row-identity">
          <div class="sub-item-title-wrapper">
            <h3 class="sub-item-title" :title="displayName">
              <span class="sub-item-name">{{ displayName }}</span>
              <span v-for="item in tag" :key="item" class="tag">
                <TagChip>{{ item }}</TagChip>
              </span>
            </h3>
          </div>
          <p class="sub-item-detail">{{ detail.firstLine }}</p>
          <p class="sub-item-detail">{{ detail.secondLine }}</p>
          <p v-if="remark" class="sub-item-remark">{{ remarkText }}</p>
          <div class="task-switch" @click.stop>
            <span class="switch-label">{{ $t("syncPage.syncSwitcher") }}</span>
            <USwitch
              class="my-switch"
              v-model="isSyncOpen"
              :loading="isSwitcherLoading"
            />
          </div>
        </div>
        <div class="workspace-row-actions" @click.stop>
          <UButton :size="isDesktop ? 'sm' : 'xs'"
            type="button"
            v-if="artifactUrl"
            :disabled="props.disabled"
            @click.stop="openUrl"
            title="查看"
           color="neutral" variant="outline">
            <UIcon mode="svg" class="size-4 shrink-0 align-middle" name="i-lucide-eye" /><span>查看</span>
          </UButton>
          <UButton :size="isDesktop ? 'sm' : 'xs'"
            type="button"
            v-if="artifactUrl"
            :disabled="props.disabled"
            @click.stop="onClickCopyLink"
            title="复制链接"
           color="neutral" variant="outline">
            <UIcon mode="svg" class="size-4 shrink-0 align-middle" name="i-lucide-copy" /><span>复制链接</span>
          </UButton>
          <UButton :size="isDesktop ? 'sm' : 'xs'"
            type="button"
            :disabled="props.disabled"
            @click.stop="onClickSync"
            title="立即同步"
           color="neutral" variant="outline">
            <UIcon mode="svg" class="size-4 shrink-0 align-middle" name="i-lucide-cloud-upload" /><span
              >立即同步</span
            >
          </UButton>
          <UButton :size="isDesktop ? 'sm' : 'xs'"
            type="button"
            :disabled="props.disabled"
            @click.stop="onClickEdit"
            title="编辑"
           color="neutral" variant="outline">
            <UIcon mode="svg" class="size-4 shrink-0 align-middle" name="i-lucide-pencil" /><span>编辑</span>
          </UButton>
          <UButton :size="isDesktop ? 'sm' : 'xs'"
            type="button"
            class="danger"
            :disabled="props.disabled"
            @click.stop="onClickDelete"
            title="删除"
           color="error" variant="soft">
            <UIcon mode="svg" class="size-4 shrink-0 align-middle" name="i-lucide-trash-2" /><span>删除</span>
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useMediaQuery } from "@vueuse/core";
const handleContentClick = (event: MouseEvent) => { event.stopPropagation(); openPreviewSource(); };
import { useAppNotifyStore } from "@/store/appNotify";
import { useArtifactsStore } from "@/store/artifacts";
import { useSettingsStore } from "@/store/settings";
import { useSubsStore } from "@/store/subs";
import { butifyDate } from "@/utils/butifyDate";
import { resolveArtifactIcon } from "@/utils/artifactIcon";
import { createGithubProxyUrlRewriter } from "@/utils/githubProxy";
import { resolveImageFit } from "@/utils/iconFit";

import { Dialog, Toast } from '@/services/feedback';
import { storeToRefs } from "pinia";
import { computed, ref, toRaw, watch, watchEffect } from "vue";
import { copyText } from "@/utils/clipboard";
import { useI18n } from "vue-i18n";
import { useGlobalStore } from "@/store/global";
import { useHostAPI } from "@/hooks/useHostAPI";
import { useBackend } from "@/hooks/useBackend";
import { openManagedDeleteDialog } from "@/utils/archive";
const isDesktop = useMediaQuery("(min-width: 768px)");
const globalStore = useGlobalStore();

const { t } = useI18n();
const { currentUrl: host } = useHostAPI();
const { env } = useBackend();
const isArchiveEnabled = computed(() => {
  return env.value?.feature?.archive;
});

const props = defineProps<{
  name: string;
  disabled?: boolean;
  isDualColumn?: boolean;
}>();

const { showNotify } = useAppNotifyStore();
const subsStore = useSubsStore();
const artifactsStore = useArtifactsStore();
const settingsStore = useSettingsStore();
const { appearanceSetting, githubProxy, githubProxyRegex } = storeToRefs(settingsStore);
const { artifacts } = storeToRefs(artifactsStore);
const artifact = computed(() => {
  return artifacts.value.find((item) => item.name === props.name);
});
const emit = defineEmits(["edit"]);
const artifactUrl = computed(() => {
  return artifact.value?.upload === false ? "" : artifact.value?.url || "";
});

const displayName = computed(() => {
  return (
    artifact.value.displayName ||
    artifact.value["display-name"] ||
    artifact.value.name
  );
});
const tag = computed(() => artifact.value?.tag || []);
const remark = computed(() => artifact.value?.remark || "");
const remarkText = computed(() => {
  if (remark.value) {
    return remark.value;
  }
  return "";
});
const shouldInlineRemarkInSecondLine = computed(() => {
  return Boolean(
    props.isDualColumn
    && appearanceSetting.value.isSimpleMode
    && remarkText.value
    && appearanceSetting.value.isSimpleShowRemark
  );
});
const isDualNonSimpleMode = computed(() => {
  return Boolean(
    props.isDualColumn
    && !appearanceSetting.value.isSimpleMode,
  );
});
const avatarSize = computed(() => {
  if (appearanceSetting.value.isSimpleMode) return "36";
  return props.isDualColumn ? "40" : "48";
});
const itemPadding = computed(() => {
  if (appearanceSetting.value.isSimpleMode) return "9px";
  return props.isDualColumn ? "12px" : "16px";
});

const isInit = ref(false);
const isSyncOpen = ref(false);
const isSwitcherLoading = ref(false);


const sourceSub = computed(() => {
  const name = artifact.value.source;
  switch (artifact.value.type) {
    case "collection":
      return subsStore.getOneCollection(name);
    case "subscription":
      return subsStore.getOneSub(name);
    case "file":
      return subsStore.getOneFile(name);
  }
});
const isIconColor = computed(() => {
  return artifact.value.isIconColor !== false;
});
const iconFit = computed(() => {
  return resolveImageFit(artifact.value?.iconFit, appearanceSetting.value.iconFit);
});

const icon = computed(() => {
  return resolveArtifactIcon({
    artifact: artifact.value,
    isDefaultIcon: appearanceSetting.value.isDefaultIcon,
    sourceIcon: sourceSub.value?.icon,
  });
});
const githubUrlRewriter = computed(() => {
  return createGithubProxyUrlRewriter(githubProxy.value, githubProxyRegex.value);
});
const displayIcon = computed(() => {
  return githubUrlRewriter.value(icon.value) || icon.value;
});


const sourceUrl = computed(() => {
  if (!artifact.value.type) {
    return "";
  }
  if (artifact.value.type === "file") {
    const path = `/api/file/${encodeURIComponent(artifact.value.source)}`;
    const url = `${host.value}${path}`;
    return url;
  }
  const query = new URLSearchParams();
  if (artifact.value.platform !== null) {
    query.set("target", artifact.value.platform);
  }
  if (artifact.value.includeUnsupportedProxy) {
    query.set("includeUnsupportedProxy", "true");
  }
  if (artifact.value.prettyYaml) {
    query.set("prettyYaml", "true");
  }
  const queryString = query.toString();
  return `${host.value}/download/${
    artifact.value.type === "subscription" ? "" : "collection/"
  }${encodeURIComponent(
    artifact.value.source
  )}${queryString ? `?${queryString}` : ""}`;
});

const openUrl = () => {
  if (artifactUrl.value) {
    window.open(artifactUrl.value);
  }
};






// 增加延迟防止打开时 触发不了






const openPreviewSource = () => {
  if (!sourceUrl.value) return;
  Dialog({
    title: t("tabBar.sub"),
    content: sourceUrl.value,
    onCancel: () => {},
    onOk: () => {
      window.open(sourceUrl.value);
    },
    popClass: "auto-dialog",
    okText: t("editorPage.subConfig.basic.previewSwitch"),
    closeOnPopstate: true,
    lockScroll: false,
  });
};

const transferText = (type: string) => {
  const transType = () => {
    switch (artifact.value.type) {
      case "subscription":
        return t("specificWord.singleSub");
      case "collection":
        return t("specificWord.collectionSub");
      case "file":
        return t("specificWord.file");
      default:
        return t("specificWord.unknownType");
    }
  };

  const transTime = () => {
    if (appearanceSetting.value.isSimpleMode) {
      return artifact.value.updated ? butifyDate(artifact.value.updated) : "";
    } else {
      return artifact.value.updated
        ? t(`syncPage.detail.secondLine`, {
            time: butifyDate(artifact.value.updated),
          })
        : t(`syncPage.detail.notSync`);
    }
  };

  switch (type) {
    case "type":
      return transType();
    case "time":
      return transTime();
  }
};

const detail = computed(() => {
  const name = sourceSub.value
    ? sourceSub.value?.displayName ||
      sourceSub.value?.["display-name"] ||
      sourceSub.value?.name
    : (artifact.value.source ?`${artifact.value.source}(🚫)` : t("specificWord.unknownSource"));
  const type = transferText("type") || "";
  if (appearanceSetting.value.isSimpleMode) {
    return {
      firstLine: "",
      secondLine: type + " " + name + " " + transferText("time"),
    };
  } else {
    return {
      firstLine: t(`syncPage.detail.firstLine`, {
        type,
        name,
      }),
      secondLine: transferText("time"),
    };
  }
});
const simpleDetailSecondLine = computed(() => {
  if (!shouldInlineRemarkInSecondLine.value) {
    return detail.value.secondLine;
  }

  return [detail.value.secondLine, remarkText.value].filter(Boolean).join(" · ");
});
const nonSimpleDetailSecondLine = computed(() => {
  return [detail.value.secondLine, remarkText.value].filter(Boolean).join(" · ");
});



const onClickCopyLink = async () => {
  try {
    await copyText(encodeURI(artifactUrl.value));
    showNotify({ title: t("syncPage.copyNotify.succeed"), type: "success" });
  } catch (error) {
    Toast.fail(t("syncPage.copyNotify.failed", { e: error?.message ?? String(error) }));
  }
};

const onDeleteConfirm = async (mode: DeleteMode = "permanent") => {
  const shouldShowToast = Boolean(artifactUrl.value);
  if (shouldShowToast) {
    Toast.loading("正在删除...", {
      cover: true,
      id: "delete-toast",
    });
  }

  await artifactsStore.deleteArtifact(artifact.value.name, mode);

  if (shouldShowToast) {
    Toast.hide("delete-toast");
  }
};

const onClickSync = async () => {
  Toast.loading("同步中...", {
    cover: true,
    id: "sync-toast",
  });
  await artifactsStore.syncOneArtifact(artifact.value.name);
  await settingsStore.fetchSettings();
  Toast.hide("sync-toast");
};

const onClickEdit = () => {
  emit("edit", artifact.value);
};

const onClickDelete = () => {
  openManagedDeleteDialog({
    enabled: isArchiveEnabled.value,
    managedTitle: t("archivePage.liveDelete.title"),
    managedContent: [
      t("archivePage.liveDelete.desc", { displayName: displayName.value }),
      t("syncPage.deleteArt.archiveExtra"),
    ].join("\n\n"),
    managedCancelText: t("archivePage.liveDelete.btn.archive"),
    managedOkText: t("archivePage.liveDelete.btn.permanent"),
    legacyTitle: t("syncPage.deleteArt.title"),
    legacyContent: t("syncPage.deleteArt.desc", { displayName: displayName.value }),
    legacyCancelText: t("syncPage.deleteArt.btn.cancel"),
    legacyOkText: t("syncPage.deleteArt.btn.confirm"),
    onArchive: () => onDeleteConfirm("archive"),
    onPermanent: () => onDeleteConfirm("permanent"),
  });
};

// 初始化开关状态
watchEffect(() => {
  if (!isInit.value && artifact.value.name) {
    isSyncOpen.value = artifact.value.sync;
    isInit.value = true;
  } else {
  }
});

// 切换开关修改数据
watch(isSyncOpen, async () => {
  if (!isInit.value) return;
  isSwitcherLoading.value = true;
  const data = toRaw(artifact.value);
  data.sync = !artifact.value.sync;
  await artifactsStore.editArtifact(artifact.value.name, data);
  isSwitcherLoading.value = false;
});
</script>
