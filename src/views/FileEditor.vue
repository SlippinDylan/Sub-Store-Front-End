<template>
  <div v-show="!route.meta.editorPreview">
  <div
    class="resource-editor-page"
    :inert="isEditorBusy"
    :aria-busy="isEditorBusy"
    :style="{ '--icon-fit': formIconFit }"
    @click="handleEditGlobalClick"
  >
    <ResourceForm
      class="resource-editor-form"
      :model-value="form"
      ref="ruleForm"
    >
      <UCard
        class="resource-editor-card"
        :ui="{ header: 'px-4 py-3 sm:px-4', body: 'p-0 sm:p-0' }"
      >
        <template #header>
          <h2 class="text-sm font-semibold">
            {{ $t("subscriptionEditor.basic") }}
          </h2>
        </template>
        <div class="resource-editor-fields">
          <!-- name -->
          <ResourceField
            required
            :label="$t(`editorPage.subConfig.basic.name.label`)"
            prop="name"
            :rules="[
              {
                required: true,
                message: $t(`editorPage.subConfig.basic.name.isEmpty`),
              },
              {
                validator: nameValidator,
                message: $t(`editorPage.subConfig.basic.name.isInvalid`),
              },
            ]"
          >
            <FieldInput
              class="plain-input"
              data-1p-ignore
              @blur="customerBlurValidate('name')"
              v-model.trim="form.name"
              :placeholder="$t(`editorPage.subConfig.basic.name.placeholder`)"
              type="text"
            />
          </ResourceField>
          <!-- displayName -->
          <ResourceField
            :label="$t(`editorPage.subConfig.basic.displayName.label`)"
            prop="displayName"
          >
            <FieldInput
              class="plain-input"
              data-1p-ignore
              v-model.trim="form.displayName"
              :placeholder="
                $t(`editorPage.subConfig.basic.displayName.placeholder`)
              "
              type="text"
            />
          </ResourceField>
          <ResourceField
            :label="$t(`filePage.download.label`)"
            prop="download"
            class="ignore-failed-wrapper"
          >
            <div class="switch-wrapper">
              <USwitch v-model="form.download" />
            </div>
          </ResourceField>
          <!-- remark -->
          <ResourceField
            :label="$t(`editorPage.subConfig.basic.remark.label`)"
            prop="remark"
          >
            <FieldTextarea
              class="plain-input"
              v-model="form.remark"
              :placeholder="$t(`editorPage.subConfig.basic.remark.placeholder`)"
              rows="1"
              :autosize="{ maxHeight: 140 }"
              max-length="100"
            />
          </ResourceField>
          <!-- tag -->
          <ResourceField
            :label="$t(`editorPage.subConfig.basic.tag.label`)"
            prop="tag"
          >
            <FieldInput
              class="plain-input"
              v-model.trim="form.tag"
              :border="false"
              :placeholder="$t(`editorPage.subConfig.basic.tag.placeholder`)"
              type="text"
              input-align="right"
              right-icon="rect-right"
              @click-right-icon="showTagPopup('tag')"
            ></FieldInput>
          </ResourceField>
        </div>
      </UCard>
      <UCard
        class="resource-editor-card"
        :ui="{ header: 'px-4 py-3 sm:px-4', body: 'p-0 sm:p-0' }"
      >
        <template #header>
          <h2 class="text-sm font-semibold">
            {{ $t("resourceEditor.fileContent") }}
          </h2>
        </template>
        <div class="resource-editor-fields">
          <ResourceField required :label="$t(`specificWord.type`)" prop="type">
            <div class="radio-wrapper">
              <ChoiceGroup v-model="form.type" direction="horizontal">
                <ChoiceOption shape="button" :label="MIHOMO_CONFIG_FILE_TYPE">
                  {{ $t(`filePage.type.mihomoConfig`) }}
                </ChoiceOption>
                <ChoiceOption shape="button" label="file">
                  {{ $t(`specificWord.file`) }}
                </ChoiceOption>
              </ChoiceGroup>
            </div>
          </ResourceField>
          <template v-if="isMihomoConfigFile">
            <ResourceField
              required
              :label="$t(`editorPage.subConfig.basic.source.label`)"
              prop="source"
            >
              <div class="radio-wrapper">
                <ChoiceGroup
                  v-model="form.sourceType"
                  direction="horizontal"
                  @change="handleTypeChange"
                >
                  <ChoiceOption shape="button" label="subscription">
                    {{ $t(`specificWord.singleSub`) }}
                  </ChoiceOption>
                  <ChoiceOption shape="button" label="collection">
                    {{ $t(`specificWord.collectionSub`) }}
                  </ChoiceOption>
                  <ChoiceOption shape="button" label="remote">
                    {{ $t(`filePage.source.remote`) }}
                  </ChoiceOption>
                  <ChoiceOption shape="button" label="local">
                    {{ $t(`filePage.source.local`) }}
                  </ChoiceOption>
                  <ChoiceOption shape="button" label="none">
                    {{ $t(`specificWord.none`) }}
                  </ChoiceOption>
                </ChoiceGroup>
              </div>
            </ResourceField>
            <ResourceField
              v-if="
                mihomoConfigSubscriptionSourceTypes.includes(form.sourceType)
              "
              required
              :label="$t(`editorPage.subConfig.sourceNameInputLabel`)"
              prop="sourceName"
              :rules="[
                {
                  required: true,
                  message: $t(`editorPage.subConfig.basic.name.isEmpty`),
                },
              ]"
            >
              <div class="space-y-3">
                <div class="source-name-controls">
                  <FieldInput
                    class="min-w-0"
                    data-1p-ignore
                    @blur="customerBlurValidate('sourceName')"
                    v-model.trim="form.sourceName"
                    :placeholder="
                      $t('editorPage.subConfig.sourceNameInputLabel')
                    "
                  />
                  <USelectMenu
                    v-if="sourceNameColumns.length"
                    v-model="form.sourceName"
                    value-key="value"
                    :items="
                      sourceNameColumns.map((option) => ({
                        label: option.text,
                        value: option.value,
                      }))
                    "
                    :placeholder="
                      $t('editorPage.subConfig.sourceNamePicker.title')
                    "
                    :aria-label="
                      $t('editorPage.subConfig.sourceNamePicker.title')
                    "
                    class="w-full"
                  />
                </div>
                <div
                  v-if="!sourceNameColumns.length"
                  class="settings-notice flex flex-wrap items-center justify-between gap-2"
                >
                  <span>{{ $t("help.noSourceSubscription") }}</span>
                  <UButton
                    @click="goAddSub"
                    icon="i-lucide-plus"
                    color="neutral"
                    variant="outline"
                    size="sm"
                  >
                    {{
                      $t(
                        form.sourceType === "collection"
                          ? "subscriptionEditor.createCollection"
                          : "subscriptionEditor.createSubscription",
                      )
                    }}
                  </UButton>
                </div>
              </div>
            </ResourceField>
            <ResourceField
              v-if="isMihomoConfigFileSource"
              :label="$t(`filePage.mode.label`)"
              prop="mode"
            >
              <div class="radio-wrapper">
                <ChoiceGroup direction="horizontal" v-model="form.mode">
                  <ChoiceOption shape="button" label="config">
                    {{ $t(`filePage.mode.config`) }}
                  </ChoiceOption>
                  <ChoiceOption shape="button" label="proxy">
                    {{ $t(`filePage.mode.proxy`) }}
                  </ChoiceOption>
                </ChoiceGroup>
              </div>
            </ResourceField>
            <template v-if="showIncludeUnsupportedProxy">
              <ResourceField class="ignore-failed-wrapper">
                <template #label>
                  <span class="label-with-tip">
                    <span>
                      {{
                        $t(`syncPage.addArtForm.includeUnsupportedProxy.label`)
                      }}
                    </span>
                    <HelpTip :help="includeUnsupportedProxyTips()" />
                  </span>
                </template>
                <div class="switch-wrapper">
                  <USwitch v-model="form.includeUnsupportedProxy" />
                </div>
              </ResourceField>
            </template>
          </template>
          <template v-if="showFileSourceFields">
            <ResourceField
              v-if="!isMihomoConfigFile"
              required
              :label="$t(`editorPage.subConfig.basic.source.label`)"
              prop="source"
            >
              <div class="radio-wrapper">
                <ChoiceGroup direction="horizontal" v-model="form.source">
                  <ChoiceOption shape="button" label="remote">
                    {{ $t(`filePage.source.remote`) }}
                  </ChoiceOption>
                  <ChoiceOption shape="button" label="local">
                    {{ $t(`filePage.source.local`) }}
                  </ChoiceOption>
                </ChoiceGroup>
              </div>
            </ResourceField>
            <ResourceField
              required
              v-if="fileSourceMode === 'remote'"
              prop="url"
              :rules="[
                {
                  required: true,
                  message: $t(`filePage.url.isEmpty`),
                },
                {
                  validator: urlValidator,
                  message: $t(`filePage.url.isIllegal`),
                },
              ]"
            >
              <template #label>
                <span class="field-label-with-help">
                  {{ $t("editorPage.subConfig.basic.url.label") }}
                  <HelpTip :help="fileUrlTips()" />
                </span>
              </template>
              <FieldTextarea
                class="textarea-wrapper"
                @blur="customerBlurValidate('url')"
                v-model="form.url"
                :autosize="{ maxHeight: 110, minHeight: 50 }"
                :placeholder="$t(`filePage.url.placeholder`)"
              />
            </ResourceField>
            <ResourceField
              v-else-if="fileSourceMode === 'local'"
              :label="$t('resourceEditor.fileContent')"
              prop="content"
            >
              <!-- <FieldTextarea
              class="textarea-wrapper"
              v-model="form.content"
              :autosize="{ maxHeight: 410, minHeight: 50 }"
              :placeholder="$t(`filePage.content.placeholder`)"
            /> -->

              <div class="resource-code-editor">
                <cmView
                  :isReadOnly="false"
                  id="FileEditer"
                  @update:busy="isContentUpdating = $event"
                  toolbar-variant="subscription"
                  :enable-fullscreen="false"
                  :editor-language="form.editorLanguage"
                  @update:editor-language="setEditorLanguage"
                />
              </div>
            </ResourceField>
            <ResourceField
              v-if="
                fileSourceMode === 'remote' ||
                ['localFirst', 'remoteFirst'].includes(form.mergeSources)
              "
              :label="$t(`editorPage.subConfig.basic.noCache.label`)"
              prop="noCache"
              class="ignore-failed-wrapper"
            >
              <div class="switch-wrapper">
                <USwitch v-model="form.noCache" />
              </div>
            </ResourceField>
            <!-- ua -->
            <ResourceField
              :label="$t(`editorPage.subConfig.basic.ua.label`)"
              prop="ua"
              v-if="fileSourceMode === 'remote'"
            >
              <FieldInput
                class="plain-input"
                v-model.trim="form.ua"
                :placeholder="$t(`editorPage.subConfig.basic.ua.placeholder`)"
                type="text"
              />
            </ResourceField>
            <ResourceField
              :help="proxyTips()"
              :label="$t(`editorPage.subConfig.basic.proxy.label`)"
              prop="proxy"
            >
              <FieldInput
                :border="false"
                class="plain-input"
                v-model.trim="form.proxy"
                :placeholder="
                  $t(`editorPage.subConfig.basic.proxy.placeholder`)
                "
                type="text"
                input-align="right"
              />
            </ResourceField>
            <ResourceField
              :label="$t(`editorPage.subConfig.basic.source.mergeSources`)"
              prop="mergeSources"
            >
              <div class="radio-wrapper">
                <ChoiceGroup direction="horizontal" v-model="form.mergeSources">
                  <ChoiceOption shape="button" label="">
                    {{ $t(`editorPage.subConfig.basic.source.noMerge`) }}
                  </ChoiceOption>
                  <ChoiceOption shape="button" label="localFirst">
                    {{ $t(`editorPage.subConfig.basic.source.localFirst`) }}
                  </ChoiceOption>
                  <ChoiceOption shape="button" label="remoteFirst">
                    {{ $t(`editorPage.subConfig.basic.source.remoteFirst`) }}
                  </ChoiceOption>
                </ChoiceGroup>
              </div>
            </ResourceField>
          </template>
        </div>
      </UCard>
      <UCard
        class="resource-editor-card"
        :ui="{ header: 'px-4 py-3 sm:px-4', body: 'p-0 sm:p-0' }"
      >
        <template #header>
          <h2 class="text-sm font-semibold">
            {{ $t("subscriptionEditor.advanced") }}
          </h2>
        </template>
        <div class="resource-editor-fields">
          <ResourceField
            :help="subInfoUrlTips()"
            :label="$t(`editorPage.subConfig.basic.subInfoUrl.label`)"
            prop="subInfoUrl"
          >
            <FieldInput
              :border="false"
              class="plain-input"
              data-1p-ignore
              v-model.trim="form.subInfoUrl"
              :placeholder="
                $t(`editorPage.subConfig.basic.subInfoUrl.placeholder`)
              "
              type="text"
              input-align="right"
            />
          </ResourceField>
          <ResourceField
            :label="$t(`editorPage.subConfig.basic.subInfoUserAgent.label`)"
            prop="subInfoUserAgent"
          >
            <FieldInput
              class="plain-input"
              data-1p-ignore
              v-model.trim="form.subInfoUserAgent"
              :placeholder="
                $t(`editorPage.subConfig.basic.subInfoUserAgent.placeholder`)
              "
              type="text"
            />
          </ResourceField>
          <ResourceField prop="age-public-key">
            <template #label>
              <span class="label-with-tip">
                <span>{{ $t("ageKey.publicKey.label") }}</span>
                <HelpTip :help="ageOutputTips()" />
              </span>
            </template>
            <div class="age-key-field">
              <FieldInput
                :border="false"
                class="plain-input"
                v-model.trim="form['age-public-key']"
                :placeholder="$t('ageKey.publicKey.placeholder')"
                type="text"
                input-align="right"
              />
              <AgeKeyHelper v-model="form['age-public-key']" />
            </div>
          </ResourceField>
          <ResourceField
            :label="$t(`filePage.ignoreFailedRemoteFile.label`)"
            prop="ignoreFailedRemoteFile"
          >
            <USelect
              :model-value="fileFailureModeValue"
              :items="
                fileFailureModeColumns.map((option) => ({
                  label: option.text,
                  value: option.value,
                }))
              "
              class="w-full"
              @update:model-value="
                handleFileFailureModeConfirm({ selectedValue: [$event] })
              "
            />
          </ResourceField>
        </div>
      </UCard>
      <UCard
        class="resource-editor-card"
        :ui="{ header: 'px-4 py-3 sm:px-4', body: 'p-0 sm:p-0' }"
      >
        <template #header>
          <h2 class="text-sm font-semibold">
            {{ $t("subscriptionEditor.icons") }}
          </h2>
        </template>
        <div class="resource-editor-fields">
          <div
            v-if="appearanceSetting.isShowIcon"
            class="resource-editor-icon-preview"
          >
            <ResourceImage
              :class="{ 'sub-item-customer-icon': !isIconColor }"
              :src="fileIcon"
              :fit="formIconFit"
              show-loading
              @click="showIconPopup"
            />
          </div>
          <!-- icon -->
          <ResourceField
            :label="$t(`editorPage.subConfig.basic.icon.label`)"
            prop="icon"
          >
            <FieldInput
              :border="false"
              class="plain-input"
              v-model.trim="form.icon"
              :placeholder="$t(`editorPage.subConfig.basic.icon.placeholder`)"
              type="text"
              input-align="right"
              left-icon="shop"
              @click-left-icon="showIconPopup"
            />
          </ResourceField>
          <!-- isIconColor -->
          <ResourceField
            :label="$t(`editorPage.subConfig.basic.isIconColor.label`)"
            prop="isIconColor"
            class="ignore-failed-wrapper"
          >
            <div class="switch-wrapper">
              <USwitch v-model="form.isIconColor" />
            </div>
          </ResourceField>
          <ImageFitPicker
            compact
            v-model="form.iconFit"
            :fallback-value="appearanceSetting.iconFit"
          />
        </div>
      </UCard>
    </ResourceForm>
    <UCard :ui="{ body: 'p-4 sm:p-4' }">
      <div v-if="isMihomoConfigFile" class="settings-notice mb-4">
        {{ $t("filePage.type.mihomoConfigScriptActionTips") }}
        <a
          href="https://mihomo.party/docs/guide/override"
          target="_blank"
          rel="noopener noreferrer"
        >
          {{ $t("subPage.panel.tips.ok") }}
        </a>
      </div>
      <ActionBlock
        compact-palette
        ref="actionBlockRef"
        @update:busy="isActionUpdating = $event"
        :checked="actionsChecked"
        :list="actionsList"
        sourceType="file"
        @updateCustomNameModeFlag="updateCustomNameModeFlag"
        @addAction="addAction"
        @deleteAction="deleteAction"
        @toggleAction="toggleAction"
      />
    </UCard>
  </div>
  <Teleport v-if="!route.meta.editorPreview" defer to="#resource-editor-actions">
    <UButton
      to="/files"
      icon="i-lucide-arrow-left"
      size="sm"
      color="neutral"
      variant="outline"
      :disabled="isEditorBusy"
    >
      {{ $t("workspace.back") }}
    </UButton>
    <UButton
      @click="compare"
      icon="i-lucide-eye"
      size="sm"
      color="neutral"
      variant="outline"
      :disabled="isEditorBusy"
    >
      {{ $t("editorPage.subConfig.btn.compare") }}
    </UButton>
    <UButton @click="submit" icon="i-lucide-save" size="sm" :loading="isget" :disabled="isEditorBusy || !isInit">
      {{ $t("workspace.save") }}
    </UButton>
  </Teleport>
  <FilePreview
    v-if="filePreviewIsVisible"
    :name="configName"
    :previewData="previewData"
    :showRefresh="true"
    @closePreview="closePreview"
    @refresh="refreshPreview"
  />
  <icon-popup
    v-model:visible="iconPopupVisible"
    @setIcon="setIcon"
  ></icon-popup>
  <!-- 订阅名称 -->

  <tag-popup
    v-model:visible="tagPopupVisible"
    ref="tagPopupRef"
    :currentTag="currentTag"
    @setTag="setTagValue"
    type="file"
  ></tag-popup>
  </div>
  <router-view />
