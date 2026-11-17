<template>
  <div
    class="sub-item-wrapper"
    :class="{ disabled: props.disabled, 'is-dual-column': props.isDualColumn }"
    :style="{ padding: itemPadding, '--icon-fit': shareIconFit }"
    data-testid="link-card"
    @click="onClickPreviews"
  >
    <div
      class="sub-img-wrappers"
      :style="{ 'margin-top': imageMarginTop }"
      @click.stop="onClickEdit"
    >
      <div v-if="appearanceSetting.isShowIcon">
        <div v-if="isIconColor">
          <ResourceAvatar :size="avatarSize" :url="shareIcon" bg-color="" />
        </div>
        <div v-else>
          <ResourceAvatar
            class="sub-item-customer-icon"
            :size="avatarSize"
            :url="shareIcon"
            bg-color=""
          />
        </div>
      </div>
    </div>
    <div class="sub-item-content">
      <div class="workspace-row-identity">
        <div class="sub-item-title-wrapper">
          <h3 class="sub-item-title" :title="displayName || name">
            <span class="sub-item-name">{{ displayName || name }}</span>
            <span v-for="item in shareTags" :key="item" class="tag">
              <TagChip>{{ item }}</TagChip>
            </span>
          </h3>
        </div>
        <p class="sub-item-detail">
          {{ t("sharePage.createTimeLabel") }}{{ createTime }}
        </p>
        <p class="sub-item-detail">{{ nonSimpleSecondLine }}</p>
        <p v-if="remark" class="sub-item-remark">{{ remark }}</p>
      </div>
      <div class="workspace-row-actions" @click.stop>
        <UButton :size="isDesktop ? 'sm' : 'xs'"
          type="button"
          :disabled="props.disabled"
          @click.stop="onClickPreviews"
          title="预览"
         color="neutral" variant="outline">
          <UIcon mode="svg" class="size-4 shrink-0 align-middle" name="i-lucide-eye" /><span>预览</span>
        </UButton>
        <UButton :size="isDesktop ? 'sm' : 'xs'"
          type="button"
          :disabled="props.disabled"
          @click.stop="onClickShareLink"
          title="分享"
         color="neutral" variant="outline">
          <UIcon mode="svg" class="size-4 shrink-0 align-middle" name="i-lucide-link" /><span>分享</span>
        </UButton>
        <UButton :size="isDesktop ? 'sm' : 'xs'"
          type="button"
          :disabled="props.disabled"
          @click.stop="onClickCopyLink"
          title="复制链接"
         color="neutral" variant="outline">
          <UIcon mode="svg" class="size-4 shrink-0 align-middle" name="i-lucide-copy" /><span>复制链接</span>
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
</template>

<script lang="ts" setup>
import { useMediaQuery } from "@vueuse/core";
import { Dialog, Toast } from '@/services/feedback';
import dayjs from "dayjs";
import { storeToRefs } from "pinia";
import { computed, createVNode } from "vue";
import { useI18n } from "vue-i18n";
import { copyText } from "@/utils/clipboard";
import { useRouter } from "vue-router";
import logoIcon from "@/assets/icons/logo.png";
import logoRedIcon from "@/assets/icons/logo-red.png";
import PreviewPanel from "@/components/PreviewPanel.vue";
import { useBackend } from "@/hooks/useBackend";
import { useHostAPI } from "@/hooks/useHostAPI";
import { useAppNotifyStore } from "@/store/appNotify";
import { useSettingsStore } from "@/store/settings";
import { useSubsStore } from "@/store/subs";
import { openManagedDeleteDialog } from "@/utils/archive";
import { createGithubProxyUrlRewriter } from "@/utils/githubProxy";
import { resolveImageFit } from "@/utils/iconFit";
import {
  formatShareTimestamp,
  getShareEditPath,
  getSharePublicUrl,
  isShareLifetimeExpiration,
  resolveShareDisplayIconState,
} from "@/utils/share";
import { normalizeTagArray } from "@/utils/shareTags";
const isDesktop = useMediaQuery("(min-width: 768px)");

