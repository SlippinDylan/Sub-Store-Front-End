<template>
  <div class="editor-action-card">
    <ResourceField
      :label="$t(`editorPage.subConfig.nodeActions['${type}'].des.source`)"
    >
      <ChoiceGroup v-model="sourceTypeValue" direction="horizontal">
        <ChoiceOption
          v-for="(key, index) in sourceTypeOptions"
          :key="key"
          :label="key"
        >
          {{
            $t(
              `editorPage.subConfig.nodeActions['${type}'].sourceOptions[${index}]`,
            )
          }}
        </ChoiceOption>
      </ChoiceGroup>
    </ResourceField>
    <ResourceField :label="$t('editorPage.subConfig.sourceNameInputLabel')">
      <div class="source-name-controls">
        <FieldInput
          v-model.trim="sourceName"
          :placeholder="
            $t(
              `editorPage.subConfig.nodeActions['${type}'].sourceNamePlaceholder`,
            )
          "
        />
        <USelectMenu
          v-if="sourceNameColumns.length"
          v-model="sourceName"
          value-key="value"
          :items="
            sourceNameColumns.map((item) => ({
              label: item.text,
              value: item.value,
            }))
          "
          :aria-label="$t('editorPage.subConfig.sourceNamePicker.title')"
          :placeholder="$t('editorPage.subConfig.sourceNamePicker.title')"
          class="w-full"
        />
      </div>
    </ResourceField>
    <ResourceField>
      <template #label>
        <span class="inline-flex items-center gap-1">
          {{
            $t(
              `editorPage.subConfig.nodeActions['${type}'].des.includeUnsupportedProxy`,
            )
          }}
          <HelpTip :help="includeUnsupportedProxyTips()" />
        </span>
      </template>
      <div class="flex justify-end">
        <SelectionOption
          v-model="includeUnsupportedProxy"
          :aria-label="
            $t(
              `editorPage.subConfig.nodeActions['${type}'].des.includeUnsupportedProxy`,
            )
          "
        />
      </div>
    </ResourceField>
    <ResourceField
      :label="$t(`editorPage.subConfig.nodeActions['${type}'].des.position`)"
    >
      <ChoiceGroup v-model="position" direction="horizontal">
        <ChoiceOption
          v-for="(key, index) in positionOptions"
          :key="key"
          :label="key"
        >
          {{
            $t(
              `editorPage.subConfig.nodeActions['${type}'].positionOptions[${index}]`,
            )
          }}
        </ChoiceOption>
      </ChoiceGroup>
    </ResourceField>
  </div>
</template>
<script lang="ts" setup>
import { computed, inject, onMounted, ref, watch } from "vue";

import { useSubsStore } from "@/store/subs";

const { type, id } = defineProps<{
  type: string;
  id: string;
}>();

const form = inject<any>("form");
const subsStore = useSubsStore();

const sourceTypeOptions = ["subscription", "collection"];
const positionOptions = ["replace", "front", "back"];
const sourceTypeValue = ref("subscription");
const sourceName = ref("");
const includeUnsupportedProxy = ref(false);
const position = ref("replace");

const sourceList = computed<any[]>(() =>
  sourceTypeValue.value === "collection" ? subsStore.collections : subsStore.subs,
);

const sourceNameColumns = computed(() =>
  (sourceList.value || []).map((item) => ({
    text: item.displayName ? `${item.displayName}` : item.name,
    value: item.name,
  })),
);

const getActionItem = () => form.process.find((item) => item.id === id);

const syncArgs = () => {
  const item = getActionItem();
  if (!item) return;

  item.args = {
    sourceType: sourceTypeValue.value,
    sourceName: sourceName.value,
    includeUnsupportedProxy: includeUnsupportedProxy.value,
    position: position.value,
  };
};



const includeUnsupportedProxyDocUrl =
  "https://github.com/sub-store-org/Sub-Store/wiki/%E9%93%BE%E6%8E%A5%E5%8F%82%E6%95%B0%E8%AF%B4%E6%98%8E";

const includeUnsupportedProxyTips = () => ({
  href: includeUnsupportedProxyDocUrl,
});

onMounted(() => {
  const item = getActionItem();
  if (!item) return;

  const defaultSourceType =
    sourceTypeOptions.includes(form?.sourceType) && form?.sourceType !== "none"
      ? form.sourceType
      : "subscription";

  sourceTypeValue.value = item.args?.sourceType || defaultSourceType;
  sourceName.value =
    item.args?.sourceName ||
    (sourceTypeValue.value === form?.sourceType ? form?.sourceName : "") ||
    "";
  includeUnsupportedProxy.value =
    typeof item.args?.includeUnsupportedProxy === "boolean"
      ? item.args.includeUnsupportedProxy
      : false;
  position.value = item.args?.position || "replace";
  syncArgs();
});

watch(
  [sourceTypeValue, sourceName, includeUnsupportedProxy, position],
  syncArgs,
);
</script>

<style lang="scss" scoped>
.des-label {
  font-size: 12px;
  margin-bottom: 14px;
  color: var(--ui-text-muted);

  &:not(:first-child) {
    margin-top: 24px;
  }
}

.radio-wrapper {
}

.source-radio {
  width: min(100%, 760px);
  margin-bottom: 24px;
}

.position-radio {
  width: 100%;
}

.source-name-row {
  width: min(100%, 1120px);
  margin-bottom: 18px;
}

.checkbox-row {
  display: flex;
  align-items: center;
  gap: 4px;
  margin: 18px 0 24px;
  color: var(--ui-text-toned);
  font-size: 14px;
  line-height: 1.35;

  .my-switch {
    width: 18px;
    margin-right: 0;
  }

  .checkbox-label {
    background: none;
    border: none;
    color: inherit;
    cursor: pointer;
    flex: 0 1 auto;
    font: inherit;
    padding: 0;
    user-select: none;
  }

  .checkbox-tip {
    align-items: center;
    background: none;
    border: none;
    color: var(--ui-text-muted);
    cursor: pointer;
    display: inline-flex;
    flex: 0 0 auto;
    justify-content: center;
    padding: 0;
  }

  .checkbox-info {
    color: var(--ui-text-muted);
    font-size: 15px;
  }
}

@media (min-width: 900px) {
  .source-name-row {
    width: 67%;
  }
}

@media (max-width: 640px) {
  .source-radio,
  .position-radio {
  }
}
</style>
