<template>
  <div v-if="flatFields" class="editor-action-card" :inert="isContentUpdating" :aria-busy="isContentUpdating">
    <ResourceField
      :label="$t(`editorPage.subConfig.nodeActions['${type}'].des[0]`)"
    >
      <ChoiceGroup v-model="value.mode" direction="horizontal">
        <ChoiceOption v-for="(key, index) in modeList" :key="key" :label="key">
          {{
            $t(`editorPage.subConfig.nodeActions['${type}'].options[${index}]`)
          }}
        </ChoiceOption>
      </ChoiceGroup>
    </ResourceField>
    <ResourceField
      prop="scriptContent"
      :rules="
        value.mode === 'link'
          ? [
              {
                validator: () => isScriptSourceValid(value.content),
                message: $t('actionValidation.scriptSource'),
              },
            ]
          : []
      "
      :label="$t(`editorPage.subConfig.nodeActions['${type}'].des[1]`)"
      :help="{
        href: 'https://github.com/sub-store-org/Sub-Store/wiki/脚本使用说明',
      }"
    >
      <div class="min-w-0 space-y-3">
        <FieldTextarea
          v-if="value.mode === 'link'"
          v-model="value.content"
          :placeholder="
            $t(`editorPage.subConfig.nodeActions['${type}'].placeholder`)
          "
          :rows="3"
          autosize
          @blur="handleLinkValueChange"
        />
        <cmView
          v-else
          :id="id"
          :is-read-only="false"
          :editor-language="scriptEditorLanguage"
          @update:busy="isContentUpdating = $event"
          @update:editor-language="setScriptEditorLanguage"
        />
      </div>
    </ResourceField>
    <ResourceField
      v-if="value.mode === 'link'"
      :label="$t(`editorPage.subConfig.nodeActions['${type}'].noCache`)"
      :help="showNoCacheTips()"
    >
      <div class="flex justify-end">
        <SelectionOption
          v-model="params.noCache"
          :aria-label="
            $t(`editorPage.subConfig.nodeActions['${type}'].noCache`)
          "
        />
      </div>
    </ResourceField>
    <ResourceField
      v-if="value.mode === 'link'"
      :label="$t(`editorPage.subConfig.nodeActions['${type}'].insecure`)"
      :help="showInsecureTips()"
    >
      <div class="flex justify-end">
        <SelectionOption
          v-model="params.insecure"
          :aria-label="
            $t(`editorPage.subConfig.nodeActions['${type}'].insecure`)
          "
        />
      </div>
    </ResourceField>
    <section class="action-parameters border-t border-default py-3 space-y-3">
      <div class="flex items-center justify-between gap-3">
        <div class="flex items-center gap-1 text-sm">
          <span>{{ $t("subscriptionEditor.scriptArguments") }}</span>
          <HelpTip :help="showParamsEditTips()" />
        </div>
        <UButton
          @click="addParameter"
          icon="i-lucide-plus"
          color="neutral"
          variant="outline"
          size="sm"
          class="shrink-0 whitespace-nowrap"
        >
          {{ $t(`editorPage.subConfig.nodeActions['${type}'].paramsAdd`) }}
        </UButton>
      </div>
      <ParamsEditor
        v-if="paramsArguments.length"
        v-model:paramsArguments="paramsArguments"
        :visible="true"
        :type="type"
      />
    </section>
  </div>
  <div v-else class="editor-action-card" :inert="isContentUpdating" :aria-busy="isContentUpdating">
    <div class="type-row">
      <UButton
        type="button"
        class="content-fold-toggle"
        :aria-expanded="!isContentFolded"
        :aria-label="
          isContentFolded
            ? $t('moreSettingPage.editorDisplayMode.expanded')
            : $t('moreSettingPage.editorDisplayMode.collapsed')
        "
        @click="toggleContentFold"
        color="neutral"
        variant="outline"
      >
        <AppIcon
          :name="isContentFolded ? 'rect-right' : 'rect-down'"
          size="12px"
        />
        <span>
          {{ $t(`editorPage.subConfig.nodeActions['${type}'].des[0]`) }}
        </span>
      </UButton>
      <HelpTip
        :help="{
          href: 'https://github.com/sub-store-org/Sub-Store/wiki/脚本使用说明',
        }"
      />
    </div>
    <div v-show="!isContentFolded">
      <ChoiceGroup v-model="value.mode" direction="horizontal">
        <ChoiceOption
          v-for="(key, index) in modeList"
          :key="index"
          :label="key"
        >
          {{
            $t(`editorPage.subConfig.nodeActions['${type}'].options[${index}]`)
          }}
        </ChoiceOption>
      </ChoiceGroup>

      <div v-if="value.mode === 'link'" class="input-wrapper">
        <FieldTextarea
          v-model="value.content"
          :placeholder="
            $t(`editorPage.subConfig.nodeActions['${type}'].placeholder`)
          "
          :rows="5"
          autosize
          @blur="handleLinkValueChange"
        />
      </div>
      <div v-if="value.mode === 'script'" class="local-content-section">
        <cmView
          :id="id"
          :is-read-only="false"
          :editor-language="scriptEditorLanguage"
          @update:busy="isContentUpdating = $event"
          @update:editor-language="setScriptEditorLanguage"
        />
      </div>
    </div>

    <!-- 参数控制部分 -->
    <div class="input-wrapper-title">
      <!-- 参数区域展开开关 -->
      <div class="title-label">
        <UButton
          class="params-toggle"
          type="button"
          :aria-expanded="showKeyValue"
          @click="toggleShowKeyValue"
          color="neutral"
          variant="outline"
        >
          <AppIcon
            class="params-toggle-icon"
            :name="showKeyValue ? 'rect-down' : 'rect-right'"
            size="12px"
          />
          <span>
            {{
              $t(
                `editorPage.subConfig.nodeActions['${type}'].${
                  showKeyValue ? "paramsCollapse" : "paramsExpand"
                }`,
              )
            }}
          </span>
        </UButton>
        <HelpTip :help="showParamsEditTips()" />
      </div>
      <!-- 无缓存开关 - 仅在link模式时显示 -->
      <div v-if="value.mode === 'link'" class="title-label">
        <SelectionOption v-model="params.noCache" class="my-switch" />
        <UButton
          class="switch-label"
          type="button"
          @click="toggleNoCache"
          color="neutral"
          variant="outline"
        >
          {{ $t(`editorPage.subConfig.nodeActions['${type}'].noCache`) }}
        </UButton>
        <HelpTip :help="showNoCacheTips()" />
      </div>
      <div v-if="value.mode === 'link'" class="title-label">
        <SelectionOption v-model="params.insecure" class="my-switch" />
        <UButton
          class="switch-label"
          type="button"
          @click="toggleInsecure"
          color="neutral"
          variant="outline"
        >
          {{ $t(`editorPage.subConfig.nodeActions['${type}'].insecure`) }}
        </UButton>
        <HelpTip :help="showInsecureTips()" />
      </div>
      <!-- 添加参数按钮 -->
      <div v-if="showKeyValue" class="button">
        <div @click="addParameter">
          {{ $t(`editorPage.subConfig.nodeActions['${type}'].paramsAdd`) }}
        </div>
      </div>
    </div>
    <ParamsEditor
      v-model:paramsArguments="paramsArguments"
      :visible="showKeyValue"
      :type="type"
    />
  </div>