const { showNotify } = useAppNotifyStore();
const router = useRouter();
const props = defineProps<{
  data: Share;
  disabled?: boolean;
  isDualColumn?: boolean;
}>();
const { t } = useI18n();
const { env } = useBackend();
const isArchiveEnabled = computed(() => {
  return env.value?.feature?.archive;
});
const settingsStore = useSettingsStore();
const subsStore = useSubsStore();
const { appearanceSetting, githubProxy, githubProxyRegex } = storeToRefs(settingsStore);
const { currentUrl: host, currentShareBaseUrl } = useHostAPI();
const avatarSize = computed(() => {
  if (appearanceSetting.value.isSimpleMode) return "36";
  return props.isDualColumn ? "40" : "48";
});
const itemPadding = computed(() => {
  if (appearanceSetting.value.isSimpleMode) return "9px";
  return props.isDualColumn ? "12px" : "16px";
});
const imageMarginTop = computed(() => {
  if (appearanceSetting.value.isSimpleMode) return "5px";
  return props.isDualColumn ? "2px" : "0";
});

const name = computed(() => {
  return props?.data?.name;
});

const displayName = computed(() => {
  return props?.data?.displayName;
});
const remark = computed(() => {
  return props?.data?.remark;
});
const shouldInlineRemarkInSecondLine = computed(() => {
  return Boolean(
    props.isDualColumn
    && appearanceSetting.value.isSimpleMode
    && remark.value
    && appearanceSetting.value.isSimpleShowRemark
  );
});
const isDualNonSimpleMode = computed(() => {
  return Boolean(
    props.isDualColumn
    && !appearanceSetting.value.isSimpleMode,
  );
});
const type = computed(() => {
  return props?.data?.type;
});
const token = computed(() => {
  return props?.data?.token;
});
const shareTags = computed(() => {
  return normalizeTagArray(props?.data?.tag);
});
const expiresTime = computed(() => {
  return formatShareTimestamp(props?.data?.exp);
});
const createTime = computed(() => {
  return formatShareTimestamp(props?.data?.createdAt);
});
const leftTime = computed(() => {
  if (props?.data?.mode === "count") {
    const count = Number(props?.data?.count);
    const usedCount = props?.data?.usedCount == null ? 0 : Number(props?.data?.usedCount);
    return Number.isSafeInteger(count)
      && count > 0
      && Number.isSafeInteger(usedCount)
      && usedCount >= 0
      ? `${t("sharePage.countUsage")} ${Math.min(usedCount, count)}/${count}`
      : t("sharePage.expired");
  }

  if (isShareLifetimeExpiration(props?.data)) {
    return t("sharePage.createShare.unit.lifetime");
  }

  return props?.data?.exp
    ? dayjs(props?.data?.exp).diff(dayjs(), "second") > 0
      ? `${t("sharePage.leftTime")} ${dayjs(props?.data?.exp).diff(dayjs(), "day", true).toFixed(0)} ${t("sharePage.createShare.unit.day")}`
      : t("sharePage.expired")
    : 0;
});
const detailLine = computed(() => {
  const baseLine = `${expiresTime.value}${expiresTime.value ? " · " : ""}${leftTime.value}`;

  if (!shouldInlineRemarkInSecondLine.value) {
    return baseLine;
  }

  return [baseLine, remark.value].filter(Boolean).join(" · ");
});
const nonSimpleSecondLine = computed(() => {
  const baseLine = `${expiresTime.value}${expiresTime.value ? " · " : ""}${leftTime.value}`;
  return isDualNonSimpleMode.value
    ? [baseLine, remark.value].filter(Boolean).join(" · ")
    : baseLine;
});

const icon = computed(() => {
  return appearanceSetting.value.isDefaultIcon ? logoIcon : logoRedIcon;
});
const githubUrlRewriter = computed(() => {
  return createGithubProxyUrlRewriter(githubProxy.value, githubProxyRegex.value);
});
const sourceItem = computed(() => {
  switch (type.value) {
    case "sub":
      return subsStore.getOneSub(name.value) || null;
    case "col":
      return subsStore.getOneCollection(name.value) || null;
    case "file":
      return subsStore.getOneFile(name.value) || null;
    default:
      return null;
  }
});
const shareIconState = computed(() => {
  return resolveShareDisplayIconState({
    share: props.data,
    source: sourceItem.value,
    fallbackIcon: icon.value,
  });
});

const shareIcon = computed(() => {
  return githubUrlRewriter.value(shareIconState.value.icon) || shareIconState.value.icon;
});

const isIconColor = computed(() => {
  return shareIconState.value.isIconColor;
});
const shareIconFit = computed(() => {
  return resolveImageFit(shareIconState.value.iconFit, appearanceSetting.value.iconFit);
});

const onDeleteConfirm = async (mode: DeleteMode = "permanent") => {
  await subsStore.deleteShare(token.value, type.value, name.value, mode);
};

const onClickEdit = () => {
  if (props.disabled) {
    return;
  }
  if (!type.value || !name.value || !token.value) {
    return;
  }
  router.push(getShareEditPath(type.value, name.value, token.value));
};

