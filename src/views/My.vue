<template>
  <div class="my-page-wrapper">
    <Teleport defer :to="isDesktop ? '#settings-tabs-host' : '#settings-tabs-mobile-host'">
      <WorkspaceSegments
        :model-value="activePanel"
        :options="
          settingEntries.map((item) => ({
            value: item.panel,
            label: item.label,
          }))
        "
        :disabled="isBusy"
        full-width
        label="偏好设置分类"
        class="settings-tabs"
        @update:model-value="selectPanel"
      />
    </Teleport>
    <fieldset :disabled="isBusy" :inert="isBusy" class="profile-block settings-panel-content min-w-0 m-0 border-0 p-0">
      <UCard
        v-if="activePanel === 'gist'"
        class="backup-sync-card"
        :ui="{ header: 'px-4 sm:px-4' }"
      >
        <template #header>
          <h3 class="text-sm font-semibold">手动备份</h3>
        </template>
        <div class="backup-content">
          <UIcon
            mode="svg"
            name="i-lucide-archive"
            class="backup-content-icon"
          />
          <p>将数据备份到本地文件，或选择已有备份恢复数据。</p>
          <p class="backup-content-note">恢复前请先备份当前数据。</p>
          <div class="backup-content-actions">
            <!-- <input type="file" @change="uploadFile" /> -->
            <!-- accept="application/json,text/json,.json"  -->
            <input
              type="file"
              ref="fileInput"
              @change="fileChange"
              style="display: none"
            />
            <UButton
              class="upload-btn"
              variant="outline"
              color="primary"
              :disabled="restoreIsLoading"
              size="sm"
              :loading="restoreIsLoading"
              @click="upload()"
            >
              <UIcon
                mode="svg"
                class="size-4 shrink-0 align-middle"
                name="i-lucide-cloud-upload"
                v-if="!uploadIsLoading"
              />
              {{ $t(`myPage.storage.manual.restore`) }}
            </UButton>
            <UButton
              class="download-btn"
              color="primary"
              size="sm"
              :disabled="backupIsLoading"
              :loading="backupIsLoading"
              @click="downloadBackup"
            >
              <UIcon
                mode="svg"
                class="size-4 shrink-0 align-middle"
                v-if="!backupIsLoading"
                name="i-lucide-cloud-download"
              />
              {{ $t(`myPage.storage.manual.backup`) }}
            </UButton>
          </div>
        </div>
      </UCard>
      <UCard
        v-if="activePanel === 'gist'"
        class="backup-sync-card"
        :ui="{
          header: 'px-4 sm:px-4',
          body: 'p-0 sm:p-0',
          footer: 'px-4 sm:px-4',
        }"
      >
        <template #header>
          <h3 class="text-sm font-semibold">Gist 同步</h3>
        </template>
        <div class="info">
          <div class="avatar-wrapper gist-avatar-wrapper">
            <ResourceAvatar
              :key="avatarDisplayKey"
              :class="{ 'avatar-fallback': isAvatarFallback }"
              size="72"
              bg-color="var(--ui-bg)"
              :url="remoteAvatarUrl"
              :icon="displayAvatarIcon"
              @on-error="handleAvatarError"
            />
            <div class="name">
              <p class="title">
                {{ gistProfileTitle }}
              </p>
              <p class="des">
                <span class="des-line1">{{ desText[0] }}</span>
                <span class="des-line2" v-if="desText.length === 2">
                  {{ desText[1] }}
                </span>
              </p>
            </div>
          </div>
        </div>
        <div class="config-card">
          <div
            class="config-input-wrapper settings-fields settings-fields-divided"
          >
            <FieldInput
              class="input input-small-left-icon"
              v-model="userInput"
              :label="$t('myPage.fieldLabels.githubUser')"
              :placeholder="$t(`myPage.placeholder.githubUser`)"
              type="text"
              input-align="left"
              left-icon="i-lucide-user"
            ></FieldInput>
            <FieldInput
              class="input input-small-left-icon"
              v-model="tokenInput"
              :label="$t('myPage.fieldLabels.gistToken')"
              :placeholder="$t(`myPage.placeholder.gistToken`)"
              type="text"
              input-align="left"
              left-icon="i-lucide-key-round"
            />
            <div class="settings-inline-field">
              <span>{{ $t(`moreSettingPage.gistUpload.title`) }}</span>
              <InlineOptions
                v-model="gistUploadPickerValue"
                :columns="gistUploadColumns"
                :label="$t(`moreSettingPage.gistUpload.title`)"
                @confirm="handleGistUploadConfirm"
              />
            </div>
            <div class="settings-inline-field">
              <span>{{ $t(`myPage.downloadTokenStrategy.label`) }}</span>
              <InlineOptions
                v-model="downloadTokenStrategyPickerValue"
                :columns="downloadTokenStrategyColumns"
                :label="$t(`myPage.downloadTokenStrategy.label`)"
                @confirm="handleDownloadTokenStrategyConfirm"
              />
            </div>
            <FieldInput
              v-if="isGistBackupAgeMode"
              class="input"
              v-model="ageSecretKeyInput"
              :label="$t('myPage.fieldLabels.gistAgeSecretKey')"
              :help="gistAgeSecretKeyTips()"
              :placeholder="$t(`myPage.placeholder.gistAgeSecretKey`)"
              type="text"
              input-align="left"
              left-icon="i-lucide-lock-keyhole"
            >
              <template #button>
                <div class="input-action-icons">
                  <AgeKeyHelper
                    v-model="ageSecretKeyInput"
                    apply-mode="secret"
                  />
                </div>
              </template>
            </FieldInput>
            <FieldInput
              class="input"
              v-model="githubApiUrlInput"
              :label="$t('myPage.fieldLabels.githubApiUrl')"
              :placeholder="$t(`myPage.placeholder.githubApiUrl`)"
              type="text"
              input-align="left"
              left-icon="i-lucide-waypoints"
              :help="githubApiUrlTips()"
            />
            <FieldInput
              class="input"
              v-model="githubApiTimeoutInput"
              :label="$t('myPage.fieldLabels.githubApiTimeout')"
              :placeholder="$t(`myPage.placeholder.githubApiTimeout`)"
              type="number"
              input-align="left"
              left-icon="i-lucide-clock"
              :help="githubApiTimeoutTips()"
            />
            <FieldInput
              class="input"
              v-model="artifactSyncBatchSizeInput"
              :label="$t('myPage.fieldLabels.artifactSyncBatchSize')"
              :placeholder="$t(`myPage.placeholder.artifactSyncBatchSize`)"
              type="number"
              input-align="left"
              left-icon="i-lucide-layers"
              :help="artifactSyncBatchSizeTips()"
            />
            <FieldInput
              class="input"
              v-model="githubProxyInput"
              :label="$t('myPage.fieldLabels.githubProxy')"
              :placeholder="$t(`myPage.placeholder.githubProxy`)"
              type="text"
              input-align="left"
              left-icon="i-lucide-waypoints"
              :help="githubProxyTips()"
            />
            <FieldInput
              class="input"
              v-model="githubProxyRegexInput"
              :label="$t('myPage.fieldLabels.githubProxyRegex')"
              :placeholder="$t(`myPage.placeholder.githubProxyRegex`)"
              type="text"
              input-align="left"
              left-icon="i-lucide-waypoints"
              :help="githubProxyRegexTips()"
            />
          </div>
        </div>
        <template #footer>
          <div class="flex flex-wrap justify-end gap-2">
            <div class="settings-header-actions">
              <UButton
                class="upload-btn"
                variant="outline"
                color="primary"
                :disabled="syncIsDisabled"
                size="sm"
                :loading="uploadIsLoading"
                @click="uploadBtn"
              >
                <UIcon
                  mode="svg"
                  class="size-4 shrink-0 align-middle"
                  name="i-lucide-cloud-upload"
                  v-if="!uploadIsLoading"
                />
                {{ $t(`myPage.btn.upload`) }}
              </UButton>
              <UButton
                class="download-btn"
                color="primary"
                size="sm"
                :disabled="syncIsDisabled"
                :loading="downloadIsLoading"
                @click="downloadBtn"
              >
                <UIcon
                  mode="svg"
                  class="size-4 shrink-0 align-middle"
                  v-if="!downloadIsLoading"
                  name="i-lucide-cloud-download"
                />
                {{ $t(`myPage.btn.download`) }}
              </UButton>
            </div>
            <UButton
              type="button"
              class="workspace-button primary"
              :disabled="isEditLoading"
              size="sm"
              @click="saveConfiguration('github')"
              color="primary"
              variant="solid"
            >
              {{
                isEditLoading ? $t("workspace.saving") : $t("workspace.save")
              }}
            </UButton>
          </div>
        </template>
      </UCard>
      <div v-if="activePanel === 'runtime'" class="settings-card-columns">
        <UCard
          class="config-card"
          :ui="{
            header: 'px-4 sm:px-4',
            body: 'p-0 sm:p-0',
            footer: 'px-4 sm:px-4',
          }"
        >
          <template #header>
            <h3 class="text-sm font-semibold">{{ $t("workspace.request") }}</h3>
          </template>
          <div
            class="config-input-wrapper settings-fields settings-fields-divided"
          >
            <FieldInput
              class="input"
              v-model="proxyInput"
              :label="$t('myPage.fieldLabels.defaultProxy')"
              :placeholder="$t(`myPage.placeholder.defaultProxy`)"
              type="text"
              input-align="left"
              left-icon="i-lucide-network"
              :help="proxyTips()"
            />
            <FieldInput
              class="input"
              v-model="uaInput"
              :label="$t('myPage.fieldLabels.defaultUserAgent')"
              :placeholder="$t(`myPage.placeholder.defaultUserAgent`)"
              type="text"
              input-align="left"
              left-icon="i-lucide-contact"
              :help="uaTips()"
            />
            <FieldInput
              class="input"
              v-model="flowUaInput"
              :label="$t('myPage.fieldLabels.defaultFlowUserAgent')"
              :placeholder="$t(`myPage.placeholder.defaultFlowUserAgent`)"
              type="text"
              input-align="left"
              left-icon="i-lucide-contact"
              :help="flowUaTips()"
            />
            <FieldInput
              class="input"
              v-model="timeoutInput"
              :label="$t('myPage.fieldLabels.defaultTimeout')"
              :placeholder="$t(`myPage.placeholder.defaultTimeout`)"
              type="number"
              input-align="left"
              left-icon="i-lucide-clock"
              :help="timeoutTips()"
            />
            <FieldInput
              class="input"
              v-model="githubApiTimeoutInput"
              :label="$t('myPage.fieldLabels.githubApiTimeout')"
              :placeholder="$t(`myPage.placeholder.githubApiTimeout`)"
              type="number"
              input-align="left"
              left-icon="i-lucide-clock"
              :help="githubApiTimeoutTips()"
            />
            <FieldInput
              class="input"
              v-model="backendRequestConcurrencyInput"
              :label="$t('myPage.fieldLabels.backendRequestConcurrency')"
              :placeholder="$t(`myPage.placeholder.backendRequestConcurrency`)"
              type="number"
              input-align="left"
              left-icon="i-lucide-layers"
              :help="backendRequestConcurrencyTips()"
            />
            <FieldInput
              class="input"
              v-model="backendRequestConcurrencyWaitTimeInput"
              :label="
                $t('myPage.fieldLabels.backendRequestConcurrencyWaitTime')
              "
              :placeholder="
                $t(`myPage.placeholder.backendRequestConcurrencyWaitTime`)
              "
              type="number"
              input-align="left"
              left-icon="i-lucide-clock"
              :help="backendRequestConcurrencyWaitTimeTips()"
            />
          </div>
          <template #footer>
            <div class="flex justify-end">
              <UButton
                type="button"
                :disabled="isEditLoading"
                :loading="isEditLoading"
                size="sm"
                @click="saveConfiguration('request')"
                color="primary"
              >
                {{
                  isEditLoading ? $t("workspace.saving") : $t("workspace.save")
                }}
              </UButton>
            </div>
          </template>
        </UCard>
        <UCard
          class="config-card"
          :ui="{
            header: 'px-4 sm:px-4',
            body: 'p-0 sm:p-0',
            footer: 'px-4 sm:px-4',
          }"
        >
          <template #header>
            <h3 class="text-sm font-semibold">{{ $t("workspace.cache") }}</h3>
          </template>
          <div
            class="config-input-wrapper settings-fields settings-fields-divided"
          >
            <FieldInput
              class="input"
              v-model="cacheThresholdInput"
              :label="$t('myPage.fieldLabels.cacheThreshold')"
              :placeholder="$t(`myPage.placeholder.cacheThreshold`)"
              type="number"
              input-align="left"
              left-icon="i-lucide-gauge"
              :help="cacheThresholdTips()"
            />
            <FieldInput
              class="input"
              v-model="resourceCacheTtlInput"
              :label="$t('myPage.fieldLabels.resourceCacheTtl')"
              :placeholder="$t(`myPage.placeholder.resourceCacheTtl`)"
              type="number"
              input-align="left"
              left-icon="i-lucide-database"
              :help="resourceCacheTtlTips()"
            />
            <FieldInput
              class="input"
              v-model="headersCacheTtlInput"
              :label="$t('myPage.fieldLabels.headersCacheTtl')"
              :placeholder="$t(`myPage.placeholder.headersCacheTtl`)"
              type="number"
              input-align="left"
              left-icon="i-lucide-timer"
              :help="headersCacheTtlTips()"
            />
            <FieldInput
              class="input"
              v-model="scriptCacheTtlInput"
              :label="$t('myPage.fieldLabels.scriptCacheTtl')"
              :placeholder="$t(`myPage.placeholder.scriptCacheTtl`)"
              type="number"
              input-align="left"
              left-icon="i-lucide-file-code"
              :help="scriptCacheTtlTips()"
            />
            <FieldInput
              class="input"
              v-model="logsMaxCountInput"
              :label="$t('myPage.fieldLabels.logsMaxCount')"
              :placeholder="$t(`myPage.placeholder.logsMaxCount`)"
              type="number"
              input-align="left"
              left-icon="i-lucide-scroll-text"
              :help="logsMaxCountTips()"
            />
          </div>
          <template #footer>
            <div class="flex justify-end">
              <UButton
                type="button"
                :disabled="isEditLoading"
                :loading="isEditLoading"
                size="sm"
                @click="saveConfiguration('cache')"
                color="primary"
              >
                {{
                  isEditLoading ? $t("workspace.saving") : $t("workspace.save")
                }}
              </UButton>
            </div>
          </template>
        </UCard>
        <UCard
          class="config-card"
          :ui="{
            header: 'px-4 sm:px-4',
            body: 'p-0 sm:p-0',
            footer: 'px-4 sm:px-4',
          }"
        >
          <template #header>
            <h3 class="text-sm font-semibold">
              {{ $t("workspace.frontend") }}
            </h3>
          </template>
          <div
            class="config-input-wrapper settings-fields settings-fields-divided"
          >
            <FieldInput
              class="input"
              v-model="concurrencyInput"
              :label="$t('myPage.fieldLabels.concurrency')"
              :placeholder="$t(`myPage.placeholder.concurrency`)"
              type="number"
              input-align="left"
              left-icon="i-lucide-layers"
              :help="concurrencyTips()"
            />
            <FieldInput
              class="input"
              v-model="concurrencyWaitTimeInput"
              :label="$t('myPage.fieldLabels.concurrencyWaitTime')"
              :placeholder="$t(`myPage.placeholder.concurrencyWaitTime`)"
              type="number"
              input-align="left"
              left-icon="i-lucide-clock"
              :help="concurrencyWaitTimeTips()"
            />
            <FieldInput
              class="input"
              v-model="apiCheckTimeoutInput"
              :label="$t('myPage.fieldLabels.apiCheckTimeout')"
              :placeholder="$t(`myPage.placeholder.apiCheckTimeout`)"
              type="number"
              input-align="left"
              left-icon="i-lucide-clock"
              :help="apiCheckTimeoutTips()"
            />
            <FieldInput
              class="input"
              v-model="apiRequestTimeoutInput"
              :label="$t('myPage.fieldLabels.apiRequestTimeout')"
              :placeholder="$t(`myPage.placeholder.apiRequestTimeout`)"
              type="number"
              input-align="left"
              left-icon="i-lucide-clock"
              :help="apiRequestTimeoutTips()"
            />
          </div>
          <template #footer>
            <div class="flex justify-end">
              <UButton
                type="button"
                :disabled="isEditLoading"
                :loading="isEditLoading"
                size="sm"
                @click="saveConfiguration('frontEnd')"
                color="primary"
              >
                {{
                  isEditLoading ? $t("workspace.saving") : $t("workspace.save")
                }}
              </UButton>
            </div>
          </template>
        </UCard>
        <SharingSettings />
        <DataMaintenanceSettings />
      </div>

      <MoreSetting v-show="activePanel === 'more'" />
      <APISetting v-show="activePanel === 'api'" />
      <LogsPanel v-if="activePanel === 'logs'" />
      <AboutUs v-if="activePanel === 'about'" />
    </fieldset>
    <WorkspaceModal
      v-model:visible="showDownloadTokenDialog"
      :title="$t(`myPage.downloadTokenStrategy.dialog.title`)"
    >
      <div class="download-token-dialog-content">
        <p>{{ $t(`myPage.downloadTokenStrategy.dialog.content`) }}</p>
        <label class="download-token-dialog-checkbox">
          <UCheckbox v-model="rememberDownloadTokenStrategy" />
          <span>
            {{ $t(`myPage.downloadTokenStrategy.dialog.doNotAskAgain`) }}
          </span>
        </label>
      </div>
      <template #footer>
        <UButton
          :size="isDesktop ? 'sm' : 'md'"
          type="button"
          class="workspace-button"
          @click="chooseDownloadToken('overwrite')"
          color="neutral"
          variant="outline"
        >
          {{ $t("myPage.downloadTokenStrategy.dialog.overwrite") }}
        </UButton>
        <UButton
          :size="isDesktop ? 'sm' : 'md'"
          type="button"
          class="workspace-button primary"
          @click="chooseDownloadToken('keep')"
          color="primary"
          variant="solid"
        >
          {{ $t("myPage.downloadTokenStrategy.dialog.keep") }}
        </UButton>
      </template>
    </WorkspaceModal>
  </div>
