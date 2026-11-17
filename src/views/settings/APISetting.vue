<template>
  <div class="page-wrapper">
    <template v-if="isEnvReady">
      <SettingsSection :title="$t(`apiSettingPage.currentApi.title`)">
        <SettingsRow class="cell" center>
          <template #icon>
            <img :src="backendIcon" alt="" class="auto-reverse backend-icon">
          </template>
          <template #title>
            <span class="backend-title">{{
              currentName === ''
                ? $t(`apiSettingPage.apiList.defaultName`)
                : currentName
            }}</span>
          </template>
          <template #link>
            <span class="backend-version">{{
              `${env.meta?.node?.env?.SUB_STORE_BACKEND_CUSTOM_NAME || env.backend} - ${env.version}`
            }}</span>
          </template>
        </SettingsRow>
      </SettingsSection>
    </template>

    <SettingsSection
      :title="$t(`apiSettingPage.apiList.title`)"
      :desc="$t(`apiSettingPage.apiList.desc`)"
    >
      <SettingsRow @click="handleSwitchClick('')">
        <div class="api-list-item">
          <div class="api-item-left">
            <h2>
              {{ $t(`apiSettingPage.apiList.defaultName`) }}
              <TagChip v-if="currentName === ''">
                {{ $t(`apiSettingPage.apiList.currentTag`) }}
              </TagChip>
            </h2>
            <p>{{ defaultAPI }}</p>
          </div>
        </div>
      </SettingsRow>

      <SettingsRow
        v-for="api in apis"
        :key="api.name"
        @click="handleSwitchClick(api.name)"
      >
        <div class="api-list-item">
          <div class="api-item-left">
            <h2>
              <FieldInput
                v-if="editingApiName === api.name"
                v-model="editApiNameInput"
                :label="$t('myPage.fieldLabels.backendName')"
                class="api-name-input"
                type="text"
                input-align="left"
                @click.stop
                @keyup.enter.stop="saveApiName(api)"
              />
              <template v-else>
                {{ api.name }}
              </template>
              <TagChip v-if="currentName === api.name">
                {{ $t(`apiSettingPage.apiList.currentTag`) }}
              </TagChip>
            </h2>
            <p>{{ maskApiUrl(api.url) }}</p>
            <template v-if="editingApiName === api.name">
              <FieldInput
                v-model="editShareBaseUrlInput"
                :label="$t('myPage.fieldLabels.shareBaseUrl')"
                class="api-share-url-input"
                type="text"
                input-align="left"
                :placeholder="$t(`apiSettingPage.addApi.placeholder.shareBaseUrl`)"
                :error="!!editShareBaseUrlError"
                :error-message="editShareBaseUrlError"
                @click.stop
                @keyup.enter.stop="saveApiName(api)"
              />
            </template>
            <p v-else-if="api.shareBaseUrl" class="api-share-url">
              {{ $t(`apiSettingPage.apiList.shareBaseUrl`) }}: {{ api.shareBaseUrl }}
            </p>
          </div>
          <div class="api-item-right">
            <template v-if="editingApiName === api.name">
              <UButton
                :size="isDesktop ? 'sm' : 'md'"
                type="button"
                class="api-action-btn"
                :title="$t(`apiSettingPage.apiList.saveName`)"
                @click.stop="saveApiName(api)"
               color="neutral" variant="outline">
                <UIcon mode="svg" class="size-4 shrink-0 align-middle" name="i-lucide-save" />
              </UButton>
              <UButton
                :size="isDesktop ? 'sm' : 'md'"
                type="button"
                class="api-action-btn"
                :title="$t(`apiSettingPage.apiList.cancelEditName`)"
                @click.stop="cancelEditApiName"
               color="neutral" variant="outline">
                <UIcon mode="svg" class="size-4 shrink-0 align-middle" name="i-lucide-ban" />
              </UButton>
            </template>
            <template v-else>
              <UButton
                :size="isDesktop ? 'sm' : 'md'"
                type="button"
                class="api-action-btn"
                :title="$t(`apiSettingPage.apiList.copy`)"
                @click.stop="copyApi(api)"
               color="neutral" variant="outline">
                <UIcon mode="svg" class="size-4 shrink-0 align-middle" name="i-lucide-copy" />
              </UButton>
              <UButton
                :size="isDesktop ? 'sm' : 'md'"
                type="button"
                class="api-action-btn"
                :title="$t(`apiSettingPage.apiList.editName`)"
                @click.stop="startEditApiName(api)"
               color="neutral" variant="outline">
                <UIcon mode="svg" class="size-4 shrink-0 align-middle" name="i-lucide-pencil" />
              </UButton>
              <UButton
                :size="isDesktop ? 'sm' : 'md'"
                type="button"
                class="api-action-btn"
                :title="$t(`apiSettingPage.apiList.delete`)"
                @click.stop="deleteApi(api.name)"
               color="neutral" variant="outline">
                <UIcon mode="svg" class="size-4 shrink-0 align-middle" name="i-lucide-x" />
              </UButton>
            </template>
          </div>
        </div>
      </SettingsRow>
    </SettingsSection>

    <SettingsSection :title="$t(`apiSettingPage.addApi.title`)">
      <template #footer>
        <div class="flex justify-end">
          <UButton
            class="save-btn"
            size="sm"
            color="primary"
            :disabled="!addForm.name || !addForm.url"
            :loading="checkingAPI"
            @click="addApiHandler"
          >
            <UIcon mode="svg" class="size-4 shrink-0 align-middle"
              v-if="!checkingAPI"
              name="i-lucide-save"
            />
            {{ $t('apiSettingPage.addApi.btn') }}
          </UButton>
        </div>
      </template>
      <div class="add-api-wrapper">
        <div class="add-form-wrapper settings-fields">
          <FieldInput
            v-model="addForm.name"
            :label="$t('myPage.fieldLabels.backendName')"
            class="input"
            :placeholder="$t(`apiSettingPage.addApi.placeholder.name`)"
            type="text"
            input-align="left"
          />
          <FieldInput
            id="backend-url"
            v-model="addForm.url"
            :label="$t('myPage.fieldLabels.backendUrl')"
            class="input"
            :placeholder="$t(`apiSettingPage.addApi.placeholder.url`)"
            type="text"
            input-align="left"
            :error="!!error"
            :error-message="error"
            @blur="validateInput"
            @keyup.enter="addApiHandler"
          />
          <FieldInput
            v-model="addForm.shareBaseUrl"
            :label="$t('myPage.fieldLabels.shareBaseUrl')"
            class="input"
            :placeholder="$t(`apiSettingPage.addApi.placeholder.shareBaseUrl`)"
            type="text"
            input-align="left"
            :error="!!shareBaseUrlError"
            :error-message="shareBaseUrlError"
            @blur="validateShareBaseUrlInput(addForm.shareBaseUrl)"
            @keyup.enter="addApiHandler"
          />


          <div v-if="addForm.url.trim()" class="preview-container">
            <div class="preview-label">{{ $t('magicPath.preview') }}:</div>
            <div class="preview-url">
              <span v-if="inputType === 'full'" class="preview-full">{{ previewUrl }}</span>
              <template v-else-if="inputType === 'host'">
                <span class="preview-protocol">http://</span>
                <span class="preview-host">{{ parsedHost }}</span>
                <span class="preview-path">{{ (parsedPath && parsedPath !== '/') ? `/${parsedPath}` : '' }}</span>
              </template>
              <template v-else>
                <span class="preview-origin">{{ currentOrigin }}</span>
                <span class="preview-path">{{ (parsedPath && parsedPath !== '/') ? `/${parsedPath}` : '' }}</span>
              </template>
            </div>
            <div class="preview-type">
              {{ $t(`magicPath.inputTypes.${inputType}`) }}
            </div>
          </div>
        </div>

      </div>
    </SettingsSection>

    <div class="settings-notice mt-4">
      <p>{{ $t(`apiSettingPage.apiSettingDesc0`) }}</p>
      <p>{{ $t(`apiSettingPage.apiSettingDesc1`) }}</p>
      <span>{{ $t(`apiSettingPage.apiSettingDesc2`) }}</span>
      <a
        href="https://github.com/sub-store-org/Sub-Store/wiki#%E5%AE%89%E8%A3%85"
        target="_blank"
      >
        {{ $t(`apiSettingPage.apiSettingWiki`) }}</a>
      <br/>
      4. <a href="https://telegram.me/zhetengsha/218" target="_blank">{{ $t('magicPath.troubleshooting') }}</a>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useMediaQuery } from "@vueuse/core";
