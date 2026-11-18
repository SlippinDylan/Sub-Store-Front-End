<template>
  <div v-show="!route.meta.editorPreview">
  <div class="subscription-editor" :inert="isEditorBusy" :aria-busy="isEditorBusy" @click="handleEditGlobalClick">
    <ResourceForm
      class="subscription-editor-form"
      :model-value="form"
      ref="ruleForm"
    >
      <div class="subscription-editor-grid">
        <UCard
          class="subscription-editor-card"
          :ui="{ header: 'px-4 py-3 sm:px-4', body: 'p-0 sm:p-0' }"
        >
          <template #header>
            <h2 class="text-sm font-semibold">
              {{ $t("subscriptionEditor.basic") }}
            </h2>
          </template>
          <div class="subscription-editor-fields">
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
              :label="$t(`editorPage.subConfig.basic.remark.label`)"
              prop="remark"
            >
              <FieldTextarea
                class="plain-input"
                v-model="form.remark"
                :placeholder="
                  $t(`editorPage.subConfig.basic.remark.placeholder`)
                "
                rows="1"
                :autosize="{ maxHeight: 140 }"
                max-length="100"
              />
            </ResourceField>
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
          class="subscription-editor-card"
          :ui="{ header: 'px-4 py-3 sm:px-4', body: 'p-0 sm:p-0' }"
        >
          <template #header>
            <h2 class="text-sm font-semibold">
              {{ $t("subscriptionEditor.content") }}
            </h2>
          </template>
          <div class="subscription-editor-fields">
            <template v-if="editType === 'subs'">
              <ResourceField
                required
                :label="$t(`editorPage.subConfig.basic.source.label`)"
                prop="source"
              >
                <div class="radio-wrapper">
                  <ChoiceGroup direction="horizontal" v-model="form.source">
                    <ChoiceOption shape="button" label="remote">
                      {{ $t(`editorPage.subConfig.basic.source.remote`) }}
                    </ChoiceOption>
                    <ChoiceOption shape="button" label="local">
                      {{ $t(`editorPage.subConfig.basic.source.local`) }}
                    </ChoiceOption>
                  </ChoiceGroup>
                </div>
              </ResourceField>
              <ResourceField
                required
                v-if="form.source === 'remote'"
                prop="url"
                :rules="[
                  {
                    required: true,
                    message: $t(`editorPage.subConfig.basic.url.isEmpty`),
                  },
                  {
                    validator: urlValidator,
                    message: $t(`editorPage.subConfig.basic.url.isIllegal`),
                  },
                ]"
              >
                <template v-slot:label>
                  <span class="field-label-with-help">
                    {{ $t("editorPage.subConfig.basic.url.label") }}
                    <HelpTip :help="urlTips()" />
                  </span>
                </template>
                <FieldTextarea
                  class="textarea-wrapper"
                  @blur="customerBlurValidate('url')"
                  @change="strTrim('url')"
                  v-model="form.url"
                  :autosize="{ maxHeight: 240, minHeight: 100 }"
                  :placeholder="
                    $t(`editorPage.subConfig.basic.url.placeholder`)
                  "
                />
              </ResourceField>
              <ResourceField
                v-else-if="form.source === 'local'"
                :label="$t('subscriptionEditor.localContent')"
                prop="content"
              >
                <!-- <FieldTextarea
              class="textarea-wrapper"
              v-model="form.content"
              :autosize="{ maxHeight: 410, minHeight: 50 }"
              :placeholder="
                $t(`editorPage.subConfig.basic.content.placeholder`)
              "
            /> -->
                <div class="subscription-code-editor">
                  <cmView
                    :isReadOnly="false"
                    id="SubEditer"
                    @update:busy="isContentUpdating = $event"
                    toolbar-variant="subscription"
                    :enable-fullscreen="false"
                    :placeholder="
                      $t(`editorPage.subConfig.basic.content.tips.content`)
                    "
                    :editor-language="form.editorLanguage"
                    @update:editor-language="setEditorLanguage"
                  />
                </div>
              </ResourceField>
              <ResourceField
                :label="$t(`editorPage.subConfig.basic.source.mergeSources`)"
                prop="mergeSources"
              >
                <div class="radio-wrapper">
                  <ChoiceGroup
                    direction="horizontal"
                    v-model="form.mergeSources"
                  >
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
            <template v-else>
              <ResourceField
                :help="subscriptionTagsTips()"
                :label="$t(`editorPage.subConfig.basic.subscriptionTags.label`)"
                prop="subscriptionTags"
              >
                <FieldInput
                  :border="false"
                  class="plain-input"
                  v-model.trim="form.subscriptionTags"
                  :placeholder="
                    $t(
                      `editorPage.subConfig.basic.subscriptionTags.placeholder`,
                    )
                  "
                  type="text"
                  input-align="right"
                  right-icon="rect-right"
                  @click-right-icon="showTagPopup('linkTag')"
                />
              </ResourceField>
              <SettingsRow
                class="include-subs-trigger"
                @click.stop="toggleManualSubscriptionsFold"
              >
                <view class="include-subs-label">
                  {{ $t(`editorPage.subConfig.basic.subscriptions.label`) }}
                </view>
                <view class="include-subs-value">
                  <view>
                    <FieldInput
                      :model-value="selectedSubsDisplay"
                      :border="false"
                      class="plain-input include-subs-trigger-input"
                      readonly
                      input-align="right"
                      :right-icon="
                        manualSubscriptionsIsFold ? 'rect-right' : 'rect-down'
                      "
                    />
                  </view>
                </view>
              </SettingsRow>
              <div
                v-show="!manualSubscriptionsIsFold"
                class="include-subs-wrapper"
              >
                <div v-if="tags.length" class="subscription-picker-toolbar">
                  <div class="flex min-w-0 flex-wrap gap-2">
                    <UButton
                      v-for="group in tags"
                      :key="group.value"
                      :variant="group.value === tag ? 'soft' : 'ghost'"
                      :color="group.value === tag ? 'primary' : 'neutral'"
                      :aria-pressed="group.value === tag"
                      size="sm"
                      @click="setTag(group.value)"
                    >
                      {{ group.label }}
                    </UButton>
                  </div>
                  <SelectionOption
                    v-model="subCheckbox"
                    :indeterminate="subCheckboxIndeterminate"
                    :ui="{ root: 'items-center shrink-0' }"
                    @change="selectVisibleSubscriptions"
                  >
                    {{ $t("subscriptionEditor.selectAll") }}
                  </SelectionOption>
                </div>
                <SelectionGroup
                  v-model="visibleSelectedSubscriptions"
                  :class="{ 'is-dragging': isDragging }"
                >
                  <draggable
                    v-model="displayedSubsSelectList"
                    class="subscription-picker-list"
                    item-key="0"
                    animation="300"
                    :scroll-sensitivity="200"
                    :force-fallback="true"
                    :scroll-speed="8"
                    :scroll="true"
                    handle=".drag-handle"
                    @start="onStartDrag"
                    @end="onEndDrag"
                  >
                    <template #item="{ element }">
                      <div
                        class="subscription-picker-row"
                        :class="{
                          'is-selected': visibleSelectedSubscriptions.includes(
                            element[0],
                          ),
                        }"
                      >
                        <SelectionOption
                          :label="element[0]"
                          class="min-w-0 flex-1"
                          :ui="{
                            root: 'w-full items-center gap-3',
                            wrapper: 'min-w-0 flex-1',
                            label: 'block cursor-pointer',
                          }"
                        >
                          <span class="flex min-w-0 items-center gap-3">
                            <ResourceAvatar
                              v-if="element[2]"
                              :class="{ 'sub-item-customer-icon': !element[4] }"
                              class="shrink-0"
                              :size="chooserAvatarSize"
                              :url="rewriteGithubUrl(element[2])"
                              :style="{ '--icon-fit': element[5] }"
                              bg-color=""
                            />
                            <span class="min-w-0 flex-1">
                              <span
                                class="block truncate text-sm font-medium"
                                :title="element[1]"
                              >
                                {{ element[1] }}
                              </span>
                              <span
                                v-if="element[3]?.length"
                                class="mt-1 flex flex-wrap gap-1"
                              >
                                <TagChip v-for="item in element[3]" :key="item">
                                  {{ item }}
                                </TagChip>
                              </span>
                            </span>
                          </span>
                        </SelectionOption>
                        <span
                          class="drag-handle"
                          :title="$t('subscriptionEditor.dragAction')"
                        >
                          <UIcon name="i-lucide-grip-vertical" class="size-4" />
                        </span>
                      </div>
                    </template>
                  </draggable>
                </SelectionGroup>
              </div>
            </template>
          </div>
        </UCard>
        <UCard
          class="subscription-editor-card"
          :ui="{ header: 'px-4 py-3 sm:px-4', body: 'p-0 sm:p-0' }"
        >
          <template #header>
            <h2 class="text-sm font-semibold">
              {{ $t("subscriptionEditor.request") }}
            </h2>
          </template>
          <div class="subscription-editor-fields">
            <template v-if="editType === 'subs'">
              <ResourceField
                v-if="
                  form.source === 'remote' ||
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
              <ResourceField
                :label="$t(`editorPage.subConfig.basic.passThroughUA.label`)"
                prop="passThroughUA"
                class="ignore-failed-wrapper"
                v-if="form.source === 'remote'"
              >
                <div class="switch-wrapper">
                  <USwitch
                    v-model="form.passThroughUA"
                    @update:model-value="handlePassThroughUAChange"
                  />
                </div>
              </ResourceField>
              <ResourceField
                :help="uaTips()"
                :label="$t(`editorPage.subConfig.basic.ua.label`)"
                prop="ua"
                v-if="form.source === 'remote'"
              >
                <FieldInput
                  :border="false"
                  class="plain-input"
                  v-model.trim="form.ua"
                  :placeholder="userAgentPlaceholder"
                  type="text"
                  input-align="right"
                  :readonly="passThroughUAOn"
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
            </template>
            <template v-else>
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
            </template>
            <ResourceField
              :label="$t(`editorPage.subConfig.basic.noFlow.label`)"
              prop="noFlow"
              class="ignore-failed-wrapper"
            >
              <div class="switch-wrapper">
                <USwitch v-model="form.noFlow" />
              </div>
            </ResourceField>
            <ResourceField
              :help="subUserinfoTips()"
              :label="$t(`editorPage.subConfig.basic.subUserinfo.label`)"
              prop="subUserinfo"
            >
              <FieldInput
                :border="false"
                class="plain-input"
                v-model.trim="form.subUserinfo"
                :placeholder="
                  $t(`editorPage.subConfig.basic.subUserinfo.placeholder`)
                "
                type="text"
                input-align="right"
              />
            </ResourceField>
            <template v-if="editType === 'collections'">
              <ResourceField prop="firstSubFlow" class="ignore-failed-wrapper">
                <template #label>
                  <span class="label-with-tip">
                    <span>
                      {{ $t(`editorPage.subConfig.basic.firstSubFlow.label`) }}
                    </span>
                    <HelpTip :help="firstSubFlowTips()" />
                  </span>
                </template>
                <div class="switch-wrapper">
                  <USwitch v-model="form.firstSubFlow" />
                </div>
              </ResourceField>
            </template>
          </div>
        </UCard>
        <UCard
          class="subscription-editor-card"
          :ui="{ header: 'px-4 py-3 sm:px-4', body: 'p-0 sm:p-0' }"
        >
          <template #header>
            <h2 class="text-sm font-semibold">
              {{ $t("subscriptionEditor.icons") }}
            </h2>
          </template>
          <div class="subscription-editor-fields">
            <div class="subscription-icon-preview">
              <UButton
                color="neutral"
                variant="soft"
                class="size-12 shrink-0 justify-center p-2"
                :aria-label="$t('editorPage.subConfig.basic.icon.label')"
                @click="showIconPopup"
              >
                <ResourceImage
                  :src="subIcon"
                  :fit="formIconFit"
                  class="size-8"
                />
              </UButton>
              <span class="text-xs text-muted">
                {{ $t("subscriptionEditor.iconHint") }}
              </span>
            </div>
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
        <UCard
          class="subscription-editor-card"
          :ui="{ header: 'px-4 py-3 sm:px-4', body: 'p-0 sm:p-0' }"
        >
          <template #header>
            <h2 class="text-sm font-semibold">
              {{ $t("subscriptionEditor.advanced") }}
            </h2>
          </template>
          <div class="subscription-editor-fields">
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
              :label="
                $t(`editorPage.subConfig.basic.ignoreFailedRemoteSub.label`)
              "
              class="failure-mode-trigger"
              prop="ignoreFailedRemoteSub"
            >
              <USelect
                :model-value="subFailureModeValue"
                :items="
                  subFailureModeColumns.map((option) => ({
                    label: option.text,
                    value: option.value,
                  }))
                "
                :aria-label="
                  $t('editorPage.subConfig.basic.ignoreFailedRemoteSub.label')
                "
                class="w-full"
                @update:model-value="form.ignoreFailedRemoteSub = $event"
              />
            </ResourceField>
          </div>
        </UCard>
      </div>
    </ResourceForm>
    <UCard
      v-if="showEditorCommonBlock"
      class="subscription-editor-card"
      :ui="{ body: 'p-4 sm:p-4' }"
    >
      <CommonBlock inline />
    </UCard>
    <UCard class="subscription-editor-card" :ui="{ body: 'p-4 sm:p-4' }">
      <ActionBlock
        ref="actionBlockRef"
        @update:busy="isActionUpdating = $event"
        compact-palette
        :checked="actionsChecked"
        :list="actionsList"
        @updateCustomNameModeFlag="updateCustomNameModeFlag"
        @addAction="addAction"
        @deleteAction="deleteAction"
        @toggleAction="toggleAction"
      />
    </UCard>
  </div>
  <Teleport v-if="!route.meta.editorPreview" defer to="#subscription-editor-actions">
    <UButton
      to="/subs"
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
      :disabled="isEditorBusy || !isInit"
    >
      {{ $t("editorPage.subConfig.btn.compare") }}
    </UButton>
    <UButton
      @click="submit"
      icon="i-lucide-save"
      size="sm"
      :loading="isget"
      :disabled="isEditorBusy || !isInit"
    >
      {{ $t("workspace.save") }}
    </UButton>
  </Teleport>
  <CompareTable
    v-if="compareTableIsVisible"
    :name="configName"
    :compareData="compareData"
    :showRefresh="true"
    @closeCompare="closeCompare"
    @refresh="refreshCompare"
  />
  <icon-popup
    v-model:visible="iconPopupVisible"
    @setIcon="setIcon"
  ></icon-popup>

  <tag-popup
    v-model:visible="tagPopupVisible"
    ref="tagPopupRef"
    :currentTag="currentTag"
    @setTag="setTagValue"
  ></tag-popup>
  </div>
  <router-view />
