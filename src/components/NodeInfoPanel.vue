<template>
  <PreviewFrame
    :page-mode="pageMode"
    :title="props.nodeInfo.name"
    @close="closePanel"
  >
    <div class="node-info-content">
      <UTabs
        v-model="currentTab"
        :items="[
          {
            label: $t('comparePage.nodeInfo.node.title'),
            value: '0',
            slot: 'node',
          },
          {
            label: $t('comparePage.nodeInfo.ipApi.title'),
            value: '1',
            slot: 'ip',
          },
          { label: 'JSON', value: '2', slot: 'json' },
        ]"
        class="w-full"
        size="sm"
      >
        <template #node>
          <UCard :ui="{ body: 'p-0 sm:p-0', header: 'px-4 py-3 sm:px-4' }">
            <template #header>
              <div class="flex flex-wrap items-center gap-2">
                <TagChip>{{ props.nodeInfo.type }}</TagChip>
                <h2 class="min-w-0 break-all text-sm font-semibold">
                  {{ props.nodeInfo.name }}
                </h2>
              </div>
            </template>
            <dl class="node-properties">
              <div v-for="(value, key) in displayNodeInfo" :key="key">
                <dt>{{ key }}</dt>
                <dd>
                  <pre v-if="typeof value === 'object'">{{
                    formatValue(value)
                  }}</pre>
                  <span v-else>{{ formatValue(value) }}</span>
                </dd>
              </div>
            </dl>
          </UCard>
          <UCard v-if="showQrCode && qrcode" class="mt-4">
            <div class="flex flex-wrap items-center gap-5">
              <img :src="qrcode" alt="QR Code" class="size-32 shrink-0" />
              <p class="text-sm text-muted">
                {{ $t("previewWorkspace.scanNode") }}
              </p>
            </div>
          </UCard>
        </template>
        <template #ip>
          <UCard>
            <dl v-if="hasIpApiData" class="node-properties">
              <div v-for="(value, key) in ipDetails" :key="key">
                <dt>{{ key }}</dt>
                <dd>{{ value }}</dd>
              </div>
            </dl>
            <div
              v-else-if="props.ipApiStatus === 'error'"
              class="flex min-h-48 flex-col items-center justify-center gap-4"
            >
              <p class="text-sm text-error" role="alert">
                {{ $t("comparePage.nodeInfo.ipApi.loadFailed") }}
              </p>
              <UButton
                size="sm"
                icon="i-lucide-refresh-cw"
                @click="retryLoadIpApi"
              >
                {{ $t("comparePage.nodeInfo.ipApi.retry") }}
              </UButton>
            </div>
            <div
              v-else
              class="flex min-h-48 items-center justify-center gap-2 text-sm text-muted"
            >
              <UIcon
                name="i-lucide-loader-circle"
                class="size-4 animate-spin"
              />
              {{ $t("comparePage.nodeInfo.ipApi.loading") }}
            </div>
          </UCard>
        </template>
        <template #json>
          <div class="node-json">
            <cmView
              :id="nodeInfoPreviewId"
              :is-read-only="true"
              :toolbar-actions="previewToolbarActions"
              toolbar-variant="preview"
            />
          </div>
        </template>
      </UTabs>
    </div>
  </PreviewFrame>
</template>
<script lang="ts" setup>
import PreviewFrame from "./PreviewFrame.vue";
import { useCodeStore } from "@/store/codeStore";
import cmView from "@/views/editCode/cmView.vue";
import { useQRCode } from "@vueuse/integrations/useQRCode";
import { computed, ref, onBeforeUnmount } from "vue";

const emit = defineEmits(["close", "retry"]);
const props = defineProps<{
  ipApi: IpApiData | null;
  ipApiStatus: NodeInfoIpApiStatus;
  nodeInfo: NodeInfo;
  pageMode?: boolean;
}>();

const currentTab = ref("0");
const nodeInfoPreviewId = "nodeInfoPreview";
const previewToolbarActions = ["language", "search", "copy"];
const cmStore = useCodeStore();

cmStore.setEditCode(nodeInfoPreviewId, JSON.stringify(props.nodeInfo, null, 2));
onBeforeUnmount(() => {
  delete cmStore.EditCode[nodeInfoPreviewId];
});
const formatValue = (value: unknown) =>
  typeof value === "object" ? JSON.stringify(value, null, 2) : String(value);

const hasIpApiData = computed(() => {
  return props.ipApiStatus === "success" && Boolean(props.ipApi);
});

const qrcode = useQRCode(
  computed(() => {
    return hasIpApiData.value ? props.ipApi?.shareUrl || "" : "";
  }),
);

const displayNodeInfo = computed(() => {
  const result = {};
  Object.keys(props.nodeInfo).forEach((key) => {
    switch (key) {
      case "id":
      case "type":
      case "name":
        break;
      default:
        result[key] = props.nodeInfo[key];
        break;
    }
  });
  return result;
});

const city = computed(() => {
  const info = props.ipApi?.info;
  if (!info) {
    return "";
  }

  return info.city === info.country
    ? info.city
    : info.country + " - " + info.city;
});

const ipDetails = computed(() => {
  const info = props.ipApi?.info;
  return info
    ? {
        IP: info.query,
        Region: city.value,
        ISP: info.isp,
        Org: info.org,
        Timezone: info.timezone,
        Location: `${info.lon}, ${info.lat}`,
      }
    : {};
});

const showQrCode = computed(() => {
  return hasIpApiData.value && currentTab.value === "0";
});

const retryLoadIpApi = () => {
  emit("retry");
};

const closePanel = () => {
  emit("close");
};
</script>

<style scoped>
.node-properties {
  margin: 0;
}
.node-properties > div {
  display: grid;
  grid-template-columns: minmax(140px, 24%) minmax(0, 1fr);
  gap: 24px;
  padding: 12px 16px;
  font-size: 14px;
}
.node-properties > div + div {
  border-top: 1px solid var(--ui-border);
}
.node-properties dt {
  color: var(--ui-text-muted);
  overflow-wrap: anywhere;
}
.node-properties dd {
  margin: 0;
  min-width: 0;
  overflow-wrap: anywhere;
}
.node-properties pre {
  margin: 0;
  white-space: pre-wrap;
  font-size: 12px;
}
.node-json {
  overflow: hidden;
  border: 1px solid var(--ui-border);
  border-radius: var(--ui-radius);
}
.node-json :deep(.cmviewRef) {
  min-height: 50dvh;
}
@media (max-width: 600px) {
  .node-properties > div {
    grid-template-columns: 1fr;
    gap: 6px;
  }
}
</style>
