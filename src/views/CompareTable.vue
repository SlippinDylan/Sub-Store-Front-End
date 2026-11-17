<template>
  <PreviewFrame
    v-if="!pageMode || !nodeInfoIsVisible"
    :page-mode="pageMode"
    :title="displayName || $t(`comparePage.title`)"
    @close="clickClose"
  >
    <template #actions>
      <UButton
        size="sm"
        v-if="showRefresh"
        :loading="loading"
        type="button"
        class="workspace-button"
        icon="i-lucide-refresh-cw"
        @click="emit('refresh')"
        color="neutral"
        variant="outline"
      >
        刷新
      </UButton>
      <UButton
        size="sm"
        type="button"
        class="workspace-button"
        icon="i-lucide-scroll-text"
        @click="openLogsOverlay"
        color="neutral"
        variant="outline"
      >
        运行日志
      </UButton>
    </template>
    <div
      class="compare-page-wrapper"
      :class="{ 'compare-page-standalone': pageMode }"
    >
      <FieldInput
        v-if="pageMode"
        v-model="search"
        left-icon="i-lucide-search"
        :placeholder="$t('workspace.search')"
        :aria-label="$t('workspace.search')"
        clearable
      />
      <PreviewNodesTable
        v-if="pageMode"
        v-model="activeNodeTab"
        :original="originalData"
        :processed="processedData"
        :search="search"
        :before-visible="isOriginalVisible"
        :after-visible="isProcessedVisible"
        :format-endpoint="formatNodeEndpoint"
        @toggle-before="toggleOriginalVisible"
        @toggle-after="toggleProcessedVisible"
        @node-names="openNodeNamesDialog"
        @select="openNodeInfoPanel"
      />
      <div v-else class="compare-page-body">
        <div class="block-wrapper">
          <!--块标题-->
          <div class="sticky-title-wrapperse compare-title">
            <p>
              {{ $t(`comparePage.remain.title`) }}({{ remainDesc }})
              <small
                v-if="filteredOriginalData.length > 0"
                @click="goToFilterRef"
              >
                {{ $t(`comparePage.filter.title`) }}({{ filterDesc }})
              </small>
            </p>
          </div>

          <!--指示器说明-->
          <div class="compare-des">
            <span class="indicator-group">
              <UButton
                size="sm"
                type="button"
                :aria-disabled="!hasOriginalData"
                :aria-pressed="isOriginalVisible"
                :title="
                  !hasOriginalData
                    ? $t('comparePage.remain.indicatorDisabledTips', {
                        side: $t('comparePage.remain.beforeIndicator'),
                      })
                    : ''
                "
                :class="[
                  'original-item',
                  'indicator',
                  !hasOriginalData && 'is-disabled',
                  isOriginalVisible ? 'is-active' : 'is-inactive',
                ]"
                @click="toggleOriginalVisible"
                color="neutral"
                variant="outline"
              >
                {{ $t(`comparePage.remain.beforeIndicator`) }}
              </UButton>
              <UButton
                size="sm"
                type="button"
                :aria-disabled="!hasOriginalData"
                :class="[
                  'node-names-action',
                  !hasOriginalData && 'is-disabled',
                ]"
                :title="
                  !hasOriginalData
                    ? $t('comparePage.remain.indicatorDisabledTips', {
                        side: $t('comparePage.remain.beforeIndicator'),
                      })
                    : $t('comparePage.nodeNames.entry')
                "
                @click.stop="openNodeNamesDialog('before')"
                color="neutral"
                variant="outline"
              >
                <UIcon
                  mode="svg"
                  class="size-4 shrink-0 align-middle"
                  name="i-lucide-copy"
                />
                {{ $t("comparePage.nodeNames.entry") }}
              </UButton>
            </span>

            <span class="indicator-group">
              <UButton
                size="sm"
                type="button"
                :aria-disabled="!hasProcessedData"
                :aria-pressed="isProcessedVisible"
                :title="
                  !hasProcessedData
                    ? $t('comparePage.remain.indicatorDisabledTips', {
                        side: $t('comparePage.remain.afterIndicator'),
                      })
                    : ''
                "
                :class="[
                  'processed-item',
                  'indicator',
                  !hasProcessedData && 'is-disabled',
                  isProcessedVisible ? 'is-active' : 'is-inactive',
                ]"
                @click="toggleProcessedVisible"
                color="neutral"
                variant="outline"
              >
                {{ $t(`comparePage.remain.afterIndicator`) }}
              </UButton>
              <UButton
                size="sm"
                type="button"
                :aria-disabled="!hasProcessedData"
                :class="[
                  'node-names-action',
                  !hasProcessedData && 'is-disabled',
                ]"
                :title="
                  !hasProcessedData
                    ? $t('comparePage.remain.indicatorDisabledTips', {
                        side: $t('comparePage.remain.afterIndicator'),
                      })
                    : $t('comparePage.nodeNames.entry')
                "
                @click.stop="openNodeNamesDialog('after')"
                color="neutral"
                variant="outline"
              >
                <UIcon
                  mode="svg"
                  class="size-4 shrink-0 align-middle"
                  name="i-lucide-copy"
                />
                {{ $t("comparePage.nodeNames.entry") }}
              </UButton>
            </span>
          </div>

          <!--表格标题-->
          <ul class="compare-table-head">
            <li v-for="title in titleList" :key="title">
              {{ $t(`comparePage.tableHead.${title}`) }}
            </li>
          </ul>

          <!--表格内容-->
          <table
            class="compare-table-body"
            :class="{
              'compare-table-body--paired':
                isProcessedVisible && isOriginalVisible,
            }"
          >
            <template v-for="[processed, original] in data" :key="processed.id">
              <tr
                v-if="isProcessedVisible"
                class="compare-table-row processed-tr"
                role="button"
                tabindex="0"
                @keydown.enter.prevent="openNodeInfoPanel(processed)"
                @keydown.space.prevent="openNodeInfoPanel(processed)"
                :class="{
                  'processed-tr--unpaired': !hasNodeDisplayInfo(original),
                }"
                @click="openNodeInfoPanel(processed)"
              >
                <td class="processed-item">
                  <div class="name-wrapper">
                    <div>
                      <TagChip class="type-tag">{{ processed.type }}</TagChip>
                      {{ processed.name }}
                    </div>
                    <div v-if="formatNodeEndpoint(processed)">
                      {{ formatNodeEndpoint(processed) }}
                    </div>
                  </div>
                </td>
                <td>
                  <span :class="processed.udp ? 'item-true' : 'item-false'">
                    <UIcon
                      mode="svg"
                      class="size-4 shrink-0 align-middle"
                      v-if="processed.udp"
                      name="i-lucide-check"
                    />
                  </span>
                </td>
                <td>
                  <span
                    :class="
                      processed.tfo || processed['fast-open']
                        ? 'item-true'
                        : 'item-false'
                    "
                  >
                    <UIcon
                      mode="svg"
                      class="size-4 shrink-0 align-middle"
                      v-if="processed.tfo || processed['fast-open']"
                      name="i-lucide-check"
                    />
                  </span>
                </td>
                <td>
                  <span
                    :class="
                      processed['skip-cert-verify'] ? 'item-true' : 'item-false'
                    "
                  >
                    <UIcon
                      mode="svg"
                      class="size-4 shrink-0 align-middle"
                      v-if="processed['skip-cert-verify']"
                      name="i-lucide-check"
                    />
                  </span>
                </td>
                <td>
                  <span :class="processed.aead ? 'item-true' : 'item-false'">
                    <UIcon
                      mode="svg"
                      class="size-4 shrink-0 align-middle"
                      v-if="processed.aead"
                      name="i-lucide-check"
                    />
                  </span>
                </td>
              </tr>
              <tr
                v-if="isOriginalVisible && hasNodeDisplayInfo(original)"
                class="compare-table-row original-tr"
                role="button"
                tabindex="0"
                @keydown.enter.prevent="openNodeInfoPanel(original)"
                @keydown.space.prevent="openNodeInfoPanel(original)"
                @click="openNodeInfoPanel(original)"
              >
                <td class="original-item">
                  <div class="name-wrapper">
                    <div>
                      {{ original.name }}
                    </div>
                    <div v-if="formatNodeEndpoint(original)">
                      {{ formatNodeEndpoint(original) }}
                    </div>
                  </div>
                </td>
                <td>
                  <span :class="original.udp ? 'item-true' : 'item-false'">
                    <UIcon
                      mode="svg"
                      class="size-4 shrink-0 align-middle"
                      v-if="original.udp"
                      name="i-lucide-check"
                    />
                  </span>
                </td>
                <td>
                  <span
                    :class="
                      original.tfo || original['fast-open']
                        ? 'item-true'
                        : 'item-false'
                    "
                  >
                    <UIcon
                      mode="svg"
                      class="size-4 shrink-0 align-middle"
                      v-if="original.tfo || original['fast-open']"
                      name="i-lucide-check"
                    />
                  </span>
                </td>
                <td>
                  <span
                    :class="
                      original['skip-cert-verify'] ? 'item-true' : 'item-false'
                    "
                  >
                    <UIcon
                      mode="svg"
                      class="size-4 shrink-0 align-middle"
                      v-if="original['skip-cert-verify']"
                      name="i-lucide-check"
                    />
                  </span>
                </td>
                <td>
                  <span :class="original.aead ? 'item-true' : 'item-false'">
                    <UIcon
                      mode="svg"
                      class="size-4 shrink-0 align-middle"
                      v-if="original.aead"
                      name="i-lucide-check"
                    />
                  </span>
                </td>
              </tr>
            </template>
          </table>
        </div>

        <USeparator
          v-if="filteredOriginalData.length > 0"
          class="divider"
          dashed
          hairline
          :style="{
            padding: '0 16px',
          }"
        >
          {{ $t(`comparePage.divider`) }}
        </USeparator>

        <div
          ref="filterRef"
          class="block-wrapper"
          v-if="filteredOriginalData.length > 0"
        >
          <!--块标题-->
          <div class="sticky-title-wrapperse compare-title">
            <p>{{ $t(`comparePage.filter.title`) }}({{ filterDesc }})</p>
          </div>

          <!--表格标题-->
          <ul class="compare-table-head filter-table-head">
            <li v-for="title in titleList" :key="title">
              {{ $t(`comparePage.tableHead.${title}`) }}
            </li>
          </ul>

          <!--表格内容-->
          <table class="compare-table-body">
            <template v-for="node in filteredOriginalData" :key="node.id">
              <tr
                class="compare-table-row original-tr"
                role="button"
                tabindex="0"
                @keydown.enter.prevent="openNodeInfoPanel(node)"
                @keydown.space.prevent="openNodeInfoPanel(node)"
                @click="openNodeInfoPanel(node)"
              >
                <td class="original-item">
                  <div class="name-wrapper">
                    <div>
                      <TagChip class="type-tag">{{ node.type }}</TagChip>
                      {{ node.name }}
                    </div>
                    <div v-if="formatNodeEndpoint(node)">
                      {{ formatNodeEndpoint(node) }}
                    </div>
                  </div>
                </td>
                <td>
                  <span :class="node.udp ? 'item-true' : 'item-false'">
                    <UIcon
                      mode="svg"
                      class="size-4 shrink-0 align-middle"
                      v-if="node.udp"
                      name="i-lucide-check"
                    />
                  </span>
                </td>
                <td>
                  <span :class="node.tfo ? 'item-true' : 'item-false'">
                    <UIcon
                      mode="svg"
                      class="size-4 shrink-0 align-middle"
                      v-if="node.tfo"
                      name="i-lucide-check"
                    />
                  </span>
                </td>
                <td>
                  <span
                    :class="
                      node['skip-cert-verify'] ? 'item-true' : 'item-false'
                    "
                  >
                    <UIcon
                      mode="svg"
                      class="size-4 shrink-0 align-middle"
                      v-if="node['skip-cert-verify']"
                      name="i-lucide-check"
                    />
                  </span>
                </td>
                <td>
                  <span :class="node.aead ? 'item-true' : 'item-false'">
                    <UIcon
                      mode="svg"
                      class="size-4 shrink-0 align-middle"
                      v-if="node.aead"
                      name="i-lucide-check"
                    />
                  </span>
                </td>
              </tr>
            </template>
          </table>
        </div>
      </div>
    </div>

    <NodeInfoPanel
      :key="nodeInfoPanelKey"
      :ipApi="ipApi"
      :ip-api-status="ipApiStatus"
      :nodeInfo="nodeInfo"
      v-if="nodeInfoIsVisible && !pageMode"
      @close="closeNodeInfoPanel"
      @retry="retryLoadIpApi"
    />
    <PreviewNodeNamesDialog
      v-if="nodeNamesDialogVisible"
      :side="nodeNamesDialogSide"
      :node-infos="activeNodeInfos"
      @close="closeNodeNamesDialog"
    />
  </PreviewFrame>
  <NodeInfoPanel
    v-if="pageMode && nodeInfoIsVisible"
    :key="nodeInfoPanelKey"
    :ip-api="ipApi"
    :ip-api-status="ipApiStatus"
    :node-info="nodeInfo"
    page-mode
    @close="closeNodeInfoPanel"
    @retry="retryLoadIpApi"
  />