</template>
<script lang="ts" setup>
import { usePreviewSession } from "@/store/previewSession";
import { usePreviewRequest } from "@/hooks/usePreviewRequest";
import { useMediaQuery } from "@vueuse/core";
import { actionDraftDirtyKey } from "@/views/editor/actionDraft";
import { useArtifactsStore } from "@/store/artifacts";
import { useSubsApi } from "@/api/subs";
import logoIcon from "@/assets/icons/logo.png";
import logoRedIcon from "@/assets/icons/logo-red.png";
import { usePopupRoute } from "@/hooks/usePopupRoute";
import { useAppNotifyStore } from "@/store/appNotify";
import { useGlobalStore } from "@/store/global";
import { useSettingsStore } from '@/store/settings';
import { useSubsStore } from "@/store/subs";
import { addItem, deleteItem, toggleItem } from "@/utils/actionsOperate";
import { actionsToProcess } from "@/utils/actionsToPorcess";
import {
  getEditorFoldState,
  getEditorIsFolded,
  getEditorRouteValue,
  setEditorFoldState,
  setEditorRouteValue,
} from "@/utils/editorFoldState";
import { initStores } from "@/utils/initApp";
import draggable from "vuedraggable";
import CompareTable from "@/views/CompareTable.vue";
import ActionBlock from "@/views/editor/ActionBlock.vue";
import CommonBlock from "@/views/editor/CommonBlock.vue";
import ActionRadio from "@/views/editor/components/ActionRadio.vue";
import FilterSelect from "@/views/editor/components/FilterSelect.vue";
import HandleDuplicate from "@/views/editor/components/HandleDuplicate.vue";
import Regex from "@/views/editor/components/Regex.vue";
import Script from "@/views/editor/components/Script.vue";
import IconPopup from "@/views/icon/IconPopup.vue";
import ImageFitPicker from "@/components/ImageFitPicker.vue";
import TagPopup from "@/components/TagPopup.vue";
import AgeKeyHelper from "@/components/AgeKeyHelper.vue";
import { Dialog, Toast } from '@/services/feedback';
import { storeToRefs } from "pinia";
import {
  computed,
  nextTick,
  provide,
  reactive,
  ref,
  shallowRef,
  toRaw,
  watchEffect,
  watch,
} from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import cmView from "@/views/editCode/cmView.vue";
import { useCodeStore } from "@/store/codeStore";
import { createGithubProxyUrlRewriter } from "@/utils/githubProxy";
import { normalizeOptionalImageFit, resolveImageFit } from "@/utils/iconFit";
const cmStore = useCodeStore();
const { t, locale } = useI18n();
const route = useRoute();
const beginPreviewRequest = usePreviewRequest();
const router = useRouter();
const MANUAL_SUBSCRIPTIONS_FOLD_STORAGE_KEY = "manual-subscriptions-fold";
const MANUAL_SUBSCRIPTIONS_GROUP_STORAGE_KEY = "manual-subscriptions-group";
const subsApi = useSubsApi();
const editType = route.params.editType as string;
const configName = route.params.id as string;
const subsStore = useSubsStore();
const { showNotify } = useAppNotifyStore();