import { Dialog, Toast } from '@/services/feedback';
import { computed, ref, watchEffect } from 'vue';
import { useI18n } from 'vue-i18n';
import { useBackend } from '@/hooks/useBackend';
import { useHostAPI } from '@/hooks/useHostAPI';
import axios from 'axios';

import { copyText } from '@/utils/clipboard';
import { storeToRefs } from 'pinia';
import { useAppNotifyStore } from '@/store/appNotify';
import { useSettingsStore } from '@/store/settings';
import { createGithubProxyUrlRewriter } from '@/utils/githubProxy';
import { isValidShareBaseUrl, normalizeShareBaseUrl } from '@/utils/share';
const isDesktop = useMediaQuery("(min-width: 768px)");

const { t } = useI18n();
const { showNotify } = useAppNotifyStore();

const { icon, env, isEnvReady } = useBackend();
const settingsStore = useSettingsStore();
const { githubProxy, githubProxyRegex } = storeToRefs(settingsStore);
const { defaultAPI, currentName, apis, setCurrent, addApi, editApi, editApiName: updateApiName, deleteApi }
    = useHostAPI();
const githubUrlRewriter = computed(() => {
  return createGithubProxyUrlRewriter(githubProxy.value, githubProxyRegex.value);
});
const backendIcon = computed(() => {
  return githubUrlRewriter.value(
    env.value?.meta?.node?.env?.SUB_STORE_BACKEND_CUSTOM_ICON || icon.value,
  ) || icon.value;
});