</template>
<script lang="ts" setup>
import { useMediaQuery } from "@vueuse/core";
import { useSettingsApi } from "@/api/settings";
import avatar from "@/assets/icons/avatar.svg?url";
import { useAppNotifyStore } from "@/store/appNotify";
import { useGlobalStore } from "@/store/global";
import {
  normalizeGistDownloadTokenStrategy,
  useSettingsStore,
} from "@/store/settings";
import { butifyDate } from "@/utils/butifyDate";
import { downloadBlobResponse } from "@/utils/download";
import { initStores } from "@/utils/initApp";
import { storeToRefs } from "pinia";
import { computed, ref, watch, watchEffect } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import AgeKeyHelper from "@/components/AgeKeyHelper.vue";
import InlineOptions from "@/components/InlineOptions.vue";
import WorkspaceModal from "@/components/WorkspaceModal.vue";
import WorkspaceSegments from "@/components/WorkspaceSegments.vue";
import SharingSettings from "@/views/settings/SharingSettings.vue";
import DataMaintenanceSettings from "@/views/settings/DataMaintenanceSettings.vue";
import MoreSetting from "@/views/settings/moreSetting.vue";
import APISetting from "@/views/settings/APISetting.vue";
import LogsPanel from "@/components/LogsPanel.vue";
import AboutUs from "@/views/settings/AboutUs.vue";
import { AGE_SECRET_KEY } from "@/utils/age";
import { Dialog, Toast } from "@/services/feedback";
const isDesktop = useMediaQuery("(min-width: 768px)");

