<template>
  <!-- 滚动内容 -->
  <div class="resource-row">
    <div
      class="sub-item-wrapper"
      :class="{ 'is-dual-column': props.isDualColumn }"
      :style="{ padding: itemPadding, '--icon-fit': iconFit }"
      @click="handleContentClick"
    >
      <div
        @click.stop="previewFile"
        class="sub-img-wrappers"
        :style="{ 'margin-top': imageMarginTop }"
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
          <p v-if="typeof flow === 'string'" class="sub-item-detail">
            {{ flow }}
          </p>
          <p v-if="remark" class="sub-item-remark">{{ remarkText }}</p>
        </div>
        <div class="workspace-row-actions" @click.stop>
          <UButton :size="isDesktop ? 'sm' : 'xs'"
            type="button"
            :disabled="props.disabled"
            @click.stop="previewFile"
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
            @click.stop="onClickExportFile(name)"
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

  <FilePreview
    v-if="filePreviewIsVisible"
    :name="name"
    :previewData="previewData"
    :show-refresh="true"
    @closePreview="closePreview"
    @refresh="refreshPreview"
  />
</template>

<script lang="ts" setup>
import { usePreviewSession } from "@/store/previewSession";
import { usePreviewRequest } from "@/hooks/usePreviewRequest";
import { useMediaQuery } from "@vueuse/core";
const handleContentClick = (event: MouseEvent) => { event.stopPropagation(); previewFile(); };
  import { useSubsApi } from '@/api/subs';
  import { useFilesApi } from '@/api/files';
  import logoIcon from '@/assets/icons/logo.png';
  import logoRedIcon from '@/assets/icons/logo-red.png';
  import { usePopupRoute } from '@/hooks/usePopupRoute';
  import { useAppNotifyStore } from '@/store/appNotify';
  import { useGlobalStore } from '@/store/global';
  import { useSettingsStore } from '@/store/settings';
  import { useSubsStore } from '@/store/subs';
  import { getString } from '@/utils/flowTransfer';
  import { createGithubProxyUrlRewriter } from '@/utils/githubProxy';
  import { resolveImageFit } from '@/utils/iconFit';

  import { openManagedDeleteDialog } from '@/utils/archive';
  import FilePreview from '@/views/FilePreview.vue';
  import { Dialog, Toast } from '@/services/feedback';
  import dayjs from 'dayjs';
  import { storeToRefs } from 'pinia';
  import { computed, ref, toRaw } from 'vue';
  import { copyText } from '@/utils/clipboard';
  import { useI18n } from 'vue-i18n';
  import { useRouter, useRoute } from 'vue-router';
  import { useHostAPI } from '@/hooks/useHostAPI';
  import { useBackend } from "@/hooks/useBackend";
  import clashmetaIcon from '@/assets/icons/clashmeta_color.png';
  import { isMihomoConfigFileType } from "@/utils/fileType";
  import { formatPreviewError } from "@/utils/previewError";
  import { downloadBlobResponse } from '@/utils/download';
const isDesktop = useMediaQuery("(min-width: 768px)");

  const { t } = useI18n();
  const { env } = useBackend();
  const isArchiveEnabled = computed(() => {
    return env.value?.feature?.archive;
  });

  const props = defineProps<{
    type: 'sub' | 'collection' | 'file';
    file?: any;
    sub?: Sub;
    collection?: Collection;
    disabled?: boolean;
    isDualColumn?: boolean;
  }>();
  // console.log('props.disabled')
  // console.log(props.disabled)
  let scrollTop = 0;
  const filePreviewIsVisible = ref(false);
  usePopupRoute(filePreviewIsVisible);
  const previewData = ref();

  const compareData = ref();
  const router = useRouter();
  const route = useRoute();
