<template>
  <div class="link-editor-page">
    <section v-if="isLoading" class="link-editor-state">
      <div class="link-editor-state-card">
        <h3>{{ $t("globalNotify.refresh.loading") }}</h3>
      </div>
    </section>

    <section v-else-if="hasLoadError" class="link-editor-state">
      <EmptyState image="error">
        <template #description>
          <h3>{{ $t("sharePage.editor.loadFailed.title") }}</h3>
          <p>{{ $t("sharePage.editor.loadFailed.desc") }}</p>
        </template>
      </EmptyState>
      <div class="link-editor-state-actions">
        <UButton :size="isDesktop ? 'sm' : 'md'" variant="outline" @click="loadEditorData">
          {{ $t("sharePage.editor.loadFailed.retry") }}
        </UButton>
        <UButton :size="isDesktop ? 'sm' : 'md'" color="primary" @click="router.push('/shares')">
          {{ $t("sharePage.editor.loadFailed.back") }}
        </UButton>
      </div>
    </section>

    <div v-else class="resource-editor-page" :inert="isSubmitting" :aria-busy="isSubmitting">
      <ResourceForm
        ref="ruleForm"
        class="resource-editor-form"
        :model-value="form"
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
            <ResourceField
              :label="$t(`sharePage.createShare.displayName.label`)"
              prop="displayName"
            >
              <FieldInput
                v-model="form.displayName"
                class="plain-input"
                :border="false"
                :placeholder="
                  $t(`sharePage.createShare.displayName.placeholder`)
                "
                type="text"
                input-align="right"
                max-length="100"
              />
            </ResourceField>

            <ResourceField
              :label="$t(`sharePage.createShare.remark.label`)"
              prop="remark"
            >
              <FieldTextarea
                v-model="form.remark"
                class="plain-input"
                :placeholder="$t(`sharePage.createShare.remark.placeholder`)"
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
                v-model.trim="form.tag"
                class="plain-input"
                :border="false"
                :placeholder="$t(`editorPage.subConfig.basic.tag.placeholder`)"
                type="text"
                input-align="right"
                right-icon="rect-right"
                @click-right-icon="showTagPopup"
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
              {{ $t("resourceEditor.shareOptions") }}
            </h2>
          </template>
          <div class="resource-editor-fields">
            <ResourceField
              :label="$t(`editorPage.subConfig.basic.source.label`)"
              prop="sourceName"
              required
              :rules="[
                {
                  required: true,
                  message: $t(`syncPage.addArtForm.source.isRequired`),
                },
              ]"
            >
              <ResourceSourceOptions
                v-model="sourceModel"
                :options="sourceOptions"
                :disabled="isSourceSelectorDisabled"
                @change="sourceChange"
              />
            </ResourceField>

            <ResourceField
              :label="$t(`sharePage.createShare.expirationMode.label`)"
              prop="expirationMode"
            >
              <div class="radio-wrapper">
                <ChoiceGroup
                  v-model="form.expirationMode"
                  direction="horizontal"
                >
                  <ChoiceOption
                    v-for="(item, index) in expirationModeList"
                    :key="index"
                    :label="item.value"
                  >
                    {{ item.label }}
                  </ChoiceOption>
                </ChoiceGroup>
              </div>
            </ResourceField>

            <template v-if="isDurationExpirationMode">
              <ResourceField
                v-if="!isLifetimeExpirationUnit"
                :label="$t(`sharePage.createShare.expiresValue.label`)"
                prop="expiresValue"
                required
                :rules="[
                  {
                    required: true,
                    message: $t(`sharePage.createShare.expiresValue.empty`),
                  },
                  {
                    validator: validateExpiresValue,
                    message: $t(`sharePage.createShare.expiresValue.regex`),
                  },
                ]"
              >
                <FieldInput
                  v-model="form.expiresValue"
                  class="plain-input"
                  :border="false"
                  :placeholder="
                    $t(`sharePage.createShare.expiresValue.placeholder`)
                  "
                  type="number"
                  input-align="right"
                  max-length="8"
                  format-trigger="onBlur"
                  @blur="customerBlurValidate('expiresValue')"
                />
              </ResourceField>
              <ResourceField
                :label="$t(`sharePage.createShare.expiresUnit.label`)"
                prop="expiresUnit"
              >
                <div class="radio-wrapper">
                  <ChoiceGroup
                    v-model="form.expiresUnit"
                    direction="horizontal"
                  >
                    <ChoiceOption
                      v-for="(item, index) in expiresUnitList"
                      :key="index"
                      :label="item.value"
                    >
                      {{ item.label }}
                    </ChoiceOption>
                  </ChoiceGroup>
                </div>
              </ResourceField>
            </template>

            <template v-else-if="isCountExpirationMode">
              <ResourceField
                :label="$t(`sharePage.createShare.countValue.label`)"
                prop="expiresValue"
                required
                :rules="[
                  {
                    required: true,
                    message: $t(`sharePage.createShare.countValue.empty`),
                  },
                  {
                    validator: validateCountValue,
                    message: $t(`sharePage.createShare.countValue.regex`),
                  },
                ]"
              >
                <FieldInput
                  v-model="form.expiresValue"
                  class="plain-input"
                  :border="false"
                  :placeholder="
                    $t(`sharePage.createShare.countValue.placeholder`)
                  "
                  type="number"
                  input-align="right"
                  :max-length="SHARE_COUNT_MAX_LENGTH"
                  format-trigger="onBlur"
                  @blur="customerBlurValidate('expiresValue')"
                />
              </ResourceField>
              <ResourceField
                :label="$t(`sharePage.createShare.usedCountValue.label`)"
                prop="usedCount"
                required
                :rules="[
                  {
                    required: true,
                    message: $t(`sharePage.createShare.usedCountValue.empty`),
                  },
                  {
                    validator: validateUsedCountValue,
                    message: $t(`sharePage.createShare.usedCountValue.regex`),
                  },
                ]"
              >
                <FieldInput
                  v-model="form.usedCount"
                  class="plain-input"
                  :border="false"
                  :placeholder="
                    $t(`sharePage.createShare.usedCountValue.placeholder`)
                  "
                  type="number"
                  input-align="right"
                  :max-length="SHARE_COUNT_MAX_LENGTH"
                  format-trigger="onBlur"
                  @blur="customerBlurValidate('usedCount')"
                />
              </ResourceField>
            </template>

            <template v-else>
              <ResourceField
                :label="$t(`sharePage.createShare.exactDatetime.label`)"
                prop="exactDatetime"
                body-align="right"
                required
                :rules="[
                  {
                    required: true,
                    message: $t(`sharePage.createShare.exactDatetime.empty`),
                  },
                  {
                    validator: validateExactDatetime,
                    message: $t(`sharePage.createShare.exactDatetime.invalid`),
                  },
                ]"
              >
                <ShareExactDatetimeField
                  v-model="form.exactDatetime"
                  :placeholder="
                    $t(`sharePage.createShare.exactDatetime.placeholder`)
                  "
                  :locale="datetimePickerLocale"
                  :confirm-text="
                    $t(`sharePage.createShare.exactDatetime.confirm`)
                  "
                  :cancel-text="
                    $t(`sharePage.createShare.exactDatetime.cancel`)
                  "
                  @blur="customerBlurValidate('exactDatetime')"
                  @closed="handleExactDatetimeClosed"
                />
              </ResourceField>
            </template>

            <ResourceField
              :label="$t(`sharePage.createShare.token.label`)"
              prop="token"
              :rules="[
                {
                  validator: duplicateTokenValidator,
                  message: $t(`sharePage.createShare.token.isExist`),
                },
              ]"
            >
              <FieldInput
                v-model="form.token"
                class="plain-input"
                :border="false"
                :placeholder="$t(`sharePage.createShare.token.placeholder`)"
                type="text"
                input-align="right"
                max-length="100"
                @blur="customerBlurValidate('token')"
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
                  v-model.trim="form['age-public-key']"
                  class="plain-input"
                  :border="false"
                  :placeholder="$t('ageKey.publicKey.placeholder')"
                  type="text"
                  input-align="right"
                />
                <AgeKeyHelper v-model="form['age-public-key']" />
              </div>
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
                :class="{ 'sub-item-customer-icon': !shareDisplayIsIconColor }"
                :src="shareDisplayIcon"
                :fit="shareDisplayIconFit"
                show-loading
                @click="showIconPopup"
              />
            </div>
            <ResourceField
              :label="$t(`editorPage.subConfig.basic.icon.label`)"
              prop="icon"
            >
              <FieldInput
                v-model.trim="form.icon"
                class="plain-input"
                :border="false"
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
          v-if="shouldShowShareUrlRow || shouldShowShareQrCode"
          class="resource-editor-card"
          :ui="{ header: 'px-4 py-3 sm:px-4', body: 'p-0 sm:p-0' }"
        >
          <template #header>
            <h2 class="text-sm font-semibold">
              {{ $t("resourceEditor.shareResult") }}
            </h2>
          </template>
          <div class="resource-editor-fields">
            <ResourceField
              v-if="shouldShowShareUrlRow"
              :label="$t(`sharePage.createShare.shareUrl.label`)"
              prop="shareUrl"
            >
              <FieldInput
                v-model="form.shareUrl"
                class="plain-input public-url-input"
                :border="false"
                :placeholder="$t(`sharePage.createShare.shareUrl.placeholder`)"
                type="text"
                input-align="right"
                readonly
              />
            </ResourceField>

            <div v-if="shouldShowShareQrCode" class="qrcode-wrapper">
              <ResourceImage
                :src="shareUrlQrCode"
                class="qrcode"
                fit="cover"
                alt="QR Code"
              />
            </div>
          </div>
        </UCard>
      </ResourceForm>
    </div>
    <Teleport defer to="#resource-editor-actions">
      <UButton
        to="/shares"
        icon="i-lucide-arrow-left"
        size="sm"
        color="neutral"
        variant="outline"
        :disabled="isSubmitting"
      >
        {{ $t("workspace.back") }}
      </UButton>
      <UButton
        v-if="form.shareUrl"
        @click="handleCopyShare()"
        icon="i-lucide-link"
        size="sm"
        color="neutral"
        variant="outline"
        :disabled="isSubmitting"
      >
        {{ $t("sharePage.createShare.copyBtn") }}
      </UButton>
      <UButton
        @click="handleSubmit"
        icon="i-lucide-save"
        size="sm"
        :loading="isSubmitting"
        :disabled="isSubmitting || isLoading || hasLoadError"
      >
        {{ submitButtonLabel }}
      </UButton>
    </Teleport>

    <TagPopup
      v-model:visible="tagPopupVisible"
      :current-tag="currentTag"
      type="share"
      @set-tag="setTagValue"
    />

    <IconPopup
      v-if="iconPopupVisible"
      v-model:visible="iconPopupVisible"
      @set-icon="setIcon"
    />
  </div>