const { t } = useI18n();

// const route = useRoute();
const router = useRouter();
const { showNotify } = useAppNotifyStore();
const settingsStore = useSettingsStore();
const {
  githubUser,
  gistToken,
  syncTime,
  defaultUserAgent,
  defaultFlowUserAgent,
  defaultProxy,
  defaultTimeout,
  backendRequestConcurrency,
  backendRequestConcurrencyWaitTime,
  cacheThreshold,
  resourceCacheTtl,
  headersCacheTtl,
  scriptCacheTtl,
  logsMaxCount,
  syncPlatform,
  githubProxy,
  githubApiUrl,
  githubApiTimeout,
  artifactSyncBatchSize,
  githubProxyRegex,
  gistUpload,
  gistDownloadTokenStrategy,
  ageSecretKey,
} = storeToRefs(settingsStore);

const DEFAULT_GITHUB_API_URL = "https://api.github.com";
const GIST_UPLOAD_MODES = ["base64", "age", "plaintext"] as const;
const DOWNLOAD_TOKEN_STRATEGIES = ["ask", "overwrite", "keep"] as const;
type GistUploadMode = (typeof GIST_UPLOAD_MODES)[number];

const avatarLoadFailed = ref(false);
const avatarRenderNonce = ref(0);

const fallbackGithubAvatarUrl = computed(() => {
  const normalizedGithubUser = githubUser.value?.trim();

  if (!normalizedGithubUser) {
    return "";
  }

  return `https://github.com/${encodeURIComponent(normalizedGithubUser)}.png`;
});