const globalStore = useGlobalStore();
const settingsStore = useSettingsStore();
const { appearanceSetting, githubProxy, githubProxyRegex } = storeToRefs(settingsStore);

const githubUrlRewriter = computed(() => {
  return createGithubProxyUrlRewriter(githubProxy.value, githubProxyRegex.value);
});
const rewriteGithubUrl = (url?: string | null) => {
  return githubUrlRewriter.value(url);
};
const editorCommonDisplayMode = computed<EditorCommonDisplayMode>(() => {
  return appearanceSetting.value.editorCommonDisplayMode || (appearanceSetting.value.isEditorCommon ? "expanded" : "hidden");
});
const showEditorCommonBlock = computed(() => editorCommonDisplayMode.value !== "hidden");
const manualSubscriptionsDefaultFolded = computed(() => {
  return (appearanceSetting.value.manualSubscriptionsDisplayMode || "collapsed") === "collapsed";
});
const manualSubscriptionsIsFold = ref(
  getEditorIsFolded(
    MANUAL_SUBSCRIPTIONS_FOLD_STORAGE_KEY,
    route.path,
    manualSubscriptionsDefaultFolded.value,
  ),
);
const toggleManualSubscriptionsFold = () => {
  manualSubscriptionsIsFold.value = !manualSubscriptionsIsFold.value;
  setEditorFoldState(
    MANUAL_SUBSCRIPTIONS_FOLD_STORAGE_KEY,
    route.path,
    manualSubscriptionsIsFold.value,
  );
};
watch(
  [() => route.path, manualSubscriptionsDefaultFolded],
  ([path, defaultFolded]) => {
    if (getEditorFoldState(MANUAL_SUBSCRIPTIONS_FOLD_STORAGE_KEY, path) === undefined) {
      manualSubscriptionsIsFold.value = defaultFolded;
      return;
    }

    manualSubscriptionsIsFold.value = getEditorIsFolded(
      MANUAL_SUBSCRIPTIONS_FOLD_STORAGE_KEY,
      path,
      defaultFolded,
    );
  },
);
const chooserAvatarSize = computed(() => {
  return appearanceSetting.value.isSimpleMode ? "28" : "32";
});