</template>
<script setup lang="ts">
import { useMediaQuery } from "@vueuse/core";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import ResourceSourceOptions from "@/components/ResourceSourceOptions.vue";
import { Toast } from '@/services/feedback';

import { useQRCode } from "@vueuse/integrations/useQRCode";
import { storeToRefs } from "pinia";
import { computed, nextTick, reactive, ref, watch } from "vue";
import { copyText } from "@/utils/clipboard";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";

import logoIcon from "@/assets/icons/logo.png";
import logoRedIcon from "@/assets/icons/logo-red.png";
import AgeKeyHelper from "@/components/AgeKeyHelper.vue";
import ImageFitPicker from "@/components/ImageFitPicker.vue";
import ShareExactDatetimeField from "@/components/ShareExactDatetimeField.vue";
import TagPopup from "@/components/TagPopup.vue";
import IconPopup from "@/views/icon/IconPopup.vue";
import { useShareApi } from "@/api/share";
import { useBackend } from "@/hooks/useBackend";
import { useHostAPI } from "@/hooks/useHostAPI";
import { getLocaleConfig, normalizeLocale } from "@/locales/languages";
import { useAppNotifyStore } from "@/store/appNotify";
import { useGlobalStore } from "@/store/global";
import { useSettingsStore } from "@/store/settings";
import { useSubsStore } from "@/store/subs";
import { createGithubProxyUrlRewriter } from "@/utils/githubProxy";
import {
  findShareByRouteIdentity,
  getShareEditPath,
  getShareExpirationFormState,
  getSharePublicUrl,
  isShareType,
  isValidShareExactDatetime,
  parseShareEditorRouteIdentity,
  resolveShareDisplayIconState,
  SHARE_EXPIRATION_DATETIME_BACKEND_VERSION,
  SHARE_EXPIRATION_LIFETIME_BACKEND_VERSION,
  SHARE_LIFETIME_EXPIRATION_UNIT,
  supportsShareExpirationDatetime,
  supportsShareExpirationLifetime,
  type ShareExpirationMode,
  type ShareExpirationUnit,
  type ShareTimedExpirationUnit,
} from "@/utils/share";
import { normalizeTagArray, stringifyTagInput } from "@/utils/shareTags";
import { normalizeOptionalImageFit, resolveImageFit, type ImageFit } from "@/utils/iconFit";
const isDesktop = useMediaQuery("(min-width: 768px)");