</template>
<script lang="ts" setup>
import { usePreviewSession } from "@/store/previewSession";
import { usePreviewRequest } from "@/hooks/usePreviewRequest";
import { useMediaQuery } from "@vueuse/core";
import { actionDraftDirtyKey } from "@/views/editor/actionDraft";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { useArtifactsStore } from "@/store/artifacts";
import logoIcon from "@/assets/icons/logo.png";
import logoRedIcon from "@/assets/icons/logo-red.png";
import { useSubsApi } from "@/api/subs";
import { useFilesApi } from "@/api/files";
import { usePopupRoute } from "@/hooks/usePopupRoute";
import { useAppNotifyStore } from "@/store/appNotify";
import { useGlobalStore } from "@/store/global";
import { useSettingsStore } from "@/store/settings";
import { useSubsStore } from "@/store/subs";
import ActionBlock from "@/views/editor/ActionBlock.vue";
import { addItem, deleteItem, toggleItem } from "@/utils/actionsOperate";
import { actionsToProcess } from "@/utils/actionsToPorcess";
import Script from "@/views/editor/components/Script.vue";
import AddProxiesFromSubscription from "@/views/editor/components/AddProxiesFromSubscription.vue";
import TagPopup from "@/components/TagPopup.vue";
import AgeKeyHelper from "@/components/AgeKeyHelper.vue";
import ImageFitPicker from "@/components/ImageFitPicker.vue";
import IconPopup from "@/views/icon/IconPopup.vue";
import FilePreview from "@/views/FilePreview.vue";
import { initStores } from "@/utils/initApp";
import { Dialog, Toast } from '@/services/feedback';
import { storeToRefs } from "pinia";
import {
  computed,
  provide,
  nextTick,
  reactive,
  ref,
  shallowRef,
  toRaw,
  watchEffect,
  watch,
} from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import cmView from "@/views/editCode/cmView.vue";
import { useCodeStore } from "@/store/codeStore";
import clashmetaIcon from '@/assets/icons/clashmeta_color.png';
import { createGithubProxyUrlRewriter } from "@/utils/githubProxy";
import {
  isMihomoConfigFileType,
  MIHOMO_CONFIG_FILE_TYPE,
  normalizeFileType,
} from "@/utils/fileType";
import { formatPreviewError } from "@/utils/previewError";
import { normalizeOptionalImageFit, resolveImageFit } from "@/utils/iconFit";