type SubSelectRow = [string, string, string | undefined, string[] | undefined, boolean, ImageFit];

  const sub = computed(() => subsStore.getOneSub(configName));
  const collection = computed(() => subsStore.getOneCollection(configName));


  const subsSelectList = computed<SubSelectRow[]>(() => {
    return subsStore.subs.map(item => {
      return [
        item.name,
        item.displayName || item['display-name'] || item.name,
        item.icon || (appearanceSetting.value.isDefaultIcon ? logoIcon : logoRedIcon),
        item.tag,
        item.isIconColor !== false,
        resolveImageFit(item.iconFit, appearanceSetting.value.iconFit),
      ];
    });
  });
  const hasUntagged = ref(false);
  const tags = computed(() => {
    if(!subsStore.subs || subsStore.subs.length === 0) return []
    const set = new Set()
    subsStore.subs.forEach(sub => {
      if (Array.isArray(sub.tag) && sub.tag.length > 0) {
        sub.tag.forEach(i => {
          set.add(i)
        });
      } else {
        hasUntagged.value = true
      }
    })

    let tags: any[] = Array.from(set)
    // if(tags.length === 0) return []
    tags = tags.map(i => ({ label: i, value: i }));
    const result = [{ label: t("specificWord.all"), value: "all" }, ...tags]
    if(hasUntagged.value) result.push({ label: t("specificWord.untagged"), value: "untagged" })
    return result
  });
  const tag = ref('all');
  const manualSubscriptionsGroupInitialized = ref(false);
  const manualSubscriptionsGroupTouched = ref(false);
  const tagPopupVisible = ref(false);
  const tagType = ref('tag'); // 标签tag | 关联订阅标签linkTag
  const tagPopupRef = ref(null);
  const currentTag = computed(() => {
    if (tagType.value === 'linkTag') {
      return form.subscriptionTags
    } else {
      return form.tag
    }
  })
  const showTagPopup = (type:string) => {
    tagType.value = type || 'tag'
    tagPopupVisible.value = true
  };
  const setTagValue = (tag: any) => {
    if (tagType.value === 'linkTag') {
      form.subscriptionTags = tag;
    } else {
      form.tag = tag;      
    }
  };
const selectedSubs = computed(() => {
  const subscriptions = form.subscriptions || [];
  if(!Array.isArray(subscriptions) || subscriptions.length === 0) {
    if (!Array.isArray(subsSelectList.value) || subsSelectList.value.length === 0) return `: ${t(`editorPage.subConfig.basic.subscriptions.empty`)}`
    return `: ${t(`editorPage.subConfig.basic.subscriptions.none`)}`
  }
    return `: ${subscriptions.map((name) => {
      const sub = subsStore.getOneSub(name);
      if(!sub) form.subscriptions = form.subscriptions.filter((n) => n !== name);
      return sub?.displayName || sub?.["display-name"] || sub?.name || `${name}(🚫)`;
    }).join(', ')}`
  });
const selectedSubsDisplay = computed(() => selectedSubs.value.replace(/^:\s*/, ""));
  const subFailureModeOptions = computed(() => {
    const prefix = "editorPage.subConfig.basic.ignoreFailedRemoteSub";
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
      {
        value: "fallbackNotify",
        label: t(`${prefix}.fallbackNotify`),
        note: t(`${prefix}.fallbackNotifyNote`),
      },
      {
        value: "fallbackQuiet",
        label: t(`${prefix}.fallbackQuiet`),
        note: t(`${prefix}.fallbackQuietNote`),
      },
    ];
  });
  const formatFailureModePickerText = (label: string, note?: string) => {
    if (!note) return label;
    return locale.value.startsWith("zh")
      ? `${label}（${note}）`
      : `${label} (${note})`;
  };
  const subFailureModeValue = computed(() => {
    return form.ignoreFailedRemoteSub === false || form.ignoreFailedRemoteSub == null
      ? "disabled"
      : form.ignoreFailedRemoteSub;
  });
  const subFailureModeColumns = computed(() => {
    return subFailureModeOptions.value.map((option) => ({
      text: formatFailureModePickerText(option.label, option.note),
      value: option.value,
    }));
  });
  const compareTableIsVisible = ref(false);
  usePopupRoute(compareTableIsVisible);
  const compareData = ref();

let scrollTop = 0;
const isInit = ref(false);
const ruleForm = ref<any>(null);
const actionsChecked = reactive([]);
const actionsList = reactive([]);
const isget = ref(false);
const isContentUpdating = ref(false);
const isActionUpdating = ref(false);
const isEditorBusy = computed(() => isget.value || isContentUpdating.value || isActionUpdating.value);
const form = reactive<any>({
  name: "",
  displayName: "",
  form: "",
  remark: "",
  mergeSources: "",
  ignoreFailedRemoteSub: false,
  passThroughUA: false,
  noFlow: undefined,
  icon: "",
  isIconColor: true,
  iconFit: undefined,
  process: [
    {
      type: "Quick Setting Operator",
    },
  ],
});
const actionDraftDirty = ref(false);
provide(actionDraftDirtyKey, actionDraftDirty);
provide("form", form);

// 排除非动作卡片
const ignoreList = ["Quick Setting Operator"];
watch(
  () => cmStore.EditCode['SubEditer'],
  (newCode) => {
    form.content = newCode;
  }
);

