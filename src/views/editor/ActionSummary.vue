<template>
  <dl class="action-summary">
    <div v-for="(row, index) in rows" :key="index" class="action-summary-row">
      <dt>{{ row.label }}</dt>
      <dd :class="{ 'font-mono': row.code }">
        {{ row.value || $t("subscriptionEditor.emptyValue") }}
      </dd>
    </div>
  </dl>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
const props = defineProps<{ action: Process }>();
const { t } = useI18n();
type SummaryRow = { label: string; value: string; code?: boolean };
const rows = computed<SummaryRow[]>(() => {
  const { type, args } = props.action;
  const key = `editorPage.subConfig.nodeActions['${type}']`;
  const a = args ?? {};
  const row = (label: string, value: unknown, code = false): SummaryRow => ({
    label,
    value: Array.isArray(value) ? value.join("\n") : String(value ?? ""),
    code,
  });
  const option = (index: number) => t(`${key}.options[${index}]`);
  const mode = (keep: unknown = true) => row(t(`${key}.des[1]`), option(keep ? 0 : 1));
  switch (type) {
    case "Add Proxies From Subscription Operator":
      return [
        row(t(`${key}.des.source`), t(`${key}.sourceOptions[${a.sourceType === 'collection' ? 1 : 0}]`)),
        row(t('editorPage.subConfig.sourceNameInputLabel'), a.sourceName),
        row(t(`${key}.des.includeUnsupportedProxy`), t(`editorPage.subConfig.commonOptions.udp.${a.includeUnsupportedProxy ? 'enabled' : 'disabled'}`)),
        row(t(`${key}.des.position`), t(`${key}.positionOptions[${['replace', 'front', 'back'].indexOf(a.position || 'replace')}]`)),
      ];
    case "Regex Filter":
      return [mode(a.keep), row(t(`${key}.des[0]`), a.regex, true)];
    case "Regex Sort Operator":
      return [
        row(
          t(`${key}.des[1]`),
          option(["asc", "desc", "original"].indexOf(a.order || "asc")),
        ),
        row(
          t(`${key}.des[0]`),
          Array.isArray(args) ? args : a.expressions,
          true,
        ),
      ];
    case "Regex Delete Operator":
      return [row(t(`${key}.des[0]`), args, true)];
    case "Regex Rename Operator":
      return [
        row(
          t(`${key}.des[0]`),
          (args ?? []).map(
            (item: { expr: string; now: string }) =>
              `${item.expr} ⇒ ${item.now}`,
          ),
          true,
        ),
      ];
    case "Region Filter":
    case "Type Filter": {
      const values = Array.isArray(args) ? args : a.value;
      const selectedMode = row(
        t(`${key}.des[1]`),
        t(`${key}.modeOptions[${a.keep === false ? 1 : 0}]`),
      );
      return [selectedMode, row(t(`${key}.des[0]`), values)];
    }
    case "Flag Operator":
      return [
        row(t(`${key}.des`), option(a.mode === "remove" ? 1 : 0)),
        ...(a.mode === "remove"
          ? []
          : [
              row(
                t("subscriptionEditor.flagDisplay"),
                t(
                  `${key}.twOptions[${["cn", "ws", "tw"].indexOf(a.tw || "cn")}]`,
                ),
              ),
            ]),
      ];
    case "Sort Operator":
      return [
        row(
          t(`${key}.des`),
          option(["asc", "desc", "random"].indexOf(args || "asc")),
        ),
      ];
    case "Handle Duplicate Operator":
      return [
        row(t("subscriptionEditor.duplicateFields"), a.field),
        row(
          t(`${key}.action.des`),
          t(`${key}.action.options[${a.action === "delete" ? 1 : 0}]`),
        ),
        ...(a.action === "delete"
          ? []
          : [
              row(
                t(`${key}.position.des`),
                t(`${key}.position.options[${a.position === "front" ? 0 : 1}]`),
              ),
              row(t(`${key}.template.des`), a.template),
              row(t(`${key}.link.des`), a.link),
            ]),
      ];
    case "Script Filter":
    case "Script Operator":
    case "Response Transformer":
      return [
        row(t(`${key}.des[0]`), option(a.mode === "script" ? 1 : 0)),
        row(t(`${key}.des[1]`), a.content, a.mode === "script"),
        ...(a.arguments && Object.keys(a.arguments).length
          ? [
              row(
                t("subscriptionEditor.scriptArguments"),
                Object.entries(a.arguments).map(
                  ([key, value]) =>
                    `${key}: ${typeof value === "object" ? JSON.stringify(value) : value}`,
                ),
                true,
              ),
            ]
          : []),
      ];
    case "Resolve Domain Operator":
      return [
        row(t("subscriptionEditor.dnsProvider"), a.provider || "Custom"),
        ...(a.provider === "Custom" || !a.provider
          ? [
              row(t("subscriptionEditor.customDns"), a.url),
              row(
                t(`${key}.tlsSkipCertVerify`),
                t(
                  `${key}.tlsSkipCertVerifyOptions[${a.tlsSkipCertVerify === "enabled" ? 1 : 0}]`,
                ),
              ),
            ]
          : []),
        row("EDNS", a.edns),
        row(t("subscriptionEditor.resolveType"), a.type || "IPv4"),
        row(
          t("subscriptionEditor.filterResult"),
          t(
            `${key}.filters[${["disabled", "removeFailed", "IPOnly", "IPv4Only", "IPv6Only"].indexOf(a.filter || "disabled")}]`,
          ),
        ),
        row(
          t("subscriptionEditor.cache"),
          t(`${key}.cache[${a.cache === "disabled" ? 1 : 0}]`),
        ),
        ...["dnsConcurrency", "timeout", "concurrency", "cacheTtl"]
          .filter((field) => a[field] !== undefined && a[field] !== "")
          .map((field) => row(t(`${key}.${field}`), a[field])),
      ];
    default:
      return [];
  }
});
</script>

<style scoped>
.action-summary {
  margin: 0;
}
.action-summary-row {
  display: grid;
  grid-template-columns: 160px minmax(0, 1fr);
  gap: 24px;
  padding: 12px 16px;
}
.action-summary-row + .action-summary-row {
  border-top: 1px solid var(--ui-border);
}
dt {
  font-size: 14px;
  color: var(--ui-text-muted);
}
dd {
  margin: 0;
  min-width: 0;
  max-height: 200px;
  overflow: auto;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  font-size: 14px;
}
@media (max-width: 600px) {
  .action-summary-row {
    grid-template-columns: minmax(0, 1fr);
    gap: 8px;
  }
}
</style>