const cmStore = useCodeStore();
const { t, locale } = useI18n();
const route = useRoute();
const beginPreviewRequest = usePreviewRequest();
const router = useRouter();
const subsApi = useSubsApi();
const filesApi = useFilesApi();
const configName = route.params.id as string;
const subsStore = useSubsStore();
const { showNotify } = useAppNotifyStore();

const globalStore = useGlobalStore();
const settingsStore = useSettingsStore();
const { subs, collections } = storeToRefs(subsStore);
const { appearanceSetting, githubProxy, githubProxyRegex } = storeToRefs(settingsStore);
const UNTITLED_FILE_NAMES = ["UNTITLED", "UNTITLED-mihomoConfig", "UNTITLED-mihomoProfile"];
const UNTITLED_MIHOMO_CONFIG_FILE_NAMES = ["UNTITLED-mihomoConfig", "UNTITLED-mihomoProfile"];
let scrollTop = 0;

const file = computed(() => subsStore.getOneFile(configName));
const filePreviewIsVisible = ref(false);
usePopupRoute(filePreviewIsVisible);
const previewData = ref();
const isInit = ref(false);
const ruleForm = ref<any>(null);
const actionsChecked = reactive([]);
const actionsList = reactive([]);
const isget = ref(false);
const isContentUpdating = ref(false);
const isActionUpdating = ref(false);
const isEditorBusy = computed(() => isget.value || isContentUpdating.value || isActionUpdating.value);
const hasUntagged = ref(false);
const tags = computed(() => {
  if(!subsStore.files || subsStore.files.length === 0) return []
  const set = new Set()
  subsStore.files.forEach(file => {
    if (Array.isArray(file.tag) && file.tag.length > 0) {
      file.tag.forEach(i => {
        set.add(i)
      });
    } else {
      hasUntagged.value = true
    }
  })

  let tags: any[] = Array.from(set)
  if(tags.length === 0) return []
  tags = tags.map(i => ({ label: i, value: i }));
  const result = [{ label: t("specificWord.all"), value: "all" }, ...tags]
  if(hasUntagged.value) result.push({ label: t("specificWord.untagged"), value: "untagged" })
  return result
});
const tag = ref('all');
const tagPopupVisible = ref(false);
const tagType = ref('tag');
const tagPopupRef = ref(null);
const currentTag = computed(() => {
  return form.tag
})
const fileFailureModeOptions = computed(() => {
  const prefix = "filePage.ignoreFailedRemoteFile";
  return [
    {
      value: "disabled",
      label: t(`${prefix}.disabled`),
      note: t(`${prefix}.disabledNote`),
    },
    {
      value: "enabled",
      label: t(`${prefix}.enabled`),
      note: t(`${prefix}.enabledNote`),
    },
    {
      value: "quiet",
      label: t(`${prefix}.quiet`),
      note: t(`${prefix}.quietNote`),
    },
  ];
});
const formatFailureModePickerText = (label: string, note?: string) => {
  if (!note) return label;
  return locale.value.startsWith("zh")
    ? `${label}（${note}）`
    : `${label} (${note})`;
};
const fileFailureModeValue = computed(() => {
  return form.ignoreFailedRemoteFile === false || form.ignoreFailedRemoteFile == null
    ? "disabled"
    : form.ignoreFailedRemoteFile;
});
const fileFailureModeColumns = computed(() => {
  return fileFailureModeOptions.value.map((option) => ({
    text: formatFailureModePickerText(option.label, option.note),
    value: option.value,
  }));
});
const handleFileFailureModeConfirm = ({ selectedValue }) => {
  const nextValue =
    selectedValue[0] ?? fileFailureModeColumns.value[0]?.value ?? "disabled";

  form.ignoreFailedRemoteFile = nextValue;

};
const showTagPopup = (type:string) => {
  tagType.value = type || 'tag'
  tagPopupVisible.value = true
};
const setTagValue = (tag: any) => {
  form.tag = tag;      
};
const form = reactive<any>({
  name: "",
  displayName: "",
  remark: "",
  icon: "",
  isIconColor: true,
  iconFit: undefined,
  source: "local",
  sourceType: "collection",
  sourceName: "",
  mode: "config",
  includeUnsupportedProxy: false,
  noCache: false,
  process: [],
  type: UNTITLED_MIHOMO_CONFIG_FILE_NAMES.includes(configName) ? MIHOMO_CONFIG_FILE_TYPE : 'file',
});
const actionDraftDirty = ref(false);
provide(actionDraftDirtyKey, actionDraftDirty);
const { markSaved, navigateAfterSave } = useUnsavedChanges(
  () => JSON.stringify({ ...form, process: actionsToProcess(form.process, actionsList, ignoreList) }),
  () => isInit.value,
  () => isEditorBusy.value,
  () => actionDraftDirty.value,
);
provide("form", form);
const mihomoConfigFileSourceTypes = ["local", "remote"];
const mihomoConfigSubscriptionSourceTypes = ["subscription", "collection"];
const mihomoConfigSourceTypes = [
  ...mihomoConfigFileSourceTypes,
  ...mihomoConfigSubscriptionSourceTypes,
  "none",
];
const isMihomoConfigFile = computed(() => isMihomoConfigFileType(form.type));
const isMihomoConfigFileSource = computed(() => {
  return isMihomoConfigFile.value && mihomoConfigFileSourceTypes.includes(form.sourceType);
});
const normalizeFormSourceType = (sourceData: any, type: string) => {
  if (!isMihomoConfigFileType(type)) {
    return sourceData.sourceType || "collection";
  }

  return mihomoConfigSourceTypes.includes(sourceData.sourceType)
    ? sourceData.sourceType
    : "collection";
};
const showFileSourceFields = computed(() => {
  return form.type === "file" || isMihomoConfigFileSource.value;
});
const fileSourceMode = computed(() => {
  return isMihomoConfigFile.value ? form.sourceType : form.source;
});
const showIncludeUnsupportedProxy = computed(() => {
  return (
    isMihomoConfigFile.value &&
    (
      mihomoConfigSubscriptionSourceTypes.includes(form.sourceType) ||
      (isMihomoConfigFileSource.value && form.mode === "proxy")
    )
  );
});
// 排除非动作卡片
const ignoreList = ["Quick Setting Operator"];
const MIHOMO_ONLY_FILE_ACTION_TYPES = ["Add Proxies From Subscription Operator"];
const normalizeProcessByFileType = (data: any) => {
  if (isMihomoConfigFileType(data.type)) return;

  data.process = (data.process || []).filter(
    (item) => !MIHOMO_ONLY_FILE_ACTION_TYPES.includes(item.type),
  );
};
// 订阅名称
const sourceNameColumns = computed(() => {
  const list = form.sourceType === "collection"
    ? subsStore.collections
    : form.sourceType === "subscription"
      ? subsStore.subs
      : [];
  if (!list || list.length === 0) {
    return [];
  }
  return list.map((item) => {
    return {
      text: item.displayName ? `${item.displayName}` : item.name,
      value: item.name,
    };
  });
});
const handleTypeChange = (val) => {
  form.sourceName = "";
  if (mihomoConfigFileSourceTypes.includes(val) && !form.mode) {
    form.mode = "config";
  }
};
const goAddSub = () => {
  router.push("/subs");
};
watch(
  () => cmStore.EditCode["FileEditer"],
  (newCode) => {
    form.content = newCode;
  }
);

