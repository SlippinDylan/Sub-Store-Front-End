<template>
  <div
    class="sub-item-wrapper archives-item-wrapper"
    :class="{ disabled: props.disabled, 'is-dual-column': props.isDualColumn }"
    :style="{ padding: itemPadding }"
  >
    <div
      class="sub-img-wrappers"
      :style="{ 'margin-top': appearanceSetting.isSimpleMode ? '5px' : '0' }"
    >
      <div
        class="archives-item-icon"
        :class="{
          simple: appearanceSetting.isSimpleMode,
          'is-dual-column': props.isDualColumn,
        }"
      >
        <img
          :src="displayItemIcon"
          alt=""
          :style="{
            opacity: isIconColor ? 1 : 0.8,
            filter: isIconColor ? 'none' : 'brightness(1)',
            objectFit: itemIconFit,
          }"
        />
      </div>
    </div>
    <div class="sub-item-content archives-item-content">
      <div class="workspace-row-identity">
        <div class="sub-item-title-wrapper">
          <h3 class="sub-item-title archives-item-title" :title="displayName">
            <span class="sub-item-name">{{ displayName }}</span>
            <span v-for="item in tags" :key="item" class="tag">
              <TagChip>{{ item }}</TagChip>
            </span>
          </h3>
        </div>
        <p v-if="detailLineWithInlineRemark" class="sub-item-detail">
          {{ detailLineWithInlineRemark }}
        </p>
        <p v-if="archiveTimeLine" class="sub-item-detail">
          {{ archiveTimeLine }}
        </p>
        <p
          v-if="remark && !shouldInlineRemarkInSecondLine"
          class="sub-item-remark"
        >
          {{ remark }}
        </p>
      </div>
      <div class="workspace-row-actions" @click.stop>
        <UButton :size="isDesktop ? 'sm' : 'xs'"
          type="button"
          :disabled="props.disabled"
          @click.stop="emit('restore', props.data)"
          title="恢复"
         color="neutral" variant="outline">
          <UIcon mode="svg" class="size-4 shrink-0 align-middle" name="i-lucide-undo-2" /><span>恢复</span>
        </UButton>
        <UButton :size="isDesktop ? 'sm' : 'xs'"
          type="button"
          class="danger"
          :disabled="props.disabled"
          @click.stop="emit('delete', props.data)"
          title="永久删除"
         color="error" variant="soft">
          <UIcon mode="svg" class="size-4 shrink-0 align-middle" name="i-lucide-trash-2" /><span
            >永久删除</span
          >
        </UButton>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useMediaQuery } from "@vueuse/core";
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';

import logoIcon from '@/assets/icons/logo.png';
import logoRedIcon from '@/assets/icons/logo-red.png';
import { useSettingsStore } from '@/store/settings';
import { useSubsStore } from '@/store/subs';
import { resolveArtifactIcon } from '@/utils/artifactIcon';
import { createGithubProxyUrlRewriter } from '@/utils/githubProxy';
import { resolveImageFit } from '@/utils/iconFit';
import { isShareType, resolveShareDisplayIconState } from '@/utils/share';
import {
  formatArchiveTime,
  getArchiveEntryDisplayName,
  getArchiveTypeLabelKey,
} from '@/utils/archive';
const isDesktop = useMediaQuery("(min-width: 768px)");

const props = defineProps<{
  data: ArchiveEntry;
  disabled?: boolean;
  isDualColumn?: boolean;
}>();

const emit = defineEmits(['restore', 'delete']);

const { t } = useI18n();
const settingsStore = useSettingsStore();
const subsStore = useSubsStore();
const { appearanceSetting, githubProxy, githubProxyRegex } = storeToRefs(settingsStore);
const itemPadding = computed(() => {
  if (appearanceSetting.value.isSimpleMode) return '10px 12px';
  return props.isDualColumn ? '12px' : '14px 16px';
});