watchEffect(() => {
  if (isInit.value) return;
  if (configName === "UNTITLED") {
    // 新建时，初始化表单
    switch (editType) {
      case "collections":
        form.subscriptions = [];
        form.firstSubFlow = true;
        break;
      case "subs":
        form.source = "remote";
        form.url = "";
        form.content = "";
        form.ua = "";
        form.noCache = false;
        cmStore.setEditCode('SubEditer', "");
        break;
    }
    // 标记 加载完成
    isInit.value = true;
    return;
  }

  const sourceData: any = toRaw(sub.value) || toRaw(collection.value);
  if (!sourceData) {
    return;
  }
  if (!Array.isArray(sourceData.process)) {
    sourceData.process = [];
  }
  const newProcess = JSON.parse(JSON.stringify(sourceData.process));
  form.mergeSources = sourceData.mergeSources;
  let ignoreFailedRemoteSub = sourceData.ignoreFailedRemoteSub;
  if (ignoreFailedRemoteSub === true) {
    ignoreFailedRemoteSub = 'quiet';
  } else if (ignoreFailedRemoteSub === false || ignoreFailedRemoteSub == null) {
    ignoreFailedRemoteSub = 'disabled';
  }
  form.ignoreFailedRemoteSub = ignoreFailedRemoteSub;
  form.passThroughUA = sourceData.passThroughUA;
  form["age-public-key"] = sourceData["age-public-key"] || "";
  form.name = sourceData.name;
  form.displayName = sourceData.displayName || sourceData["display-name"];
  form.remark = sourceData.remark;
  form.icon = sourceData.icon;
  form.isIconColor = sourceData.isIconColor !== false;
  form.iconFit = normalizeOptionalImageFit(sourceData.iconFit);
  form.editorLanguage = sourceData.editorLanguage;
  form.process = newProcess;
  form.noFlow = sourceData.noFlow;
  form.subUserinfo = sourceData.subUserinfo;
  form.proxy = sourceData.proxy;
  form.tag = Array.isArray(sourceData.tag)
    ? sourceData.tag.join(", ")
    : sourceData.tag;
  form.subscriptionTags = Array.isArray(sourceData.subscriptionTags)
    ? sourceData.subscriptionTags.join(", ")
    : sourceData.subscriptionTags;

  switch (editType) {
    case "collections":
      form.subscriptions = Array.isArray(sourceData.subscriptions)
        ? [...sourceData.subscriptions]
        : [];
      form.firstSubFlow = sourceData.firstSubFlow !== false;
      console.log('form.subscriptions ==>', form.subscriptions);
      break;
    case "subs":
      form.source = sourceData.source;
      form.url = sourceData.url;
      form.content = sourceData.content;
      cmStore.setEditCode('SubEditer', sourceData.content);
      form.ua = sourceData.ua;
      form.noCache = sourceData.noCache === true;
      form._savedUA = sourceData._savedUA;
      if(form.passThroughUA && form.ua){
        showNotify({
          type: "warning",
          title: t(`editorPage.subConfig.basic.passThroughUA.warning`),
          duration: 65535,
        });
      }
      break;
  }

  if (sourceData.process.length > 0) {
    form.process.forEach((item) => {
      const { type, id, customName, disabled } = item;

      if (!ignoreList.includes(type)) {
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
          case "Flag Operator":
          case "Sort Operator":
          case "Resolve Domain Operator":
            action.component = shallowRef(ActionRadio);
            break;
          case "Region Filter":
          case "Type Filter":
            action.component = shallowRef(FilterSelect);
            break;
          case "Regex Filter":
          case "Regex Sort Operator":
          case "Regex Delete Operator":
          case "Regex Rename Operator":
            action.component = shallowRef(Regex);
            break;
          case "Handle Duplicate Operator":
            action.component = shallowRef(HandleDuplicate);
            break;
          case "Script Filter":
          case "Script Operator":
          case "Response Transformer":
            action.component = shallowRef(Script);
            break;
          default:
            break;
        }
        actionsList.push(action);
      }
    });
  }
  // 标记 加载完成
  isInit.value = true;
  return;
});

const { markSaved, navigateAfterSave } = useUnsavedChanges(
  () => JSON.stringify({ ...form, process: actionsToProcess(form.process, actionsList, ignoreList) }),
  () => isInit.value,
  () => isEditorBusy.value,
  () => actionDraftDirty.value,
);

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