watchEffect(() => {
  if (isInit.value) return;
  if (UNTITLED_FILE_NAMES.includes(configName)) {
    const fc = "// " + t(`filePage.content.placeholder`) + "\n";
    cmStore.setEditCode("FileEditer", fc);
    // 标记 加载完成
    isInit.value = true;
    return;
  }

  const sourceData: any = toRaw(file.value);
  if (sourceData) {
    if (!Array.isArray(sourceData.process)) {
      sourceData.process = [];
    }
    form.name = sourceData.name;
    form.displayName = sourceData.displayName || sourceData["display-name"];
    form.remark = sourceData.remark;
    form.icon = sourceData.icon;
    form.isIconColor = sourceData.isIconColor !== false;
    form.iconFit = normalizeOptionalImageFit(sourceData.iconFit);
    form.editorLanguage = sourceData.editorLanguage;
    form["age-public-key"] = sourceData["age-public-key"] || "";
    form.source = sourceData.source || "local";
    const fileType = normalizeFileType(sourceData.type || 'file') || 'file';
    form.type = fileType;
    form.sourceType = normalizeFormSourceType(sourceData, fileType);
    form.sourceName = sourceData.sourceName;
    form.mode = sourceData.mode || 'config';
    form.includeUnsupportedProxy = sourceData.includeUnsupportedProxy === true;
    form.url = sourceData.url;
    form.subInfoUrl = sourceData.subInfoUrl;
    form.subInfoUserAgent = sourceData.subInfoUserAgent;
    form.proxy = sourceData.proxy;
    form.tag = Array.isArray(sourceData.tag)
    ? sourceData.tag.join(", ")
    : sourceData.tag;
    form.ua = sourceData.ua;
    form.noCache = sourceData.noCache === true;
    form.mergeSources = sourceData.mergeSources;
    form.content = sourceData.content;
    cmStore.setEditCode("FileEditer", sourceData.content);
    let ignoreFailedRemoteFile = sourceData.ignoreFailedRemoteFile;
    if (ignoreFailedRemoteFile === true) {
      ignoreFailedRemoteFile = 'quiet';
    } else if (ignoreFailedRemoteFile === false || ignoreFailedRemoteFile == null) {
      ignoreFailedRemoteFile = 'disabled';
    }
    form.ignoreFailedRemoteFile = ignoreFailedRemoteFile;
    form.download = sourceData.download;
    const newProcess = JSON.parse(JSON.stringify(sourceData.process));
    form.process = newProcess;
    if (sourceData.process.length > 0) {
      form.process.forEach((item) => {
        const { type, id, customName, disabled } = item;
        actionsChecked.push([id, type !== "Response Transformer"]);
        const action = {
          type,
          id,
          customName,
          tipsDes: t(`editorPage.subConfig.nodeActions['${type}'].tipsDes`),
          component: null,
          enabled: !disabled,
        };
        switch (type) {
          case "Script Operator":
          case "Response Transformer":
            action.component = shallowRef(Script);
            break;
          case "Add Proxies From Subscription Operator":
            action.component = shallowRef(AddProxiesFromSubscription);
            break;
          default:
            break;
        }
        actionsList.push(action);
      });
    }
    // 标记 加载完成
    isInit.value = true;
    return;
  }
});