const addForm = ref<HostAPI>({
  name: '',
  url: '',
  shareBaseUrl: '',
});
const editingApiName = ref('');
const editApiNameInput = ref('');
const editShareBaseUrlInput = ref('');
const editShareBaseUrlError = ref('');


const error = ref('');
const shareBaseUrlError = ref('');
const checkingAPI = ref(false);
const switchingAPI = ref(false);


const inputType = ref('path');
const parsedHost = ref('');
const parsedPath = ref('');
const previewUrl = ref('');
const currentOrigin = ref(window.location.origin);

const copyApi = async (api: HostAPI) => {
  const url = new URL(window.location.origin);
  url.searchParams.set('api', api.url);
  if (api.shareBaseUrl) {
    url.searchParams.set('shareBaseUrl', api.shareBaseUrl);
  }
  try {
    await copyText(url.toString());
    showNotify({ title: url.toString() });
  } catch (error) {
    Toast.fail(t("globalNotify.copyFailed", { e: error?.message ?? String(error) }));
  }
};

const startEditApiName = (api: HostAPI) => {
  editingApiName.value = api.name;
  editApiNameInput.value = api.name;
  editShareBaseUrlInput.value = api.shareBaseUrl || '';
  editShareBaseUrlError.value = '';
};

const cancelEditApiName = () => {
  editingApiName.value = '';
  editApiNameInput.value = '';
  editShareBaseUrlInput.value = '';
  editShareBaseUrlError.value = '';
};

const maskApiUrl = (url: string) => {
  return url.length > 26 ? `${url.slice(0, 20)}******` : url;
};

const validateShareBaseUrlInput = (value?: string | null, target: 'add' | 'edit' = 'add') => {
  const normalizedValue = normalizeShareBaseUrl(value);
  const message = normalizedValue && !isValidShareBaseUrl(normalizedValue)
    ? t('apiSettingPage.addApi.errors.shareBaseUrlInvalid')
    : '';

  if (target === 'edit') {
    editShareBaseUrlError.value = message;
  } else {
    shareBaseUrlError.value = message;
  }

  if (message) {
    showNotify({
      title: message,
      type: 'danger',
    });
  }

  return !message;
};

const saveApiName = async (api: HostAPI) => {
  const nextName = editApiNameInput.value.trim();
  const nextShareBaseUrl = normalizeShareBaseUrl(editShareBaseUrlInput.value);

  if (!nextName) {
    showNotify({
      title: t('apiSettingPage.addApi.errors.nameEmpty'),
      type: 'danger',
    });
    return;
  }

  if (!validateShareBaseUrlInput(nextShareBaseUrl, 'edit')) {
    return;
  }

  const currentShareBaseUrl = normalizeShareBaseUrl(api.shareBaseUrl);
  if (nextName === api.name && nextShareBaseUrl === currentShareBaseUrl) {
    cancelEditApiName();
    return;
  }

  if (nextName !== api.name && apis.value.some(item => item.name === nextName)) {
    showNotify({
      title: t('apiSettingPage.addApi.errors.nameDuplicate'),
      type: 'danger',
    });
    return;
  }

  let result = nextName === api.name
    ? true
    : await updateApiName({ name: nextName, url: api.url });
  if (result) {
    result = editApi({
      name: nextName,
      url: api.url,
      shareBaseUrl: nextShareBaseUrl,
    });
  }
  if (result) {
    cancelEditApiName();
    showNotify({ title: t('magicPath.success'), type: 'success' });
  }
};

