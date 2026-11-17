<template>
  <div class="resource-row">
    <div
      class="sub-item-wrapper"
      :class="{ 'is-dual-column': props.isDualColumn }"
      :style="{ padding: itemPadding, '--icon-fit': iconFit }"
      @click="handleContentClick"
    >
      <div
        v-if="
          appearanceSetting.subProgressStyle === 'background' &&
          typeof flow === 'object' &&
          flow.progress
        "
        class="progress"
        :style="{ width: `${flow.progress * 100}%` }"
      ></div>
      <!-- compareSub -->
      <div
        class="sub-img-wrappers"
        :style="{ 'margin-top': imageMarginTop }"
        @click.stop="compareSub"
      >
        <!-- icon visible -->
        <div v-if="appearanceSetting.isShowIcon">
          <div v-if="isIconColor">
            <ResourceAvatar
              v-if="props[props.type].icon"
              :size="avatarSize"
              :url="rewriteGithubUrl(props[props.type].icon)"
              bg-color=""
            />
            <ResourceAvatar
              v-else
              :size="avatarSize"
              :url="rewriteGithubUrl(icon)"
              bg-color=""
            />
          </div>
          <div v-else>
            <ResourceAvatar
              class="sub-item-customer-icon"
              :size="avatarSize"
              :url="rewriteGithubUrl(props[props.type].icon || icon)"
              bg-color=""
            />
          </div>
        </div>
      </div>
      <div class="sub-item-content">
        <div class="workspace-row-identity">
          <div class="sub-item-title-wrapper">
            <h3 class="sub-item-title" :title="displayName">
              <span class="sub-item-name">{{ displayName }}</span>

              <span v-for="i in tag" :key="i" class="tag">
                <TagChip>{{ i }}</TagChip>
              </span>
            </h3>
          </div>
          <p v-if="type === 'sub'" class="sub-item-detail">
            <template v-if="typeof flow === 'string'">{{ flow }}</template>
            <template v-else-if="typeof flow === 'object'">
              <span :title="flow.planName">{{ flow.firstLine }}</span>
              <span :title="flow.planName">{{ flow.secondLine }}</span>
            </template>
          </p>
          <p v-else class="sub-item-detail">{{ collectionDetail }}</p>
          <p v-if="remark" class="sub-item-remark">{{ remarkText }}</p>
        </div>
        <div class="workspace-row-actions" @click.stop>
          <UButton :size="isDesktop ? 'sm' : 'xs'"
            type="button"
            v-if="appOpenBtnVisible && !appearanceSetting.hidePublicLinkActionButton"
            :disabled="props.disabled"
            @click.stop="openAppUrl"
            title="官网"
           color="neutral" variant="outline">
            <UIcon mode="svg" class="size-4 shrink-0 align-middle" name="i-lucide-external-link" /><span
              >官网</span
            >
          </UButton>
          <UButton :size="isDesktop ? 'sm' : 'xs'"
            type="button"
            :disabled="props.disabled"
            @click.stop="compareSub"
            title="预览"
           color="neutral" variant="outline">
            <UIcon mode="svg" class="size-4 shrink-0 align-middle" name="i-lucide-eye" /><span>预览</span>
          </UButton>
          <UButton :size="isDesktop ? 'sm' : 'xs'"
            type="button"
            v-if="shareBtnVisible"
            :disabled="props.disabled"
            @click.stop="onClickShareLink"
            title="分享"
           color="neutral" variant="outline">
            <UIcon mode="svg" class="size-4 shrink-0 align-middle" name="i-lucide-share-2" /><span
              >分享</span
            >
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
            v-if="props.type === 'sub'"
            :disabled="props.disabled"
            @click.stop="onClickRefresh"
            title="刷新"
           color="neutral" variant="outline">
            <UIcon mode="svg" class="size-4 shrink-0 align-middle" name="i-lucide-refresh-cw" /><span
              >刷新</span
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
            :disabled="props.disabled"
            @click.stop="onClickCopyConfig"
            title="复制配置"
           color="neutral" variant="outline">
            <UIcon mode="svg" class="size-4 shrink-0 align-middle" name="i-lucide-clipboard-paste" /><span>复制配置</span>
          </UButton>
          <UButton :size="isDesktop ? 'sm' : 'xs'"
            type="button"
            :disabled="props.disabled"
            @click.stop="onClickExport"
            title="导出"
           color="neutral" variant="outline">
            <UIcon mode="svg" class="size-4 shrink-0 align-middle" name="i-lucide-file-output" /><span
              >导出</span
            >
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
    <!-- 加入判断 开启拖动不显示 -->
  </div>

  <CompareTable
    v-if="compareTableIsVisible"
    :name="name"
    :compare-data="compareData"
    :show-refresh="true"
    @closeCompare="closeCompare"
    @refresh="refreshCompare"
  />