type EditorMode = "create" | "edit";
type ShareSourceType = "sub" | "col" | "file";
type ShareEditorData = Share & {
  type: ShareSourceType;
  name: string;
  shareUrl?: string;
};
type ActiveShareEditorData = ShareEditorData & {
  token: string;
};

const route = useRoute();
const router = useRouter();
const { t, locale } = useI18n();
const shareApi = useShareApi();
const globalStore = useGlobalStore();
const settingsStore = useSettingsStore();
const subsStore = useSubsStore();
const {
  appearanceSetting,
  githubProxy,
  githubProxyRegex,
} = storeToRefs(settingsStore);
const { showNotify } = useAppNotifyStore();
const { currentUrl: host, currentShareBaseUrl } = useHostAPI();
const { env } = useBackend();


const getRouteParam = (value: string | string[] | null | undefined) => {
  return Array.isArray(value) ? value[0] || "" : value || "";
};

const routeNameParam = computed(() => getRouteParam(route.params.name));
const routeIdentity = computed(() => {
  return parseShareEditorRouteIdentity({
    name: routeNameParam.value,
    queryType: getRouteParam(route.query.type),
    queryToken: getRouteParam(route.query.token),
  });
});
const routeMode = computed<EditorMode>(() => routeIdentity.value.mode);
const isEditMode = computed(() => routeMode.value === "edit");
const ruleForm = ref<any>(null);
const isLoading = ref(true);
const hasLoadError = ref(false);
const isSubmitting = ref(false);
const editorData = ref<ShareEditorData | null>(null);
const isHydratingForm = ref(false);
const tagPopupVisible = ref(false);
const iconPopupVisible = ref(false);

const sourceInput = ref("");
const sourceModel = ref<string[]>([]);
const latestLoadRequestId = ref(0);
const isRetryingCreateAfterDelete = ref(false);
const MAX_SHARE_COUNT = Number.MAX_SAFE_INTEGER;
const SHARE_COUNT_MAX_LENGTH = String(MAX_SHARE_COUNT).length;

const form = reactive({
  sourceType: "" as ShareSourceType | "",
  sourceName: "",
  expirationMode: "duration" as ShareExpirationMode,
  expiresValue: "",
  usedCount: "",
  expiresUnit: "day" as ShareExpirationUnit,
  exactDatetime: null as number | null,
  remark: "",
  token: "",
  displayName: "",
  "age-public-key": "",
  tag: "",
  icon: "",
  isIconColor: true,
  iconFit: undefined as ImageFit | undefined,
  shareUrl: "",
});

const { markSaved, navigateAfterSave } = useUnsavedChanges(
  () => { const { shareUrl, ...editable } = form; return JSON.stringify(editable); },
  () => !isLoading.value && !hasLoadError.value,
  () => isSubmitting.value,
);

const routeShareType = computed(() => routeIdentity.value.type);
const routeShareName = computed(() => routeIdentity.value.name);
const routeToken = computed(() => routeIdentity.value.token);
const isSourceSelectorDisabled = computed(() => isEditMode.value);

const submitButtonLabel = computed(() => {
  return routeMode.value === "create"
    ? t("sharePage.editor.create.submit")
    : t("sharePage.editor.edit.submit");
});
const isExactExpirationMode = computed(() => form.expirationMode === "datetime");
const isDurationExpirationMode = computed(() => form.expirationMode === "duration");
const isCountExpirationMode = computed(() => form.expirationMode === "count");
const isLifetimeExpirationUnit = computed(() => form.expiresUnit === SHARE_LIFETIME_EXPIRATION_UNIT);
const shouldShowShareUrlRow = computed(() => isEditMode.value);
const shouldShowShareQrCode = computed(() => {
  return isEditMode.value && Boolean(form.shareUrl);
});
const datetimePickerLocale = computed(() => {
  return getLocaleConfig(normalizeLocale(locale.value)).datePickerLocale;
});

const currentTag = computed(() => form.tag || "");
const normalizedSourceName = computed(() => form.sourceName.trim());
const secretPath = computed(() => {
  return env.value?.meta?.node?.env?.SUB_STORE_FRONTEND_BACKEND_PATH || "";
});