const remoteAvatarUrl = computed(() => {
  if (!githubUser.value?.trim() || avatarLoadFailed.value) {
    return "";
  }

  return fallbackGithubAvatarUrl.value;
});

const gistProfileTitle = computed(() => {
  const normalizedGithubUser = githubUser.value?.trim();

  if (normalizedGithubUser) {
    return normalizedGithubUser;
  }

  return gistToken.value
    ? t(`myPage.storage.gist.label`)
    : t(`myPage.placeholder.name`);
});

const displayAvatarIcon = computed(() => {
  return remoteAvatarUrl.value ? "" : avatar;
});

const isAvatarFallback = computed(() => {
  return !remoteAvatarUrl.value;
});

const avatarDisplayKey = computed(() => {
  return `${remoteAvatarUrl.value || "fallback"}:${avatarRenderNonce.value}`;
});

const resetAvatarState = (forceRerender = false) => {
  avatarLoadFailed.value = false;

  if (forceRerender) {
    avatarRenderNonce.value += 1;
  }
};

const handleAvatarError = () => {
  if (!remoteAvatarUrl.value) {
    return;
  }

  avatarLoadFailed.value = true;
  avatarRenderNonce.value += 1;
};

watch([githubUser], () => {
  resetAvatarState(true);
});

// 编辑 更新
const syncPlatformInput = ref("");
const userInput = ref("");
const tokenInput = ref("");
const gistUploadInput = ref<GistUploadMode>("base64");
const gistUploadPickerValue = ref<GistUploadMode[]>(["base64"]);
const downloadTokenStrategyInput = ref<DownloadTokenStrategy>(
  normalizeGistDownloadTokenStrategy(gistDownloadTokenStrategy.value),
);
const downloadTokenStrategyPickerValue = ref<DownloadTokenStrategy[]>([
  downloadTokenStrategyInput.value,
]);
const ageSecretKeyInput = ref("");
const githubProxyInput = ref("");
const githubApiUrlInput = ref("");
const githubApiTimeoutInput = ref("");
const artifactSyncBatchSizeInput = ref("");
const githubProxyRegexInput = ref("");
const uaInput = ref("");
const flowUaInput = ref("");
const proxyInput = ref("");
const timeoutInput = ref("");
const backendRequestConcurrencyInput = ref("");
const backendRequestConcurrencyWaitTimeInput = ref("");
const cacheThresholdInput = ref("");
const resourceCacheTtlInput = ref("");
const headersCacheTtlInput = ref("");
const scriptCacheTtlInput = ref("");
const logsMaxCountInput = ref("");
const concurrencyInput = ref("");
const concurrencyWaitTimeInput = ref("");
const apiCheckTimeoutInput = ref("");
const apiRequestTimeoutInput = ref("");
const isEditLoading = ref(false);
const isInit = ref(false);
const activePanel = ref<SettingsPanel>("api");
const savedGithubConfig = ref("");
const fileInput = ref(null);
const showDownloadTokenDialog = ref(false);
const rememberDownloadTokenStrategy = ref(false);

const normalizeGistUploadMode = (value?: string): GistUploadMode => {
  return GIST_UPLOAD_MODES.includes(value as GistUploadMode)
    ? (value as GistUploadMode)
    : "base64";
};

const gistUploadColumns = computed(() =>
  GIST_UPLOAD_MODES.map((value) => ({
    text: t(`moreSettingPage.gistUpload.${value}`),
    value,
  })),
);

const isGistBackupAgeMode = computed(() => gistUploadInput.value === "age");
const downloadTokenStrategyColumns = computed(() =>
  DOWNLOAD_TOKEN_STRATEGIES.map((value) => ({
    text: t(`myPage.downloadTokenStrategy.${value}`),
    value,
  })),
);

const setDownloadTokenStrategyInput = (strategy: DownloadTokenStrategy) => {
  downloadTokenStrategyInput.value = strategy;
  downloadTokenStrategyPickerValue.value = [strategy];
};