</template>

<script lang="ts" setup>
import { usePreviewSession } from "@/store/previewSession";
import { usePreviewRequest } from "@/hooks/usePreviewRequest";
import { useMediaQuery } from "@vueuse/core";
const handleContentClick = (event: MouseEvent) => { event.stopPropagation(); openPreviewPanel(); };
import { Dialog, Toast } from '@/services/feedback';
import dayjs from "dayjs";
import { storeToRefs } from "pinia";
import { computed, createVNode, ref, toRaw } from "vue";
import { copyText } from "@/utils/clipboard";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";

import { useSubsApi } from "@/api/subs";
import logoIcon from "@/assets/icons/logo.png";
import logoRedIcon from "@/assets/icons/logo-red.png";
import PreviewPanel from "@/components/PreviewPanel.vue";
import { useBackend } from "@/hooks/useBackend";
import { useHostAPI } from "@/hooks/useHostAPI";
import { usePopupRoute } from "@/hooks/usePopupRoute";
import { useAppNotifyStore } from "@/store/appNotify";
import { useGlobalStore } from "@/store/global";
import { useSettingsStore } from "@/store/settings";
import { useSubsStore } from "@/store/subs";
import { getString } from "@/utils/flowTransfer";
import { createGithubProxyUrlRewriter } from "@/utils/githubProxy";
import { resolveImageFit } from "@/utils/iconFit";

import { openManagedDeleteDialog } from "@/utils/archive";
import { downloadBlobResponse } from "@/utils/download";
import CompareTable from "@/views/CompareTable.vue";
const isDesktop = useMediaQuery("(min-width: 768px)");

const props = defineProps<{
  type: "sub" | "collection";
  sub?: Sub;
  collection?: Collection;
  disabled?: boolean;
  isDualColumn?: boolean;
}>();
const emit = defineEmits(["update:visible", "share"]);

const { t } = useI18n();

const { env } = useBackend();

// console.log('props.disabled')
// console.log(props.disabled)
let scrollTop = 0;

const compareTableIsVisible = ref(false);
usePopupRoute(compareTableIsVisible);

const compareData = ref();
const router = useRouter();
const route = useRoute();
const beginPreviewRequest = usePreviewRequest();
const globalStore = useGlobalStore();
const subsStore = useSubsStore();
const subsApi = useSubsApi();
const settingsStore = useSettingsStore();
const { appearanceSetting, githubProxy, githubProxyRegex } = storeToRefs(settingsStore);

const {
  isFlowFetching,
  // isSimpleMode,
  // isLeftRight,
  // isIconColor,
  // isSimpleReicon,
  // isDefaultIcon,
  // subProgressStyle,
} = storeToRefs(globalStore);
const { showNotify } = useAppNotifyStore();
const { currentUrl: host } = useHostAPI();

const displayName =
  props[props.type].displayName || props[props.type]["display-name"] || props[props.type].name;