const normalizedFormToken = computed(() => {
  return form.token.trim();
});
const normalizedFormIcon = computed(() => {
  return form.icon.trim();
});
const selectedSourceType = computed<ShareSourceType | null>(() => {
  return isShareType(form.sourceType) ? form.sourceType : null;
});

const isCurrentEditingShare = (share: Share) => {
  if (routeIdentity.value.mode !== "edit") {
    return false;
  }

  return share.type === routeIdentity.value.type
    && share.name === routeIdentity.value.name
    && share.token === routeIdentity.value.token;
};

const hasDuplicateTokenForSource = (token: string) => {
  if (!token || !selectedSourceType.value || !normalizedSourceName.value) {
    return false;
  }

  return subsStore.shares.some((share) => {
    const shareToken = typeof share.token === "string" ? share.token.trim() : "";
    return share.type === selectedSourceType.value
      && share.name === normalizedSourceName.value
      && shareToken === token
      && !isCurrentEditingShare(share);
  });
};

const duplicateTokenValidator = (value: string) => {
  const nextToken = (value ?? form.token ?? "").trim();
  return Promise.resolve(!hasDuplicateTokenForSource(nextToken));
};

const sourceOptions = computed(() => {
  const buildChildren = <T extends { name: string; displayName?: string; ["display-name"]?: string }>(
    items: T[],
  ) =>
    items.map((item) => ({
      value: item.name,
      text: item.displayName || item["display-name"] || item.name,
    }));

  const options: Array<{ value: ShareSourceType; text: string; children: Array<{ value: string; text: string }> }> = [];

  if (subsStore.subs.length > 0) {
    options.push({
      value: "sub",
      text: t("specificWord.singleSub"),
      children: buildChildren(subsStore.subs),
    });
  }

  if (subsStore.collections.length > 0) {
    options.push({
      value: "col",
      text: t("specificWord.collectionSub"),
      children: buildChildren(subsStore.collections),
    });
  }

  if (subsStore.files.length > 0) {
    options.push({
      value: "file",
      text: t("specificWord.file"),
      children: buildChildren(subsStore.files),
    });
  }

  return options;
});

const sourceTypeLabel = computed(() => {
  return sourceOptions.value.find((item) => item.value === selectedSourceType.value)?.text
    || t("specificWord.unknownType");
});

const sourceDisplayName = computed(() => {
  const typeOption = sourceOptions.value.find((item) => item.value === selectedSourceType.value);
  return typeOption?.children?.find((item) => item.value === normalizedSourceName.value)?.text
    || (
      normalizedSourceName.value
        ? `${normalizedSourceName.value}(🚫)`
        : t("specificWord.unknownSource")
    );
});

const expirationModeList = computed(() => [
  {
    label: t("sharePage.createShare.expirationMode.duration"),
    value: "duration",
  },
  {
    label: t("sharePage.createShare.expirationMode.datetime"),
    value: "datetime",
  },
  {
    label: t("sharePage.createShare.expirationMode.count"),
    value: "count",
  },
]);
const expiresUnitList = computed(() => [
  {
    label: t("sharePage.createShare.unit.day"),
    value: "day",
  },
  {
    label: t("sharePage.createShare.unit.month"),
    value: "month",
  },
  {
    label: t("sharePage.createShare.unit.season"),
    value: "season",
  },
  {
    label: t("sharePage.createShare.unit.year"),
    value: "year",
  },
  {
    label: t("sharePage.createShare.unit.lifetime"),
    value: SHARE_LIFETIME_EXPIRATION_UNIT,
  },
]);

const shareUrlQrCode = useQRCode(computed(() => form.shareUrl));

const buildShareUrl = (
  type: "sub" | "col" | "file",
  name: string,
  token: string,
  notifyOnError: boolean = false,
) => {
  try {
    return getSharePublicUrl({
      host: host.value,
      shareBaseUrl: currentShareBaseUrl.value,
      secretPath: secretPath.value,
      type,
      name,
      token,
    });
  } catch (error) {
    if (notifyOnError) {
      Toast.fail(t("sharePage.magicPathErrorNotify"));
    }
    return "";
  }
};

const resetFormState = () => {
  isRetryingCreateAfterDelete.value = false;
  sourceInput.value = "";
  sourceModel.value = [];
  form.sourceType = "";
  form.sourceName = "";
  form.expirationMode = "duration";
  form.expiresValue = "";
  form.usedCount = "";
  form.expiresUnit = "day";
  form.exactDatetime = null;
  form.remark = "";
  form.token = "";
  form.displayName = "";
  form["age-public-key"] = "";
  form.tag = "";
  form.icon = "";
  form.isIconColor = true;
  form.shareUrl = "";
};

const getSourceDefaultDisplayName = (
  source?: {
    displayName?: string | null;
    "display-name"?: string | null;
  } | null,
) => {
  if (typeof source?.displayName === "string") {
    return source.displayName;
  }
  if (typeof source?.["display-name"] === "string") {
    return source["display-name"];
  }
  return "";
};

const getSourceDefaultTag = (
  source?: {
    tag?: string[];
  } | null,
) => {
  return stringifyTagInput(source?.tag);
};

