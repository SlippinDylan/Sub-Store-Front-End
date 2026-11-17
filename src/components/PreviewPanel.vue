<template>
  <div :class="{ 'preview-target-page': pageMode }">
    <div class="desc">
      <span>{{ desc }}</span>
      <HelpTip :help="tips()" />
    </div>
    <div class="preview-options">
      <UCheckbox
        v-model="includeUnsupportedProxy"
        :label="includeUnsupportedProxyLabel"
      />
      <UCheckbox v-model="prettyYaml" :label="prettyYamlLabel" />
      <UCheckbox v-model="noFlow" :label="noFlowLabel" />
      <UCheckbox
        :model-value="appearanceSetting.displayPreviewInWebPage"
        :label="displayPreviewInWebPageLabel"
        @update:model-value="setDisplayPreviewInWebPage"
      />
    </div>
    <ul class="preview-list">
      <li v-for="platform in platformList" :key="platform.name">
        <div class="infos">
          <div>
            <img :src="platform.icon" class="auto-reverse" />
          </div>
          <p>{{ platform.name }}</p>
          <HelpTip v-if="platform.path === 'SurgeMac'" :help="tips()" />
          <HelpTip v-if="platform.path === 'QX'" :help="qxTips()" />
        </div>

        <div class="actions">
          <a
            :aria-label="
              $t('previewWorkspace.previewFormat', { format: platform.name })
            "
            :href="
              getUrl(platform.path, appearanceSetting.displayPreviewInWebPage)
            "
            target="_blank"
          >
            <UIcon mode="svg" name="i-lucide-eye" class="action-icon" />
            <span v-if="pageMode">
              {{ $t("editorPage.subConfig.btn.compare") }}
            </span>
          </a>
          <UButton
            size="sm"
            :aria-label="
              $t('previewWorkspace.copyFormat', { format: platform.name })
            "
            class="copy-sub-link"
            @click.stop="targetCopy(platform.path)"
            color="neutral"
            variant="outline"
          >
            <UIcon mode="svg" name="i-lucide-copy" class="action-icon" />
            <span v-if="pageMode">{{ $t("previewWorkspace.copyLink") }}</span>
          </UButton>
        </div>
      </li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
  import { onMounted, ref, watch } from 'vue';
  import { Toast } from '@/services/feedback';
  import json from '@/assets/icons/json.svg';
  import uri from '@/assets/icons/uri.svg';
  import surfboard from '@/assets/icons/surfboard.png';
  import surge from '@/assets/icons/surge.png';
  import surgeMac from '@/assets/icons/surgeformac_text.png';
  import clash from '@/assets/icons/clash.png';
  import egern from '@/assets/icons/egern.png';
  import quanx from '@/assets/icons/quanx.png';
  import loon from '@/assets/icons/loon.png';
  import stash from '@/assets/icons/stash.png';
  import shadowrocket from '@/assets/icons/shadowrocket.png';
  import v2ray from '@/assets/icons/v2ray.png';
  import singbox from '@/assets/icons/sing-box.png';
  import clashmeta from '@/assets/icons/clashmeta.png';
  import logoIcon from '@/assets/icons/logo.png';
  import { copyText } from '@/utils/clipboard';
  import i18n from '@/locales';
  import { useAppNotifyStore } from '@/store/appNotify';
  import { useHostAPI } from '@/hooks/useHostAPI';
  import { storeToRefs } from "pinia";
  import { useSettingsStore } from '@/store/settings';

  const settingsStore = useSettingsStore();
  const { changeAppearanceSetting } = settingsStore;
  const { appearanceSetting } = storeToRefs(settingsStore);

  const includeUnsupportedProxy = ref(false);
  const prettyYaml = ref(false);
  const noFlow = ref(false);
  const { showNotify } = useAppNotifyStore();
  const { t } = i18n.global;
  const {
    name,
    pageMode,
    displayName,
    type,
    url,
    general,
    notify,
    tipsTitle,
    tipsContent,
    desc,
    tipsCancelText,
    tipsOkText,
    includeUnsupportedProxyLabel,
    prettyYamlLabel,
    noFlowLabel,
    displayPreviewInWebPageLabel,
  } = defineProps<{
    name: string;
    displayName?: string;
    type: 'sub' | 'collection' | 'share';
    pageMode?: boolean;
    general: string;
    notify: string;
    desc: string;
    includeUnsupportedProxyLabel: string;
    prettyYamlLabel: string;
    noFlowLabel: string;
    displayPreviewInWebPageLabel: string;
    url?: string;
    tipsTitle?: string;
    tipsContent?: string;
    tipsCancelText?: string;
    tipsOkText?: string;
  }>();

  const { currentUrl: host } = useHostAPI();

  const PREVIEW_INCLUDE_UNSUPPORTED_PROXY_KEY = "preview.includeUnsupportedProxy";
  const PREVIEW_PRETTY_YAML_KEY = "preview.prettyYaml";
  const PREVIEW_NO_FLOW_KEY = "preview.noFlow";

  const getLocalStorageBoolean = (key: string): boolean => {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }
    try {
      return window.localStorage.getItem(key) === "true";
    } catch {
      return false;
    }
  };

  const setLocalStorageBoolean = (key: string, value: boolean) => {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }
    try {
      window.localStorage.setItem(key, String(value));
    } catch {
      // ignore localStorage write failures in restricted environments
    }
  };

  onMounted(() => {
    includeUnsupportedProxy.value = getLocalStorageBoolean(PREVIEW_INCLUDE_UNSUPPORTED_PROXY_KEY);
    prettyYaml.value = getLocalStorageBoolean(PREVIEW_PRETTY_YAML_KEY);
    noFlow.value = getLocalStorageBoolean(PREVIEW_NO_FLOW_KEY);
  });

  watch(includeUnsupportedProxy, (value) => {
    setLocalStorageBoolean(PREVIEW_INCLUDE_UNSUPPORTED_PROXY_KEY, value);
  });
  watch(prettyYaml, (value) => {
    setLocalStorageBoolean(PREVIEW_PRETTY_YAML_KEY, value);
  });
  watch(noFlow, (value) => {
    setLocalStorageBoolean(PREVIEW_NO_FLOW_KEY, value);
  });
  const setDisplayPreviewInWebPage = async (value: boolean | 'indeterminate') => {
    await changeAppearanceSetting({ appearanceSetting: { displayPreviewInWebPage: value === true } });
  };
  const buildUrlWithQuery = (url: string, query: Record<string, string | boolean>): string => {
    if (!url) {
      return '';
    }
    const queryString = Object.entries(query)
      .filter(([_, value]) => value !== undefined && value !== null)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
      
    if (!queryString) {
      return url;
    }
    
    const hasQueryParams = url.includes('?');
    return `${url}${hasQueryParams ? '&' : '?'}${queryString}`;
  };

  const getUrl = (path: string, preview: boolean = false) => {
    const query = {} as Record<string, string | boolean>;
    if (path !== null) {
      query.target = path;
    }
    if (includeUnsupportedProxy.value) {
      query.includeUnsupportedProxy = true;
    }
    if (prettyYaml.value) {
      query.prettyYaml = true;
    }
    if (noFlow.value) {
      query.noFlow = true;
    }
    let previewUrl
    if (url) {
      previewUrl = buildUrlWithQuery(url, query);
    } else {
      previewUrl = `${host.value}/download/${
        type === "sub" ? "" : "collection/"
        }${encodeURIComponent(name)}${Object.keys(query).length > 0 ? `?${Object.entries(query).map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join('&')}` : ''}`; 
    }
    if (!preview) {
      return previewUrl;
    }

    const previewQuery = {
      url: previewUrl,
      name: displayName || name,
      api: host.value,
    } as Record<string, string | boolean>;

    if (type === "sub" || type === "collection") {
      previewQuery.sourceType = type;
      previewQuery.sourceName = name;
    }

    return buildUrlWithQuery('/preview', previewQuery);
  }
  const targetCopy = async (path: string) => {
    const url = getUrl(path);
    try {
      await copyText(url);
      showNotify({ title: notify });
    } catch (error) {
      Toast.fail(t("globalNotify.copyFailed", { e: error?.message ?? String(error) }));
    }
  };
  const platformList = [
    {
      name: general,
      path: null,
      icon: logoIcon,
    },
    {
      name: 'Stash',
      path: 'Stash',
      icon: stash,
    },
    {
      name: 'mihomo',
      path: 'ClashMeta',
      icon: clashmeta,
    },
    // {
    //   name: 'Clash(Deprecated)',
    //   path: 'Clash',
    //   icon: clash,
    // },
    {
      name: 'Egern',
      path: 'Egern',
      icon: egern,
    },
    {
      name: 'Surfboard',
      path: 'Surfboard',
      icon: surfboard,
    },
    {
      name: 'Surge',
      path: 'Surge',
      icon: surge,
    },
    {
      name: 'Surge Mac',
      path: 'SurgeMac',
      icon: surgeMac,
    },

    {
      name: 'Loon',
      path: 'Loon',
      icon: loon,
    },
    {
      name: 'Shadowrocket',
      path: 'ShadowRocket',
      icon: shadowrocket,
    },
    {
      name: 'Quantumult X',
      path: 'QX',
      icon: quanx,
    },
    {
      name: 'sing-box',
      path: 'sing-box',
      icon: singbox,
    },
    {
      name: 'V2Ray',
      path: 'V2Ray',
      icon: v2ray,
    },
    {
      name: 'URI',
      path: 'URI',
      icon: uri,
    },
    {
      name: 'JSON',
      path: 'JSON',
      icon: json,
    },
  ];
  const tips = () => ({
  href: "https://github.com/sub-store-org/Sub-Store/wiki/%E9%93%BE%E6%8E%A5%E5%8F%82%E6%95%B0%E8%AF%B4%E6%98%8E",
});
  const qxTips = () => ({
  content:
    "由于 QX 资源解析器对 QX 格式的输入支持不完善, 请勿对 Sub-Store 链接启用资源解析器. 如果一定要用资源解析器, 请手动选择 V2Ray 输出, 将形如 ?target=V2Ray 的链接填入 QX",
});
</script>

