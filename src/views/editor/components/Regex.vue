<template>
  <div class="editor-action-card">
    <ResourceField
      v-if="type === 'Regex Filter' || type === 'Regex Sort Operator'"
      :label="$t(`editorPage.subConfig.nodeActions['${type}'].des[1]`)"
    >
      <ChoiceGroup direction="horizontal" v-model="mode">
        <ChoiceOption
          v-for="(key, index) in opt[type]"
          :label="key"
          :key="index"
        >
          {{
            $t(`editorPage.subConfig.nodeActions['${type}'].options[${index}]`)
          }}
        </ChoiceOption>
      </ChoiceGroup>
    </ResourceField>
    <ResourceField
      prop="regex"
      :rules="[{ validator: () => !regexError, message: regexError }]"
      :label="$t(`editorPage.subConfig.nodeActions['${type}'].des[0]`)"
    >
      <div class="min-w-0 space-y-3">
        <draggable
          v-if="dragData.length"
          item-key="id"
          v-model="dragData"
          :force-fallback="true"
          :scroll="true"
          :chosen-class="'chosentag'"
        >
          <template #item="{ element, index }">
            <TagChip
              @click="onClickTag"
              class="tag-item mr-2 mb-2"
              closeable
              @close="deleteRegexItem(index)"
            >
              <span class="whitespace-pre-wrap break-all">
                {{
                  type === "Regex Rename Operator"
                    ? `${element.value.expr} ⇒ ${element.value.now}`
                    : element.value
                }}
              </span>
            </TagChip>
          </template>
        </draggable>
        <FieldTextarea
          v-model="input1"
          :rows="3"
          :autosize="{ minHeight: 88, maxHeight: 280 }"
          class="font-mono"
          :aria-label="$t(`editorPage.subConfig.nodeActions['${type}'].des[0]`)"
          :placeholder="
            $t(`editorPage.subConfig.nodeActions['${type}'].placeholder[0]`)
          "
        />
      </div>
    </ResourceField>
    <ResourceField
      v-if="type === 'Regex Rename Operator'"
      :label="$t('subscriptionEditor.replacement')"
    >
      <FieldTextarea
        v-model="input2"
        :rows="3"
        :autosize="{ minHeight: 88, maxHeight: 280 }"
        :placeholder="
          $t(`editorPage.subConfig.nodeActions['${type}'].placeholder[1]`)
        "
      />
    </ResourceField>
    <div class="regex-draft-actions">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <p class="text-xs text-muted">
          {{ $t("subscriptionEditor.ruleDraftHint") }}
        </p>
        <UButton
          @click="addItem"
          :disabled="!input1"
          icon="i-lucide-plus"
          size="sm"
          color="neutral"
          variant="outline"
        >
          {{ $t("subscriptionEditor.addRule") }}
        </UButton>
      </div>
    </div>
  </div>
</template>