const hydrateForm = () => {
  isHydratingForm.value = true;
  const activeSource = editorData.value;

  if (!activeSource) {
    resetFormState();
    isHydratingForm.value = false;
    return;
  }

  form.sourceType = activeSource.type;
  form.sourceName = activeSource.name;
  syncSourceModel();
  const expirationState = getShareExpirationFormState({
    mode: activeSource.mode,
    expiresAt: activeSource.expiresAt,
    expiresIn: activeSource.expiresIn,
    expiresValue: activeSource.expiresValue,
    expiresUnit: activeSource.expiresUnit,
    exp: activeSource.exp,
    count: activeSource.count,
  });
  form.expirationMode = expirationState.mode;
  form.expiresValue = expirationState.expiresValue;
  form.usedCount = activeSource.mode === "count"
    ? String(activeSource.usedCount ?? 0)
    : "";
  form.expiresUnit = expirationState.expiresUnit;
  form.exactDatetime = expirationState.exactDatetime;

  form.remark = activeSource.remark || "";
  form.token = activeSource.token || "";
  form["age-public-key"] = routeMode.value === "edit"
    ? activeSource["age-public-key"] || ""
    : "";
  form.displayName = routeMode.value === "create"
    ? getSourceDefaultDisplayName(activeSource)
    : activeSource.displayName || "";
  form.tag = routeMode.value === "create"
    ? getSourceDefaultTag(activeSource)
    : stringifyTagInput(activeSource.tag);
  form.icon = routeMode.value === "create"
    ? ""
    : activeSource.icon || "";
  form.isIconColor = routeMode.value === "edit" && activeSource.icon
    ? activeSource.isIconColor !== false
    : true;
  form.iconFit = routeMode.value === "edit"
    ? normalizeOptionalImageFit(activeSource.iconFit)
    : undefined;
  form.shareUrl =
    activeSource.shareUrl
    || (
      routeMode.value === "edit" && activeSource.token
        ? buildShareUrl(activeSource.type, activeSource.name, activeSource.token)
        : ""
    );
  Promise.resolve().then(() => {
    isHydratingForm.value = false;
  });
};

const refreshShares = async () => {
  try {
    await subsStore.fetchShareData();
  } catch (error) {
    console.error(error);
  }
  return subsStore.shares;
};

const findSourceItem = (type: ShareSourceType, name: string) => {
  if (type === "sub") {
    return subsStore.getOneSub(name);
  }
  if (type === "col") {
    return subsStore.getOneCollection(name);
  }
  return subsStore.getOneFile(name);
};

const selectedSourceItem = computed(() => {
  if (!selectedSourceType.value || !normalizedSourceName.value) {
    return null;
  }

  return findSourceItem(selectedSourceType.value, normalizedSourceName.value) || null;
});
const githubUrlRewriter = computed(() => {
  return createGithubProxyUrlRewriter(githubProxy.value, githubProxyRegex.value);
});
const rewriteGithubUrl = (url?: string | null) => {
  return githubUrlRewriter.value(url);
};
const defaultShareIcon = computed(() => {
  return appearanceSetting.value.isDefaultIcon ? logoIcon : logoRedIcon;
});
const shareDisplayIconState = computed(() => {
  return resolveShareDisplayIconState({
    share: form.icon
      ? {
          icon: form.icon,
          isIconColor: form.isIconColor,
          iconFit: form.iconFit,
        }
      : { iconFit: form.iconFit },
    source: selectedSourceItem.value,
    fallbackIcon: defaultShareIcon.value,
  });
});
const shareDisplayIcon = computed(() => {
  return rewriteGithubUrl(shareDisplayIconState.value.icon) || shareDisplayIconState.value.icon;
});
const shareDisplayIsIconColor = computed(() => {
  return shareDisplayIconState.value.isIconColor;
});
const shareDisplayIconFit = computed(() => {
  return resolveImageFit(shareDisplayIconState.value.iconFit, appearanceSetting.value.iconFit);
});

const syncSourceModel = () => {
  if (!selectedSourceType.value || !normalizedSourceName.value) {
    sourceModel.value = [];
    return;
  }

  sourceModel.value = [selectedSourceType.value, normalizedSourceName.value];
};

const updateSourceInput = () => {
  if (!selectedSourceType.value || !normalizedSourceName.value) {
    sourceInput.value = "";
    return;
  }

  sourceInput.value = `${sourceTypeLabel.value} - ${sourceDisplayName.value}`;
};

const applyCreateSourceDefaults = (force: boolean = false) => {
  if (routeMode.value !== "create") {
    return;
  }

  const sourceItem = selectedSourceItem.value;
  if (!sourceItem) {
    return;
  }

  if (force || !form.remark) {
    form.remark = sourceItem.remark || "";
  }
  if (force || !form.displayName) {
    form.displayName = getSourceDefaultDisplayName(sourceItem);
  }
  if (force || !form.tag) {
    form.tag = getSourceDefaultTag(sourceItem);
  }
};

const sourceChange = (value: string[]) => {
  if (isSourceSelectorDisabled.value) {
    return;
  }

  const [nextType, nextName] = value;
  if (!isShareType(nextType) || !nextName) {
    return;
  }

  form.sourceType = nextType;
  form.sourceName = nextName;
  syncSourceModel();
  applyCreateSourceDefaults(true);
};


const ensureEnvLoaded = async (
  options: {
    forceRefresh?: boolean;
    strict?: boolean;
  } = {},
) => {
  if (!options.forceRefresh && env.value?.backend) {
    return env.value;
  }

  return globalStore.setEnv({
    bypassCache: options.forceRefresh === true,
    strict: options.strict === true,
  });
};

const isLoadRequestActive = (requestId: number) => latestLoadRequestId.value === requestId;

const applyLoadError = (requestId: number) => {
  if (!isLoadRequestActive(requestId)) {
    return;
  }

  isRetryingCreateAfterDelete.value = false;
  hasLoadError.value = true;
  isLoading.value = false;
};

const finishLoad = (requestId: number, nextData: ShareEditorData | null, isError: boolean = false) => {
  if (!isLoadRequestActive(requestId)) {
    return;
  }

  isRetryingCreateAfterDelete.value = false;
  editorData.value = nextData;
  hydrateForm();
  hasLoadError.value = isError;
  isLoading.value = false;
};