const beginPreviewRequest = usePreviewRequest();
  const globalStore = useGlobalStore();
  const settingsStore = useSettingsStore();
  const subsStore = useSubsStore();
  const subsApi = useSubsApi();
  const filesApi = useFilesApi();
  const { appearanceSetting, githubProxy, githubProxyRegex } = storeToRefs(settingsStore);
  const {
    isFlowFetching,
    // isSimpleMode,
    // isLeftRight,
    // isIconColor,
    // isSimpleReicon,
    // isDefaultIcon
  } = storeToRefs(globalStore);

  const displayName =
    props[props.type].displayName || props[props.type]['display-name'] || props[props.type].name;

  const name = props[props.type].name;
  const tag = props[props.type].tag;
  const remark = props[props.type].remark;
  const remarkText = computed(() => {
    if (remark) {
      return remark;
    } else {
      return "";
    }
  })
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
    if (isMihomoConfigFileType(props.file.type)) return clashmetaIcon;
    return appearanceSetting.value.isDefaultIcon ? logoIcon : logoRedIcon;
  })
  const avatarSize = computed(() => {
    if (appearanceSetting.value.isSimpleMode) return '36';
    return props.isDualColumn ? '40' : '48';
  });
  const itemPadding = computed(() => {
    if (appearanceSetting.value.isSimpleMode) return '9px';
    return props.isDualColumn ? '12px' : '16px';
  });
  const imageMarginTop = computed(() => {
    if (appearanceSetting.value.isSimpleMode) return '5px';
    return props.isDualColumn ? '2px' : '0';
  });
  const titleActionTop = computed(() => {
    if (appearanceSetting.value.isSimpleMode) return '8px';
    return props.isDualColumn ? '2px' : '0';
  });
  const githubUrlRewriter = computed(() => {
    return createGithubProxyUrlRewriter(githubProxy.value, githubProxyRegex.value);
  });
  const rewriteGithubUrl = (url?: string | null) => {
    return githubUrlRewriter.value(url);
  };
  const isIconColor = computed(() => {
    return props.file.isIconColor !== false;
  });
  const iconFit = computed(() => {
    return resolveImageFit(props.file.iconFit, appearanceSetting.value.iconFit);
  });

  const collectionDetail = computed(() => {
    const nameList = props?.collection.subscriptions || [];
    if (nameList.length === 0) {
      return t('subPage.collectionItem.noSub');
    } else {
      const displayNameList = nameList.map(name => {
        const sub = subsStore.getOneSub(name);
        return sub?.displayName || sub?.['display-name'] || sub.name || `${name}(🚫)`;
      });
      return `${t('subPage.collectionItem.contain')}：${displayNameList.join(
        '、'
      )}`;
    }
  });

  const flow = computed(() => {
    if (isMihomoConfigFileType(props.file.type)) return t('filePage.type.mihomoConfig');
    if (props.file.source === 'remote') return t('filePage.source.remote');
    return t('filePage.source.local');
  });
  const simpleDetailLine = computed(() => {
    if (!shouldInlineRemarkInSecondLine.value) {
      return flow.value;
    }

    return [flow.value, remarkText.value].filter(Boolean).join(" · ");
  });
  const nonSimpleSecondLine = computed(() => {
    return remarkText.value;
  });

  const closePreview = () => {
    document.querySelector('html').style['overflow-y'] = '';
    document.querySelector('html').style.height = '';
    document.body.style.height = '';
    document.body.style['overflow-y'] = '';
    (document.querySelector('#app') as HTMLElement).style['overflow-y'] = '';
    (document.querySelector('#app') as HTMLElement).style.height = '';

    filePreviewIsVisible.value = false;

    window.scrollTo({
        top: scrollTop,
        behavior: "instant" as any,
    });

    router.back();
  };

  const doPreview = async (fileData: any) => {
    Toast.loading('生成中...', { id: 'compare', cover: true, duration: 1500 });
    try {
      const res = await subsApi.compareSub('file', fileData);
      if (res?.data?.status === 'success') {
        return res.data.data;
      } else {
        return { processed: formatPreviewError(res) };
      }
    } catch (e) {
      console.error(e);
      return { processed: formatPreviewError(e) };
    } finally {
      Toast.hide('compare');
    }
  };

  const openPreviewPanel = () => {
    if (isDesktop.value) {
      usePreviewSession().open({ kind: "file", source: { type: "file", name }, name, returnPath: route.fullPath, data: previewData.value, refresh: refreshPreview });
      void router.push({ path: "/preview/workspace", query: { sourceType: "file", sourceName: name } });
      return;
    }
    scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    globalStore.setSavedPositions(route.path, { left: 0, top: scrollTop });

    document.querySelector('html').style['overflow-y'] = 'hidden';
    document.querySelector('html').style.height = '100%';
    document.body.style.height = '100%';
    document.body.style['overflow-y'] = 'hidden';
    (document.querySelector('#app') as HTMLElement).style['overflow-y'] = 'hidden';
    (document.querySelector('#app') as HTMLElement).style.height = '100%';

    filePreviewIsVisible.value = true;
  };

  const previewFile = async () => {
    const isCurrent = beginPreviewRequest();
    const data = await doPreview(props.file);
    if (!isCurrent()) return;
    previewData.value = data;
    openPreviewPanel();
  };

  const refreshPreview = async (isCurrent = () => true) => {
    try {
      const fileRes = await filesApi.getWholeFile(name);
      if (!isCurrent()) return;
      const latestFile = (fileRes?.data?.status === 'success' ? fileRes.data.data : null) ?? props.file;
      const data = await doPreview(latestFile);
      if (!isCurrent()) return;
      previewData.value = data;
      // 同步更新 store，使进入编辑器时数据一致
      subsStore.setOneData('files', name, latestFile);
      return data;
    } catch (e) {
      if (!isCurrent()) return;
      console.error(e);
      previewData.value = { processed: formatPreviewError(e) };
      Toast.hide('compare');
      return previewData.value;
    }
  };














  const onDeleteConfirm = async (mode: DeleteMode = 'permanent') => {
    await subsStore.deleteFile(name, mode);
    // Notify.danger(t('subPage.deleteSub.succeedNotify'), { duration: 1500 });
  };




  const onClickCopyConfig = async () => {
    const data = JSON.parse(JSON.stringify(toRaw(props.file)));
    data.name += `-copy${~~(Math.random() * 10000)}`;

    Toast.loading(t('subPage.copyConfigNotify.loading'), { id: 'copyConfig' });
    await filesApi.createFile(data);
    await subsStore.fetchSubsData();
    Toast.hide('copyConfig');
    showNotify({ title: t('subPage.copyConfigNotify.succeed') });
  };

  const onClickEdit = () => {
    router.push(`/edit/${props.type}s/${encodeURIComponent(name)}`);
  };

  const onClickDelete = () => {
    openManagedDeleteDialog({
      enabled: isArchiveEnabled.value,
      managedTitle: t('archivePage.liveDelete.title'),
      managedContent: t('archivePage.liveDelete.desc', { displayName }),
      managedCancelText: t('archivePage.liveDelete.btn.archive'),
      managedOkText: t('archivePage.liveDelete.btn.permanent'),
      legacyTitle: t('subPage.deleteSub.title'),
      legacyContent: t('subPage.deleteSub.desc', { displayName }),
      legacyCancelText: t('subPage.deleteSub.btn.cancel'),
      legacyOkText: t('subPage.deleteSub.btn.confirm'),
      onArchive: () => onDeleteConfirm('archive'),
      onPermanent: () => onDeleteConfirm('permanent'),
    });
  };

  const { showNotify } = useAppNotifyStore();
  const { currentUrl: host } = useHostAPI();
  const emit = defineEmits(["share"]);

  const shareBtnVisible = computed(() => {
    return env.value?.feature?.share;
  });

  const onClickExportFile = async (name: string) => {
    Toast.loading(t('subPage.exportConfigNotify.loading'), { id: 'exportConfig' });
    try {
      downloadBlobResponse(
        await filesApi.exportFile(name),
        `sub-store_file_${name}.json`,
      );
      showNotify({ title: t('subPage.exportConfigNotify.succeed') });
    } catch (e) {
      console.error(e);
      showNotify({
        type: 'danger',
        title: t('subPage.exportConfigNotify.failed', {
          e: e instanceof Error ? e.message : e,
        }),
      });
    } finally {
      Toast.hide('exportConfig');
    }
  };

  const onClickShareLink = async () => {
    console.log('props', props)
    const type = props.type;
    const data = props.file;
    emit("share", data, type);
  };
  const onClickCopyLink = async () => {
    const path = `/api/file/${encodeURIComponent(name)}`;
    const url = `${host.value}${path}`;

    try {
      await copyText(url);
      showNotify({ title: t('filePage.copyNotify.succeed', { path }) });
    } catch (error) {
      Toast.fail(t("filePage.copyNotify.failed", { e: error?.message ?? String(error) }));
    }
  };


</script>