// 验证输入
const validateInput = () => {
  const input = addForm.value.url.trim();

  if (!input) {
    error.value = t('magicPath.errors.empty');
    return false;
  }

  // 根据输入内容判断类型并验证
  if (input.includes('://')) {
    // 完整URL格式
    try {
      new URL(input);
    } catch (e) {
      error.value = t('magicPath.errors.invalid');
      showNotify({
        title: t('magicPath.errors.invalid'),
        type: 'danger'
      });
      return false;
    }
  } else if (/^\d+\.\d+\.\d+\.\d+(?::\d+)?$/.test(input) || /^localhost(?::\d+)?$/.test(input)) {
    // IP地址或localhost格式
    if (!input.includes(':')) {
      error.value = t('magicPath.errors.invalid');
      showNotify({
        title: t('magicPath.errors.invalid') + ' - ' + t('magicPath.errors.portRequired'),
        type: 'danger'
      });
      return false;
    }
  } else if (/^https?:\/\//.test(input)) {
    // 不完整的URL格式（有http(s):// 但格式不正确）
    error.value = t('magicPath.errors.invalid');
    showNotify({
      title: t('magicPath.errors.invalid'),
      type: 'danger'
    });
    return false;
  }

  // 如果通过所有验证，清除错误
  error.value = '';
  return true;
};


const addApiHandler = async () => {

  if (!validateInput()) {

    error.value = error.value || t('magicPath.errors.invalid');


    showNotify({
      title: error.value,
      type: 'danger'
    });
    return;
  }

  if (!addForm.value.name) {
    error.value = t('apiSettingPage.addApi.errors.nameEmpty');
    showNotify({
      title: error.value,
      type: 'danger'
    });
    return;
  }
  if (!validateShareBaseUrlInput(addForm.value.shareBaseUrl)) {
    return;
  }
  // 使用解析后的完整URL（host:port 类型会被 previewUrl 补全为 http://...）
  const addFormUrl = previewUrl.value || (addForm.value.url && addForm.value.url.trim());
  const addFormName = addForm.value.name && addForm.value.name.trim();
  const addFormShareBaseUrl = normalizeShareBaseUrl(addForm.value.shareBaseUrl);
  // 默认API地址
  const defaultApiUrl = defaultAPI && defaultAPI.trim();
  
  // 如果输入的地址与默认API地址不同，且不为空，则进行重复检查
  if (addFormUrl && addFormUrl !== defaultApiUrl) {
    const existingApi = apis.value.find(api => api.url === addFormUrl);
    // 如果存在相同地址的API，提示用户选择是切换还是覆盖
    if (existingApi) {
      Dialog({
        title: t('apiSettingPage.addApi.duplicate.title'),
        content: t('apiSettingPage.addApi.duplicate.content', { name: existingApi.name }),
        onOk: async () => {
          checkingAPI.value = true;
          try {
            const ok = await checkApiConnectivity(existingApi.url);
            if (ok) {
              setCurrent(existingApi.name);
              await resetAddForm();
              showNotify({ title: t('magicPath.success'), type: 'success' });
            }
          } finally {
            checkingAPI.value = false;
          }
        },
        onCancel: async () => {
          await setApi({
            name: addFormName,
            url: addFormUrl,
            shareBaseUrl: addFormShareBaseUrl,
            isEditName: true,
          });
        },
        popClass: "auto-dialog",
        noCancelBtn: false,
        okText: t('apiSettingPage.addApi.duplicate.confirm'),
        cancelText: t('apiSettingPage.addApi.duplicate.cancel'),
        closeOnClickOverlay: true,
        lockScroll: false,
      });
      return;
    }
  }
  // 如果没有重复，直接添加
  await setApi({ name: addFormName, url: addFormUrl, shareBaseUrl: addFormShareBaseUrl });
};

// 检查API连通性，成功返回 true，失败自动 showNotify 并返回 false
const checkApiConnectivity = async (url: string): Promise<boolean> => {
  try {
    const res = await axios.get(`${url}/api/utils/env`);
    if (res?.data?.status !== 'success') {
      showNotify({ title: t('magicPath.errors.invalid'), type: 'danger' });
      return false;
    }
    return true;
  } catch (e) {
    showNotify({ title: t('magicPath.errors.connection'), type: 'danger' });
    return false;
  }
};