const handleGistUploadConfirm = ({ selectedValue }) => {
  const mode = normalizeGistUploadMode(selectedValue?.[0]);
  gistUploadInput.value = mode;
  gistUploadPickerValue.value = [mode];
};

const handleDownloadTokenStrategyConfirm = ({ selectedValue }) => {
  setDownloadTokenStrategyInput(
    normalizeGistDownloadTokenStrategy(selectedValue?.[0]),
  );
};

const createSettingsPayload = (type: string): SettingsPostData => {
  if (type === "github") {
    const payload: SettingsPostData = {
      syncPlatform: syncPlatformInput.value,
      githubUser: userInput.value,
      gistToken: tokenInput.value,
      gistUpload: gistUploadInput.value,
      gistDownloadTokenStrategy: downloadTokenStrategyInput.value,
      githubProxy: githubProxyInput.value,
      githubApiUrl: githubApiUrlInput.value,
      githubApiTimeout: githubApiTimeoutInput.value,
      artifactSyncBatchSize: artifactSyncBatchSizeInput.value,
      githubProxyRegex: githubProxyRegexInput.value,
    };

    if (gistUploadInput.value === "age") {
      payload[AGE_SECRET_KEY] = ageSecretKeyInput.value;
    }

    return payload;
  }

  if (type === "request") {
    return {
      defaultUserAgent: uaInput.value,
      defaultFlowUserAgent: flowUaInput.value,
      defaultProxy: proxyInput.value,
      defaultTimeout: timeoutInput.value,
      githubApiTimeout: githubApiTimeoutInput.value,
      backendRequestConcurrency: backendRequestConcurrencyInput.value,
      backendRequestConcurrencyWaitTime:
        backendRequestConcurrencyWaitTimeInput.value,
    };
  }

  if (type === "cache") {
    return {
      cacheThreshold: cacheThresholdInput.value,
      resourceCacheTtl: resourceCacheTtlInput.value,
      headersCacheTtl: headersCacheTtlInput.value,
      scriptCacheTtl: scriptCacheTtlInput.value,
      logsMaxCount: logsMaxCountInput.value,
    };
  }

  return {};
};

const saveConfiguration = async (
  type: "github" | "request" | "cache" | "frontEnd",
) => {
  if (isBusy.value) return;
  isEditLoading.value = true;
  try {
    if (type !== "frontEnd") {
      const saveSucceeded = await settingsStore.changeSettings(
        createSettingsPayload(type),
      );

      if (saveSucceeded && type === "github") {
        resetAvatarState(true);
        await settingsStore.fetchSettings();
        resetAvatarState(true);
      }

      if (saveSucceeded) {
        setDisplayInfo(type);
      }
    } else {
      const apiCheckTimeout = Number(apiCheckTimeoutInput.value);
      if (!isNaN(apiCheckTimeout)) {
        if (apiCheckTimeout > 0) {
          console.log(`设置超时 ${apiCheckTimeout}`);
          localStorage.setItem("timeout", apiCheckTimeout.toString());
        } else {
          console.log(`清除超时设置`);
          localStorage.removeItem("timeout");
        }
      } else {
        console.log(`清除超时设置`);
        localStorage.removeItem("timeout");
      }
      const apiRequestTimeout = Number(apiRequestTimeoutInput.value);
      if (!isNaN(apiRequestTimeout)) {
        if (apiRequestTimeout > 0) {
          console.log(`设置前端请求超时 ${apiRequestTimeout}`);
          localStorage.setItem(
            "apiRequestTimeout",
            apiRequestTimeout.toString(),
          );
        } else {
          console.log(`清除前端请求超时设置`);
          localStorage.removeItem("apiRequestTimeout");
        }
      } else {
        console.log(`清除前端请求超时设置`);
        localStorage.removeItem("apiRequestTimeout");
      }
      const concurrency = parseInt(concurrencyInput.value, 10);
      if (!isNaN(concurrency)) {
        if (concurrency >= 1) {
          console.log(`设置并发数 ${concurrency}`);
          localStorage.setItem("concurrency", concurrency.toString());
        } else {
          console.log(`清除并发数设置`);
          localStorage.removeItem("concurrency");
        }
      } else {
        console.log(`清除并发数设置`);
        localStorage.removeItem("concurrency");
      }
      const concurrencyWaitTime = parseInt(concurrencyWaitTimeInput.value, 10);
      if (!isNaN(concurrencyWaitTime)) {
        if (concurrencyWaitTime > 0) {
          console.log(`设置并发等待时间 ${concurrencyWaitTime}`);
          localStorage.setItem(
            "concurrencyWaitTime",
            concurrencyWaitTime.toString(),
          );
        } else {
          console.log(`清除并发等待时间设置`);
          localStorage.removeItem("concurrencyWaitTime");
        }
      } else {
        console.log(`清除并发等待时间设置`);
        localStorage.removeItem("concurrencyWaitTime");
      }
      setTimeout(() => {
        window.location.reload();
      }, 100);
    }
  } catch (e) {
    showNotify({
      title: `更新配置失败`,
      type: "danger",
    });
    console.error(e);
  } finally {
    isEditLoading.value = false;
  }
};

