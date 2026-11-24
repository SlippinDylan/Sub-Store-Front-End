<template>
  <div class="editor-action-card">
    <ResourceField
      v-if="type === 'Regex Filter' || type === 'Regex Sort Operator'"
      :label="$t(`editorPage.subConfig.nodeActions['${type}'].des[1]`)"
    >
      <ChoiceGroup v-model="mode" direction="horizontal">
        <ChoiceOption
          v-for="(option, index) in modeOptions"
          :key="option"
          :label="option"
        >
          {{ $t(`editorPage.subConfig.nodeActions['${type}'].options[${index}]`) }}
        </ChoiceOption>
      </ChoiceGroup>
    </ResourceField>
    <Draggable
      v-model="rules"
      item-key="id"
      handle=".regex-rule-handle"
      :disabled="rules.length < 2"
      :force-fallback="true"
      class="divide-y divide-default"
    >
      <template #item="{ element, index }">
        <ResourceField
          :prop="`regex-${id}-${element.id}`"
          :label="expressionLabel"
          :rules="[{ validator: () => !getRuleError(element), message: getRuleError(element) }]"
        >
          <div class="flex items-start gap-2">
            <div class="min-w-0 flex-1 space-y-3">
              <FieldTextarea
                v-model="element.expression"
                :rows="2"
                :autosize="{ maxHeight: 280 }"
                :aria-label="expressionLabel"
                :placeholder="expressionPlaceholder"
                :spellcheck="false"
                class="font-mono"
              />
              <UFormField v-if="isRename" :label="$t('subscriptionEditor.replacement')">
                <FieldTextarea
                  v-model="element.replacement"
                  :rows="2"
                  :autosize="{ maxHeight: 280 }"
                  :placeholder="$t(`editorPage.subConfig.nodeActions['${type}'].placeholder[1]`)"
                  :spellcheck="false"
                  class="font-mono"
                />
              </UFormField>
            </div>
            <div class="flex shrink-0 items-center">
              <UButton
                type="button"
                icon="i-lucide-x"
                size="sm"
                color="neutral"
                variant="ghost"
                :aria-label="$t('subscriptionEditor.deleteRule')"
                @click="rules.splice(index, 1)"
              />
              <span
                v-if="rules.length > 1"
                :title="$t('subscriptionEditor.dragAction')"
                class="regex-rule-handle inline-flex cursor-grab p-2 text-muted"
              >
                <UIcon name="i-lucide-grip-vertical" class="size-4" />
              </span>
            </div>
          </div>
        </ResourceField>
      </template>
    </Draggable>
    <div class="regex-draft-actions">
      <UButton
        type="button"
        icon="i-lucide-plus"
        size="sm"
        color="neutral"
        variant="outline"
        @click="rules.push(createRule())"
      >
        {{ $t("subscriptionEditor.addRule") }}
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { onBeforeRouteLeave } from "vue-router";
import Draggable from "vuedraggable";
import { Dialog } from "@/services/feedback";
import { actionDialogKey } from "../actionDraft";

type SavedRule = string | { expr: string; now: string };
type EditableRule = {
  id: number;
  expression: string;
  replacement: string;
  originalExpression?: string;
};

const { type, id } = defineProps<{ type: string; id: string }>();
const { t } = useI18n();
const form = inject<Sub | Collection>("form");
const inActionDialog = inject(actionDialogKey, false);
const action = form.process.find((item) => item.id === id);
const isFilter = type === "Regex Filter";
const isRename = type === "Regex Rename Operator";
const modeOptions = isFilter ? [0, 1] : ["asc", "desc", "original"];
const mode = computed({
  get: () => {
    const { keep = true, order } = action.args;
    return isFilter ? (keep ? 0 : 1) : order;
  },
  set: (option) => {
    if (isFilter) action.args.keep = option === 0;
    else action.args.order = option;
  },
});

const expressionLabel = computed(() =>
  t(`editorPage.subConfig.nodeActions['${type}'].des[0]`),
);
const expressionPlaceholder = computed(() =>
  t(`editorPage.subConfig.nodeActions['${type}'].placeholder[0]`),
);

const getSavedRules = (): SavedRule[] => {
  if (isFilter) return action.args.regex ??= [];
  if (type === "Regex Sort Operator") {
    const args = action.args;
    const expressions = Array.isArray(args) ? args : args.expressions;
    action.args = {
      order: args.order || "asc",
      expressions: Array.isArray(expressions) ? expressions : [],
    };
    return action.args.expressions;
  }
  return action.args;
};

let nextRuleId = 0;
const createRule = (saved?: SavedRule): EditableRule => {
  const originalExpression = typeof saved === "string" ? saved : saved?.expr;
  return {
    id: nextRuleId++,
    expression: originalExpression ?? "",
    replacement: typeof saved === "object" ? saved.now : "",
    originalExpression,
  };
};

const savedRules = getSavedRules();
const rules = ref(savedRules.length ? savedRules.map(createRule) : [createRule()]);

const getRuleError = ({ expression, replacement, originalExpression }: EditableRule) => {
  if (expression || originalExpression === "") return "";
  if (originalExpression !== undefined) return t("actionValidation.fillOrRemove");
  return replacement ? t("actionValidation.expressionRequired") : "";
};

const configuredRules = computed(() =>
  rules.value.filter(({ expression, replacement, originalExpression }) =>
    expression || replacement || originalExpression !== undefined,
  ),
);
const getDraftState = () =>
  configuredRules.value.map(({ expression, replacement }) => [expression, replacement]);

const commitPending = () => {
  const next = configuredRules.value.map(({ expression, replacement }) =>
    isRename ? { expr: expression, now: replacement } : expression,
  );
  savedRules.splice(0, savedRules.length, ...next);
};

if (!inActionDialog) {
  let committedDraft = JSON.stringify(getDraftState());
  watch(rules, () => {
    if (rules.value.some(getRuleError)) return;
    commitPending();
    committedDraft = JSON.stringify(getDraftState());
  }, { deep: true });
  onBeforeRouteLeave(() => {
    if (JSON.stringify(getDraftState()) === committedDraft) return true;
    return new Promise<boolean>((resolve) => {
      Dialog({
        title: t("subscriptionEditor.unsavedTitle"),
        content: t("subscriptionEditor.unsavedDescription"),
        okText: t("subscriptionEditor.discard"),
        cancelText: t("subscriptionEditor.keepEditing"),
        onOk: () => resolve(true),
        onClosed: () => resolve(false),
        closeOnClickOverlay: false,
      });
    });
  });
}

defineExpose({ commitPending, getDraftState });
</script>

<style scoped>
.regex-draft-actions {
  margin-left: 184px;
  padding: 0 16px 12px;
}
@media (max-width: 600px) {
  .regex-draft-actions { margin-left: 0; }
}
</style>
