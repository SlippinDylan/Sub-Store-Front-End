<template>
  <UCard :ui="{ body: 'p-0 sm:p-0' }">
    <div
      class="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-default px-4 py-3"
    >
      <WorkspaceSegments
        v-model="activeTab"
        :options="tabs"
        :label="$t('previewTable.status')"
        class="shrink-0"
      />
      <template v-if="activeTab !== 'filtered'">
        <div class="flex items-center gap-2">
          <UCheckbox
            :model-value="beforeVisible"
            :disabled="!original.length || !afterVisible"
            :label="$t('comparePage.remain.beforeIndicator')"
            @update:model-value="$emit('toggleBefore')"
          />
          <UButton
            size="sm"
            color="neutral"
            variant="outline"
            icon="i-lucide-copy"
            :disabled="!original.length"
            @click="$emit('nodeNames', 'before')"
          >
            {{ $t("comparePage.nodeNames.entry") }}
          </UButton>
        </div>
        <div class="flex items-center gap-2">
          <UCheckbox
            :model-value="afterVisible"
            :disabled="!processed.length || !beforeVisible"
            :label="$t('comparePage.remain.afterIndicator')"
            @update:model-value="$emit('toggleAfter')"
          />
          <UButton
            size="sm"
            color="neutral"
            variant="outline"
            icon="i-lucide-copy"
            :disabled="!processed.length"
            @click="$emit('nodeNames', 'after')"
          >
            {{ $t("comparePage.nodeNames.entry") }}
          </UButton>
        </div>
      </template>
      <span v-else class="text-sm text-muted">
        {{ $t("previewTable.filteredHint") }}
      </span>
    </div>
    <p class="px-4 pt-3 text-xs text-muted md:hidden">
      {{ $t('workspace.scrollForMore') }}
    </p>
    <div
      class="overflow-x-auto"
      tabindex="0"
      role="region"
      :aria-label="$t('previewTable.status')"
    >
      <table class="preview-nodes-table">
        <colgroup>
          <col style="width: 72px" />
          <col style="width: 88px" />
          <col style="width: 22%" />
          <col />
          <col v-for="flag in flags" :key="flag.key" style="width: 60px" />
        </colgroup>
        <thead>
          <tr>
            <th>{{ $t("previewTable.stage") }}</th>
            <th>{{ $t("previewTable.protocol") }}</th>
            <th>{{ $t("previewTable.name") }}</th>
            <th>{{ $t("previewTable.server") }}</th>
            <th v-for="flag in flags" :key="flag.key" class="flag-column">
              {{ flag.label }}
            </th>
          </tr>
        </thead>
        <tbody
          v-for="group in visibleGroups"
          :key="group.status === 'retained' ? group.after.id : group.before.id"
          :class="{ 'filtered-group': group.status === 'filtered' }"
        >
          <tr
            v-for="row in rowsFor(group)"
            :key="row.side"
            tabindex="0"
            @click="$emit('select', row.node)"
            @keydown.enter.prevent="$emit('select', row.node)"
            @keydown.space.prevent="$emit('select', row.node)"
          >
            <td class="stage-column">
              <span
                :class="
                  group.status === 'filtered'
                    ? 'text-muted'
                    : row.side === 'after'
                      ? 'text-primary'
                      : 'text-muted'
                "
              >
                {{
                  $t(
                    group.status === "filtered"
                      ? "previewTable.filtered"
                      : row.side === "after"
                        ? "comparePage.remain.afterIndicator"
                        : "comparePage.remain.beforeIndicator",
                  )
                }}
              </span>
            </td>
            <td class="protocol-column">
              <TagChip>{{ row.node.type }}</TagChip>
            </td>
            <td class="name-column">
              <button
                type="button"
                class="text-left font-medium"
                @click.stop="$emit('select', row.node)"
              >
                {{ row.node.name }}
              </button>
            </td>
            <td class="server-column" :title="formatEndpoint(row.node)">{{ formatEndpoint(row.node) }}</td>
            <td v-for="flag in flags" :key="flag.key" class="flag-column">
              <UIcon
                v-if="flag.enabled(row.node)"
                name="i-lucide-check"
                class="size-4 text-primary"
                :aria-label="$t('previewTable.enabled')"
              />
              <span
                v-else
                class="text-dimmed"
                :aria-label="$t('previewTable.disabled')"
              >
                —
              </span>
            </td>
          </tr>
        </tbody>
        <tbody v-if="!visibleGroups.length">
          <tr>
            <td colspan="8" class="py-10 text-center text-muted">
              {{ $t("previewWorkspace.noNodes") }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </UCard>
</template>
<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import WorkspaceSegments from "./WorkspaceSegments.vue";
import {
  groupPreviewNodes,
  type PreviewNodeGroup,
} from "@/utils/previewNodeRows";
import type { PreviewNodeNameSide } from "@/utils/previewNodeNames";
type PreviewNode = NodeInfo & { aead?: boolean; "fast-open"?: boolean };
const props = defineProps<{
  modelValue: string;
  original: PreviewNode[];
  processed: PreviewNode[];
  search: string;
  beforeVisible: boolean;
  afterVisible: boolean;
  formatEndpoint: (node: PreviewNode) => string;
}>();
const emit = defineEmits<{
  (event: "update:modelValue", value: string): void;
  (event: "toggleBefore"): void;
  (event: "toggleAfter"): void;
  (event: "nodeNames", side: PreviewNodeNameSide): void;
  (event: "select", node: PreviewNode): void;
}>();
const { t } = useI18n();
const activeTab = computed({
  get: () => props.modelValue,
  set: (value: string) => emit("update:modelValue", value),
});
const groups = computed(() =>
  groupPreviewNodes(props.original, props.processed),
);
const tabs = computed(() => [
  { value: "all", label: `${t("previewTable.all")} (${groups.value.length})` },
  {
    value: "retained",
    label: `${t("previewTable.retained")} (${props.processed.length})`,
  },
  {
    value: "filtered",
    label: `${t("previewTable.filtered")} (${groups.value.length - props.processed.length})`,
  },
]);
const matches = (node: PreviewNode | undefined) =>
  node &&
  `${node.name} ${node.type || ""} ${props.formatEndpoint(node)}`
    .toLowerCase()
    .includes(props.search.trim().toLowerCase());
const visibleGroups = computed(() =>
  groups.value.filter(
    (group) =>
      (activeTab.value === "all" || group.status === activeTab.value) &&
      (matches(group.before) || matches(group.after)),
  ),
);
const rowsFor = (group: PreviewNodeGroup<PreviewNode>) => {
  const rows: { side: PreviewNodeNameSide; node: PreviewNode }[] = [];
  if (group.before && (group.status === "filtered" || props.beforeVisible))
    rows.push({ side: "before", node: group.before });
  if (group.after && props.afterVisible)
    rows.push({ side: "after", node: group.after });
  return rows;
};
const flags = [
  { key: "udp", label: "UDP", enabled: (node: PreviewNode) => node.udp },
  {
    key: "tfo",
    label: "TFO",
    enabled: (node: PreviewNode) => node.tfo || node["fast-open"],
  },
  {
    key: "scert",
    label: "SCERT",
    enabled: (node: PreviewNode) => node["skip-cert-verify"],
  },
  { key: "aead", label: "AEAD", enabled: (node: PreviewNode) => node.aead },
];
</script>
<style scoped>
.preview-nodes-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  font-size: 14px;
}
@media (max-width: 767px) {
  .preview-nodes-table {
    min-width: 760px;
  }
}
th {
  background: var(--ui-bg-muted);
  color: var(--ui-text-muted);
  font-size: 12px;
  font-weight: 500;
  text-align: left;
  white-space: nowrap;
}
th,
td {
  padding: 12px;
  vertical-align: middle;
}
tbody + tbody {
  border-top: 1px solid var(--ui-border);
}
tr:focus-visible {
  outline: 2px solid var(--ui-primary);
  outline-offset: -2px;
}
tbody tr:hover {
  background: var(--ui-bg-muted);
  cursor: pointer;
}
.stage-column,
.protocol-column {
  width: 1%;
  white-space: nowrap;
  font-size: 12px;
}
.name-column {
  overflow-wrap: anywhere;
}
.server-column {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  color: var(--ui-text-muted);
}
.flag-column {
  text-align: center;
  white-space: nowrap;
}
</style>