<script lang="ts" setup>
  import { Dialog } from '@/services/feedback';
  import { inject, onMounted, ref, watch, computed } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { onBeforeRouteLeave } from "vue-router";
  import { actionDialogKey } from "../actionDraft";
  import { getRegexError } from "../actionValidation";
  import { formContextKey } from "@/components/ui/form";
  import draggable from "vuedraggable";
  
  const { t } = useI18n();
  const validation = inject(formContextKey, null);
  const inActionDialog = inject(actionDialogKey, false);
  const { type, id } = defineProps<{
    type: string;
    id: string;
  }>();

  const form = inject<Sub | Collection>('form');

  // 此处 key 需要与 i18n 的 actions 中的 key 相同
  // 值的次序需要与该选项的 options 值 顺序相同
  const opt = {
    'Regex Filter': [0, 1],
    'Regex Sort Operator': ['asc', 'desc', 'original'],
  };

  const input1 = ref('');
  const input2 = ref('');

  const regexError = computed(() => {
    if (!input1.value && input2.value) return t("actionValidation.expressionRequired");
    const expressions: string[] = (value.value || []).map(item => type === "Regex Rename Operator" ? item.expr : item);
    if (input1.value) expressions.push(input1.value);
    for (const expression of expressions) {
      const error = getRegexError(expression);
      if (error) return t("actionValidation.invalidRegex", { expression, error });
    }
    return "";
  });
  const mode = ref();
  const value = ref();
  const dragData = computed({
    get() {
      return Array.isArray(value.value) ? value.value.map((item, index) => ({
        id: index + JSON.stringify(item),
        value: item,
      })) : []
    },
    set(val) {
      val.map((item, index) => {
        value.value[index] = item.value
      })
    }
  })

  const onClickTag = el => {
    const index = [...el.currentTarget.parentElement.children].indexOf(
      el.currentTarget
    );
    if (input1.value || input2.value) {
      Dialog({
        title: t('editorPage.subConfig.pop.clickTag.title'),
        content: t('editorPage.subConfig.pop.clickTag.content'),
        popClass: 'auto-dialog',
        okText: t(`editorPage.subConfig.pop.clickTag.confirm`),
        cancelText: t(`editorPage.subConfig.pop.clickTag.cancel`),
        onOk: () => editTag(index),
        // onCancel: () => resolve(false),
        // @ts-ignore
        closeOnClickOverlay: true,
      });
    } else {
      editTag(index);
    }
  };

  const editTag = index => {
    const oldValue = value.value[index];

    value.value.splice(index, 1);
    if (type === 'Regex Rename Operator') {
      input1.value = oldValue.expr;
      input2.value = oldValue.now;
    } else {
      input1.value = oldValue;
    }
  };

  const deleteRegexItem = index => {
    value.value.splice(index, 1);
  };

  const addItem = () => {
    if (!input1.value) return;
    if (regexError.value) {
      if (validation) validation.errors.value = [{ prop: "regex", message: regexError.value }];
      return;
    }
    if (validation) validation.errors.value = validation.errors.value.filter(error => error.prop !== "regex");
    if (type === 'Regex Rename Operator') {
      value.value.push({
        expr: input1.value,
        now: input2.value,
      });
    } else {
      value.value.push(input1.value);
    }
    input1.value = '';
    input2.value = '';
  };

  // 挂载时将 value 值指针指向 form 对应的数据
  onMounted(() => {
    const item = form.process.find(item => item.id === id);
    if (item) {
      switch (type) {
        case 'Regex Filter':
          value.value = item.args.regex;
          mode.value = item.args.keep ? 0 : 1;
          break;
        case 'Regex Sort Operator':
          const order = item.args?.order || 'asc';
          let expressions = item.args?.expressions;
          if (Array.isArray(item.args)) {
              expressions = item.args;
          }
          if (!Array.isArray(expressions)) {
              expressions = [];
          }
          item.args = { order, expressions };
          value.value = item.args.expressions;
          mode.value = item.args.order;
          break;
        default:
          value.value = item.args;
          break;
      }
    }
  });

  watch(mode, () => {
    const item = form.process.find(item => item.id === id);
    if (item && type === 'Regex Filter') {
      item.args.keep = !mode.value;
    }
    if (item && type === 'Regex Sort Operator') {
      item.args.order = mode.value;
    }
  });

  onBeforeRouteLeave(() => {
    if (inActionDialog || (!input1.value && !input2.value)) return true;
    return new Promise<boolean>(resolve => {
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
  defineExpose({
    commitPending: () => { if (input1.value) addItem(); },
    getDraftState: () => ({ expression: input1.value, replacement: input2.value }),
  });
</script>

<style lang="scss" scoped>
.regex-draft-actions {
  margin-left: 184px;
  padding: 0 16px 12px;
}
@media (max-width: 600px) {
  .regex-draft-actions { margin-left: 0; }
}
.tag-item { max-width: 100%; cursor: pointer; }
.chosentag { box-shadow: 0 0 5px var(--ui-primary); }
</style>
