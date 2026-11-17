<template>
  <div
    class="form-block-wrapper"
    :inert="isPasting"
    :aria-busy="isPasting"
    :class="{ 'action-workspace': compactPalette }"
  >
    <div
      v-if="compactPalette"
      class="action-workspace-header flex flex-wrap items-center gap-3"
    >
      <div class="mr-auto flex items-center gap-1">
        <h2 class="text-sm font-semibold">{{ $t(actionsTitleKey) }}</h2>
        <HelpTip v-if="sourceType !== 'file'" :help="popActionsHelp()" />
      </div>
      <UButton @click="openActionEditor()" icon="i-lucide-plus" size="sm">
        {{ $t("editorPage.subConfig.actions.addAction.title") }}
      </UButton>
    </div>
    <div v-else class="sticky-title-wrapper actions-title-wrapper">
      <span class="field-label-with-help">
        <p>{{ $t(actionsTitleKey) }}</p>
        <HelpTip v-if="sourceType !== 'file'" :help="popActionsHelp()" />
      </span>
      <UIcon
        mode="svg"
        v-if="isCollapsed"
        @click.stop="setCollapsed(false)"
        class="toggle"
        name="i-lucide-toggle-right"
      />
      <UIcon
        mode="svg"
        v-else
        @click.stop="setCollapsed(true)"
        class="toggle"
        name="i-lucide-toggle-left"
      />
    </div>
    <p
      v-if="compactPalette && !list.length"
      class="py-8 px-4 text-center text-sm text-muted"
    >
      {{ $t("subscriptionEditor.noActions") }}
    </p>
    <Draggable
      v-if="list.length > 0"
      class="list-group"
      tag="ul"
      :component-data="{
        tag: 'ul',
        name: drag ? 'flip-list' : null,
      }"
      :scroll-sensitivity="200"
      :force-fallback="true"
      :scroll="true"
      :list="list"
      :scrollSpeed="8"
      v-bind="{
        animation: 200,
        disabled: false,
        ghostClass: 'ghost',
        chosenClass: 'chosen',
        dragClass: 'dragging',
        delay: 0,
        handle: '.drag-handler',
      }"
      @end="drag = false"
      @start="drag = true"
      item-key="id"
    >
      <template #item="{ element, index }">
        <UCard
          v-if="compactPalette"
          as="li"
          class="action-step-card"
          :ui="{
            header: 'px-4 py-3 sm:px-4',
            body: 'p-0 sm:p-0',
          }"
        >
          <template #header>
            <div class="action-step-header">
              <div class="action-step-heading">
                <div class="flex items-center gap-1">
                  <h3 class="text-sm font-semibold break-words">
                    {{ index + 1 }}.
                    {{
                      getProcess(element.id).customName ||
                      findNameByType(element.type)
                    }}
                  </h3>
                  <HelpTip :help="pop(element.type, element.tipsDes)" />
                </div>
                <p
                  v-if="getProcess(element.id).customName"
                  class="mt-1 text-xs text-muted"
                >
                  {{ findNameByType(element.type) }}
                </p>
              </div>
              <div class="action-step-toolbar">
                <UButton
                  @click="openActionEditor(element)"
                  icon="i-lucide-square-pen"
                  size="sm"
                  color="neutral"
                  variant="ghost"
                >
                  {{ $t("subscriptionEditor.editAction") }}
                </UButton>
                <SelectionOption v-model="element.enabled" size="sm">
                  {{ $t("editorPage.subConfig.actions.enable") }}
                </SelectionOption>
                <div class="action-step-tools">
                  <UButton
                    @click="copyItem(element)"
                    icon="i-lucide-copy"
                    :aria-label="$t('subscriptionEditor.copyAction')"
                    size="sm"
                    color="neutral"
                    variant="ghost"
                  >
                    {{ $t("subscriptionEditor.copyAction") }}
                  </UButton>
                  <UButton
                    @click="deleteItem(element.id)"
                    icon="i-lucide-trash-2"
                    :aria-label="$t('subscriptionEditor.deleteAction')"
                    size="sm"
                    color="error"
                    variant="ghost"
                  >
                    {{ $t("subscriptionEditor.deleteAction") }}
                  </UButton>
                  <UButton
                    @click="moveAction(index, -1)"
                    :disabled="index === 0"
                    icon="i-lucide-chevron-up"
                    :aria-label="$t('subscriptionEditor.moveUp')"
                    size="sm"
                    color="neutral"
                    variant="ghost"
                  />
                  <UButton
                    @click="moveAction(index, 1)"
                    :disabled="index === list.length - 1"
                    icon="i-lucide-chevron-down"
                    :aria-label="$t('subscriptionEditor.moveDown')"
                    size="sm"
                    color="neutral"
                    variant="ghost"
                  />
                  <span
                    class="drag-handler inline-flex p-2 text-muted"
                    :title="$t('subscriptionEditor.dragAction')"
                  >
                    <UIcon name="i-lucide-grip-vertical" class="size-4" />
                  </span>
                </div>
              </div>
            </div>
          </template>
          <ActionSummary :action="getProcess(element.id)" />
        </UCard>
        <SettingsRow v-else class="list-group-item">
          <div
            :class="{
              'list-group-item-title': true,
              collapsed: collapsedElements.includes(element.id),
            }"
          >
            <div class="title-text left">
              <span
                class="collapsed"
                @click="toggleElementCollapsed(element.id)"
              >
                <AppIcon
                  v-if="!collapsedElements.includes(element.id)"
                  name="rect-down"
                  size="12px"
                ></AppIcon>
                <AppIcon
                  v-if="collapsedElements.includes(element.id)"
                  name="rect-right"
                  size="12px"
                ></AppIcon>
              </span>
              <div class="input-wrapper">
                <FieldInput
                  :id="`action-input-${element.id}`"
                  @click.stop
                  v-model="findEditItemById(element).customName"
                  class="custom-name-input"
                  type="text"
                  :readonly="!findEditItemById(element).isEditing"
                  :placeholder="findEditItemById(element).defaultName"
                  @blur="saveEditName(element)"
                  @keyup.enter="saveEditName(element)"
                  @click="toggleInput(element)"
                >
                  <!-- <template #button>
                    <div class="list-group-item-icons">
                      <template v-if="!findEditItemById(element).isEditing">
                        <UIcon mode="svg" class="size-4 shrink-0 align-middle" name="i-lucide-square-pen" @click.stop="toggleEditName(element)" />
                      </template>
                      <template v-else>
                        <UIcon mode="svg" class="size-4 shrink-0 align-middle" name="i-lucide-save" @click.stop="saveEditName(element)" />
                        <UIcon mode="svg" class="size-4 shrink-0 align-middle" name="i-lucide-ban" @click.stop="exitEditName(element)" />
                      </template>
                      <UIcon mode="svg" class="size-4 shrink-0 align-middle" name="i-lucide-circle-help" @click.stop="pop(element.type, element.tipsDes)" />
                    </div>
                  </template> -->
                </FieldInput>
                <HelpTip :help="pop(element.type, element.tipsDes)" />
                <!-- <div
                  v-if="!findEditItemById(element).isEditing"
                  class="input-overlay"
                  @click="toggleElementCollapsed(element.id)"
                ></div> -->
              </div>
              <!-- <div class="list-group-item-icons">
                <template v-if="!findEditItemById(element).isEditing">
                  <UIcon mode="svg" class="size-4 shrink-0 align-middle" name="i-lucide-square-pen" @click.stop="toggleEditName(element)" />
                </template>
                <template v-else>
                  <UIcon mode="svg" class="size-4 shrink-0 align-middle" name="i-lucide-save" @click.stop="saveEditName(element)" />
                  <UIcon mode="svg" class="size-4 shrink-0 align-middle" name="i-lucide-ban" @click.stop="exitEditName(element)" />
                </template>
                <UIcon mode="svg" class="size-4 shrink-0 align-middle" name="i-lucide-circle-help" @click.stop="pop(element.type, element.tipsDes)" />
              </div> -->
            </div>
            <div class="right">
              <div class="list-group-item-icons icon-button__input">
                <template v-if="!findEditItemById(element).isEditing">
                  <UIcon
                    mode="svg"
                    class="size-4 shrink-0 align-middle"
                    name="i-lucide-square-pen"
                    @click.stop="toggleEditName(element)"
                  />
                </template>
                <template v-else>
                  <UIcon
                    mode="svg"
                    class="size-4 shrink-0 align-middle"
                    name="i-lucide-save"
                    @click.stop="saveEditName(element)"
                  />
                  <UIcon
                    mode="svg"
                    class="size-4 shrink-0 align-middle"
                    name="i-lucide-ban"
                    @click.stop="exitEditName(element)"
                  />
                </template>
              </div>
              <div class="action-switch">
                <SelectionOption
                  v-model="element.enabled"
                  class="my-switch"
                ></SelectionOption>
                <span @click="toggleActionSwitch(element.id)">
                  {{ $t(`editorPage.subConfig.actions.enable`) }}
                </span>
              </div>
              <div
                v-if="isPreviewSwitchDisabled(element)"
                class="preview-switch-popover"
                @mouseenter="showPreviewTooltip(element.id)"
                @mouseleave="hidePreviewTooltip(element.id)"
                @focusin="showPreviewTooltip(element.id)"
                @focusout="hidePreviewTooltip(element.id)"
              >
                <UPopover
                  v-model:open="previewTooltipVisible[element.id]"
                  arrow
                >
                  <template #default>
                    <div
                      class="preview-switch preview-switch--disabled"
                      @click.stop="showPreviewTooltip(element.id)"
                    >
                      <SelectionOption
                        v-model="getItem(element.id)[1]"
                        disabled
                        class="my-switch"
                      ></SelectionOption>
                      <span>
                        {{ $t(`editorPage.subConfig.basic.previewSwitch`) }}
                      </span>
                    </div>
                  </template>
                  <template #content>
                    <span class="preview-switch-tooltip">
                      {{
                        $t(
                          `editorPage.subConfig.basic.previewDisabledResponseOnlyTips`,
                        )
                      }}
                    </span>
                  </template>
                </UPopover>
              </div>
              <div v-else class="preview-switch">
                <SelectionOption
                  v-model="getItem(element.id)[1]"
                  class="my-switch"
                ></SelectionOption>
                <span @click="togglePreviewSwitch(element)">
                  {{ $t(`editorPage.subConfig.basic.previewSwitch`) }}
                </span>
              </div>
              <div class="icon-button">
                <UIcon
                  mode="svg"
                  class="size-4 shrink-0 align-middle"
                  name="i-lucide-copy"
                  @click="copyItem(element)"
                ></UIcon>
              </div>
              <div class="delete">
                <UIcon
                  mode="svg"
                  class="size-4 shrink-0 align-middle"
                  name="i-lucide-trash-2"
                  @click="deleteItem(element.id)"
                />
              </div>
              <div class="drag-handler">
                <UIcon
                  mode="svg"
                  name="i-lucide-grip-vertical"
                  class="size-5"
                />
              </div>
            </div>
          </div>
          <Component
            v-show="!collapsedElements.includes(element.id)"
            :is="element.component"
            :type="element.type"
            :id="element.id"
            :sourceType="sourceType"
          />
        </SettingsRow>
      </template>
    </Draggable>

    <!-- <UButton class="add-action-btn" @click="onClickAddBtn" color="neutral" variant="outline"> -->
    <!-- <span class="add-action-btn"
        ><UIcon mode="svg" class="size-4 shrink-0 align-middle" name="i-lucide-plus" />{{
          $t(`editorPage.subConfig.actions.addAction.title`)
        }}</span
      > -->
    <!-- </UButton> -->

    <SettingsRow
      v-if="!compactPalette"
      class="list-group-itemsa"
      :class="{ 'list-group-itemsa--compact': isActionButtonsCompact }"
    >
      <div class="list-group-item-titlesa">
        <div class="add-action-title">
          <span>{{ $t(`editorPage.subConfig.actions.addAction.title`) }}</span>
          <HelpTip v-if="sourceType !== 'file'" :help="popActionsHelp()" />
        </div>
        <label class="action-buttons-mode-select">
          <USelect
            v-model="actionButtonsDisplayMode"
            :items="
              actionButtonsDisplayModes.map((value) => ({
                value,
                label: $t(`moreSettingPage.actionButtons.${value}`),
              }))
            "
            :aria-label="$t(`moreSettingPage.actionButtons.title`)"
          />
        </label>
      </div>
      <div class="horizontal-button-container">
        <UButton
          v-for="(item, index) in columns"
          :key="index"
          @click="onButtonClick(item)"
          class="custom-button"
          :size="isActionButtonsCompact ? 'xs' : 'sm'"
          color="neutral"
          variant="outline"
        >
          {{ item.text }}
        </UButton>
        <UButton
          @click="paste"
          class="custom-button"
          :size="isActionButtonsCompact ? 'xs' : 'sm'"
          color="neutral"
          variant="outline"
        >
          {{ $t(`editorPage.subConfig.actions.pasteAction.label`) }}
        </UButton>
      </div>
    </SettingsRow>
    <div v-if="actionTip" class="action-block-tip">
      <span>{{ actionTip }}</span>
      <a
        v-if="actionTipUrl"
        :href="actionTipUrl"
        target="_blank"
        rel="noopener noreferrer"
      >
        {{ actionTipLinkText }}
      </a>
    </div>
    <ActionEditorDialog
      v-if="actionPickerVisible"
      :options="columns"
      :action="editingAction"
      :source-type="sourceType"
      @cancel="actionPickerVisible = false"
      @import="
        actionPickerVisible = false;
        paste();
      "
      @confirm="saveAction"
    />
    <WorkspaceModal
      v-model:visible="showPasteboard"
      :title="$t(`editorPage.subConfig.actions.pasteAction.label`)"
    >
      <ResourceField>
        <FieldTextarea
          class="textarea-wrapper"
          v-model="pasteboard"
          :autosize="{ maxHeight: 110, minHeight: 50 }"
          :placeholder="
            $t(`editorPage.subConfig.actions.pasteAction.placeholder`)
          "
        />
      </ResourceField>
      <template #footer>
        <UButton
          @click="cancelPaste"
          class="custom-button"
          :size="isActionButtonsCompact ? 'xs' : 'sm'"
          color="neutral"
          variant="outline"
        >
          {{ $t(`editorPage.subConfig.actions.addAction.cancel`) }}
        </UButton>
        <UButton
          @click="paste"
          class="custom-button"
          :size="isActionButtonsCompact ? 'xs' : 'sm'"
          color="neutral"
          variant="outline"
        >
          {{ $t(`editorPage.subConfig.actions.pasteAction.label`) }}
        </UButton>
      </template>
    </WorkspaceModal>
  </div>