const loadEditorData = async () => {
  const requestId = latestLoadRequestId.value + 1;
  latestLoadRequestId.value = requestId;
  isLoading.value = true;
  hasLoadError.value = false;
  editorData.value = null;

  const type = routeShareType.value;
  const name = routeShareName.value;
  const token = routeToken.value;

  if (routeMode.value === "edit" && (!token || !type || !name)) {
    applyLoadError(requestId);
    return;
  }

  try {
    if (routeMode.value === "edit") {
      let nextData = findShareByRouteIdentity(subsStore.shares, routeIdentity.value);

      if (!nextData) {
        await Promise.all([
          subsStore.fetchSubsData(),
          subsStore.fetchShareData(),
        ]);
        if (!isLoadRequestActive(requestId)) {
          return;
        }
        nextData = findShareByRouteIdentity(subsStore.shares, routeIdentity.value);
      }

      if (!nextData || !isShareType(nextData.type) || !nextData.name) {
        applyLoadError(requestId);
        return;
      }

      await ensureEnvLoaded();
      if (!isLoadRequestActive(requestId)) {
        return;
      }
      finishLoad(requestId, {
        ...nextData,
        type: nextData.type,
        name: nextData.name,
        shareUrl: buildShareUrl(nextData.type, nextData.name, nextData.token || token),
      });
      return;
    }

    if (type && name) {
      let nextData = findSourceItem(type, name);
      if (!nextData) {
        await subsStore.fetchSubsData();
        if (!isLoadRequestActive(requestId)) {
          return;
        }
        nextData = findSourceItem(type, name);
      }
      if (nextData) {
        finishLoad(requestId, {
          ...nextData,
          type,
          name,
        });
        return;
      }
      finishLoad(requestId, {
        type,
        name,
      });
      return;
    }

    if (subsStore.subs.length === 0 && subsStore.collections.length === 0 && subsStore.files.length === 0) {
      await subsStore.fetchSubsData();
      if (!isLoadRequestActive(requestId)) {
        return;
      }
    }

    finishLoad(requestId, null);
  } catch (error) {
    console.error(error);
    applyLoadError(requestId);
  }
};

const showTagPopup = () => {
  tagPopupVisible.value = true;
};

const setTagValue = (tag: string) => {
  form.tag = tag;
};

const showIconPopup = () => {
  iconPopupVisible.value = true;
};

const setIcon = (icon: { url?: string | null }) => {
  form.icon = icon?.url || "";
};

const ageOutputTips = () => ({
  title: t("ageKey.publicKey.tips.title"),
  content: t("ageKey.publicKey.tips.content"),
});

const validateExpiresValue = (value: string) => {
  return /^(?:0\.0[1-9]\d*|[1-9]\d{0,4}(?:\.\d*)?|0\.[1-9]\d*)$/.test(value);
};

const validateExactDatetime = (value: number | null) => {
  return value == null || isValidShareExactDatetime(value);
};

const validateCountValue = (value: string) => {
  const count = parseShareCountValue(value);
  return count != null && count > 0;
};

const validateUsedCountValue = (value: string) => {
  const count = parseShareCountValue(form.expiresValue);
  const usedCount = parseShareCountValue(value);
  return count != null && usedCount != null && usedCount <= count;
};

const parseShareCountValue = (value: string) => {
  if (!/^(?:0|[1-9]\d*)$/.test(value)) {
    return null;
  }

  const count = Number(value);
  return Number.isSafeInteger(count) ? count : null;
};

const customerBlurValidate = (prop: string) => {
  ruleForm.value?.validate?.(prop);
};

const handleExactDatetimeClosed = () => {
  customerBlurValidate("exactDatetime");
};

const reportFieldError = (prop: string, message: string) => {
  ruleForm.value.setErrors([{ prop, message }], !isSubmitting.value);
};

const validateTokenBeforeSubmit = () => {
  if (!hasDuplicateTokenForSource(normalizedFormToken.value)) {
    return true;
  }

  customerBlurValidate("token");
  reportFieldError("token", t("sharePage.createShare.token.isExist"));
  return false;
};

const normalizeExpiresValue = (expireValue: string) => {
  return String(Number(Number.parseFloat(expireValue).toFixed(2)));
};

const genExpiresIn = (expireValue: string, expireUnit: ShareTimedExpirationUnit) => {
  const unitMap: Record<ShareTimedExpirationUnit, { multiplier: number; suffix: string }> = {
    day: {
      multiplier: 1,
      suffix: "d",
    },
    month: {
      multiplier: 30,
      suffix: "d",
    },
    season: {
      multiplier: 90,
      suffix: "d",
    },
    year: {
      multiplier: 365,
      suffix: "d",
    },
  };
  const value = Number(normalizeExpiresValue(expireValue));
  const unitConfig = unitMap[expireUnit];
  return `${value * unitConfig.multiplier}${unitConfig.suffix}`;
};

const getDurationExpirationOptions = async (): Promise<ShareToken["options"] | null> => {
  if (form.expiresUnit === SHARE_LIFETIME_EXPIRATION_UNIT) {
    let verifiedEnv: { version?: string | null } | null = null;
    try {
      verifiedEnv = await ensureEnvLoaded({
        forceRefresh: true,
        strict: true,
      });
    } catch (error) {
      console.error(error);
          showNotify({
        title: t("sharePage.editor.lifetimeBackendCheckFailed.title"),
        content: t("sharePage.editor.lifetimeBackendCheckFailed.desc"),
        type: "danger",
        duration: 3600,
      });
      return null;
    }

    if (!supportsShareExpirationLifetime(verifiedEnv?.version)) {
          showNotify({
        title: t("sharePage.editor.lifetimeBackendRequired.title"),
        content: t("sharePage.editor.lifetimeBackendRequired.desc", {
          currentVersion: verifiedEnv?.version || t("specificWord.unknown"),
          minVersion: SHARE_EXPIRATION_LIFETIME_BACKEND_VERSION,
        }),
        type: "danger",
        duration: 3600,
      });
      return null;
    }

    if (!isDurationExpirationMode.value || form.expiresUnit !== SHARE_LIFETIME_EXPIRATION_UNIT) {
      return null;
    }

    // 长期有效: 不传 expiresIn, 需显式声明 mode 让后端按长期有效保存
    return {
      mode: "duration",
      expiresUnit: SHARE_LIFETIME_EXPIRATION_UNIT,
    };
  }

  if (!form.expiresValue) {
      reportFieldError("expiresValue", t("sharePage.createShare.expiresValue.empty"));
    return null;
  }

  if (!validateExpiresValue(form.expiresValue)) {
      reportFieldError("expiresValue", t("sharePage.createShare.expiresValue.regex"));
    return null;
  }

  return {
    expiresIn: genExpiresIn(form.expiresValue, form.expiresUnit),
    expiresValue: normalizeExpiresValue(form.expiresValue),
    expiresUnit: form.expiresUnit,
  };
};