</template>


<script lang="ts" setup>
import PreviewNodesTable from "@/components/PreviewNodesTable.vue";
import PreviewFrame from "@/components/PreviewFrame.vue";
  import { useSubsApi } from '@/api/subs';
  import NodeInfoPanel from '@/components/NodeInfoPanel.vue';
  import PreviewNodeNamesDialog from '@/components/PreviewNodeNamesDialog.vue';
  import { useLogsOverlayStore } from '@/store/logsOverlay';
  import { useSubsStore } from '@/store/subs';
  import { extractPreviewNodeInfos, PreviewNodeNameSide } from '@/utils/previewNodeNames';
  import { computed, ref, toRaw, watch } from 'vue';
  import { useRoute, useRouter } from 'vue-router';

  const route = useRoute();
  const router = useRouter();
  const { getSubInfo } = useSubsApi();
  const logsOverlayStore = useLogsOverlayStore();
  const subsStore = useSubsStore();
  const props = defineProps<{
    compareData: any;
    name: string;
    showRefresh?: boolean;
    pageMode?: boolean;
    loading?: boolean;
  }>();

  const showRefresh = computed(() => props.showRefresh !== false);

  const titleList = ['name', 'udp', 'tfo', 'skip-cert-verify', 'aead'];

  const emit = defineEmits(['closeCompare', 'refresh']);

  const filterRef = ref(null);
  const isOriginalVisible = ref(false);
  const isProcessedVisible = ref(true);

  const nodeInfoIsVisible = ref(false);
  const nodeInfoPanelKey = ref(0);
  const ipApi = ref<IpApiData>(null);
  const ipApiStatus = ref<NodeInfoIpApiStatus>('idle');
  const nodeInfo = ref<NodeInfo>(null);
  const currentIpApiRequestId = ref(0);
  const nodeNamesDialogVisible = ref(false);
  const nodeNamesDialogSide = ref<PreviewNodeNameSide>('after');

  const displayName = computed(() => {
    const sub = subsStore.getOneSub(props.name) || subsStore.getOneCollection(props.name);
    return sub?.displayName || sub?.['display-name'] || props.name;
  });

  const toggleVisibility = (
    currentVisible: { value: boolean },
    otherVisible: { value: boolean },
    hasData: boolean,
  ) => {
    if (currentVisible.value) {
      if (!otherVisible.value) {
        return;
      }

      currentVisible.value = false;
      return;
    }

    if (!hasData) {
      return;
    }

    currentVisible.value = true;
  };

  const toggleProcessedVisible = () => {
    toggleVisibility(
      isProcessedVisible,
      isOriginalVisible,
      processedData.value.length > 0,
    );
  };

  const toggleOriginalVisible = () => {
    toggleVisibility(
      isOriginalVisible,
      isProcessedVisible,
      originalData.value.length > 0,
    );
  };

  const activeNodeTab = ref("all");
  const search = ref("");
  const matchesSearch = (node: NodeInfo) => `${node.name} ${node.type} ${node.server || ""}`.toLowerCase().includes(search.value.trim().toLowerCase());
  const processedData = computed(() => props.compareData?.processed || []);
  const originalData = computed(() => props.compareData?.original || []);
  const hasProcessedData = computed(() => processedData.value.length > 0);
  const hasOriginalData = computed(() => originalData.value.length > 0);

  watch(
    () => props.compareData,
    () => {
      isOriginalVisible.value = hasOriginalData.value;
      isProcessedVisible.value = hasProcessedData.value;
    },
    { immediate: true },
  );

  const processedNodeInfos = computed(() => extractPreviewNodeInfos(processedData.value));
  const originalNodeInfos = computed(() => extractPreviewNodeInfos(originalData.value));
  const hasNodeNamesData = (side: PreviewNodeNameSide) => {
    return side === 'after' ? hasProcessedData.value : hasOriginalData.value;
  };
  const activeNodeInfos = computed(() => {
    return nodeNamesDialogSide.value === 'after'
      ? processedNodeInfos.value
      : originalNodeInfos.value;
  });
  const data = computed(() => {
    const original = originalData.value;
    const result = [];
    for (let i = 0; i < processedData.value.length; i++) {
      const item = [];
      item.push(processedData.value[i]);
      const id = processedData.value[i].id;
      const originalItem = original.find(item => item.id === id);
      item.push(originalItem);
      result.push(item);
    }
    return result.filter(([processed, original]) => matchesSearch(processed) || (original && matchesSearch(original)));
  });

  const normalizeEndpointPart = (value: unknown) => {
    if (value == null) {
      return '';
    }

    if (Array.isArray(value)) {
      return value
        .map(item => normalizeEndpointPart(item))
        .filter(Boolean)
        .join(',');
    }

    return String(value).trim();
  };

  const formatNodeEndpoint = (node: Record<string, any> | null | undefined) => {
    const host = normalizeEndpointPart(node?.server)
      || normalizeEndpointPart(node?.addresses);
    const port = normalizeEndpointPart(node?.port ?? node?.['local-port']);

    if (host && port) {
      return `${host}:${port}`;
    }

    return host || port;
  };

  const hasNodeDisplayInfo = (node: Record<string, any> | null | undefined) => {
    return Boolean(node?.name || node?.type || formatNodeEndpoint(node));
  };

  // 被过滤掉的节点：original 中未被 processed 匹配到的
  const filteredOriginalData = computed(() => {
    const original = originalData.value;
    const processedIds = new Set(processedData.value.map(item => item.id));
    return original.filter(item => !processedIds.has(item.id) && matchesSearch(item));
  });

  const remainDesc = computed(() => {
    const remainSize = processedData.value?.length || 0
    const filterSize = filteredOriginalData.value?.length || 0
    const totalSize = remainSize + filterSize
    if (!remainSize) {
      return 0
    }
    return filterSize > 0 ? `${remainSize}/${totalSize}` : remainSize
  });
  const filterDesc = computed(() => {
    const remainSize = processedData.value?.length || 0
    const filterSize = filteredOriginalData.value?.length || 0
    const totalSize = remainSize + filterSize
    if (!filterSize) {
      return 0
    }
    return remainSize > 0 ? `${filterSize}/${totalSize}` : filterSize
  });

  const goToFilterRef = () => {
    filterRef.value?.scrollIntoView()
  }

  const clickClose = () => {
    emit('closeCompare');
  };

  const openLogsOverlay = () => {
    logsOverlayStore.open();
  };

  const openNodeNamesDialog = (side: PreviewNodeNameSide) => {
    if (!hasNodeNamesData(side)) {
      return;
    }

    nodeNamesDialogSide.value = side;
    nodeNamesDialogVisible.value = true;
  };

  const closeNodeNamesDialog = () => {
    nodeNamesDialogVisible.value = false;
  };

  const invalidateIpApiRequest = () => {
    currentIpApiRequestId.value += 1;
  };

  const resetIpApiState = (status: NodeInfoIpApiStatus = 'idle') => {
    ipApi.value = null;
    ipApiStatus.value = status;
  };

  const loadIpApi = async (nodeData: NodeInfo) => {
    invalidateIpApiRequest();
    const requestId = currentIpApiRequestId.value;
    resetIpApiState('loading');

    try {
      const res = await getSubInfo(nodeData);
      if (requestId !== currentIpApiRequestId.value || !nodeInfoIsVisible.value) {
        return;
      }

      if (res?.data?.status === 'success') {
        ipApi.value = res.data.data;
        ipApiStatus.value = 'success';
      } else {
        ipApiStatus.value = 'error';
      }
    } catch (error) {
      if (requestId !== currentIpApiRequestId.value || !nodeInfoIsVisible.value) {
        return;
      }

      ipApiStatus.value = 'error';
    }
  };

  const hideNodeInfo = () => {
    invalidateIpApiRequest();
    nodeInfoIsVisible.value = false;
    nodeInfo.value = null;
    resetIpApiState();
  };

  const closeNodeInfoPanel = () => {
    if (props.pageMode && route.query.node) {
      const { node, ...query } = route.query;
      const target = { path: route.path, query, hash: route.hash };
      if (window.history.state.back === router.resolve(target).fullPath) router.back();
      else void router.replace(target);
      return;
    }
    hideNodeInfo();
  };

  const showNodeInfo = (nodeData: NodeInfo) => {
    nodeInfo.value = toRaw(nodeData);
    nodeInfoIsVisible.value = true;
    nodeInfoPanelKey.value += 1;
    void loadIpApi(toRaw(nodeData));
  };

  const openNodeInfoPanel = (val: NodeInfo) => {
    if (props.pageMode) {
      const processedIndex = processedData.value.findIndex(node => toRaw(node) === toRaw(val));
      const side = processedIndex >= 0 ? 'p' : 'o';
      const index = processedIndex >= 0 ? processedIndex : originalData.value.findIndex(node => toRaw(node) === toRaw(val));
      void router.push({ path: route.path, query: { ...route.query, node: `${side}:${index}` }, hash: route.hash });
      return;
    }
    showNodeInfo(val);
  };

  watch([() => route.query.node, () => props.compareData], () => {
    if (!props.pageMode) return;
    const selected = typeof route.query.node === 'string' ? /^([po]):(\d+)$/.exec(route.query.node) : null;
    const selectedNode = selected ? (selected[1] === 'p' ? processedData.value : originalData.value)[Number(selected[2])] : undefined;
    if (selectedNode) showNodeInfo(selectedNode);
    else hideNodeInfo();
  }, { immediate: true });

  const retryLoadIpApi = () => {
    if (!nodeInfo.value) {
      return;
    }

    void loadIpApi(toRaw(nodeInfo.value));
  };
