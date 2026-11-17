<template>
  <div
    v-if="visible && paramsArgumentsLocal.length"
    class="parameter-table-wrapper"
  >
    <table class="parameter-table">
      <thead>
        <tr>
          <th scope="col">{{ $t("subscriptionEditor.parameterName") }}</th>
          <th scope="col">{{ $t("subscriptionEditor.parameterValue") }}</th>
          <th scope="col" class="parameter-actions">{{ optionsText }}</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(item, index) in paramsArgumentsLocal"
          :key="index"
          :class="{ 'duplicate-key-row': isDuplicateKey(item.key) }"
        >
          <td>
            <ResourceField
              :prop="`scriptArgument${index}`"
              class="parameter-key-field"
              :rules="[
                {
                  validator: () =>
                    !getScriptArgumentError(paramsArgumentsLocal, index),
                  message: $t('actionValidation.argumentNameRequired'),
                },
              ]"
            >
              <FieldTextarea
                v-model="item.key"
                :aria-label="$t('subscriptionEditor.parameterName')"
                :placeholder="$t('subscriptionEditor.parameterName')"
                :rows="1"
                autosize
                @blur="handleKeyBlur(item, index)"
              />
              <p
                v-if="isDuplicateKey(item.key) && item.key"
                class="mt-1 text-xs text-error"
              >
                {{
                  $t(
                    `editorPage.subConfig.nodeActions['${props.type}'].duplicateKeyWarning`,
                  )
                }}
              </p>
            </ResourceField>
          </td>
          <td>
            <FieldTextarea
              v-model="item.value"
              :aria-label="$t('subscriptionEditor.parameterValue')"
              :placeholder="$t('subscriptionEditor.parameterValue')"
              :rows="1"
              autosize
            />
          </td>
          <td class="parameter-actions">
            <UButton
              @click="deleteItem(index)"
              icon="i-lucide-trash-2"
              color="error"
              variant="ghost"
              size="sm"
              class="whitespace-nowrap"
            >
              {{ deleteParamsText }}
            </UButton>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script lang="ts" setup>
import { getScriptArgumentError } from "@/views/editor/actionValidation";
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

type ParamItem = {
  key: string;
  value: string;
};

const props = defineProps({
  paramsArguments: {
    type: Array as () => ParamItem[],
    default: () => [],
  },
  visible: {
    type: Boolean,
    default: false,
  },
  type: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(["update:paramsArguments", "add-parameter"]);

const { t } = useI18n();

const paramsArgumentsLocal = computed({
  get: () => props.paramsArguments as ParamItem[],
  set: (val: ParamItem[]) => emit("update:paramsArguments", val),
});

// 跟踪重复键
const keyOccurrences = ref<Record<string, number>>({});

// 更新键名出现次数的函数
const updateKeyOccurrences = (args) => {
  const occurrences = {};
  args.forEach((item) => {
    if (item.key && item.key.trim() !== "") {
      occurrences[item.key] = (occurrences[item.key] || 0) + 1;
    }
  });
  keyOccurrences.value = occurrences;
};

// 检查一个键名是否重复
const isDuplicateKey = (key) => {
  return key && keyOccurrences.value[key] > 1;
};

// 监听参数变化，更新重复键的计数
watch(
  () => props.paramsArguments,
  (newArgs) => {
    updateKeyOccurrences(newArgs);
  },
  { deep: true, immediate: true },
);

// 文本内容通过i18n翻译
const optionsText = computed(() =>
  t(`editorPage.subConfig.nodeActions['${props.type}'].paramsOptions`),
);
const deleteParamsText = computed(() =>
  t(`editorPage.subConfig.nodeActions['${props.type}'].paramsDelete`),
);

const deleteItem = (index) => {
  const newParamsArguments = [...props.paramsArguments];
  newParamsArguments.splice(index, 1);
  emit("update:paramsArguments", newParamsArguments);
  // 删除后需要更新键名出现次数
  updateKeyOccurrences(newParamsArguments);
};

const trimValue = (item, field) => {
  if (item[field] && typeof item[field] === "string") {
    item[field] = item[field].replace(/\s+/g, "");
  }
};

// 处理键名失焦事件
const handleKeyBlur = (item, index) => {
  // 先去除空白符
  trimValue(item, "key");

  // 更新键名出现次数统计
  updateKeyOccurrences(props.paramsArguments);
};
</script>

<style scoped>
.parameter-table :deep(.parameter-key-field.resource-field) { display: block; padding: 0; margin: 0; }
.parameter-table-wrapper { width: 100%; overflow-x: auto; border: 1px solid var(--ui-border); border-radius: var(--ui-radius); }
.parameter-table { width: 100%; table-layout: fixed; border-collapse: collapse; font-size: 14px; }
.parameter-table th { background: var(--ui-bg-muted); color: var(--ui-text-muted); font-weight: 500; text-align: left; }
.parameter-table th, .parameter-table td { padding: 12px; vertical-align: top; }
.parameter-table td { border-top: 1px solid var(--ui-border); }
.parameter-table .parameter-actions { width: 100px; text-align: right; }
.duplicate-key-row { background: color-mix(in srgb, var(--ui-error) 5%, transparent); }
@media (max-width: 600px) {
  .parameter-table th, .parameter-table td { padding: 8px; }
  .parameter-table .parameter-actions { width: 84px; }
}
</style>