const closeCompare = () => {
  document.querySelector("html").style["overflow-y"] = "";
  document.querySelector("html").style.height = "";
  document.body.style.height = "";
  document.body.style["overflow-y"] = "";
  (document.querySelector("#app") as HTMLElement).style["overflow-y"] = "";
  (document.querySelector("#app") as HTMLElement).style.height = "";

  compareTableIsVisible.value = false;

  window.scrollTo({
    top: scrollTop,
    behavior: "instant" as any,
  });

  router.back();
};
const fetchCompareData = async () => {
  Toast.loading("生成节点对比中...", {
    id: "compare",
    cover: true,
    duration: 1500,
  });
  try {
    const data: any = JSON.parse(JSON.stringify(toRaw(form)));
    data.process = actionsToProcess(data.process, actionsList, ignoreList);
    if (data.ignoreFailedRemoteSub === "disabled") {
      data.ignoreFailedRemoteSub = false;
    }
    if (editType === "collections") {
      data.firstSubFlow = data.firstSubFlow !== false;
    } else {
      delete data.firstSubFlow;
    }
    data.tag = [
      ...new Set(
        (data.tag || "")
          .split(",")
          .map((item: string) => item.trim())
          .filter((item: string) => item.length)
      ),
    ];
    data.subscriptionTags = [
      ...new Set(
        (data.subscriptionTags || "")
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
    // if (configName !== "UNTITLED") {
    //   await subsStore.fetchFlows(ref([data]).value);
    // }
    const type = editType === "collections" ? "collection" : "sub";
    const res = await subsApi.compareSub(type, data);
    if (res?.data?.status === "success") {
      return res.data.data;
    } else {
      return null;
    }
  } catch (e) {
    console.error(e);
    return null;
  } finally {
    Toast.hide("compare");
  }
};

const desktopPreview = useMediaQuery("(min-width: 768px)");
const previewSession = usePreviewSession();
const openComparePanel = () => {
  if (desktopPreview.value) {
    const returnPath = route.path;
    previewSession.open({ kind: "nodes", name: configName, returnPath, data: compareData.value, refresh: refreshCompare });
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

  compareTableIsVisible.value = true;
};

const compare = async () => {
  const isCurrent = beginPreviewRequest();
  const { valid } = await ruleForm.value.validate();
  if (!valid || !isCurrent()) return;
  const data = await fetchCompareData();
  if (!isCurrent()) return;
  compareData.value = data;
  openComparePanel();
};

const refreshCompare = async (isCurrent = () => true) => {
  const data = await fetchCompareData();
  if (!isCurrent()) return;
  compareData.value = data;
  return data;
};

const passThroughUAOn = computed(() => {
  return form.source === "remote" && form.passThroughUA;
});

const userAgentPlaceholder = computed(() => {
  return passThroughUAOn.value
    ? t(`editorPage.subConfig.basic.ua.placeholderDisabled`)
    : t(`editorPage.subConfig.basic.ua.placeholder`);
});

const handlePassThroughUAChange = (val) => {
  if (val) {
    form._savedUA = form.ua;
    form.ua = "";
  } else {
    if (form._savedUA !== undefined) {
      form.ua = form._savedUA;
      form._savedUA = undefined;
    }
  }
};

const submit = async () => {
  if (isEditorBusy.value || !isInit.value) return;
  isget.value = true;
  try {
    const { valid } = await ruleForm.value.validate(undefined, false);
    if (!valid) {
      return;
    }
    const data: any = JSON.parse(JSON.stringify(toRaw(form)));
    const iconFit = normalizeOptionalImageFit(form.iconFit);
    if (iconFit) {
      data.iconFit = iconFit;
    } else if (configName === "UNTITLED") {
      delete data.iconFit;
    } else {
      data.iconFit = null;
    }
    const agePublicKey = `${data["age-public-key"] || ""}`.trim();
    if (agePublicKey) {
      data["age-public-key"] = agePublicKey;
    } else if (configName === "UNTITLED") {
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
    data.subscriptionTags = [
      ...new Set(
        (data.subscriptionTags || "")
          .split(",")
          .map((item: string) => item.trim())
          .filter((item: string) => item.length)
      ),
    ];
    data["display-name"] = data.displayName;
    data.process = actionsToProcess(data.process, actionsList, ignoreList);
    if (data.ignoreFailedRemoteSub === "disabled"){
      data.ignoreFailedRemoteSub = false;
    }
    if (editType === "collections") {
      data.firstSubFlow = data.firstSubFlow !== false;
    } else {
      delete data.firstSubFlow;
    }


    let res = null;

    if (configName === "UNTITLED") {
      res = await subsApi.createSub(editType, data);
      await subsStore.fetchSubsData();
      if (data.source === "remote") await initStores(false, true, false);
    } else {
      let apiType = "";
      if (editType === "subs") {
        apiType = "sub";
      } else if (editType === "collections") {
        apiType = "collection";
      }
      res = await subsApi.editSub(apiType, configName, data);

      if (configName === data.name) {
        // @ts-ignore
        await subsStore.updateOneData(editType, configName);
      } else {
        await subsStore.fetchSubsData();
        await useArtifactsStore().fetchArtifactsData();
      }
    }

    if (res?.data?.status === "success") {
      markSaved();
      await navigateAfterSave("/subs");
      showNotify({ type: 'success', title: t('editorPage.subConfig.pop.succeedMsg') });
    } else {
      showNotify({
        type: 'danger',
        title: res?.data?.status === 'failed' ? res.data.error?.message || t('subscriptionEditor.saveFailed') : t('subscriptionEditor.saveFailed'),
      });
    }
  } finally {
    isget.value = false;
    await nextTick();
    await ruleForm.value?.focusFirstError();
  }
};

const nameValidator = (val: string): Promise<boolean> => {
  return new Promise((resolve) => {
    if (val === "UNTITLED") resolve(false);
    if (/\//.test(val)) {
      resolve(false);
    }
    const nameList = [
      ...subsStore.subs.map((item) => item.name),
      ...subsStore.collections.map((item) => item.name),
    ];
    nameList.includes(val) && configName !== val
      ? resolve(false)
      : resolve(true);
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
  // 去除空格
  const strTrim = (prop: string) => {
    if (typeof form[prop] === "string") {
      // 去除首尾空格
      form[prop] = form[prop].trim();
    }
  }
  // 图标
  const subIcon = computed(() => {
    if (form.icon) {
      return rewriteGithubUrl(form.icon)
    } else {
      return rewriteGithubUrl(appearanceSetting.value.isDefaultIcon ? logoIcon : logoRedIcon)
    }
  })
  const formIconFit = computed(() => resolveImageFit(form.iconFit, appearanceSetting.value.iconFit));
  const iconPopupVisible = ref(false)
  const showIconPopup = () => {
    iconPopupVisible.value = true
  }
  const setIcon = (icon: any) => {
    form.icon = icon.url
  }
  const uaTips = () => ({
  title: "默认使用配置中的全局 UA",
  content:
    "可尝试设置为 clash-verge/v2.4.6, v2rayNG 等客户端的 User-Agent 让机场后端下发更多协议(可根据实际情况改成最新版本号)",
});
  const subUserinfoTips = () => ({
  title: "手动设置订阅流量信息",
  content:
    "若填写链接, 则使用链接的响应体内容/响应头 subscription-userinfo 作为值. 链接支持 headers/noCache/headersCacheTtl 等参数.\n\n此项值的格式为:\n\nupload=1024; download=10240; total=102400; expire=4115721600; reset_day=14; plan_name=VIP1; app_url=http://a.com\n\n1. app_url, 订阅将有一个可点击跳转的按钮\n\n2. plan_name, hover 时将显示套餐名称\n\n3. reset_day, 流量重置剩余天数(若要设置周期性重置, 可查看订阅链接中的参数说明)\n\n⚠️ 注意: 手动设置的订阅流量信息会附加到订阅自己的流量信息之前. 若包含不合法的内容, 订阅将无法正常使用\n\n例如: http://官网.com 应编码为 http%3A%2F%2F%E5%AE%98%E7%BD%91.com",
});
  const firstSubFlowTips = () => ({
  title: t(`editorPage.subConfig.basic.firstSubFlow.tips.title`),
  content: t(`editorPage.subConfig.basic.firstSubFlow.tips.content`),
  href: "https://telegram.me/zhetengsha/3070",
});
  const proxyTips = () => ({
  title: "通过代理/节点/策略获取订阅",
  content:
    '1. Surge/Egern(参数 policy/policy-descriptor)\n\n可设置节点代理 例: Test = snell, 1.2.3.4, 80, psk=password, version=4\n\n或设置策略/节点 例: 国外加速\n\n2. Loon(参数 node)\n\nLoon 官方文档: \n\n指定该请求使用哪一个节点或者策略组（可以是节点名称、策略组名称，也可以是一个 Loon 格式的节点描述，如：shadowsocksr,example.com,1070,chacha20-ietf,"password",protocol=auth_aes128_sha1,protocol-param=test,obfs=plain,obfs-param=edge.microsoft.com）\n\n3. Stash(参数 headers["X-Surge-Policy"])/Shadowrocket(参数 headers.X-Surge-Policy)/QX(参数 opts.policy)\n\n可设置策略/节点\n\n4. Node.js 版(http/https/socks5):\n\n例: socks5://a:b@127.0.0.1:7890\n\n※ 优先级由高到低: 单条订阅, 组合订阅, 默认配置\n\n完整说明 请查看 https://telegram.me/zhetengsha/1843',
});
  const subscriptionTagsTips = () => ({
  title: "组合订阅与单条订阅",
  content:
    '组合订阅中将包含\n\n1. 含有关联订阅标签的单条订阅\n\n2. 手动选择的单条订阅\n\n举例: 设置了关联订阅标签为 "A, B" 后\n包含标签 "A" 或 "B" 的单条订阅将自动关联到此组合订阅',
});
  const urlTips = () => ({
  title: t("editorPage.subConfig.basic.url.tips.title"),
  content: t("editorPage.subConfig.basic.url.tips.content"),
});
  const ageOutputTips = () => ({
  title: t("ageKey.publicKey.tips.title"),
  content: t("ageKey.publicKey.tips.content"),
});
  const normalizeTagList = (value: any): string[] => {
    const source = Array.isArray(value) ? value : String(value || "").split(",");
    return source
      .map((item) => String(item).trim())
      .filter((item) => item.length);
  };
  const getMatchingCollectionGroup = () => {
    const collectionTags = normalizeTagList(form.tag);
    if (collectionTags.length === 0) return "";

    const subTagSet = new Set<string>();
    subsSelectList.value.forEach(([, , , subTags]) => {
      normalizeTagList(subTags).forEach((item) => subTagSet.add(item));
    });

    return collectionTags.find((item) => subTagSet.has(item)) || "";
  };
  const isManualSubscriptionsGroupAvailable = (group: string) => {
    if (group === "all") return true;
    if (!Array.isArray(tags.value) || tags.value.length === 0) return false;

    return tags.value.some((item) => item.value === group);
  };
  const applyInitialManualSubscriptionsGroup = () => {
    if (editType !== "collections") return;
    if (!isInit.value) return;
    if (manualSubscriptionsGroupInitialized.value || manualSubscriptionsGroupTouched.value) return;
    if (tag.value !== "all") return;

    const rememberedGroup = getEditorRouteValue(
      MANUAL_SUBSCRIPTIONS_GROUP_STORAGE_KEY,
      route.path,
    );
    if (rememberedGroup && isManualSubscriptionsGroupAvailable(rememberedGroup)) {
      tag.value = rememberedGroup;
      manualSubscriptionsGroupInitialized.value = true;
      return;
    }
    if (rememberedGroup && subsSelectList.value.length === 0) return;

    const matchedGroup = getMatchingCollectionGroup();
    if (!matchedGroup) return;

    tag.value = matchedGroup;
    manualSubscriptionsGroupInitialized.value = true;
  };
  const setTag = (current) => {
    manualSubscriptionsGroupTouched.value = true;
    tag.value = current;
    setEditorRouteValue(
      MANUAL_SUBSCRIPTIONS_GROUP_STORAGE_KEY,
      route.path,
      current,
    );
  };
  const shouldShowElement = (element) => {
    if(tag.value === 'all') return true
    if(tag.value === 'untagged') return !Array.isArray(element) || element.length === 0
    return element.includes(tag.value)
  };
  const ensureSubscriptions = (): string[] => {
    if (!Array.isArray(form.subscriptions)) {
      form.subscriptions = [];
    }
    return form.subscriptions;
  };
  const hasSameSubscriptions = (left: string[], right: string[]) => {
    return left.length === right.length && left.every((name, index) => name === right[index]);
  };
  const skipNextDisplayedListSync = ref(false);
  const replaceSubscriptions = (
    nextSubscriptions: string[],
    options?: { preserveDisplayedOrder?: boolean },
  ) => {
    const subscriptions = ensureSubscriptions();

    if (hasSameSubscriptions(subscriptions, nextSubscriptions)) {
      return;
    }

    if (options?.preserveDisplayedOrder) {
      skipNextDisplayedListSync.value = true;
    }

    subscriptions.splice(0, subscriptions.length, ...nextSubscriptions);
  };
  const syncSubscriptionsFromRows = (rows: SubSelectRow[]) => {
    const selectedSet = new Set(ensureSubscriptions());
    const nextSubscriptions = rows
      .filter(([name]) => selectedSet.has(name))
      .map(([name]) => name);

    replaceSubscriptions(nextSubscriptions, { preserveDisplayedOrder: true });
  };
  const selectedSubscriptions = computed(() => {
    return Array.isArray(form.subscriptions) ? form.subscriptions : [];
  });
  const isRowVisibleByName = (name: string) => {
    const row = subsSelectList.value.find((item) => item[0] === name);
    return row ? shouldShowElement(row[3]) : false;
  };
  const orderedSubsSelectList = computed<SubSelectRow[]>(() => {
    const selectedRows = selectedSubscriptions.value
      .map(name => subsSelectList.value.find(item => item[0] === name))
      .filter((item): item is SubSelectRow => Boolean(item));
    const selectedSet = new Set(selectedRows.map(([name]) => name));

    return [
      ...selectedRows,
      ...subsSelectList.value.filter(([name]) => !selectedSet.has(name)),
    ];
  });
  const getCurrentVisibleRows = () => {
    if (displayedSubsSelectList.value.length > 0) {
      return displayedSubsSelectList.value;
    }

    return orderedSubsSelectList.value.filter((item) => shouldShowElement(item[3]));
  };
  const visibleSelectedSubscriptions = computed<string[]>({
    get: () => {
      return selectedSubscriptions.value.filter((name) => isRowVisibleByName(name));
    },
    set: (visibleSelectedNames) => {
      const subscriptions = ensureSubscriptions();
      const visibleRowOrder = getCurrentVisibleRows().map(([name]) => name);
      const visibleSet = new Set(visibleRowOrder);
      const visibleSelectedSet = new Set(visibleSelectedNames);
      const visibleSelectedRowOrder = visibleRowOrder.filter((name) => visibleSelectedSet.has(name));
      const nextSubscriptions = subscriptions.filter((name) => {
        return !visibleSet.has(name) || visibleSelectedSet.has(name);
      });
      const findExistingIndex = (name: string) => nextSubscriptions.indexOf(name);

      visibleSelectedRowOrder.forEach((name, index) => {
        if (findExistingIndex(name) > -1) return;

        const nextVisibleAnchor = visibleSelectedRowOrder
          .slice(index + 1)
          .find((candidate) => findExistingIndex(candidate) > -1);

        if (nextVisibleAnchor) {
          nextSubscriptions.splice(findExistingIndex(nextVisibleAnchor), 0, name);
          return;
        }

        const previousVisibleAnchor = visibleSelectedRowOrder
          .slice(0, index)
          .reverse()
          .find((candidate) => findExistingIndex(candidate) > -1);

        if (previousVisibleAnchor) {
          nextSubscriptions.splice(findExistingIndex(previousVisibleAnchor) + 1, 0, name);
          return;
        }

        nextSubscriptions.push(name);
      });

      replaceSubscriptions(nextSubscriptions, { preserveDisplayedOrder: true });
    },
  });
  const mergeVisibleOrder = <T>(
    source: T[],
    reorderedVisibleItems: T[],
    shouldInclude: (item: T) => boolean,
  ) => {
    let visibleIndex = 0;

    return source.map((item) => {
      if (!shouldInclude(item)) {
        return item;
      }

      const reorderedItem = reorderedVisibleItems[visibleIndex];
      visibleIndex += 1;
      return reorderedItem ?? item;
    });
  };
  const subCheckboxIndeterminate = ref(true);
  const subCheckbox = ref(true);
  // const subCheckboxChange = (v) => {
  //   console.log(`${!v} -> ${v}`)
  // };
  const selectVisibleSubscriptions = (checked: boolean) => {
    visibleSelectedSubscriptions.value = checked ? getCurrentVisibleRows().map(([name]) => name) : [];
  };
  const displayedSubsSelectList = ref<SubSelectRow[]>([]);
  const isDragging = ref(false);
  const syncDisplayedSubsSelectList = () => {
    displayedSubsSelectList.value = orderedSubsSelectList.value.filter((item) => shouldShowElement(item[3]));
  };

  const onStartDrag = () => {
    console.log("开始拖拽");
    isDragging.value = true;
  };

  const onEndDrag = () => {
    console.log("结束拖拽");
    const mergedRows = mergeVisibleOrder(
      orderedSubsSelectList.value,
      displayedSubsSelectList.value,
      (item) => shouldShowElement(item[3]),
    );
    isDragging.value = false;
    syncSubscriptionsFromRows(mergedRows);
    syncDisplayedSubsSelectList();
  };
  watch([() => form.tag, subsSelectList, tags, isInit], () => {
    applyInitialManualSubscriptionsGroup();
  }, { immediate: true, deep: true });
  watch([tag, subsSelectList], () => {
    if (isDragging.value) return;
    syncDisplayedSubsSelectList();
  }, { immediate: true });
  watch(selectedSubscriptions, () => {
    if (isDragging.value) return;
    if (skipNextDisplayedListSync.value) {
      skipNextDisplayedListSync.value = false;
      return;
    }
    syncDisplayedSubsSelectList();
  }, { deep: true });
  watch([tag, selectedSubscriptions, subsSelectList], () => {
    const selected = toRaw(selectedSubscriptions.value) || []
    const group = subsSelectList.value.filter(item => shouldShowElement(item[3])).map(item => item[0]) || []
    // 1. group 中不包含 selected 中的任何元素, subCheckbox 为 false, subCheckboxIndeterminate 为 false
    // 2. group 中包含 selected 中的任意元素, subCheckbox 为 true, subCheckboxIndeterminate 为 true
    // 3. group 中包含 selected 中的所有元素, subCheckbox 为 true, subCheckboxIndeterminate 为 false
    if (group.every(item => selected.includes(item))) {
      // console.log('group 中包含 selected 中的所有元素')
      subCheckbox.value = true
      subCheckboxIndeterminate.value = false
    } else if (group.some(item => selected.includes(item))) {
      // console.log('group 中包含 selected 中的任意元素')
      subCheckbox.value = true
      subCheckboxIndeterminate.value = true
    } else {
      // console.log('group 中不包含 selected 中的任意元素')
      subCheckbox.value = false
      subCheckboxIndeterminate.value = false
    }
  }, { immediate: true, deep: true });
  // const subCheckboxIndeterminate = computed(() => {
  //   const selected = toRaw(form.subscriptions)
  //   const currentGroup = subsSelectList.value.filter(item => shouldShowElement(item[3])).map(item => item[0])
  //   return true
  // });

const actionBlockRef = ref(null)
const customNameModeFlag = ref(false)
const updateCustomNameModeFlag = (flag) => customNameModeFlag.value = flag
const handleEditGlobalClick = () => {
  if (actionBlockRef.value) {
    if (customNameModeFlag.value) {
      // exit
      actionBlockRef.value.exitAllEditName();
    }
  }
}
</script>

<style scoped>
.subscription-editor {
  display: flex;
  flex-direction: column;
  gap: 18px;
  width: 100%;
  min-width: 0;
}
.subscription-editor-form {
  display: block;
}
.subscription-editor-grid {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.subscription-editor-card {
  min-width: 0;
}
.subscription-editor-fields {
  display: block;
}
.subscription-editor-fields :deep(.resource-field) {
  display: grid;
  grid-template-columns: 160px minmax(0, 1fr);
  align-items: center;
  column-gap: 24px;
  margin: 0;
  padding: 12px 16px;
}
.subscription-editor-fields :deep(.resource-field + .resource-field) {
  border-top: 1px solid var(--ui-border);
}
.subscription-editor-fields :deep(.resource-field > [data-slot="wrapper"]) {
  padding: 0;
  font-size: 14px;
  font-weight: 400;
}
.subscription-editor-fields :deep(.resource-field > [data-slot="wrapper"] label) {
  font-weight: 400;
}
.subscription-editor-fields :deep(.resource-field > div:last-child) {
  min-width: 0;
  margin-top: 0;
}
.subscription-editor-fields :deep(.switch-wrapper),
.subscription-editor-fields :deep(.inline-options) {
  justify-content: flex-end;
}
.subscription-editor-fields :deep(.radio-wrapper) {
  margin: 0;
}
.subscription-editor-fields :deep(.age-key-field) {
  display: flex;
  align-items: center;
  gap: 8px;
}
.subscription-editor-fields :deep(.age-key-field > .field-input) {
  flex: 1;
}
.subscription-editor-fields :deep(.label-tips) {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
.subscription-editor-fields :deep(.label-tips p) {
  margin: 0;
}
.subscription-editor-fields :deep(.label-tips .tips) {
  font-size: 12px;
  color: var(--ui-text-muted);
}
.subscription-icon-preview {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-bottom: 1px solid var(--ui-border);
}
.subscription-code-editor {
  max-height: 440px;
  overflow: auto;
  border: 1px solid var(--ui-border);
  border-radius: var(--ui-radius);
}
.subscription-editor :deep(.form-block-wrapper) {
  margin: 0;
}
.subscription-editor :deep(.sticky-title-wrapper) {
  min-height: 28px;
}
.subscription-editor :deep(.sticky-title-wrapper > p) {
  margin-right: auto;
}
.subscription-editor :deep(.quick-option-palette) {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.subscription-editor :deep(.include-subs-trigger),
.subscription-editor :deep(.include-subs-wrapper) {
  grid-column: 1 / -1;
  padding: 12px 16px;
  border-top: 1px solid var(--ui-border);
}
.subscription-editor-fields :deep(.label-with-tip) {
  flex-wrap: nowrap;
}
.subscription-editor :deep(.include-subs-trigger) {
  column-gap: 24px;
}
.subscription-picker-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}
.subscription-picker-list {
  overflow: hidden;
  border: 1px solid var(--ui-border);
  border-radius: var(--ui-radius);
}
.subscription-picker-list:empty {
  display: none;
}
.subscription-picker-row {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 56px;
  padding: 10px 12px;
  background: var(--ui-bg);
}
.subscription-picker-row + .subscription-picker-row {
  border-top: 1px solid var(--ui-border);
}
.subscription-picker-row.is-selected {
  background: var(--ui-bg-elevated);
}
.subscription-picker-row .drag-handle {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 32px;
  color: var(--ui-text-muted);
  cursor: grab;
  touch-action: none;
}
.subscription-picker-row .drag-handle:active {
  cursor: grabbing;
}
@media (max-width: 767px) {
  .subscription-editor-fields :deep(.resource-field) {
    grid-template-columns: minmax(0, 1fr);
    row-gap: 8px;
  }
  .subscription-editor-fields :deep(.switch-wrapper) {
    justify-content: flex-start;
  }
}
</style>