</script>

<style lang="scss" scoped>
  .type-tag {
    padding: 1px 4px;
    line-height: 1;
    margin-right: 3px;
    color: var(--ui-text-toned);
    background: var(--ui-bg-elevated);
  }

  .item-true {
    color: var(--ui-primary);
  }

  .item-false {
    width: 8px;
    height: 1px;
    border-radius: 2px;
    background: var(--ui-text-dimmed);
  }

  .name-wrapper {
    display: flex;
    flex-direction: column;
    flex: 1;
    width: 100%;
    min-width: 0;

    > div {
      width: 100%;
      min-width: 0;
      max-width: 100%;
      white-space: normal;
      overflow-wrap: anywhere;
      word-break: break-all;
    }
  }

  .compare-table-body {
    width: 100%;

    .compare-table-row {
      padding-top: 20px;
      padding-bottom: 20px;
      border-bottom: 1px solid var(--ui-border);
    }

    &--paired {
      .processed-tr {
        padding-bottom: 0;
        border-bottom: none;
      }

      .processed-tr--unpaired {
        padding-bottom: 20px;
        border-bottom: 1px solid var(--ui-border);
      }

      .original-tr {
        padding-top: 10px;
      }
    }
  }

  .compare-table-row {
    padding: 0 var(--safe-area-side);
    width: 100%;
    cursor: pointer;
  }

  .compare-table-head {
    padding: 10px var(--safe-area-side);
  }

  .compare-table-head,
  .compare-table-row {
    margin: 0;
    display: grid;
    grid-template-columns: 46% 1fr 1fr 1fr 1fr;

    li,
    td {
      display: flex;
      justify-content: center;
      align-items: center;
      min-width: 0;
    }

    li:first-child,
    td:first-child {
      justify-content: start;
    }
  }

  .compare-table-head {
    position: sticky;
    z-index: 7;
    top: calc(var(--compare-header-offset) + 62px);
    border-bottom: 1px solid var(--ui-border);
    font-weight: bold;
    background: var(--ui-bg-muted);
    color: var(--ui-text-muted);

    &.filter-table-head {
      top: calc(var(--compare-header-offset) + 28px);
    }
  }

  .processed-item,
  .original-item {
    display: flex;
    align-items: center;
    width: 100%;
    min-width: 0;

    &::before {
      content: '';
      display: block;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      margin-right: 10px;
      background: var(--ui-primary);
      flex-shrink: 0;
    }
  }

  .indicator-group {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-right: 24px;
    min-width: 0;

    .processed-item,
    .original-item {
      width: auto;
    }
  }

  .indicator {
    display: inline-flex;
    align-items: center;
    width: auto;
    padding: 4px 8px;
    border: none;
    border-radius: var(--ui-radius);
    background: transparent;
    color: var(--ui-text-muted);
    font: inherit;
    line-height: 1;
    cursor: pointer;
    flex-shrink: 0;

    &.is-active {
      background: var(--ui-bg-elevated);
      box-shadow: inset 0 0 0 1px var(--ui-border);
    }

    &.is-inactive {
      opacity: 0.45;
    }

    &.is-disabled {
      opacity: 0.25;
      cursor: not-allowed;
      box-shadow: none;
    }

    &.original-item.is-active {
      color: var(--ui-primary);
    }

    &.processed-item.is-active {
      color: var(--ui-text-muted);
    }

    &:focus-visible {
      outline: 2px solid var(--ui-primary);
      outline-offset: 2px;
    }
  }

  .node-names-action {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-width: 0;
    padding: 2px 0;
    border: none;
    background: none;
    color: var(--ui-text-muted);
    cursor: pointer;
    font: inherit;
    font-size: 12px;
    line-height: 1;
    white-space: nowrap;

    &.is-disabled {
      opacity: 0.25;
      cursor: not-allowed;
    }

    :deep(svg) {
      width: 12px;
      height: 12px;
      color: var(--ui-text-muted);
      flex-shrink: 0;
    }
  }

  .processed-item::before {
    background: var(--ui-text-muted);
  }

  .block-wrapper {
    position: relative;
    background: var(--ui-bg-elevated);

    .compare-title {
      padding: 0 var(--safe-area-side);
      z-index: 9;
      margin-top: 0;
      top: var(--compare-header-offset);
      background: var(--ui-bg-muted);
      small {
        cursor: pointer;
        text-decoration: underline;
      }
    }

    .compare-des {
      padding: 6px var(--safe-area-side);
      z-index: 8;
      display: flex;
      flex-wrap: wrap;
      gap: 8px 0;
      position: sticky;
      top: calc(var(--compare-header-offset) + 32px);
      background: var(--ui-bg-muted);
      color: var(--ui-text-muted);
    }
  }

  .compare-page-body {
    font-size: 12px;
    background: inherit;
    color: var(--ui-text-muted);
    width: 100%;
    flex: 1;
  }

  .compare-page-header {
    padding: env(safe-area-inset-top) var(--safe-area-side) 0;
    position: sticky;
    top: 0;
    z-index: 19;
    display: flex;
    gap: 12px;
    justify-content: space-between;
    align-items: center;
    min-height: var(--compare-header-offset);
    box-sizing: border-box;
    border-bottom: 1px solid;
    color: var(--ui-text);
    background: var(--ui-bg-muted);
    border-color: var(--ui-border);
    width: 100%;

    &.preview-popup-header {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      gap: 0;
    }

    .title {
      white-space: nowrap;
      flex-shrink: 0;
    }
    .displayName {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      min-width: 0;
      overflow: hidden;
      flex: 0 1 40vw;
      
      @media screen and (min-width: 768px) {
        flex-basis: 300px;
      }
      
      @media screen and (min-width: 1024px) {
        flex-basis: 400px;
      }

      > svg {
        flex-shrink: 0;
      }

      .displayNameText {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
    h1 {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;
      min-width: 0;
      margin: 0;
      font-size: 20px;
      line-height: 1;
      font-weight: 500;

      > svg {
        width: 20px;
        height: 20px;
        flex-shrink: 0;
      }

      span {
        font-size: 14px;
        color: var(--ui-text-toned);

        > svg {
          color: var(--ui-text-muted);
        }
      }
    }
    .btn-groups {
      display: flex;
      align-items: center;
      flex-shrink: 0;
      gap: 10px;
    }
    button {
      cursor: pointer;
      background: none;
      border: none;
      font-size: 20px;
      padding: 8px;
      color: var(--ui-text-dimmed);
      margin: 0;
      &.refresh {
        font-size: 18px;
      }
    }
  }

  .compare-page-header .preview-leading {
    gap: 0;
    justify-content: flex-start;
  }

  .compare-page-header .preview-trailing {
    grid-column: 3;
    justify-self: end;
    gap: 0;
    justify-content: flex-end;
  }

  .compare-page-header .preview-leading button,
  .compare-page-header .preview-trailing button {
    width: 32px;
    height: 32px;
    padding: 0;
    color: var(--ui-text-muted);
    display: inline-flex;
    align-items: center;
    justify-content: center;

    :deep(svg) {
      width: 14px;
      height: 14px;
      font-size: 14px;
    }
  }

  .compare-page-header .preview-popup-title {
    grid-column: 2;
    justify-self: center;
    display: block;
    flex: none;
    margin: 0;
    min-width: 20px;
    font-size: 18px;
    line-height: 1;
    font-weight: 600;
    color: var(--ui-text);
    text-align: center;
    overflow: hidden;
  }

.compare-page-wrapper {
  width: 100%;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  :deep(.cmviewRef) { width: 100%; height: 48dvh; }
}

  .divider,
  .divider::before,
  .divider::after {
    color: var(--ui-text-dimmed);
    border-color: var(--ui-text-dimmed);
  }
</style>

<style scoped>
.compare-page-standalone .block-wrapper { border: 1px solid var(--ui-border); border-radius: var(--ui-radius); overflow: hidden; background: var(--ui-bg); }
.compare-page-standalone .compare-title { position: static; padding: 14px 16px; border-bottom: 1px solid var(--ui-border); font-size: 14px; font-weight: 600; background: var(--ui-bg); }
.compare-page-standalone .compare-title p { margin: 0; display: flex; align-items: center; gap: 12px; }
.compare-page-standalone .compare-des { position: static; padding: 12px 16px; background: var(--ui-bg); }
.compare-page-standalone .compare-table-head { position: static; padding: 10px 16px; font-size: 12px; font-weight: 500; }
.compare-page-standalone .compare-table-body .compare-table-row { padding: 8px 16px; min-height: 54px; }
.compare-page-standalone .name-wrapper > div + div { margin-top: 4px; color: var(--ui-text-muted); font-size: 12px; }
.compare-page-standalone .compare-table-row:hover { background: var(--ui-bg-muted); }
.compare-page-standalone .compare-table-row td { font-size: 14px; }
.compare-page-standalone .indicator, .compare-page-standalone .node-names-action { padding: 4px 8px; line-height: 20px; font-size: 12px; }
</style>