const addAction = (val) => {
  addItem(form, actionsList, actionsChecked, val, t);
};

const setEditorLanguage = (language) => {
  form.editorLanguage = language || null;
};

const deleteAction = (id) => {
  deleteItem(form, actionsList, actionsChecked, id);
};

const toggleAction = (id) => {
  toggleItem(actionsList, id);
};

const closePreview = () => {
  document.querySelector("html").style["overflow-y"] = "";
  document.querySelector("html").style.height = "";
  document.body.style.height = "";
  document.body.style["overflow-y"] = "";
  (document.querySelector("#app") as HTMLElement).style["overflow-y"] = "";
  (document.querySelector("#app") as HTMLElement).style.height = "";

  filePreviewIsVisible.value = false;

  window.scrollTo({
    top: scrollTop,
    behavior: "instant" as any,
  });

  router.back();
};
const compare = async () => {
  const isCurrent = beginPreviewRequest();
  const { valid } = await ruleForm.value.validate();
  if (!valid || !isCurrent()) return;
  const data = await fetchPreviewData();
  if (!isCurrent()) return;
  previewData.value = data;
  openPreviewPanel();
};

const fetchPreviewData = async () => {
  Toast.loading("生成中...", { id: "compare", cover: true, duration: 1500 });
  try {
    const data: any = JSON.parse(JSON.stringify(toRaw(form)));
    data.process = actionsToProcess(data.process, actionsList, ignoreList);
    if (data.ignoreFailedRemoteFile === "disabled") {
      data.ignoreFailedRemoteFile = false;
    }
    data.tag = [
      ...new Set(
        (data.tag || "")
          .split(",")
          .map((item: string) => item.trim())
          .filter((item: string) => item.length)
      ),
    ];
    actionsChecked.forEach((item) => {
      if (!item[1]) {
        const index = data.process.findIndex((i) => i.id === item[0]);
        if (index > -1) {
          data.process.splice(index, 1);
        }
      }
    });
    normalizeProcessByFileType(data);
    const res = await subsApi.compareSub("file", data);
    if (res?.data?.status === "success") {
      return res.data.data;
    } else {
      return { processed: formatPreviewError(res) };
    }
  } catch (e) {
    console.error(e);
    return { processed: formatPreviewError(e) };
  } finally {
    Toast.hide("compare");
  }
};