const toggleSyncPlatform = () => {
  if (syncPlatformInput.value === "gitlab") {
    syncPlatformInput.value = "";
    Toast.text(
      `已切换到 ${syncPlatformInput.value === "gitlab" ? "GitLab Snippet" : "Gist"}`,
    );
  } else {
    Dialog({
      title: "切换同步平台",
      content:
        "GitLab Snippet 正在测试中, 相关文案仍然是 Gist, 请备份数据后使用",
      popClass: "auto-dialog",
      okText: `使用 ${syncPlatformInput.value === "gitlab" ? "Gist" : " Snippet"}`,
      cancelText: "取消",
      onOk: () => {
        if (syncPlatformInput.value === "gitlab") {
          syncPlatformInput.value = "";
        } else {
          syncPlatformInput.value = "gitlab";
        }
        Toast.text(
          `已切换到 ${syncPlatformInput.value === "gitlab" ? "GitLab Snippet" : "Gist"}`,
        );
      },
      closeOnPopstate: true,
      lockScroll: false,
    });
  }
};
const setDisplayInfo = (scope?: "github" | "request" | "cache") => {
  if (!scope || scope === "github") {
    syncPlatformInput.value = syncPlatform.value || "";
    userInput.value = githubUser.value || "";
    gistUploadInput.value = normalizeGistUploadMode(gistUpload.value);
    gistUploadPickerValue.value = [gistUploadInput.value];
    setDownloadTokenStrategyInput(
      normalizeGistDownloadTokenStrategy(gistDownloadTokenStrategy.value),
    );
    ageSecretKeyInput.value = ageSecretKey.value || "";
    githubProxyInput.value = githubProxy.value || "";
    githubApiUrlInput.value = githubApiUrl.value || "";
    githubApiTimeoutInput.value = githubApiTimeout.value || "";
    artifactSyncBatchSizeInput.value = artifactSyncBatchSize.value || "";
    githubProxyRegexInput.value = githubProxyRegex.value || "";
    tokenInput.value = gistToken.value || "";
  }
  if (!scope || scope === "request") {
    uaInput.value = defaultUserAgent.value || "";
    flowUaInput.value = defaultFlowUserAgent.value || "";
    proxyInput.value = defaultProxy.value || "";
    timeoutInput.value = defaultTimeout.value || "";
    backendRequestConcurrencyInput.value =
      backendRequestConcurrency.value || "";
    backendRequestConcurrencyWaitTimeInput.value =
      backendRequestConcurrencyWaitTime.value || "";
  }
  if (!scope || scope === "cache") {
    cacheThresholdInput.value = cacheThreshold.value || "";
    resourceCacheTtlInput.value = resourceCacheTtl.value || "";
    headersCacheTtlInput.value = headersCacheTtl.value || "";
    scriptCacheTtlInput.value = scriptCacheTtl.value || "";
    logsMaxCountInput.value = logsMaxCount.value ?? "";
  }
  if (!scope || scope === "github")
    savedGithubConfig.value = JSON.stringify(createSettingsPayload("github"));
  if (!scope) {
    const storedTimeout = localStorage.getItem("timeout");
    if (storedTimeout) {
      apiCheckTimeoutInput.value = storedTimeout;
    } else {
      apiCheckTimeoutInput.value = "";
    }
    const storedApiRequestTimeout = localStorage.getItem("apiRequestTimeout");
    if (storedApiRequestTimeout) {
      apiRequestTimeoutInput.value = storedApiRequestTimeout;
    } else {
      apiRequestTimeoutInput.value = "";
    }
    const storedConcurrency = localStorage.getItem("concurrency");
    if (storedConcurrency) {
      concurrencyInput.value = storedConcurrency;
    } else {
      concurrencyInput.value = "";
    }
    const storedConcurrencyWaitTime = localStorage.getItem(
      "concurrencyWaitTime",
    );
    if (storedConcurrencyWaitTime) {
      concurrencyWaitTimeInput.value = storedConcurrencyWaitTime;
    } else {
      concurrencyWaitTimeInput.value = "";
    }
  }
};

// 同步 上传
const downloadIsLoading = ref(false);
const uploadIsLoading = ref(false);
const restoreIsLoading = ref(false);
const backupIsLoading = ref(false);
const syncIsDisabled = computed(() => {
  return uploadIsLoading.value || downloadIsLoading.value || !gistToken.value;
});

const desText = computed(() => {
  if (!gistToken.value) {
    return [t(`myPage.placeholder.des`), ""];
  } else {
    if (!syncTime.value) return [t(`myPage.placeholder.haveNotDownload`), ""];
    return [t(`myPage.placeholder.uploadTime`), butifyDate(syncTime.value)];
  }
});
const downloadBackup = async () => {
  if (isBusy.value) return;
  backupIsLoading.value = true;
  try {
    const res = await useSettingsApi().downloadBackup();
    downloadBlobResponse(res, "sub-store_data.json");
    showNotify({
      type: "success",
      title: t(`myPage.notify.download.succeed`),
    });
  } catch (e) {
    showNotify({
      type: "danger",
      title: t(`myPage.notify.download.failed`),
    });
    console.error(e);
  } finally {
    backupIsLoading.value = false;
  }
};
const reloadRestoredSettings = async (successTitle: string) => {
  await initStores(false, true, true);
  if (!useGlobalStore().fetchResult) {
    throw new Error("Failed to refresh restored settings");
  }
  if ("serviceWorker" in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      await registration.unregister();
    }
  }
  if ("caches" in window) {
    const cacheNames = await caches.keys();
    for (const cacheName of cacheNames) {
      await caches.delete(cacheName);
    }
  }
  showNotify({ type: "success", title: successTitle });
  await new Promise<void>((resolve) => setTimeout(resolve, 1000));
  window.location.reload();
};
const fileChange = async (event) => {
  const file = event.target.files[0];
  event.target.value = "";
  if (!file || isBusy.value) return;
  restoreIsLoading.value = true;
  try {
    const content = await file.text();
    const res = await useSettingsApi().restoreSettings({ content });
    if (res?.data?.status !== "success") {
      throw new Error("Restore failed");
    }
    await reloadRestoredSettings(t("myPage.notify.restore.succeed"));
  } catch (e) {
    showNotify({
      type: "danger",
      title: t("myPage.notify.restore.failed"),
    });
    console.error(e);
  } finally {
    restoreIsLoading.value = false;
  }
};
const upload = async () => {
  if (isBusy.value) return;
  try {
    fileInput.value.click();
  } catch (e) {
    console.error(e);
  }
};

const sync = async (
  query: "download" | "upload",
  options?: GistBackupSyncOptions,
) => {
  if (isBusy.value) return;
  const loading = query === "download" ? downloadIsLoading : uploadIsLoading;
  loading.value = true;
  try {
    const res = await useSettingsApi().syncSettings(query, options);
    if (res?.data?.status !== "success") {
      throw new Error("Backup sync failed");
    }
    if (query === "download") {
      await reloadRestoredSettings(t("myPage.notify.download.succeed"));
    } else {
      await useSettingsStore().fetchSettings();
      showNotify({
        type: "success",
        title: t("myPage.notify.upload.succeed"),
      });
    }
  } catch (e) {
    showNotify({
      type: "danger",
      title: t(`myPage.notify.${query}.failed`),
    });
    console.error(e);
  } finally {
    loading.value = false;
  }
};

const ensureGitHubConfigReadyForSync = (action: "upload" | "download") => {
  if (
    JSON.stringify(createSettingsPayload("github")) === savedGithubConfig.value
  ) {
    return true;
  }

  Dialog({
    title:
      action === "upload" ? "请先保存 GitHub 配置" : "请先处理 GitHub 配置",
    content: `当前 GitHub 配置正在编辑中，未保存的 Gist 配置不会用于本次${action === "upload" ? "上传" : "下载"}。\n\n请先保存配置后再继续。`,
    popClass: "auto-dialog",
    textAlign: "left",
    okText: "知道了",
    noCancelBtn: true,
    closeOnPopstate: true,
    lockScroll: false,
  });

  return false;
};