<style lang="scss" scoped>
  .preview-options {
    width: max-content;
    max-width: 100%;
    margin: 6px auto 4px;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    column-gap: 18px;
    row-gap: 8px;
    flex-wrap: wrap;

    .preview-option-item {
      display: flex;
      align-items: center;
      font-size: 12px;
      gap: 4px;
      white-space: nowrap;
    }

    input {
      cursor: pointer;
      padding: 0;
      margin: 0;
    }

    label {
      cursor: pointer;
    }
  }
  .desc {
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
  }
  .preview-list {
    flex: 1;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;

    > li {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;

      &:not(:last-child) {
        border-bottom: 1px solid var(--ui-border);
      }

      .infos {
        flex: 1;
        padding: 3px 0;
        display: flex;
        align-items: center;
        gap: 4px;

        div {
          width: 32px;
          aspect-ratio: 1;
        }

        p {
          font-size: 14px;
          color: var(--ui-text-toned);
        }
      }

      .actions {
        flex-shrink: 0;
        flex-grow: 0;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        font-size: 20px;

        > button {
          background-color: transparent;
          border: none;
          padding: 0;
          cursor: pointer;
        }
      }
    }
  }
</style>

<style scoped>
.preview-target-page .desc { justify-content: flex-start; padding: 14px 16px; border: 1px solid var(--ui-border); border-radius: var(--ui-radius); background: var(--ui-bg-muted); color: var(--ui-text-muted); font-size: 13px; gap: 8px; }
.preview-target-page .preview-options { width: 100%; margin: 16px 0; padding: 16px; border: 1px solid var(--ui-border); border-radius: var(--ui-radius); background: var(--ui-bg); }
.preview-target-page .preview-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(290px, 1fr)); gap: 16px; height: auto; align-items: stretch; }
.preview-target-page .preview-list > li { border: 1px solid var(--ui-border); border-radius: var(--ui-radius); padding: 16px; background: var(--ui-bg); flex-wrap: wrap; gap: 14px; }
.preview-target-page .preview-list .infos { gap: 12px; flex-basis: 100%; }
.preview-target-page .preview-list .infos img { width: 32px; height: 32px; object-fit: contain; }
.preview-target-page .preview-list .infos p { margin: 0; font-weight: 500; }
.preview-target-page .preview-list .actions { gap: 8px; font-size: 12px; width: 100%; justify-content: flex-end; }
.preview-target-page .preview-list .actions > a, .preview-target-page .preview-list .actions > button { height: 28px; display: inline-flex; align-items: center; gap: 6px; border: 1px solid var(--ui-border); border-radius: var(--ui-radius); padding: 4px 8px; color: var(--ui-text); }
.preview-target-page .action-icon { width: 16px; height: 16px; }
</style>
