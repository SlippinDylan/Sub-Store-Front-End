<template>
  <WorkspaceModal
    :visible="true"
    :title="
      action
        ? `${$t('subscriptionEditor.editAction')} · ${$t(`editorPage.subConfig.nodeActions['${action.type}'].label`)}`
        : $t('editorPage.subConfig.actions.addAction.title')
    "
    :dismissible="false"
    :busy="isBusy"
    @update:visible="requestClose"
  >
    <ResourceForm ref="ruleForm" class="action-step-fields" :inert="isBusy" :aria-busy="isBusy">
      <ResourceField :label="$t('subscriptionEditor.actionType')">
        <USelect
          :model-value="selectedType"
          :disabled="!!action"
          :items="
            options.map((item) => ({ label: item.text, value: item.value }))
          "
          :placeholder="$t('subscriptionEditor.chooseActionType')"
          class="w-full"
          @update:model-value="requestTypeChange"
        />
      </ResourceField>
      <template v-if="draftAction">
        <ResourceField :label="$t('subscriptionEditor.actionName')">
          <FieldInput
            v-model="draftForm.process[0].customName"
            :placeholder="
              options.find((item) => item.value === selectedType)?.text
            "
          />
        </ResourceField>
        <Component
          :is="draftAction.component"
          :key="draftAction.id"
          ref="fields"
          :id="draftAction.id"
          :type="draftAction.type"
          :source-type="sourceType"
          flat-fields
        />
      </template>
      <p v-else class="py-8 text-center text-sm text-muted">
        {{ $t("subscriptionEditor.chooseAction") }}
      </p>
    </ResourceForm>
    <template #footer>
      <UButton
        size="sm"
        v-if="!action"
        @click="requestImport"
        :disabled="isBusy"
        icon="i-lucide-clipboard-paste"
        color="neutral"
        variant="ghost"
        class="mr-auto shrink-0 whitespace-nowrap"
      >
        {{ $t("editorPage.subConfig.actions.pasteAction.label") }}
      </UButton>
      <UButton
        size="sm"
        @click="requestClose"
        :disabled="isBusy"
        color="neutral"
        variant="outline"
        class="shrink-0 whitespace-nowrap"
      >
        {{ $t("specificWord.cancel") }}
      </UButton>
      <UButton
        size="sm"
        @click="confirm"
        :disabled="isBusy || !draftAction"
        class="shrink-0 whitespace-nowrap"
      >
        {{ action ? $t("workspace.save") : $t("workspace.add") }}
      </UButton>
    </template>
  </WorkspaceModal>
</template>
<script setup lang="ts">
import {
  computed,
  inject,
  nextTick,
  onBeforeUnmount,
  watchEffect,
  provide,
  reactive,
  ref,
} from "vue";
import { useI18n } from "vue-i18n";
import { Dialog } from "@/services/feedback";
import { actionDraftDirtyKey, actionDialogKey } from "./actionDraft";
import ResourceForm from "@/components/ui/ResourceForm.vue";
import WorkspaceModal from "@/components/WorkspaceModal.vue";
import { addItem } from "@/utils/actionsOperate";
import { useCodeStore } from "@/store/codeStore";

const props = defineProps<{
  options: { text: string; value: string }[];
  action?: Process;
  sourceType?: string;
}>();
const emit = defineEmits<{
  (event: "cancel"): void;
  (event: "import"): void;
  (event: "confirm", action: Process): void;
}>();
const { t } = useI18n();
const parentForm = inject<Sub | Collection>("form");
const draftForm = reactive({ ...parentForm, process: [] as Process[] });
provide("form", draftForm);
provide(actionDialogKey, true);
const draftActions = reactive<ActionModuleProps[]>([]);
const preview = reactive<Array<[string, boolean]>>([]);
const draftAction = computed(() => draftActions[0]);
const selectedType = ref(props.action?.type);
const fields = ref<{
  isBusy?: boolean;
  commitPending?: () => void;
  getDraftState?: () => unknown;
}>();
const ruleForm = ref<InstanceType<typeof ResourceForm>>();
const isBusy = computed(() => fields.value?.isBusy ?? false);
const pageDraftDirty = inject(actionDraftDirtyKey);
const baseline = ref<string>();
const snapshot = () =>
  JSON.stringify({
    process: draftForm.process,
    pending: fields.value?.getDraftState?.(),
    code: draftAction.value
      ? codeStore.EditCode[draftAction.value.id]
      : undefined,
  });