</template>
<script lang="ts" setup>
import WorkspaceModal from '@/components/WorkspaceModal.vue';
import ActionEditorDialog from './ActionEditorDialog.vue';
import ActionSummary from './ActionSummary.vue';
import i18nFile from '@/locales/zh';
import { Dialog, Toast } from '@/services/feedback';
import { ref, inject, reactive, watch, nextTick, computed, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import Draggable from 'vuedraggable';
import { storeToRefs } from 'pinia';
import { useMediaQuery } from '@vueuse/core';
import { copyText } from "@/utils/clipboard";
import { isMihomoConfigFileType } from "@/utils/fileType";
import { useSettingsStore } from '@/store/settings';
import { WIDE_SCREEN_NARROW_MODE_QUERY } from '@/hooks/useWideScreenNarrowMode';

const { t } = useI18n();
const settingsStore = useSettingsStore();
const { appearanceSetting } = storeToRefs(settingsStore);
const pasteboard = ref("");
const isPasting = ref(false);
let disposed = false;
onBeforeUnmount(() => { disposed = true; });
const showPasteboard = ref(false);
const drag = ref(true);
const actionPickerVisible = ref(false);
const editingAction = ref<Process>();
const getProcess = (id: string): Process => form.process.find((item: Process) => item.id === id);
const openActionEditor = (element?: ActionModuleProps) => {
  editingAction.value = element ? getProcess(element.id) : undefined;
  actionPickerVisible.value = true;
};
const saveAction = (action: Process) => {
  if (editingAction.value) {
    editingAction.value.args = action.args;
    editingAction.value.customName = action.customName;
  } else {
    emit('addAction', [{ value: action.type, args: action.args, customName: action.customName }]);
  }
  actionPickerVisible.value = false;
};
const moveAction = (index: number, direction: -1 | 1) => {
  const [action] = list.splice(index, 1);
  list.splice(index + direction, 0, action);
};
const isCollapsed = ref(localStorage.getItem('actions-block-collapsed') === '1');
const collapsedElements = ref([]);
const form = inject<any>('form');
// 列表渲染的数据
// 预览开关数组，数组第一项为 id，对应 list 中的同 id 项目，控制该 id 开启关闭预览
const { checked, list, sourceType, actionTip, actionTipUrl, actionTipLinkText, compactPalette = false } = defineProps<{
  checked: Array<[string, boolean]>;
  list: ActionModuleProps[];
  sourceType?: string;
  actionTip?: string;
  actionTipUrl?: string;
  actionTipLinkText?: string;
  compactPalette?: boolean;
}>();


const ADD_PROXIES_FROM_SUBSCRIPTION_OPERATOR = 'Add Proxies From Subscription Operator';
const FILE_ACTION_TYPES = [
  ADD_PROXIES_FROM_SUBSCRIPTION_OPERATOR,
  'Script Operator',
  'Response Transformer',
];
const isMihomoConfigFile = computed(
  () => sourceType === 'file' && isMihomoConfigFileType(form?.type),
);
const actionsTitleKey = computed(() =>
  sourceType === 'file'
    ? 'editorPage.subConfig.actions.fileLabel'
    : 'editorPage.subConfig.actions.label',
);
const isWideScreen = useMediaQuery(WIDE_SCREEN_NARROW_MODE_QUERY);
const actionButtonsDisplayModes: ActionButtonsDisplayMode[] = ['responsive', 'compact', 'loose'];
const actionButtonsDisplayMode = computed<ActionButtonsDisplayMode>({
  get: () => appearanceSetting.value.actionButtonsDisplayMode || 'responsive',
  set: (actionButtonsDisplayMode) => {
    settingsStore.changeAppearanceSetting({
      appearanceSetting: {
        actionButtonsDisplayMode,
      },
    });
  },
});
const isActionButtonsCompact = computed(() => {
  if (actionButtonsDisplayMode.value === 'compact') return true;
  if (actionButtonsDisplayMode.value === 'loose') return false;

  return !isWideScreen.value;
});

const allItems = computed(() => Object.keys(i18nFile.editorPage.subConfig.nodeActions).map(type => {
  return {
    text: t(`editorPage.subConfig.nodeActions['${type}'].label`),
    value: type,
  };
}));

const columns = computed(() => {
  if (sourceType !== 'file') {
    return allItems.value.filter(item => item.value !== ADD_PROXIES_FROM_SUBSCRIPTION_OPERATOR);
  }

  const fileActionTypes = isMihomoConfigFile.value
    ? FILE_ACTION_TYPES
    : FILE_ACTION_TYPES.filter(
      type => type !== ADD_PROXIES_FROM_SUBSCRIPTION_OPERATOR,
    );

  return fileActionTypes
    .map(type => allItems.value.find(item => item.value === type))
    .filter(Boolean);
});
if(isCollapsed.value) {
  collapsedElements.value = list.map((item) => item.id);
} else {
  collapsedElements.value = [];
}
const setCollapsed = (v) => {
  isCollapsed.value = v;
  if (v) {
    localStorage.setItem('actions-block-collapsed', '1')
    collapsedElements.value = list.map((item) => item.id);
  } else {
    localStorage.removeItem('actions-block-collapsed')
    collapsedElements.value = [];
  }
};
const toggleInput = (e) => {
  if (findEditItemById(e).isEditing) {
    return;
  } else {
    toggleElementCollapsed(e.id);
  }
};
const toggleElementCollapsed = (id) => {
  if (collapsedElements.value.includes(id)) {
    collapsedElements.value = collapsedElements.value.filter(item => item !== id);
  } else {
    collapsedElements.value.push(id);
  }
  if(collapsedElements.value.length === list.length) {
    setCollapsed(true)
  } else if(collapsedElements.value.length === 0){
    setCollapsed(false)
  } else {
    isCollapsed.value = false;
  }
};
const onButtonClick = (item) => {
  emit('addAction', [item]);
};

const copyItem = async element => {
  const item = form.process.find(item => item.id === element.id);
  const data = JSON.stringify({ source: sourceType, data: item })
  try {
    await copyText(data);
    Toast.text(`已复制数据 可用于导入`);
  } catch (error) {
    Toast.fail(t("globalNotify.copyFailed", { e: error?.message ?? String(error) }));
  }

};
const cancelPaste = async () => {
  showPasteboard.value = false
  pasteboard.value = ''
}
const paste = async () => {
  if (isPasting.value) return;
  isPasting.value = true;
  emit("update:busy", true);
  try {
    let text = ''
  if (showPasteboard.value) {
    text = pasteboard.value
    showPasteboard.value = false
    pasteboard.value = ''
  } else {
    try {
      text = await navigator.clipboard.readText()
      if (disposed) return;
    } catch (e) {
      if (disposed) return;
      console.error(e)
      pasteboard.value = ''
      showPasteboard.value = true
      return
    }
  }
  let item
  try {
    item = JSON.parse(text)
  } catch (e) {
    
  }
  // console.log(`item`, item)
  if (item?.data?.id && item?.data?.type) {
    if (item?.source !== sourceType) {
      throw new Error('文件操作与订阅操作不通用')
    }
    if (
      item.data.type === ADD_PROXIES_FROM_SUBSCRIPTION_OPERATOR &&
      !isMihomoConfigFile.value
    ) {
      throw new Error('该操作仅适用于 mihomo 配置文件')
    }
    const data = [{
      ...item.data,
      value: item.data.type,
    }]
    // console.log(data)
    emit('addAction', data);
  } else {
    throw new Error('数据格式错误')
  }
  } catch (e) {
    console.error(e)
    Toast.text(`导入失败 ${e.message ?? e}`);
  } finally {
    isPasting.value = false;
    if (!disposed) emit("update:busy", false);
  }
};
const emit = defineEmits(['update:busy', 'addAction', 'deleteAction', 'updateCustomNameModeFlag', 'toggleAction']);
// 示例数据
// const checked = reactive([
//   ['12839211', true],
// ])

// const list = [
//   {
//     id: '12839211',
//     type: 'Flag Operator',
//     component: ActionRadio as any,
//     tipsDes: '我是第一条提示',
//   },
// ]
const toggleActionSwitch = (id: string) => {
  emit('toggleAction', id);
};
const isPreviewSwitchDisabled = (element) => element.type === 'Response Transformer';
const previewTooltipVisible = reactive<Record<string, boolean>>({});
const showPreviewTooltip = (id: string) => {
  previewTooltipVisible[id] = true;
};
const hidePreviewTooltip = (id: string) => {
  previewTooltipVisible[id] = false;
};
// 获取绑定的对应预览开关
const getItem = (id: string) => {
  return checked.find(item => item[0] === id);
};
const togglePreviewSwitch = (element) => {
  if (isPreviewSwitchDisabled(element)) return;
  const item = getItem(element.id);
  return item[1] = !item[1];
};

// 删除条目，actionsList 中记录的顺序 和 对应预览开关
const deleteItem = id => {
  Dialog({
    title: t(`editorPage.subConfig.pop.deleteTitle`),
    content: t(`editorPage.subConfig.pop.deleteDes`),
    popClass: 'auto-dialog',
    okText: t(`editorPage.subConfig.pop.deleteConfirm`),
    cancelText: t(`editorPage.subConfig.pop.deleteCancel`),
    onOk: () => {
      emit('deleteAction', id);
    },
    // @ts-ignore
    closeOnClickOverlay: true,
  });
};

// 确认添加时 向渲染数组和预览数组添加对应项目
// const confirm = ({ _, selectedOptions }) => {
//   emit('addAction', selectedOptions);
// };

// 节点帮助弹窗
const popActionsHelp = () => ({
  title: t(`editorPage.subConfig.pop.helpTitle`),
  content: t(`editorPage.subConfig.pop.helpContent`),
});

// tips 弹窗
const pop = (type: string, tipsDes: string) => ({
  title: t(`editorPage.subConfig.nodeActions['${type}'].tipsTitle`),
  content: tipsDes,
});

// 操作名称自定义
const findNameByType = (type) =>
  allItems.value.find((item) => item.value === type)?.text || type;
const generateEditNameItem = (element) => {
  const { tipsDes, component, ...values } = element;
  return {
    defaultName: findNameByType(values.type),
    oldCustomName: values.customName,
    isEditing: false,
    ...values,
  };
};
const editNameList = reactive(list.map(generateEditNameItem));
const inCustomNameEditMode = computed(() =>
  editNameList.map((item) => item.isEditing).includes(true),
);

watch(() => list, (newV: ActionModuleProps[]) => {
  if (editNameList.length > newV.length) {
    // delete
    const elementsToDelete = editNameList.filter(
      (item) => !newV.some((newItem) => newItem.id === item.id),
    );
    elementsToDelete.forEach((element) => {
      const index = editNameList.findIndex((item) => item.id === element.id);
      if (index !== -1) {
        editNameList.splice(index, 1);
      }
    });
  } else {
    // add
    const elementsToAdd = newV.filter(
      (newItem) => !editNameList.some((item) => item.id === newItem.id),
    );
    elementsToAdd.forEach((element) => {
      editNameList.push(generateEditNameItem(element));
    });
  }
}, { deep: true }); // https://cn.vuejs.org/guide/essentials/watchers

watch(inCustomNameEditMode, (newV) => {
  emit('updateCustomNameModeFlag', newV);
});

const findEditItemById = (target) =>
  editNameList.find((item) => item.id === target.id);

const saveEditName = (element) => {
  const editItem = editNameList.find((item) => item.id === element.id);
  editItem.isEditing = false;
  if (/^\s*$/.test(editItem.customName)) {
    editItem.customName = "";
  }
  // stash
  editItem.oldCustomName = editItem.customName;
  form.process.find((item) => item.id === element.id).customName =
    editItem.customName;
};

const exitEditName = (element) => {
  const editItem = editNameList.find((item) => item.id === element.id);
  editItem.isEditing = false;
  if (editItem.oldCustomName !== editItem.customName) {
    editItem.customName = editItem.oldCustomName;
  }
};

const exitAllEditName = () => {
  editNameList.forEach((item) => {
    if (item.isEditing) {
      exitEditName(item);
    }
  });
};

// 操作名称编辑
const toggleEditName = (element) => {
  const editItem = editNameList.find((item) => item.id === element.id);
  editNameList.forEach((item) => {
    if (item.isEditing && item.id !== editItem.id) {
      // exit others
      exitEditName(item);
    }
  });
  editItem.isEditing = true;
  nextTick(() => {
    const inputWrapper = document.getElementById(`action-input-${element.id}`);
    const inputEl = inputWrapper instanceof HTMLInputElement ? inputWrapper : inputWrapper?.querySelector('input');
    if (inputEl) {
      inputEl.focus();
    }
  });
};

defineExpose({ exitAllEditName });
</script>

<style scoped>
.action-workspace {
  display: flex;
  flex-direction: column;
  gap: 18px;
  min-width: 0;
}
.action-workspace .list-group {
  gap: 18px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.action-workspace-header {
  margin: -16px -16px 0;
  padding: 12px 16px;
  border-bottom: 1px solid var(--ui-border);
}
.action-step-card { min-width: 0; }
.action-step-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.action-step-heading { min-width: 0; }
.action-step-toolbar { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; margin-left: auto; }
.action-step-tools { display: flex; align-items: center; gap: 4px; }

</style>