const getDatetimeExpirationOptions = async (): Promise<ShareToken["options"] | null> => {
  if (form.exactDatetime == null) {
      reportFieldError("exactDatetime", t("sharePage.createShare.exactDatetime.empty"));
    return null;
  }

  if (!isValidShareExactDatetime(form.exactDatetime)) {
      reportFieldError("exactDatetime", t("sharePage.createShare.exactDatetime.invalid"));
    return null;
  }

  let verifiedEnv: { version?: string | null } | null = null;
  try {
    // Temporary safety check for mixed-version deployments.
    // Once exact datetime support is baseline everywhere, we can remove the forced refresh gate.
    verifiedEnv = await ensureEnvLoaded({
      forceRefresh: true,
      strict: true,
    });
  } catch (error) {
    console.error(error);
      showNotify({
      title: t("sharePage.editor.datetimeBackendCheckFailed.title"),
      content: t("sharePage.editor.datetimeBackendCheckFailed.desc"),
      type: "danger",
      duration: 3600,
    });
    return null;
  }

  if (!supportsShareExpirationDatetime(verifiedEnv?.version)) {
      showNotify({
      title: t("sharePage.editor.datetimeBackendRequired.title"),
      content: t("sharePage.editor.datetimeBackendRequired.desc", {
        currentVersion: verifiedEnv?.version || t("specificWord.unknown"),
        minVersion: SHARE_EXPIRATION_DATETIME_BACKEND_VERSION,
      }),
      type: "danger",
      duration: 3600,
    });
    return null;
  }

  if (!isValidShareExactDatetime(form.exactDatetime)) {
      reportFieldError("exactDatetime", t("sharePage.createShare.exactDatetime.invalid"));
    return null;
  }

  return {
    mode: "datetime",
    exp: Number(form.exactDatetime),
  };
};

const getCountExpirationOptions = (): ShareToken["options"] | null => {
  if (!form.expiresValue) {
      reportFieldError("expiresValue", t("sharePage.createShare.countValue.empty"));
    return null;
  }

  if (!validateCountValue(form.expiresValue)) {
      reportFieldError("expiresValue", t("sharePage.createShare.countValue.regex"));
    return null;
  }

  if (form.usedCount === "") {
      reportFieldError("usedCount", t("sharePage.createShare.usedCountValue.empty"));
    return null;
  }

  if (!validateUsedCountValue(form.usedCount)) {
      reportFieldError("usedCount", t("sharePage.createShare.usedCountValue.regex"));
    return null;
  }

  return {
    mode: "count",
    count: Number(form.expiresValue),
    usedCount: Number(form.usedCount),
  };
};

const handleCopyShare = async (isNotify: boolean = true) => {
  if (!form.shareUrl) {
    return false;
  }

  try {
    await copyText(form.shareUrl);
  } catch (error) {
    if (isNotify) {
      Toast.fail(t("globalNotify.copyFailed", { e: error?.message ?? String(error) }));
    }
    return false;
  }

  if (isNotify) {
    showNotify({ title: t("sharePage.copyShare.succeedNotify") });
  }

  return true;
};

const getSubmitParams = async (): Promise<ShareToken | null> => {
  const { valid } = await ruleForm.value.validate(undefined, false);
  if (!valid) return null;
  if (!selectedSourceType.value || !normalizedSourceName.value) {
    reportFieldError("sourceName", t("syncPage.addArtForm.source.isRequired"));
    return null;
  }

  if (!validateTokenBeforeSubmit()) {
    return null;
  }

  let options: ShareToken["options"] | null;
  if (isExactExpirationMode.value) {
    options = await getDatetimeExpirationOptions();
  } else if (isCountExpirationMode.value) {
    options = getCountExpirationOptions();
  } else {
    options = await getDurationExpirationOptions();
  }
  if (!options) {
    return null;
  }

  const payload: SharePayload = {
    type: selectedSourceType.value,
    name: normalizedSourceName.value,
    displayName: form.displayName || "",
    remark: form.remark || "",
    tag: normalizeTagArray(form.tag),
  };
  const iconFit = normalizeOptionalImageFit(form.iconFit);
  if (iconFit) {
    payload.iconFit = iconFit;
  }
  const agePublicKey = form["age-public-key"].trim();
  if (agePublicKey) {
    payload["age-public-key"] = agePublicKey;
  } else if (routeMode.value === "edit") {
    payload["age-public-key"] = null;
  }

  if (normalizedFormIcon.value) {
    payload.icon = normalizedFormIcon.value;
    payload.isIconColor = form.isIconColor !== false;
  }

  if (routeMode.value === "create") {
    if (normalizedFormToken.value) {
      payload.token = normalizedFormToken.value;
    }
  } else {
    payload.token = normalizedFormToken.value || null;
  }

  return {
    payload,
    options,
  };
};

const createShareFromParams = async (params: ShareToken) => {
  const res = await shareApi.createShare(getCreateSubmitParams(params));
  if (res?.data?.status !== "success") {
    return null;
  }

  return res.data.data?.token || null;
};

const getCreateSubmitParams = (params: ShareToken): ShareToken => {
  const payload = {
    ...params.payload,
  };

  if (payload.token == null || payload.token === "") {
    delete payload.token;
  }

  return {
    payload,
    options: {
      ...params.options,
    },
  };
};