const uploadBtn = () => {
  if (!ensureGitHubConfigReadyForSync("upload")) {
    return;
  }
  const encode = gistUpload.value || "base64";
  sync("upload", { encode });
  // Dialog({
  //   title: '请选择',
  //   content: '若选择明文, 将不会保留 GitHub Token. 若选择 Base64 编码, 将完整保留数据(后端版本必须 >= 2.19.85)',
  //   footerDirection: 'vertical',
  //   onCancel: () => {
  //     sync('upload', {
  //       encode: 'plaintext'
  //     });
  //   },
  //   cancelText: '明文(将不会保留 GitHub Token)',
  //   okText: 'Base64 编码上传',
  //   onOk: () => {
  //     sync('upload', {
  //       encode: 'base64'
  //     });
  //   },
  //   popClass: "auto-dialog",
  //   closeOnPopstate: true,
  //   lockScroll: false,
  // });
};
const downloadBtn = () => {
  if (!ensureGitHubConfigReadyForSync("download")) {
    return;
  }

  const strategy = normalizeGistDownloadTokenStrategy(
    gistDownloadTokenStrategy.value,
  );

  if (strategy !== "ask") {
    downloadWithTokenStrategy(strategy);
    return;
  }

  rememberDownloadTokenStrategy.value = false;
  showDownloadTokenDialog.value = true;
};

const downloadWithTokenStrategy = async (
  strategy: Exclude<DownloadTokenStrategy, "ask">,
) => {
  if (rememberDownloadTokenStrategy.value) {
    const saveSucceeded = await settingsStore.changeSettings(
      { gistDownloadTokenStrategy: strategy },
      { notifySuccess: false },
    );
    if (!saveSucceeded) return;
    setDownloadTokenStrategyInput(strategy);
  }

  await sync("download", {
    tokenStrategy: strategy,
    keep: [
      "settings.gistDownloadTokenStrategy",
      ...(strategy === "keep" ? ["settings.gistToken"] : []),
    ],
  });
};
const githubProxyTips = () => ({
  title: "请填写完整 GitHub 加速代理地址",
  content:
    "后端需 >= 2.21.75 才可完整使用下方正则匹配能力\n\n1. 该代理用于上传/下载 GitHub Gist\n\n2. 请填写完整地址, 如 https://a.com\n\n3. 需支持代理 https://api.github.com/gists\n\n4. 若同时配置下方的 GitHub 加速代理匹配正则, 匹配的所有远程资源 URL 会改写为\nhttps://a.com/原始URL\n\n测试方式:\n浏览器打开\nhttps://a.com/https://api.github.com/gists?per_page=1&page=1\n有正常的响应\n\n5. 使用自定义 GitHub API 地址后, GitHub 加速代理不会作用于 Gist API 请求\n\n6. 使用此方式时, 自行注意安全隐私问题",
});
const githubApiUrlTips = () => ({
  title: "GitHub API 地址",
  content: `后端需 >= 2.22.21\n\n1. 默认为 ${DEFAULT_GITHUB_API_URL}\n\n2. 需使用 GitHub Gist 兼容接口\n\n3. 此时 GitHub 令牌里填入的是对应服务的 API Key 之类的\n\n4. 使用自定义 GitHub API 地址后, GitHub 加速代理不会作用于此处\n\n5. 项目推荐:\nEdgeGist: https://github.com/xream/EdgeGist\nLiteGist: https://github.com/lockcp/LiteGist`,
  href: "https://github.com/lockcp/LiteGist",
});
const githubApiTimeoutTips = () => ({
  title: "GitHub API 请求超时",
  content:
    "GitHub API 请求可能比较慢, 可单独设置更长的超时时间。\n\n1. 单位为毫秒, 默认 10000\n\n2. 仅影响 GitHub/Gist API 请求\n\n3. 与请求配置里的默认超时相互独立",
});
const gistAgeSecretKeyTips = () => ({
  title: "Gist 备份 age 解密私钥",
  content:
    "后端需 >= 2.29.0\n\n1. 选择 age 加密时只需要配置 age 解密私钥\n\n2. 上传备份时会从此私钥推导 age 加密公钥用于加密\n\n3. 下载恢复时会用此私钥解密 age 加密备份\n\n4. 请妥善保存私钥，丢失后无法恢复已加密备份",
});
const artifactSyncBatchSizeTips = () => ({
  title: "同步上传分批大小",
  content:
    "同步全部配置时, 每批上传几个配置文件。\n\n1. 默认 10\n\n2. 较小的值可降低 Gist 兼容 API 的单次请求压力, 但会增加请求次数",
});
const githubProxyRegexExample =
  "^https?:\\/\\/.+\\.(githubusercontent|github)\\.com($|\\/)";