</template>

<script lang="ts" setup>

import { inject, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";

import { isScriptSourceValid } from "../actionValidation";
import ParamsEditor from "@/components/ParamsEditor.vue";
import { usePopupRoute } from "@/hooks/usePopupRoute";
import { useCodeStore } from "@/store/codeStore";
import {
  getEditorIsFolded,
  setEditorFoldState,
} from "@/utils/editorFoldState";
import cmView from "@/views/editCode/cmView.vue";
import { isMihomoConfigFileType } from "@/utils/fileType";

const { type, id, sourceType, flatFields = false } = defineProps<{
  type: string;
  id: string;
  sourceType?: string;
  flatFields?: boolean;
}>();

const cmStore = useCodeStore();
const isContentUpdating = ref(false);

const { t } = useI18n();
const route = useRoute();

const form = inject<Sub | Collection>("form");

const modeList = ["link", "script"];
const SCRIPT_CONTENT_FOLD_STORAGE_KEY = "script-local-content-fold";

const getContentFoldPath = (path = route.path) => {
  return [path, sourceType || "default", type, id].join(":");
};

const isContentFolded = ref(
  getEditorIsFolded(
    SCRIPT_CONTENT_FOLD_STORAGE_KEY,
    getContentFoldPath(),
    false,
  ),
);

const toggleContentFold = () => {
  isContentFolded.value = !isContentFolded.value;
  setEditorFoldState(
    SCRIPT_CONTENT_FOLD_STORAGE_KEY,
    getContentFoldPath(),
    isContentFolded.value,
  );
};

const showKeyValue = ref(false);

const isEditKeyValue = ref(true);

const params = ref({
  url: "",
  arguments: {},
  noCache: false,
  insecure: false,
});

const paramsArguments = ref([]);
const scriptEditorLanguage = ref();

const getActionItem = () => form.process.find((item) => item.id === id);

const setScriptEditorLanguage = (language) => {
  scriptEditorLanguage.value = language;
  const item = getActionItem();
  if (!item?.args) return;

  if (language) {
    item.args.editorLanguage = language;
  } else {
    delete item.args.editorLanguage;
  }
};

const hasArguments = (args) => {
  return !!args && typeof args === "object" && Object.keys(args).length > 0;
};

const parseUrlParams = (urlStr) => {
  let $arguments = {} as any;
  let otherArguments = {} as any;
  let noCache = false;
  let insecure = false;
  let url = urlStr?.trim() || "";

  // 处理没有参数的情况
  if (!url) {
    return { url: "", arguments: {}, noCache: false, insecure: false };
  }
  // extract link arguments
  const rawArgs = url.split('#');
  try {
    if (rawArgs.length > 1) {
        try {
            // 支持 `#${encodeURIComponent(JSON.stringify({arg1: "1"}))}`
            $arguments = JSON.parse(decodeURIComponent(rawArgs[1]));
        } catch (e) {
            for (const pair of rawArgs[1].split('&')) {
                const key = pair.split('=')[0];
                const value = pair.split('=')[1];
                // 部分兼容之前的逻辑 const value = pair.split('=')[1] || true;
                $arguments[key] =
                    value == null || value === ''
                        ? true
                        : decodeURIComponent(value);
            }
        }
    }
  } catch (e) {
    console.error("Failed to parse URL parameters:", e);
    $arguments = {};
  }
  try {
    if (rawArgs.length > 2) {
      for (const pair of rawArgs[2].split('&')) {
          const key = pair.split('=')[0];
          const value = pair.split('=')[1];
          // 部分兼容之前的逻辑 const value = pair.split('=')[1] || true;
          otherArguments[key] =
              value == null || value === ''
                  ? true
                  : decodeURIComponent(value);
      }
      noCache = otherArguments?.noCache;
      insecure = otherArguments?.insecure;
    } else if ($arguments?.noCache != null || $arguments?.insecure != null) {
      noCache = $arguments?.noCache;
      insecure = $arguments?.insecure;
      delete $arguments?.noCache;
      delete $arguments?.insecure;
    }
  } catch (e) {
    console.error("Failed to parse additional URL parameters:", e);
  }

  return {
    url: url.split('#')[0],
    arguments: $arguments,
    noCache,
    insecure,
  };
};

const buildUrlWithParams = (baseUrl, args, noCache, insecure) => {
  if (!baseUrl) {
    if(noCache && insecure){
      return "##noCache&insecure"
    }else if(noCache){
      return "##noCache"
    }else if(insecure){
      return "##insecure"
    } else {
      return ""
    }
  }

  const validArgs = args && typeof args === "object" && Object.keys(args).length > 0;

  // 如果没有参数且不需要noCache，直接返回baseUrl
  if (!validArgs && !noCache && !insecure) return baseUrl;

  let paramStrings = [];

  if (validArgs) {
    // 为了一致性，对键名进行排序
    paramStrings = Object.entries(args)
      .filter(([key]) => key && typeof key === "string")
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
      .map(([key, value]) => {
        // 处理布尔值 true - 直接输出键名，无等号
        if (value === true) {
          return key;
        }

        // 处理其他值 - 转换为字符串并编码
        const strValue = value === null || value === undefined ? "" : value.toString();
        return `${key}=${encodeURIComponent(strValue)}`;
      });
  }

  // 构建最终URL
  let result = baseUrl;

  if (paramStrings.length > 0) {
    result += `#${paramStrings.join("&")}`;
  }

  // noCache 标记始终放在末尾
  if (noCache && insecure) {
    result += "#noCache&insecure";
  }else if (noCache) {
    result += "#noCache";
  }else if (insecure) {
    result += "#insecure";
  }

  return result;
};

const editorIsVisible = ref(false);
usePopupRoute(editorIsVisible);
const value = ref({
  mode: "",
  content: "",
  code: "",
});

// 添加参数方法
const addParameter = () => {
  const newParamsArguments = [...paramsArguments.value, { key: "", value: "" }];
  paramsArguments.value = newParamsArguments;
};

const toggleShowKeyValue = () => {
  showKeyValue.value = !showKeyValue.value;
};

const toggleNoCache = () => {
  params.value.noCache = !params.value.noCache;
};

const toggleInsecure = () => {
  params.value.insecure = !params.value.insecure;
};

// 显示noCache提示
const showNoCacheTips = () => ({
  title: t(`editorPage.subConfig.nodeActions['${type}'].helpTitle`),
  content: t(`editorPage.subConfig.nodeActions['${type}'].noCacheTips`),
});
const showInsecureTips = () => ({
  title: t(`editorPage.subConfig.nodeActions['${type}'].helpTitle`),
  content: t(`editorPage.subConfig.nodeActions['${type}'].insecureTips`),
});

// 显示参数编辑提示
const showParamsEditTips = () => ({
  title: t(`editorPage.subConfig.nodeActions['${type}'].helpTitle`),
  content: t(`editorPage.subConfig.nodeActions['${type}'].paramsEditTips`),
});

const handleLinkValueChange = () => {
  if (value.value.mode === "link") {
    if (!isScriptSourceValid(value.value.content)) return;
    try {
      // 解析参数
      const parsedParams = parseUrlParams(value.value.content);

      // 更新URL和noCache状态
      params.value.url = parsedParams.url;
      params.value.noCache = parsedParams.noCache;
      params.value.insecure = parsedParams.insecure;

      // 更新arguments对象
      params.value.arguments = parsedParams.arguments || {};

      // 将已解析的参数映射到paramsArguments
      paramsArguments.value = Object.entries(params.value.arguments).map(
        ([key, value]) => ({ key, value: value === true ? "" : value }),
      );

      // 确保UI显示正确的值
      isEditKeyValue.value = true;

    } catch (error) {
      console.error("Failed to parse link content:", error);
    }
  }
};
let placeholders
const isMihomoConfigFile =
  sourceType === "file" && isMihomoConfigFileType((form as any)?.type);
const mihomoConfigPlaceholder = `// mihomo config override
// $content already contains the base mihomo config generated from the selected source.
// YAML and JavaScript override formats are supported.
// YAML override docs: https://clashparty.org/docs/guide/override/yaml
// JavaScript override docs: https://clashparty.org/docs/guide/override/javascript
`;
if (type === 'Response Transformer') {
  placeholders = `// Modify Response
// 1. shortcut script
$res.status = 200
$res.header['X-Custom'] = 'new'
$res.header['X-Powered-By'] = undefined // removeHeader
$res.body = $res.body

// 2. transform function
async function transformFunction(res, context) {
  // res.status: HTTP status code
  // res.header / res.headers: response headers
  // res.body: response body
  // context is shared by response transformers in this run.
  // Use context.process to control later response transformers by customName.
  // This control does not cross with Script Operator/File Script context.process.
  // context.process = { type: 'disable', customNames: ['branch-b'] }
  // type: 'disable' skips listed customName; type: 'enable' only runs listed customName.
  return res
}`
} else if(sourceType === "file") {
  placeholders = `${isMihomoConfigFile ? `${mihomoConfigPlaceholder}\n` : ""}// Example:
// $files: ['0', '1']
// $content: '0\\n1'

// produce proxies
// backend version(>2.14.156):
let singboxProxies = await produceArtifact({
    type: 'subscription', // type: 'subscription' 或 'collection'
    name: 'sub', // subscription name
    platform: 'sing-box', // target platform
    produceType: 'internal' // 'internal' produces an Array, otherwise produces a String( JSON.parse('JSON String') )
})

let clashMetaProxies = await produceArtifact({
    type: 'subscription',
    name: 'sub',
    platform: 'ClashMeta',
    produceType: 'internal' // 'internal' produces an Array, otherwise produces a String( ProxyUtils.yaml.safeLoad('YAML String').proxies )
})

// Base64 encode
// $content = ProxyUtils.Base64.encode($content ?? $files[0])

// YAML parse/stringify
// ProxyUtils.yaml.load('YAML String')
// ProxyUtils.yaml.safeLoad('YAML String')
// $content = ProxyUtils.yaml.safeDump({})
// $content = ProxyUtils.yaml.dump({})

// Example: insert proxies into YAML
// const yaml = ProxyUtils.yaml.safeLoad($content ?? $files[0])
// let clashMetaProxies = await produceArtifact({
//     type: 'collection',
//     name: '机场',
//     platform: 'ClashMeta',
//     produceType: 'internal'
// })
// yaml.proxies.unshift(...clashMetaProxies)
// $content = ProxyUtils.yaml.dump(yaml)

// https://clashparty.org/docs/guide/urlscheme#profile-update-interval
// if ($options){
//   $options._res = {
//     headers: {
//       'profile-update-interval': 24
//     }
//   }
// } 


// JSON
$content = JSON.stringify({}, null, 2)

// { $content, $files, $options } will be passed to the next operator
// $content is the final content of the file
// context is shared by later operators in this run.
// Use context.process to control later actions by customName.
// This control does not cross with Response Transformer context.process.
// context.process = { type: 'disable', customNames: ['branch-b'] }
// type: 'disable' skips listed customName; type: 'enable' only runs listed customName.
`
} else if (type === 'Script Operator') {
  placeholders = `// Example:
// Script Operator
// 1. shortcut script
$server.name = 'prefix-' + $server.name
$server.ecn = true
$server['test-url'] = 'http://1.0.0.1/generate_204'
// 2. operator function
async function operator(proxies, targetPlatform, context) {
  // context is shared by later operators in this run.
  // Use context.process to control later actions by customName.
  // This control does not cross with Response Transformer context.process.
  // context.process = { type: 'disable', customNames: ['branch-b'] }
  // type: 'disable' skips listed customName; type: 'enable' only runs listed customName.
  // if ($options) {
  //   const { headers, url, path } = $options?._req || {}
  //   const ua = headers?.['user-agent'] || headers?.['User-Agent']
  //   console.log(ua)
  //   $options._res = {
  //     headers: {
  //       'X-Custom': 'new',
  //       'X-Powered-By': undefined, // removeHeader
  //     }
  //   }
  // }
  return proxies.map(proxy => {
    // Change proxy information here

    return proxy;
  });
}`
} else {
  placeholders = `// Script Filter
// 1. shortcut script
const port = Number($server.port)
return [80].includes(port)

// 2. filter function
async function filter(proxies, targetPlatform) {
  return proxies.map( proxy => {
    // Return true if the current proxy is selected

    return true;
  });
}`
}
onMounted(() => {
  const item = getActionItem();
  if (item) {
    item.args = item.args || {};
    scriptEditorLanguage.value = item.args.editorLanguage;
    value.value.mode = item.args.mode;
    if (item.args.mode === "script") {
      value.value.code = item.args.content;
      cmStore.setEditCode(
        id,
        item.args.content ? item.args.content : placeholders,
      );
      if (hasArguments(item.args.arguments)) {
        params.value.arguments = item.args.arguments;
        paramsArguments.value = Object.entries(params.value.arguments).map(
          ([key, value]) => ({ key, value }),
        );
        showKeyValue.value = true;
      }
    } else {
      value.value.content = item.args.content;
      if (!isScriptSourceValid(value.value.content)) return;
      const parsedParams = parseUrlParams(value.value.content);
      params.value.url = parsedParams.url;
      params.value.arguments = parsedParams.arguments;
      params.value.noCache = parsedParams.noCache;
      params.value.insecure = parsedParams.insecure;
      paramsArguments.value = Object.entries(params.value.arguments).map(
        ([key, value]) => ({ key, value }),
      );
    }
  }
});

watch(
  paramsArguments,
  (newVal) => {
    params.value.arguments = newVal.reduce((acc, cur) => {
      if (cur.key) {
        acc[cur.key] = cur.value;
      }
      return acc;
    }, {});
    if (value.value.mode === "link" && isScriptSourceValid(value.value.content)) {
      value.value.content = buildUrlWithParams(
        params.value.url,
        params.value.arguments,
        params.value.noCache,
        params.value.insecure,
      );
    }
    const item = form.process.find((item) => item.id === id);
    item.args.arguments = params.value.arguments;
  },
  { deep: true },
);

watch(value, () => {
  const item = getActionItem();
  item.args.mode = value.value.mode;

  if (item.args.mode === "script") {
    item.args.content = value.value.code;
    !cmStore.CodeClear[id] &&
      cmStore.setEditCode(
        id,
        item.args.content ? item.args.content : placeholders,
      );
    placeholders = " ";

    item.args.arguments = params.value.arguments;
  } else {
    delete item.args.editorLanguage;
    scriptEditorLanguage.value = undefined;
    item.args.content = value.value.content;
    if (!isScriptSourceValid(value.value.content)) return;

    const parsedParams = parseUrlParams(value.value.content);
    params.value.url = parsedParams.url;
    params.value.arguments = parsedParams.arguments;
    params.value.noCache = parsedParams.noCache;
    params.value.insecure = parsedParams.insecure;

    if (!isEditKeyValue.value) {
      paramsArguments.value = Object.entries(params.value.arguments).map(
        ([key, value]) => ({ key, value }),
      );
      isEditKeyValue.value = true;
    }
  }
}, { deep: true });

watch(
  () => params.value.noCache,
  (newValue) => {
    if (value.value.mode === "link" && isScriptSourceValid(value.value.content)) {
      value.value.content = buildUrlWithParams(
        params.value.url,
        params.value.arguments,
        newValue,
        params.value.insecure,
      );
    }
  },
);
watch(
  () => params.value.insecure,
  (newValue) => {
    if (value.value.mode === "link" && isScriptSourceValid(value.value.content)) {
      value.value.content = buildUrlWithParams(
        params.value.url,
        params.value.arguments,
        params.value.noCache,
        newValue,
      );
    }
  },
);

watch(
  () => params.value.url,
  (newValue) => {
    if (value.value.mode === "link" && isScriptSourceValid(value.value.content)) {
      value.value.content = buildUrlWithParams(
        newValue,
        params.value.arguments,
        params.value.noCache,
        params.value.insecure,
      );
    }
  },
);

watch(
  () => route.path,
  (path) => {
    isContentFolded.value = getEditorIsFolded(
      SCRIPT_CONTENT_FOLD_STORAGE_KEY,
      getContentFoldPath(path),
      false,
    );
  },
);

watch(
  () => cmStore.EditCode[id],
  (newCode) => {
    value.value.code = newCode;
  },
);
defineExpose({ isBusy: isContentUpdating, getDraftState: () => ({ paramsArguments: paramsArguments.value, content: value.value, code: cmStore.EditCode[id] }) });
</script>

<style lang="scss" scoped>
.type-row {
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.content-fold-toggle {
  border: 0;
  padding: 0;
  background: transparent;
  color: var(--ui-text-muted);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 18px;
  gap: 6px;
  font-size: 12px;
  cursor: pointer;
  flex-shrink: 0;

  &:focus {
    outline: none;
  }

  svg {
    color: var(--ui-text-muted);
  }
}
.doc-link {
  color: var(--ui-primary);
  font-size: 12px;
}

.input-wrapper {
  display: flex;
  align-items: center;
}
.local-content-section {
  margin-left: -16px;
  margin-right: -16px;
  max-height: 80vh;
  overflow: auto;
}
.input-wrapper-title {
  display: flex;
  align-items: center;
  margin-top: 16px;
  margin-bottom: 8px;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 8px 24px;
  justify-content: flex-start;
  line-height: 1.5;

  .title-label {
    display: flex;
    align-items: center;
    font-size: 14px;
    color: var(--ui-text-toned);
    flex-shrink: 0;

    .my-switch {
      width: 18px;
      margin-right: 0;
    }

    .switch-label {
      background: none;
      border: none;
      color: inherit;
      cursor: pointer;
      font: inherit;
      padding: 0 0 0 4px;
      user-select: none;
    }

    .params-toggle {
      background: none;
      border: none;
      color: inherit;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font: inherit;
      padding: 0;
      user-select: none;

      &:focus {
        outline: none;
      }

      &:focus-visible {
        outline: 2px solid var(--ui-primary);
        outline-offset: 2px;
        border-radius: 4px;
      }

      .params-toggle-icon {
        color: var(--ui-text-muted);
        flex-shrink: 0;
      }
    }

    .icon {
      margin-left: 4px;
      color: var(--ui-text-muted);
    }
  }

  .button {
    margin-left: auto;

    > div {
      cursor: pointer;
      color: var(--ui-primary);
      font-size: 12px;
    }
  }
}

.open-editor-btn {
  border: 1px solid var(--ui-primary);
  background: transparent;
  margin: 20px 0 12px 0;
  padding: 8px 0;
  text-align: center;
  width: 100%;
  border-radius: var(--ui-radius);
  color: var(--ui-primary);
  font-weight: bold;

  svg {
    margin-right: 8px;
  }
}

.editor-page-header {
  padding: var(--safe-area-side);
  top: 0;
  display: flex;
  align-items: center;
  height: 56px;

  button {
    background: none;
    border: none;
    font-size: 20px;
    padding: 8px;
    color: var(--ui-error);
    cursor: pointer;

    &.toggle-plaintext-mode {
      margin-left: auto;
    }
  }
}
</style>