const getOneShareOrigin = async (keyName: string) => {
  switch (type.value) {
    case "col":
      return subsStore.getOneCollection(keyName);
    case "sub":
      return subsStore.getOneSub(keyName);
    case "file":
      return subsStore.getOneFile(keyName);
  }
};

const onClickCopyLink = async () => {
  if (props.disabled) {
    return;
  }
  const url = getShareUrl();
  try {
    await copyText(url);
    showNotify({ title: t("sharePage.copyShare.succeedNotify") });
  } catch (error) {
    Toast.fail(t("globalNotify.copyFailed", { e: error?.message ?? String(error) }));
  }
};

const onClickShareLink = async () => {
  if (props.disabled) {
    return;
  }
  try {
    const keyName = encodeURIComponent(name.value);
    const item = await getOneShareOrigin(name.value);
    if (!item) {
      return Toast.text(t("sharePage.noOriginalTips"));
    }
    if (type.value === "file") {
      router.push(`/edit/files/${keyName}`);
    }
    if (type.value === "sub") {
      router.push(`/edit/subs/${keyName}`);
    }
    if (type.value === "col") {
      router.push(`/edit/collections/${keyName}`);
    }
  } catch (error) {
    console.error(error);
  }
};

const onClickDelete = () => {
  if (props.disabled) {
    return;
  }
  openManagedDeleteDialog({
    enabled: isArchiveEnabled.value,
    managedTitle: t("archivePage.liveDelete.title"),
    managedContent: t("archivePage.liveDelete.desc", {
      displayName: displayName.value || name.value,
    }),
    managedCancelText: t("archivePage.liveDelete.btn.archive"),
    managedOkText: t("archivePage.liveDelete.btn.permanent"),
    legacyTitle: t("sharePage.deleteShare.title"),
    legacyContent: t("sharePage.deleteShare.desc", {
      displayName: name.value,
    }),
    legacyCancelText: t("sharePage.deleteShare.btn.cancel"),
    legacyOkText: t("sharePage.deleteShare.btn.confirm"),
    onArchive: () => onDeleteConfirm("archive"),
    onPermanent: () => onDeleteConfirm("permanent"),
  });
};

const secretPath = computed(() => {
  return env.value?.meta?.node?.env?.SUB_STORE_FRONTEND_BACKEND_PATH || "";
});

const getShareUrl = () => {
  try {
    if (!props.data.type || !props.data.name || !props.data.token) {
      return "";
    }
    return getSharePublicUrl({
      host: host.value,
      shareBaseUrl: currentShareBaseUrl.value,
      secretPath: secretPath.value,
      type: props.data.type,
      name: props.data.name,
      token: props.data.token,
    });
  } catch (error) {
    Toast.fail(t("sharePage.magicPathErrorNotify"));
    console.error(error);
    return "";
  }
};

const onClickPreviews = () => {
  if (props.disabled) return;
  if (isDesktop.value) {
    void router.push({ path: "/preview/targets", query: { name: name.value, displayName: displayName.value, type: "share", url: getShareUrl() } });
    return;
  }
  if (type.value === "file") {
    return;
  }
  const url = getShareUrl();

  Dialog({
    title: t("subPage.previewTitle"),
    content: createVNode(PreviewPanel, {
      name: name.value,
      displayName: displayName.value,
      type: "share",
      url,
      general: t("subPage.panel.general"),
      notify: t("subPage.copyNotify.succeedWithShare"),
      includeUnsupportedProxyLabel: t("subPage.panel.options.includeUnsupportedProxy"),
      prettyYamlLabel: t("subPage.panel.options.prettyYaml"),
      noFlowLabel: t("subPage.panel.options.noFlow"),
      displayPreviewInWebPageLabel: t("moreSettingPage.displayPreviewInWebPage"),
      tipsTitle: t("subPage.panel.tips.title"),
      tipsContent: `${t("subPage.panel.tips.content")}\n${t(
        "syncPage.addArtForm.includeUnsupportedProxy.tips.content",
      )}`,
      desc: t("subPage.panel.tips.desc"),
      tipsOkText: t("subPage.panel.tips.ok"),
      tipsCancelText: t("subPage.panel.tips.cancel"),
    }),
    popClass: "auto-dialog",
    // @ts-ignore
    closeOnClickOverlay: true,
    noOkBtn: true,
    noCancelBtn: true,
    closeOnPopstate: true,
    lockScroll: false,
  });
};
</script>