const name = props[props.type].name;
const tag = props[props.type].tag;
const remark = props[props.type].remark;
const remarkText = computed(() => {
  if (remark) {
    return remark;
  } else {
    return "";
  }
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
const { flows } = storeToRefs(subsStore);

const icon = computed(() => {
  return appearanceSetting.value.isDefaultIcon ? logoIcon : logoRedIcon;
});
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
const githubUrlRewriter = computed(() => {
  return createGithubProxyUrlRewriter(githubProxy.value, githubProxyRegex.value);
});
const rewriteGithubUrl = (url?: string | null) => {
  return githubUrlRewriter.value(url);
};

const isIconColor = computed(() => {
  return props[props.type].isIconColor !== false;
});
const iconFit = computed(() => {
  return resolveImageFit(props[props.type].iconFit, appearanceSetting.value.iconFit);
});

const collectionDetail = computed(() => {
  const nameList = props?.collection.subscriptions || [];
  const subTags = props?.collection.subscriptionTags || [];
  if (nameList.length === 0 && subTags.length === 0) {
    return t("subPage.collectionItem.noSub");
  } else {
    const displayNameList = nameList.map((name) => {
      const sub = subsStore.getOneSub(name);
      return sub?.displayName || sub?.["display-name"] || sub?.name || `${name}(🚫)`;
    });
    if (nameList.length === 0) {
      return `${t("subPage.collectionItem.containTag")}: ${subTags.join(", ")}`;
    }
    if (subTags.length === 0) {
      return `${t("subPage.collectionItem.contain")}: ${displayNameList.join(
        ", ",
      )}`;
    }
    return `${t("subPage.collectionItem.containTag")}: ${subTags.join(
      ", ",
    )} | ${t("subPage.collectionItem.contain")}: ${displayNameList.join(", ")}`;
  }
});
const appendRemarkToSimpleDetailLine = (value: string) => {
  if (!shouldInlineRemarkInSecondLine.value) {
    return value;
  }

  return [value, remarkText.value].filter(Boolean).join(" · ");
};
const simpleCollectionDetailLine = computed(() => {
  return appendRemarkToSimpleDetailLine(collectionDetail.value);
});

const flow = computed(() => {
  if (props.type === "sub") {
    if (props.sub.noFlow) {
      return {
        firstLine: t("subPage.subItem.noFlow"),
        secondLine: ``,
      };
    }
    const urlList = Object.keys(flows.value);
    const localOnly =
      props.sub.source === "local" &&
      !["localFirst", "remoteFirst"].includes(props.sub.mergeSources);
    if (localOnly && !props.sub.subUserinfo) return t("subPage.subItem.local");
    if (isFlowFetching.value && !urlList.includes(props.sub.url))
      return t("subPage.subItem.loading");

    const target = toRaw(
      flows.value[props.sub.url] || flows.value[props.sub.name],
    );
    if (!target) {
      return {
        firstLine: t("subPage.subItem.noRecord"),
        secondLine: ``,
      };
    }
    if (!target?.status) {
      return {
        firstLine: t("subPage.subItem.flowError"),
        secondLine: ``,
      };
    }

    if (target.status === "noFlow") {
      return {
        firstLine: t("subPage.subItem.noFlow"),
        secondLine: ``,
      };
    } else if (target.status === "success" && target.data?.usage) {
      let {
        planName,
        appUrl,
        remainingDays,
        expires,
        total,
        usage: { upload, download },
      } = target.data;
      if (target.hideExpire) expires = undefined;
      let progress = 0;
      try {
        progress = 1 - (upload + download) / total;
        progress = Number.parseFloat(progress.toFixed(2));
      } catch (e) {}
      if (!(progress > 0)) {
        progress = 0;
      }
      let secondLine: string;
      if (appearanceSetting.value.isSimpleMode) {
        secondLine = remainingDays
          ? `${remainingDays}${t("subPage.subItem.remainingDaysUnit")}`
          : "";
        const expiresInfo = !expires
          ? ""
          : `${dayjs.unix(expires).format("YYYY-MM-DD HH:mm")}`;
        if (expiresInfo) {
          secondLine = secondLine
            ? `${secondLine} | ${expiresInfo}`
            : expiresInfo;
        }
        return {
          planName,
          appUrl,
          firstLine: `${getString(
            target.showRemaining
              ? total - upload - download
              : upload + download,
            total,
            "B",
          )}`,
          secondLine,
          progress,
        };
      } else {
        secondLine = remainingDays
          ? `${t("subPage.subItem.remainingDays")}: ${remainingDays}${t(
              "subPage.subItem.remainingDaysUnit",
            )}`
          : "";
        let expiresInfo = !expires
          ? t("subPage.subItem.noExpiresInfo")
          : `${t("subPage.subItem.expires")}: ${dayjs
              .unix(expires)
              .format("YYYY-MM-DD HH:mm")}`;
        if (target.hideExpire) {
          expiresInfo = "";
        }
        if (expiresInfo) {
          secondLine = secondLine
            ? `${secondLine} | ${expiresInfo}`
            : expiresInfo;
        }
        return {
          planName,
          appUrl,
          firstLine: `${t(
            target.showRemaining
              ? "subPage.subItem.showRemainingFlow"
              : "subPage.subItem.flow",
          )}: ${getString(
            target.showRemaining
              ? total - upload - download
              : upload + download,
            total,
            "B",
          )}`,
          secondLine,
          progress,
        };
      }
    } else if (target?.status === "failed") {
      if (target.error.code === "NO_FLOW_INFO") {
        return {
          firstLine: t("subPage.subItem.noFlowInfo"),
          secondLine: ``,
        };
      } else {
        return {
          firstLine: `⚠️ ${target.error?.type}`,
          secondLine: `${target.error?.message}`,
        };
      }
    }
    return {
      firstLine: t("subPage.subItem.noFlowInfo"),
      secondLine: ``,
    };
  }
});
const simpleSubDetailLine = computed(() => {
  if (props.type !== "sub") {
    return "";
  }

  if (typeof flow.value === "string") {
    return appendRemarkToSimpleDetailLine(flow.value);
  }

  const baseLine = flow.value.secondLine
    ? `${flow.value.firstLine} · ${flow.value.secondLine}`
    : flow.value.firstLine;

  return appendRemarkToSimpleDetailLine(baseLine);
});
const nonSimpleLineTitle = computed(() => {
  return props.type === "sub" && typeof flow.value === "object"
    ? flow.value.planName
    : undefined;
});
const nonSimplePrimaryLine = computed(() => {
  if (props.type === "collection") {
    return collectionDetail.value;
  }

  if (typeof flow.value === "string") {
    return flow.value;
  }

  return flow.value.firstLine;
});
const nonSimpleSecondLine = computed(() => {
  if (props.type === "collection") {
    return remarkText.value;
  }

  if (typeof flow.value === "string") {
    return remarkText.value;
  }

  return [flow.value.secondLine, remarkText.value].filter(Boolean).join(" · ");
});

const closeCompare = () => {
  document.querySelector("html").style["overflow-y"] = "";
  document.querySelector("html").style.height = "";
  document.body.style.height = "";
  document.body.style["overflow-y"] = "";
  (document.querySelector("#app") as HTMLElement).style["overflow-y"] = "";
  (document.querySelector("#app") as HTMLElement).style.height = "";

  compareTableIsVisible.value = false;

  window.scrollTo({
    top: scrollTop,
    behavior: "instant" as any,
  });

  router.back();
};

const appOpenBtnVisible = computed(() => {
  return (
    props.type === "sub" && typeof flow.value === "object" && flow.value?.appUrl
  );
});

const itemMenuVisible = ref(false);



const openAppUrl = () => {
  console.log("flow", flow.value);
  if (typeof flow.value === "object" && flow.value?.appUrl) {
    window.open(flow.value.appUrl);
  }
};

const fetchCompareData = async (data?: any, isCurrent = () => true) => {
  Toast.loading("生成节点对比中...", {
    id: "compare",
    cover: true,
    duration: 1500,
  });
  try {
    const res = await subsApi.compareSub(
      props.type,
      data ?? props.sub ?? props.collection,
    );
    if (res?.data?.status === "success") {
      return res.data.data;
    } else {
      return null;
    }
  } catch (e) {
    console.error(e);
    return null;
  } finally {
    if (isCurrent()) await refreshSubFlowsIfNeeded();
    Toast.hide("compare");
  }
};

const openComparePanel = () => {
    if (isDesktop.value) {
      usePreviewSession().open({ kind: "nodes", source: { type: props.type, name }, name, returnPath: route.fullPath, data: compareData.value, refresh: refreshCompare });
      void router.push({ path: "/preview/workspace", query: { sourceType: props.type, sourceName: name } });
      return;
    }
  scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
  globalStore.setSavedPositions(route.path, { left: 0, top: scrollTop });

  document.querySelector("html").style["overflow-y"] = "hidden";
  document.querySelector("html").style.height = "100%";
  document.body.style.height = "100%";
  document.body.style["overflow-y"] = "hidden";
  (document.querySelector("#app") as HTMLElement).style["overflow-y"] = "hidden";
  (document.querySelector("#app") as HTMLElement).style.height = "100%";

  compareTableIsVisible.value = true;
};

const compareSub = async () => {
  const isCurrent = beginPreviewRequest();
  const data = await fetchCompareData(undefined, isCurrent);
  if (!isCurrent()) return;
  compareData.value = data;
  openComparePanel();
};

const refreshCompare = async (isCurrent = () => true) => {
  try {
    // 重新获取最新订阅/组合订阅信息
    const type = props.type === 'collection' ? 'collection' : 'sub';
    const infoRes = await subsApi.getOne(type, name);
    if (!isCurrent()) return;
    const latestData = (infoRes?.data?.status === 'success' ? infoRes.data.data : null) ?? (props.sub ?? props.collection);
    const data = await fetchCompareData(latestData, isCurrent);
    if (!isCurrent()) return;
    compareData.value = data;
    // 同步更新 store，使进入编辑器时数据一致
    subsStore.setOneData(props.type === 'collection' ? 'collections' : 'subs', name, latestData);
    return data;
  } catch (e) {
    if (!isCurrent()) return;
    console.error(e);
    compareData.value = null;
    Toast.hide("compare");
    return null;
  }
};





const isArchiveEnabled = computed(() => {
  return env.value?.feature?.archive;
});

const onDeleteConfirm = async (mode: DeleteMode = "permanent") => {
  await subsStore.deleteSub(props.type, name, mode);
  // Notify.danger(t('subPage.deleteSub.succeedNotify'), { duration: 1500 });
};






// 增加延迟防止打开时 触发不了






const openPreviewPanel = () => {
  if (isDesktop.value) {
    void router.push({ path: "/preview/targets", query: { name, displayName, type: props.type } });
    return;
  }

  Dialog({
    title: t("subPage.previewTitle"),
    content: createVNode(PreviewPanel, {
      name,
      displayName,
      type: props.type,
      general: t("subPage.panel.general"),
      notify: t(`subPage.copyNotify.${shareBtnVisible.value ? "succeedWithShare" : "succeed"}`),
      includeUnsupportedProxyLabel: t("subPage.panel.options.includeUnsupportedProxy"),
      prettyYamlLabel: t("subPage.panel.options.prettyYaml"),
      noFlowLabel: t("subPage.panel.options.noFlow"),
      displayPreviewInWebPageLabel: t("moreSettingPage.displayPreviewInWebPage"),
      tipsTitle: t(`subPage.panel.tips.title`),
      tipsContent: `${t("subPage.panel.tips.content")}\n${t(
        "syncPage.addArtForm.includeUnsupportedProxy.tips.content",
      )}`,
      desc: t(`subPage.panel.tips.desc`),
      tipsOkText: t(`subPage.panel.tips.ok`),
      tipsCancelText: t(`subPage.panel.tips.cancel`),
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
const shareBtnVisible = computed(() => {
  return env.value?.feature?.share;
});



const onClickShareLink = async () => {
  const type = props.type;
  const data = props.type === "sub" ? props.sub : props.collection;
  emit("share", data, type);
};
const onClickCopyConfig = async () => {
  // 移除 swipeController() 调用，保持左滑状态
  let data: Sub | Collection;
  switch (props.type) {
    case "sub":
      data = JSON.parse(JSON.stringify(toRaw(props.sub)));
      break;
    case "collection":
      data = JSON.parse(JSON.stringify(toRaw(props.collection)));
      break;
  }
  data.name += `-copy${~~(Math.random() * 10000)}`;

  Toast.loading(t("subPage.copyConfigNotify.loading"), { id: "copyConfig" });
  await subsApi.createSub(`${props.type}s`, data);
  await subsStore.fetchSubsData();
  Toast.hide("copyConfig");
  showNotify({ title: t("subPage.copyConfigNotify.succeed") });
};
const onClickExport = async () => {
  Toast.loading(t("subPage.exportConfigNotify.loading"), { id: "exportConfig" });
  try {
    downloadBlobResponse(
      await subsApi.exportOne(props.type, name),
      `sub-store_${props.type}_${name}.json`,
    );
    showNotify({ title: t("subPage.exportConfigNotify.succeed") });
  } catch (e) {
    console.error(e);
    showNotify({
      type: "danger",
      title: t("subPage.exportConfigNotify.failed", {
        e: e instanceof Error ? e.message : e,
      }),
    });
  } finally {
    Toast.hide("exportConfig");
  }
};

const onClickEdit = () => {
  router.push(`/edit/${props.type}s/${encodeURIComponent(name)}`);
};

const onClickDelete = () => {
  openManagedDeleteDialog({
    enabled: isArchiveEnabled.value,
    managedTitle: t("archivePage.liveDelete.title"),
    managedContent: t("archivePage.liveDelete.desc", { displayName }),
    managedCancelText: t("archivePage.liveDelete.btn.archive"),
    managedOkText: t("archivePage.liveDelete.btn.permanent"),
    legacyTitle: t("subPage.deleteSub.title"),
    legacyContent: t("subPage.deleteSub.desc", { displayName }),
    legacyCancelText: t("subPage.deleteSub.btn.cancel"),
    legacyOkText: t("subPage.deleteSub.btn.confirm"),
    onArchive: () => onDeleteConfirm("archive"),
    onPermanent: () => onDeleteConfirm("permanent"),
  });
};

const onClickCopyLink = async () => {
  const url = `${host.value}/download/${
    props.type === "collection" ? "collection/" : ""
  }${encodeURIComponent(name)}`;

  try {
    await copyText(url);
    showNotify({ title: t(`subPage.copyNotify.${shareBtnVisible.value ? "succeedWithShare" : "succeed"}`) });
  } catch (error) {
    Toast.fail(t("subPage.copyNotify.failed", { e: error?.message ?? String(error) }));
  }
};

const onClickRefresh = async () => {
  Toast.loading(t("globalNotify.refresh.loading"), {
    cover: true,
    id: "refresh",
  });
  try {
    await subsApi.downloadOne(name, { noCache: true });
  } catch (e) {
    console.error(e);
  }
  await refreshSubFlowsIfNeeded()
  Toast.hide("refresh");
  showNotify({ title: t("globalNotify.refresh.succeed") });
};

const refreshSubFlowsIfNeeded = async () => {
  if (!props.sub) return
  try {
    await subsStore.fetchFlows([props.sub])
  } catch (e) {
    console.error(e)
  }
}
</script>