// 切换前先检查连通性再调用 setCurrent（使用独立 switchingAPI 避免影响表单 loading 状态）
const switchToApi = async (name: string) => {
  if (switchingAPI.value) return;
  if (name === currentName.value) return;

  const rawUrl = name === ''
    ? defaultAPI
    : apis.value.find(api => api.name === name)?.url;
  if (!rawUrl) {
    setCurrent(name);
    return;
  }
  // 补全协议头：纯 host:port 格式需要加 http://
  const url = /^\d+\.\d+\.\d+\.\d+:\d+/.test(rawUrl) || /^localhost:\d+/.test(rawUrl)
    ? `http://${rawUrl}`
    : rawUrl;
  switchingAPI.value = true;
  Toast.loading(t('apiSettingPage.switchApi.loading'), {
    cover: true,
    id: 'switch-api-loading',
    duration: 0
  });
  try {
    const ok = await checkApiConnectivity(url);
    if (ok) {
      setCurrent(name);
      showNotify({ title: t('magicPath.success'), type: 'success' });
    }
  } finally {
    Toast.hide('switch-api-loading');
    switchingAPI.value = false;
  }
};

const handleSwitchClick = async (name: string) => {
  if (switchingAPI.value) return;
  await switchToApi(name);
};

const setApi = async ({
  name = '',
  url = '',
  shareBaseUrl = '',
  isEditName = false,
}: {
  name?: string;
  url?: string;
  shareBaseUrl?: string;
  isEditName?: boolean;
}) => {
  // 开始检查后端API连接状态
  checkingAPI.value = true;

  try {
    const apiUrl = url;
    const apiName = name;
    if (!apiUrl) {
      error.value = t('magicPath.errors.empty');
      return;
    }
    const ok = await checkApiConnectivity(apiUrl);
    if (!ok) {
      error.value = t('magicPath.errors.connection');
      return;
    }
    const normalizedShareBaseUrl = normalizeShareBaseUrl(shareBaseUrl);

    let result = null;
    if (isEditName) {
      const existingApi = apis.value.find(api => api.url === apiUrl);
      if (!existingApi) {
        result = false;
      } else {
        const nextName = apiName || existingApi.name;
        result = nextName === existingApi.name
          ? true
          : await updateApiName({ name: nextName, url: apiUrl });
        if (result) {
          result = editApi({
            name: nextName,
            url: apiUrl,
            shareBaseUrl: normalizedShareBaseUrl,
          });
        }
      }
    } else {
      // 已通过 checkApiConnectivity 验证，跳过 addApi 内部的重复检查
      result = await addApi({
        name: apiName,
        url: apiUrl,
        shareBaseUrl: normalizedShareBaseUrl,
      }, true);
    }
    console.log('result', result);
    if (result) {
      setCurrent(apiName);
      showNotify({ title: t('magicPath.success'), type: 'success' });
      addForm.value = { name: '', url: '', shareBaseUrl: '' };
      error.value = '';
      shareBaseUrlError.value = '';
    }
  } catch (e) {
    error.value = t('magicPath.errors.unknown');
    showNotify({ title: t('magicPath.errors.unknown'), type: 'danger' });
  } finally {
    checkingAPI.value = false;
  }
};

const resetAddForm = async () => {
  addForm.value = {
    name: '',
    url: '',
    shareBaseUrl: '',
  };
  error.value = '';
  shareBaseUrlError.value = '';
};

watchEffect(() => {
  const input = addForm.value.url.trim();


  if (!input) {
    inputType.value = 'path';
    parsedHost.value = '';
    parsedPath.value = '';
    previewUrl.value = '';
    return;
  }


  if (document.activeElement === document.querySelector('#backend-url')) {
    error.value = '';
  }

  if (input.includes('://')) {
    inputType.value = 'full';
    previewUrl.value = input;

    try {
      const url = new URL(input);
      parsedHost.value = url.host;
      parsedPath.value = url.pathname.replace(/^\/+/, '');
    } catch (e) {
      parsedHost.value = '';
      parsedPath.value = input;
    }
  } else if (/^\d+\.\d+\.\d+\.\d+:\d+/.test(input) || /^localhost:\d+/.test(input)) {
    inputType.value = 'host';

    if (input.includes('/')) {
      const parts = input.split('/');
      parsedHost.value = parts[0];
      parsedPath.value = parts.slice(1).join('/');
    } else {
      parsedHost.value = input;
      parsedPath.value = '';
    }

    previewUrl.value = `http://${parsedHost.value}${(parsedPath.value && parsedPath.value !== '/') ? `/${parsedPath.value}` : ''}`;
  } else {
    inputType.value = 'path';
    parsedPath.value = input.replace(/^\/+/, '');
    parsedHost.value = '';
    previewUrl.value = `${currentOrigin.value}${(parsedPath.value && parsedPath.value !== '/') ? `/${parsedPath.value}` : ''}`;
  }
});

</script>