const dirty = computed(
  () => baseline.value !== undefined && snapshot() !== baseline.value,
);
watchEffect(() => {
  if (pageDraftDirty) pageDraftDirty.value = dirty.value || isBusy.value;
});
const codeStore = useCodeStore();
const draftCodeIds: string[] = [];
const clearDraft = () => {
  draftForm.process.splice(0);
  draftActions.splice(0);
  preview.splice(0);
};
const selectType = async (type = selectedType.value) => {
  baseline.value = undefined;
  selectedType.value = type;
  clearDraft();
  addItem(
    draftForm,
    draftActions,
    preview,
    [
      {
        value: selectedType.value,
        ...(props.action ? JSON.parse(JSON.stringify(props.action)) : {}),
      },
    ],
    t,
  );
  draftCodeIds.push(draftActions[0].id);
  await nextTick();
  await nextTick();
  baseline.value = snapshot();
  await ruleForm.value?.setErrors([]);
};
let pendingConfirmation: Promise<boolean> | undefined;
const confirmDiscard = (switchingType = false) => {
  if (!dirty.value) return Promise.resolve(true);
  if (pendingConfirmation) return pendingConfirmation;
  pendingConfirmation = new Promise<boolean>((resolve) => {
    Dialog({
      title: t(
        switchingType
          ? "actionValidation.switchTypeTitle"
          : "subscriptionEditor.unsavedTitle",
      ),
      content: t(
        switchingType
          ? "actionValidation.switchTypeDescription"
          : "subscriptionEditor.unsavedDescription",
      ),
      okText: t(
        switchingType
          ? "actionValidation.discardAndSwitch"
          : "subscriptionEditor.discard",
      ),
      cancelText: t("subscriptionEditor.keepEditing"),
      closeOnClickOverlay: false,
      onOk: () => resolve(true),
      onClosed: () => resolve(false),
    });
  }).finally(() => {
    pendingConfirmation = undefined;
  });
  return pendingConfirmation;
};
const requestClose = async () => {
  if (isBusy.value) return;
  if (await confirmDiscard()) emit("cancel");
};
const requestImport = async () => {
  if (isBusy.value) return;
  if (await confirmDiscard()) emit("import");
};
const requestTypeChange = async (type: string) => {
  if (isBusy.value || type === selectedType.value || !(await confirmDiscard(true))) return;
  await selectType(type);
};
const confirm = async () => {
  if (isBusy.value || !ruleForm.value) return;
  const result = await ruleForm.value.validate();
  if (isBusy.value || !result.valid) return;
  fields.value?.commitPending?.();
  await nextTick();
  emit("confirm", JSON.parse(JSON.stringify(draftForm.process[0])));
};
if (props.action) selectType();
onBeforeUnmount(() => {
  if (pageDraftDirty) pageDraftDirty.value = false;
  for (const id of draftCodeIds) {
    delete codeStore.EditCode[id];
    delete codeStore.CodeClear[id];
  }
});
</script>

<style scoped>
.action-step-fields :deep(.resource-field) {
  display: grid;
  grid-template-columns: 140px minmax(0, 1fr);
  align-items: start;
  gap: 20px;
  padding: 12px 0;
  margin: 0;
}
.action-step-fields :deep(.resource-field + .resource-field) {
  border-top: 1px solid var(--ui-border);
}
.action-step-fields :deep(.resource-field > [data-slot="wrapper"]) {
  padding: 6px 0 0;
  font-size: 14px;
}
.action-step-fields :deep(.resource-field label) {
  font-weight: 400;
}
.action-step-fields :deep(.resource-field > div:last-child) {
  min-width: 0;
  margin: 0;
}
.action-step-fields :deep(.input-wrapper),
.action-step-fields :deep(.compact-input-wrapper),
.action-step-fields :deep(.compact-textarea-wrapper) {
  width: 100%;
  max-width: none;
}
.action-step-fields :deep(.regex-draft-actions) {
  margin-left: 160px;
  padding-right: 0;
  padding-left: 0;
}
@media (max-width: 600px) {
  .action-step-fields :deep(.resource-field) {
    grid-template-columns: minmax(0, 1fr);
    gap: 8px;
  }
  .action-step-fields :deep(.regex-draft-actions) {
    margin-left: 0;
  }
}
</style>