const getSubmitRouteSnapshot = () => ({
  fullPath: route.fullPath,
  mode: routeMode.value,
  type: routeIdentity.value.type,
  name: routeIdentity.value.name,
  token: routeToken.value,
});

const syncEditorRouteToShare = async (
  shareType: ShareSourceType,
  shareName: string,
  nextToken: string,
  submitRouteSnapshot: ReturnType<typeof getSubmitRouteSnapshot>,
) => {
  if (route.fullPath !== submitRouteSnapshot.fullPath) {
    return;
  }

  const shouldReplaceRoute =
    submitRouteSnapshot.mode === "create"
    || submitRouteSnapshot.type !== shareType
    || submitRouteSnapshot.name !== shareName
    || submitRouteSnapshot.token !== nextToken;

  if (shouldReplaceRoute) {
    await navigateAfterSave(getShareEditPath(shareType, shareName, nextToken));
    return;
  }

  await loadEditorData();
};

const finalizeSuccessfulSave = async (
  shareType: ShareSourceType,
  shareName: string,
  nextToken: string,
  notifyKey: string,
  copiedNotifyKey: string,
  submitRouteSnapshot: ReturnType<typeof getSubmitRouteSnapshot>,
) => {
  form.shareUrl = buildShareUrl(shareType, shareName, nextToken, true);
  markSaved();
  const copied = await handleCopyShare(false);
  showNotify({ title: t(copied ? copiedNotifyKey : notifyKey) });
  await refreshShares();
  await syncEditorRouteToShare(shareType, shareName, nextToken, submitRouteSnapshot);
};

const finalizeFailedUpdate = () => {
  Toast.fail(t("sharePage.editor.failNotify"));
};

const finalizeRetryableUpdateFailure = () => {
  isRetryingCreateAfterDelete.value = true;
};

const handleCreate = async () => {
  const params = await getSubmitParams();
  if (!params) {
    return;
  }
  const submitRouteSnapshot = getSubmitRouteSnapshot();
  const nextToken = await createShareFromParams(params);
  if (!nextToken) {
    return;
  }

  await finalizeSuccessfulSave(
    params.payload.type,
    params.payload.name,
    nextToken,
    "sharePage.editor.create.succeedNotify",
    "sharePage.editor.create.succeedAndCopyNotify",
    submitRouteSnapshot,
  );
};

const handleEdit = async () => {
  const activeSource = editorData.value;
  const params = await getSubmitParams();
  if (!activeSource || !params || !activeSource.token) {
    return;
  }
  const submitRouteSnapshot = getSubmitRouteSnapshot();
  if (isRetryingCreateAfterDelete.value) {
    const retryToken = await createShareFromParams(params);
    if (!retryToken) {
      finalizeRetryableUpdateFailure();
      return;
    }

    isRetryingCreateAfterDelete.value = false;
    await finalizeSuccessfulSave(
      params.payload.type,
      params.payload.name,
      retryToken,
      "sharePage.editor.edit.succeedNotify",
      "sharePage.editor.edit.succeedAndCopyNotify",
      submitRouteSnapshot,
    );
    return;
  }

  const activeShare = activeSource as ActiveShareEditorData;
  const updateResult = await subsStore.updateShare(
    activeShare.token,
    activeShare.type,
    activeShare.name,
    getCreateSubmitParams(params),
    false,
  );
  if (updateResult.status === "retry_create") {
    finalizeRetryableUpdateFailure();
    return;
  }

  if (updateResult.status !== "success" || !updateResult.token) {
    await finalizeFailedUpdate();
    return;
  }

  isRetryingCreateAfterDelete.value = false;
  await finalizeSuccessfulSave(
    params.payload.type,
    params.payload.name,
    updateResult.token,
    "sharePage.editor.edit.succeedNotify",
    "sharePage.editor.edit.succeedAndCopyNotify",
    submitRouteSnapshot,
  );
};

const handleSubmit = async () => {
  if (isSubmitting.value) {
    return;
  }

  isSubmitting.value = true;
  try {
    if (routeMode.value === "create") {
      await handleCreate();
    } else {
      await handleEdit();
    }
  } catch (error) {
    console.error(error);
  } finally {
    isSubmitting.value = false;
    await nextTick();
    await ruleForm.value?.focusFirstError();
  }
};

watch(
  () => route.fullPath,
  () => {
    loadEditorData();
  },
  { immediate: true },
);

watch(
  () => [form.sourceType, form.sourceName],
  () => {
    if (isHydratingForm.value) {
      return;
    }

    syncSourceModel();
  },
  { immediate: true },
);

watch(
  () => form.expirationMode,
  (mode) => {
    if (
      isHydratingForm.value
      || routeMode.value !== "create"
      || mode !== "count"
      || form.usedCount !== ""
    ) {
      return;
    }

    form.usedCount = "0";
  },
  { immediate: true },
);

watch(
  [sourceOptions, () => form.sourceType, () => form.sourceName],
  () => {
    updateSourceInput();
  },
  { deep: true, immediate: true },
);

watch(
  [host, currentShareBaseUrl, secretPath],
  () => {
    if (
      isHydratingForm.value
      || !isEditMode.value
      || !selectedSourceType.value
      || !normalizedSourceName.value
      || !form.token
    ) {
      return;
    }

    form.shareUrl = buildShareUrl(selectedSourceType.value, normalizedSourceName.value, form.token);
  },
);

watch(
  () => [
    form.sourceType,
    form.sourceName,
    form.expirationMode,
    form.expiresValue,
    form.usedCount,
    form.expiresUnit,
    form.exactDatetime,
    form.token,
    form["age-public-key"],
    form.displayName,
    form.remark,
    form.tag,
  ],
  () => {
    if (isHydratingForm.value || !form.shareUrl) {
      return;
    }

    form.shareUrl = "";
  },
);

</script>