const githubProxyRegexTips = () => ({
  title: "按正则匹配下载链接",
  content: `后端需 >= 2.21.75\n\n1. 需先配置上方 GitHub 加速代理, 本项才会生效\n\n2. 影响所有远程资源 URL, 不影响 Gist API 和头像逻辑\n\n3. 默认忽略大小写, 例如\n${githubProxyRegexExample}\n\n4. 会把匹配的下载地址改写为\nhttps://a.com/原始URL\n\n5. 使用此方式时, 自行注意安全隐私问题`,
});
const proxyTips = () => ({
  title: "通过代理/节点/策略进行下载",
  content:
    '1. Surge/Egern(参数 policy/policy-descriptor)\n\n可设置节点代理 例: Test = snell, 1.2.3.4, 80, psk=password, version=4\n\n或设置策略/节点 例: 国外加速\n\n2. Loon(参数 node)\n\nLoon 官方文档: \n\n指定该请求使用哪一个节点或者策略组（可以是节点名称、策略组名称，也可以是一个 Loon 格式的节点描述，如：shadowsocksr,example.com,1070,chacha20-ietf,"password",protocol=auth_aes128_sha1,protocol-param=test,obfs=plain,obfs-param=edge.microsoft.com）\n\n3. Stash(参数 headers["X-Surge-Policy"])/Shadowrocket(参数 headers.X-Surge-Policy)/QX(参数 opts.policy)\n\n可设置策略/节点\n\n4. Node.js 版(http/https/socks5):\n\n例: socks5://a:b@127.0.0.1:7890\n\n※ 优先级由高到低: 单条订阅, 组合订阅, 默认配置\n\n完整说明 请查看 https://telegram.me/zhetengsha/1843',
});
const uaTips = () => ({
  title: "默认为 clash.meta",
  content:
    "可尝试设置为 clash-verge/v2.4.6, v2rayNG 等客户端的 User-Agent 让机场后端下发更多协议(可根据实际情况改成最新版本号)。也可在单条订阅里设置单独的 User-Agent",
});
const flowUaTips = () => ({
  title: "查询订阅流量信息 的 User-Agent",
  content:
    '若机场后端不给默认 UA 下发订阅流量信息, 可改为 "Quantumult%20X/1.0.30 (iPhone14,2; iOS 15.6)"。也可在单条订阅里的远程链接参数里设置单独的 flowUserAgent',
});
const timeoutTips = () => ({
  title: "可尝试设置为 3000~4000",
  content:
    "防止拉取结果的总时长超过代理 app 加载外部资源的最大等待时长, 确保拉取成功",
});
const backendRequestConcurrencyTips = () => ({
  title: "后端请求并发数",
  content:
    "后端需 >= 2.23.32\n\n控制后端发起外部请求时的并发数。默认 10；在代理 App 中建议不超过 20，过高可能增加连接数和内存压力。\n\n实际会用于远程资源下载，例如远程订阅、文件、脚本、预览、同步/定时同步等经后端下载工具发起的请求；也会用于订阅流量信息请求，例如 Subscription-Userinfo 的 HEAD/GET 请求。\n\n域名解析除外，它有自己的请求并发数。\n\n后端日志会输出 [Backend Request Concurrency]，包含 active、pending、limit、waitTime，方便调试。",
});
const backendRequestConcurrencyWaitTimeTips = () => ({
  title: "后端请求并发等待时间",
  content:
    "后端需 >= 2.23.32\n\n每个受后端请求并发数限制的请求拿到并发槽后，先等待指定毫秒数再发出。默认 0。\n\n可用于降低代理 App 中后端请求的瞬时连接压力；数值越大，总处理耗时也会越长。\n\n作用范围与后端请求并发数一致：远程资源下载和订阅流量信息请求。域名解析除外，它有自己的请求并发数。",
});
const cacheThresholdTips = () => ({
  title: "可尝试设置为 1024",
  content:
    "下载资源过大时\n若要写入缓存\n代理 app 可能会崩溃重启\n可尝试设置此值",
});
const resourceCacheTtlTips = () => ({
  title: "资源缓存时间 (秒)",
  content: "主要涉及下载订阅/下载脚本/域名解析等功能",
});
const headersCacheTtlTips = () => ({
  title: "响应头缓存时间 (秒)",
  content: "主要涉及订阅流量信息等功能",
});
const scriptCacheTtlTips = () => ({
  title: "脚本缓存时间 (秒)",
  content: "主要涉及在脚本中使用的 scriptResourceCache 缓存",
});
const logsMaxCountTips = () => ({
  title: "最大保存日志条数",
  content:
    "默认 0，即关闭日志缓存读写。设为大于 0 后，后端会把日志写入持久化缓存；数值越大占用的缓存空间越多，也可能影响性能。",
});
const concurrencyTips = () => ({
  title: "并发数",
  content: "Shadowrocket/Surge 等代理 App 中并发数太高可能会爆内存, 可自行调整",
});
const concurrencyWaitTimeTips = () => ({
  title: "并发等待时间",
  content:
    "每个受并发限制的前端请求拿到并发槽后，等待指定毫秒数再发出。默认 0 毫秒。",
});
const apiCheckTimeoutTips = () => ({
  title: "API 检测超时",
  content:
    "某些版本的 Mac 上 QX https://sub.store/api/utils/env 可能会超时, JS 一直活跃中, 可设为 8000",
});
const apiRequestTimeoutTips = () => ({
  title: "前端请求超时",
  content:
    "控制前端 axios 请求后端接口的超时时间。默认 50000 毫秒，设为大于 0 的值后保存并刷新生效。",
});
// store 刷新数据完成后 复制内容给 input 绑定
const { isLoading: storeIsLoading } = storeToRefs(useGlobalStore());
watchEffect(() => {
  if (!storeIsLoading.value && !isInit.value) {
    setDisplayInfo();
    isInit.value = true;
  }
});
type SettingsPanel =
  | "runtime"
  | "gist"
  | "more"
  | "api"
  | "logs"
  | "about";
const settingEntries = computed<{ panel: SettingsPanel; label: string; icon: string }[]>(() => [
    { panel: "api", label: t("workspace.api"), icon: "i-lucide-server" },
    { panel: "runtime", label: t("workspace.runtime"), icon: "i-lucide-settings" },
    { panel: "more", label: t("workspace.appearance"), icon: "i-lucide-sliders-horizontal" },
    { panel: "gist", label: t("workspace.backup"), icon: "i-lucide-cloud" },
    { panel: "logs", label: t("workspace.logs"), icon: "i-lucide-scroll-text" },
    { panel: "about", label: t("workspace.about"), icon: "i-lucide-info" },
  ]);
const isBusy = computed(
  () =>
    isEditLoading.value ||
    uploadIsLoading.value ||
    downloadIsLoading.value ||
    restoreIsLoading.value ||
    backupIsLoading.value,
);
const selectPanel = (value: string | number) => {
  if (isBusy.value) return;
  const entry = settingEntries.value.find((item) => item.panel === value);
  if (entry)
    router.replace({
      path: "/my",
      query: { ...settingsRoute.query, panel: entry.panel },
    });
};
const chooseDownloadToken = async (strategy: "keep" | "overwrite") => {
  showDownloadTokenDialog.value = false;
  await downloadWithTokenStrategy(strategy);
  rememberDownloadTokenStrategy.value = false;
};
const settingsRoute = useRoute();
watch(
  () => settingsRoute.query.panel,
  (panel) => {
    const targetPanel = panel === "backup"
      ? "gist"
      : panel === "request" || panel === "cache" || panel === "frontEnd"
        ? "runtime"
        : panel;
    activePanel.value =
      settingEntries.value.find((item) => item.panel === targetPanel)?.panel || "api";
  },
  { immediate: true },
);
</script>