const displayName = computed(() => getArchiveEntryDisplayName(props.data));
const remark = computed(() => props.data?.remark || '');
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
const tags = computed(() => props.data?.tag || []);
const itemType = computed(() => props.data?.itemType);
const shareType = computed(() => props.data?.shareType);
const archivedAt = computed(() => formatArchiveTime(props.data?.archivedAt));
const icon = computed(() => {
  return appearanceSetting.value.isDefaultIcon ? logoIcon : logoRedIcon;
});
const shareSnapshot = computed(() => {
  return itemType.value === 'share' ? props.data?.snapshot : null;
});
const shareSourceType = computed(() => {
  const snapshotType = shareSnapshot.value?.type;
  if (isShareType(snapshotType)) {
    return snapshotType;
  }
  return isShareType(shareType.value) ? shareType.value : null;
});
const shareSourceName = computed(() => {
  return typeof shareSnapshot.value?.name === 'string'
    ? shareSnapshot.value.name
    : '';
});
const shareSourceItem = computed(() => {
  if (!shareSourceType.value || !shareSourceName.value) {
    return null;
  }

  switch (shareSourceType.value) {
    case 'sub':
      return subsStore.getOneSub(shareSourceName.value) || null;
    case 'col':
      return subsStore.getOneCollection(shareSourceName.value) || null;
    case 'file':
      return subsStore.getOneFile(shareSourceName.value) || null;
    default:
      return null;
  }
});
const shareIconState = computed(() => {
  return resolveShareDisplayIconState({
    share: shareSnapshot.value,
    source: shareSourceItem.value,
    fallbackIcon: icon.value,
  });
});
const artifactSnapshot = computed(() => {
  return itemType.value === 'artifact' ? props.data?.snapshot : null;
});
const artifactSourceItem = computed(() => {
  if (itemType.value !== 'artifact' || !artifactSnapshot.value?.source) {
    return null;
  }

  switch (artifactSnapshot.value.type) {
    case 'collection':
      return subsStore.getOneCollection(artifactSnapshot.value.source);
    case 'subscription':
      return subsStore.getOneSub(artifactSnapshot.value.source);
    case 'file':
      return subsStore.getOneFile(artifactSnapshot.value.source);
    default:
      return null;
  }
});
const artifactSourceIcon = computed(() => {
  if (
    itemType.value !== 'artifact'
    || artifactSnapshot.value?.type !== 'file'
    || !artifactSnapshot.value?.source
  ) {
    return null;
  }

  return subsStore.getOneFile(artifactSnapshot.value.source)?.icon || null;
});
const artifactSourceType = computed(() => {
  switch (artifactSnapshot.value?.type) {
    case 'subscription':
      return t('specificWord.singleSub');
    case 'collection':
      return t('specificWord.collectionSub');
    case 'file':
      return t('specificWord.file');
    default:
      return t('specificWord.unknownType');
  }
});
const artifactSourceName = computed(() => {
  const sourceItem = artifactSourceItem.value;

  if (sourceItem) {
    return (
      sourceItem.displayName
      || sourceItem['display-name']
      || sourceItem.name
    );
  }

  return artifactSnapshot.value?.source
    ? `${artifactSnapshot.value.source}(🚫)`
    : t('specificWord.unknownSource');
});

const itemIcon = computed(() => {
  switch (itemType.value) {
    case 'sub':
      return props.data?.snapshot?.icon || icon.value;
    case 'col':
      return props.data?.snapshot?.icon || icon.value;
    case 'file':
      return props.data?.snapshot?.icon || icon.value;
    case 'artifact':
      return resolveArtifactIcon({
        artifact: artifactSnapshot.value,
        isDefaultIcon: appearanceSetting.value.isDefaultIcon,
        sourceIcon: artifactSourceIcon.value,
      });
    case 'share':
      return shareIconState.value.icon;
    default:
      return icon.value;
  }
});
const githubUrlRewriter = computed(() => {
  return createGithubProxyUrlRewriter(githubProxy.value, githubProxyRegex.value);
});
const displayItemIcon = computed(() => {
  return githubUrlRewriter.value(itemIcon.value) || itemIcon.value;
});

const isIconColor = computed(() => {
  if (itemType.value === 'share') {
    return shareIconState.value.isIconColor;
  }

  return props.data?.snapshot?.isIconColor !== false;
});
const itemIconFit = computed(() => {
  if (itemType.value === 'share') {
    return resolveImageFit(shareIconState.value.iconFit, appearanceSetting.value.iconFit);
  }

  return resolveImageFit(props.data?.snapshot?.iconFit, appearanceSetting.value.iconFit);
});

const detailParts = computed(() => {
  if (itemType.value === 'artifact') {
    return appearanceSetting.value.isSimpleMode
      ? [artifactSourceType.value, artifactSourceName.value]
      : [
          t('syncPage.detail.firstLine', {
            type: artifactSourceType.value,
            name: artifactSourceName.value,
          }),
        ];
  }

  if (
    itemType.value === 'sub'
    || itemType.value === 'col'
    || itemType.value === 'file'
  ) {
    return [];
  }

  const parts = [
    t(`specificWord.${getArchiveTypeLabelKey(itemType.value)}`),
  ];

  if (itemType.value === 'share' && shareType.value) {
    parts.push(t(`specificWord.${getArchiveTypeLabelKey(shareType.value)}`));
  }

  return parts;
});

const archiveTimeLine = computed(() => {
  return archivedAt.value
    ? t('archivePage.entry.archivedAt', {
        time: archivedAt.value,
      })
    : '';
});

const detailLine = computed(() => {
  if (
    !appearanceSetting.value.isSimpleMode
    && (
      itemType.value === 'sub'
      || itemType.value === 'col'
      || itemType.value === 'file'
    )
  ) {
    return '';
  }

  const parts = [...detailParts.value];

  if (appearanceSetting.value.isSimpleMode && archivedAt.value) {
    parts.push(archivedAt.value);
  }

  if (itemType.value === 'artifact' && appearanceSetting.value.isSimpleMode) {
    const [type, name, time] = parts;
    const sourceText = [type, name].filter(Boolean).join(' ');
    return time ? `${sourceText} · ${time}` : sourceText;
  }

  return parts.join(' · ');
});
const detailLineWithInlineRemark = computed(() => {
  if (!shouldInlineRemarkInSecondLine.value) {
    return detailLine.value;
  }

  return [detailLine.value, remark.value].filter(Boolean).join(" · ");
});
const nonSimplePrimaryLine = computed(() => {
  return detailLine.value || archiveTimeLine.value;
});
const nonSimpleSecondLine = computed(() => {
  if (!detailLine.value) {
    return remark.value;
  }

  return [archiveTimeLine.value, remark.value].filter(Boolean).join(" · ");
});
</script>