const desktopPreview = useMediaQuery("(min-width: 768px)");
const previewSession = usePreviewSession();
const openPreviewPanel = () => {
  if (desktopPreview.value) {
    const returnPath = route.path;
    previewSession.open({ kind: "file", name: configName, returnPath, data: previewData.value, refresh: refreshPreview });
    void router.push(`${returnPath}/preview`);
    return;
  }
  scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
  globalStore.setSavedPositions(route.path, { left: 0, top: scrollTop });

  document.querySelector("html").style["overflow-y"] = "hidden";
  document.querySelector("html").style.height = "100%";
  document.body.style.height = "100%";
  document.body.style["overflow-y"] = "hidden";
  (document.querySelector("#app") as HTMLElement).style["overflow-y"] = "hidden";
  (document.querySelector("#app") as HTMLElement).style.height = "100%";

  filePreviewIsVisible.value = true;
};

const refreshPreview = async (isCurrent = () => true) => {
  const data = await fetchPreviewData();
  if (!isCurrent()) return;
  previewData.value = data;
  return data;
};

const submit = async () => {
  if (isEditorBusy.value || !isInit.value) {
    showNotify({
      type: "success",
      title: "请勿重复点击...",
    });
    return;
  }
  isget.value = true;
  try {
    const { valid } = await ruleForm.value.validate(undefined, false);
    // 如果验证失败
    if (!valid) {
      return;
    }
    Toast.loading("...", { id: "submits", cover: true, duration: 1500 });
    // 如果验证成功，开始保存/修改
    const data: any = JSON.parse(JSON.stringify(toRaw(form)));
    data.type = normalizeFileType(data.type);
    const iconFit = normalizeOptionalImageFit(form.iconFit);
    if (iconFit) {
      data.iconFit = iconFit;
    } else if (UNTITLED_FILE_NAMES.includes(configName)) {
      delete data.iconFit;
    } else {
      data.iconFit = null;
    }
    const agePublicKey = `${data["age-public-key"] || ""}`.trim();
    if (agePublicKey) {
      data["age-public-key"] = agePublicKey;
    } else if (UNTITLED_FILE_NAMES.includes(configName)) {
      delete data["age-public-key"];
    } else {
      data["age-public-key"] = null;
    }
    data.tag = [
      ...new Set(
        (data.tag || "")
          .split(",")
          .map((item: string) => item.trim())
          .filter((item: string) => item.length)
      ),
    ];
    data["display-name"] = data.displayName;
    data.process = actionsToProcess(data.process, actionsList, ignoreList);
    normalizeProcessByFileType(data);
    if (data.ignoreFailedRemoteFile === "disabled"){
      data.ignoreFailedRemoteFile = false;
    }

    let res = null;

    if (UNTITLED_FILE_NAMES.includes(configName)) {
      res = await filesApi.createFile(data);
      await subsStore.fetchSubsData();
      if (data.source === "remote" || (isMihomoConfigFileType(data.type) && data.sourceType === "remote")) await initStores(false, true, false);
    } else {
      res = await filesApi.editFile(configName, data);

      if (configName === data.name) {
        // @ts-ignore
        await subsStore.updateOneData("files", configName);
      } else {
        await subsStore.fetchSubsData();
        await useArtifactsStore().fetchArtifactsData();
      }
    }

    if (res?.data?.status === "success") {
      markSaved();
      await navigateAfterSave("/files");
      showNotify({
        type: "success",
        title: t(`editorPage.subConfig.pop.succeedMsg`),
      });
    }
  } finally {
    isget.value = false;
    Toast.hide("submits");
    await nextTick();
    await ruleForm.value?.focusFirstError();
  }
};
const proxyTips = () => ({
  title: "通过代理/节点/策略获取远程文件",
  content:
    '1. Surge/Egern(参数 policy/policy-descriptor)\n\n可设置节点代理 例: Test = snell, 1.2.3.4, 80, psk=password, version=4\n\n或设置策略/节点 例: 国外加速\n\n2. Loon(参数 node)\n\nLoon 官方文档: \n\n指定该请求使用哪一个节点或者策略组（可以是节点名称、策略组名称，也可以是一个 Loon 格式的节点描述，如：shadowsocksr,example.com,1070,chacha20-ietf,"password",protocol=auth_aes128_sha1,protocol-param=test,obfs=plain,obfs-param=edge.microsoft.com）\n\n3. Stash(参数 headers["X-Surge-Policy"])/Shadowrocket(参数 headers.X-Surge-Policy)/QX(参数 opts.policy)\n\n可设置策略/节点\n\n4. Node.js 版(http/https/socks5):\n\n例: socks5://a:b@127.0.0.1:7890\n\n※ 优先级由高到低: 文件配置, 默认配置\n\n完整说明 请查看 https://telegram.me/zhetengsha/1843',
});
const includeUnsupportedProxyTips = () => ({
  href: "https://github.com/sub-store-org/Sub-Store/wiki/%E9%93%BE%E6%8E%A5%E5%8F%82%E6%95%B0%E8%AF%B4%E6%98%8E",
});
const subInfoUrlTips = () => ({
  title: t(`editorPage.subConfig.basic.subInfoUrl.tips.title`),
  content: t(`editorPage.subConfig.basic.subInfoUrl.tips.content`),
});
const fileUrlTips = () => ({
  title: t("filePage.url.tips.title"),
  content: t("filePage.url.tips.content"),
});
const ageOutputTips = () => ({
  title: t("ageKey.publicKey.tips.title"),
  content: t("ageKey.publicKey.tips.content"),
});
// 图标
const fileIcon = computed(() => {
  if (form.icon) {
    return rewriteGithubUrl(form.icon);
  } else {
    if (isMihomoConfigFile.value) return clashmetaIcon;
    return rewriteGithubUrl(appearanceSetting.value.isDefaultIcon ? logoIcon : logoRedIcon);
  }
});
const githubUrlRewriter = computed(() => {
  return createGithubProxyUrlRewriter(githubProxy.value, githubProxyRegex.value);
});
const rewriteGithubUrl = (url?: string | null) => {
  return githubUrlRewriter.value(url);
};
const isIconColor = computed(() => {
  return form.isIconColor;
});
const formIconFit = computed(() => resolveImageFit(form.iconFit, appearanceSetting.value.iconFit));
const iconPopupVisible = ref(false);
const showIconPopup = () => {
  iconPopupVisible.value = true;
};
const setIcon = (icon: any) => {
  form.icon = icon.url;
};
// 名称验证器
const nameValidator = (val: string): Promise<boolean> => {
  return new Promise((resolve) => {
    if (UNTITLED_FILE_NAMES.includes(val)) resolve(false);
    if (/\//.test(val)) {
      resolve(false);
    }
    const nameList = subsStore.files.map((item) => item.name);
    nameList.includes(val) && configName !== val ? resolve(false) : resolve(true);
  });
};

// url 格式验证器
const urlValidator = (val: string): Promise<boolean> => {
  return new Promise((resolve) => {
    if (/\n/.test(val)) {
      resolve(
        val
          .split(/[\r\n]+/)
          .map((i) => i.trim())
          .filter((i) => i.length)
          .every((i) => /^(http|https):\/\/\S+$/.test(i) || /^\/api\/(file|module)\/(.+)/.test(i) || /^\/.+/.test(i))
      );
    } else {
      resolve(/^(http|https):\/\/\S+$/.test(val) || /^\/api\/(file|module)\/(.+)/.test(val) || /^\/.+/.test(val));
    }
  });
};
// 失去焦点触发验证
const customerBlurValidate = (prop: string) => {
  ruleForm.value.validate(prop);
};
const actionBlockRef = ref(null);
const customNameModeFlag = ref(false);
const updateCustomNameModeFlag = (flag) => (customNameModeFlag.value = flag);
const handleEditGlobalClick = () => {
  if (actionBlockRef.value) {
    if (customNameModeFlag.value) {
      // exit
      actionBlockRef.value.exitAllEditName();
    }
  }
};
</script>
