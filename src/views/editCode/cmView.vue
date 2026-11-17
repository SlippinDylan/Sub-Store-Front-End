<template>
  <div
    class="cmviewRef"
    :class="[
      { 'is-fullscreen': isFullscreen },
      toolbarVariant !== 'default' ? `cmviewRef--${toolbarVariant}` : '',
    ]"
  >
    <div
      class="cm-img-button"
      :class="[
        toolbarVariant !== 'default' ? `cm-img-button--${toolbarVariant}` : '',
      ]"
    >
      <div v-if="openPanel" class="cm-toolbar-actions">
        <div class="cm-toolbar-left">
          <UButton
            :size="isDesktop ? 'sm' : 'md'"
            v-if="isToolbarActionEnabled('fullscreen') && enableFullscreen"
            type="button"
            :title="fullscreenTitle"
            :aria-label="fullscreenTitle"
            @click="toggleFullscreen"
           color="neutral" variant="outline">
            <UIcon mode="svg" class="size-4 shrink-0 align-middle"
              :name="
                isFullscreen
                  ? 'i-lucide-minimize'
                  : 'i-lucide-maximize'
              "
            />
          </UButton>
          <UButton
            :size="isDesktop ? 'sm' : 'md'"
            v-if="canImportFile"
            type="button"
            :title="importFileTitle"
            :aria-label="importFileTitle"
            @click="openFilePicker"
           color="neutral" variant="outline">
            <UIcon mode="svg" class="size-4 shrink-0 align-middle" name="i-lucide-cloud-upload" />
          </UButton>
          <input
            v-if="canImportFile"
            ref="fileInput"
            class="cm-file-input"
            type="file"
            @change="importFile"
          />
        </div>
        <div class="cm-toolbar-right">
          <UButton
            :size="isDesktop ? 'sm' : 'md'"
            v-if="
              isToolbarActionEnabled('language-detect') &&
              isLanguageDetectionActionVisible
            "
            class="language-detect-button"
            :class="`is-${languageDetectionStatus}`"
            type="button"
            :title="languageDetectionTitle"
            :aria-label="languageDetectionTitle"
            @click="onLanguageDetectionAction"
           color="neutral" variant="outline">
            <UIcon v-if="languageDetectionStatus === 'detecting'" mode="svg" name="i-lucide-loader-circle" class="size-4 animate-spin" />
            <UIcon v-else-if="languageDetectionStatus === 'error'" mode="svg" name="i-lucide-refresh-cw" class="size-4" />
            <UIcon v-else mode="svg" name="i-lucide-scan-text" class="size-4" />
          </UButton>
          <span
            v-if="isToolbarActionEnabled('language')"
            class="cm-language-field"
          >
            <USelect v-model="selectedLanguage" :items="languageOptions" :title="activeLanguageTitle" aria-label="Editor language" :ui="{ content: 'z-[4000]' }" @update:model-value="onLanguageChange" />
          </span>
          <UButton :size="isDesktop ? 'sm' : 'md'" v-if="isToolbarActionEnabled('undo')" @click="undoCode" color="neutral" variant="outline" icon="i-lucide-undo-2" aria-label="撤销" />
          <UButton :size="isDesktop ? 'sm' : 'md'" v-if="isToolbarActionEnabled('redo')" @click="redoCode" color="neutral" variant="outline" icon="i-lucide-redo-2" aria-label="重做" />
          <UButton
            :size="isDesktop ? 'sm' : 'md'"
            v-if="isToolbarActionEnabled('format') && canFormatActiveLanguage"
            :disabled="isFormatting"
            @click="formatCode"
           color="neutral" variant="outline" icon="i-lucide-braces" aria-label="格式化" />
          <UButton :size="isDesktop ? 'sm' : 'md'" v-if="isToolbarActionEnabled('search')" @click="searchs" color="neutral" variant="outline" icon="i-lucide-search" aria-label="查询" />
          <UButton :size="isDesktop ? 'sm' : 'md'" v-if="isToolbarActionEnabled('copy')" @click="copyText" color="neutral" variant="outline" icon="i-lucide-copy" aria-label="复制" />
          <UButton :size="isDesktop ? 'sm' : 'md'" v-if="isToolbarActionEnabled('paste')" @click="pasteNav" color="neutral" variant="outline" icon="i-lucide-clipboard-paste" aria-label="粘贴" />
          <UButton :size="isDesktop ? 'sm' : 'md'" v-if="isToolbarActionEnabled('delete')" @click="delAllCode" color="neutral" variant="outline" icon="i-lucide-trash-2" aria-label="清空内容" />
        </div>
      </div>
      <span
        v-else-if="canToggleToolbarPanel"
        style="
          opacity: 0.9;
          font-size: 12px;
          padding-left: 10px;
          line-height: 14px;
          height: 22px;
          color: var(--ui-text-toned);
        "
      >
        {{ Length }} &nbsp;
      </span>
      <UButton :size="isDesktop ? 'sm' : 'md'" v-if="canToggleToolbarPanel" @click="setPanel" color="neutral" variant="outline" icon="i-lucide-ellipsis" aria-label="展开或收起工具栏" />
    </div>

    <div ref="viewRef" class="cm-editor-host" style="width: 100%; font-size: 12px" />
    <div style="height: 10px" />
  </div>
</template>

<script setup>
import { useMediaQuery } from "@vueuse/core";

import { lightCode } from "./light.js";
import { javascript } from "@/views/editCode/lang-js";
import { json } from "@codemirror/lang-json";
import {
  canFormatEditorLanguage,
  detectEditorLanguage,
  EDITOR_LANGUAGE_OPTIONS,
  formatEditorCode,
  loadEditorLanguageExtension,
  normalizeEditorLanguage,
} from "@/views/editCode/editorLanguages";
import { shikiHighlight } from "@/views/editCode/shikiHighlight";
import {
  computed,
  nextTick,
  ref,
  onBeforeUnmount,
  onMounted,
  watch,
} from "vue";

import {
  highlightSelectionMatches,
  searchKeymap,
  openSearchPanel,
  gotoLine,
  closeSearchPanel,
} from "@/views/editCode/search";
import {
  lineNumbers,
  EditorView,
  highlightActiveLine,
  keymap,
  placeholder as cmPlaceholder,
} from "@codemirror/view";
import { foldGutter, bracketMatching } from "@codemirror/language";
import {
  undo,
  redo,
  history,
  defaultKeymap,
  historyKeymap,
  indentWithTab,
} from "@codemirror/commands";
import { closeBrackets, autocompletion } from "@codemirror/autocomplete";
import { Compartment, EditorState } from "@codemirror/state";
import { hyperLink } from "@/views/editCode/link";
import { indentationMarkers } from "@replit/codemirror-indentation-markers";
import { copyText as writeClipboardText } from "@/utils/clipboard";

import { useCodeStore } from "@/store/codeStore";

import { useAppNotifyStore } from "@/store/appNotify";
import { useI18n } from "vue-i18n";
const isDesktop = useMediaQuery("(min-width: 768px)");
const { showNotify } = useAppNotifyStore();
const { t } = useI18n();


// 检测语言
const SYNC_DEBOUNCE_MS = 1000;
let syncTimer = null;
const debouncedSyncLanguage = (docContent) => {
  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    syncLanguageForDocument(docContent);
  }, SYNC_DEBOUNCE_MS);
};
const isDarkModeEnabled = false;

const Length = ref("");
const DEFAULT_TOOLBAR_ACTIONS = [
  "fullscreen",
  "import",
  "language-detect",
  "language",
  "undo",
  "redo",
  "format",
  "search",
  "copy",
  "delete",
  "paste",
  "panel",
];
const props = defineProps({
  isReadOnly: {
    type: Boolean,
    default: false,
  },
  id: {
    type: String,
    required: true,
  },
  editorLanguage: {
    default: undefined,
  },
  placeholder: {
    type: String,
    default: "",
  },
  enableFullscreen: {
    type: Boolean,
    default: true,
  },
  enableImport: {
    type: Boolean,
    default: true,
  },
  toolbarActions: {
    type: Array,
    default: () => [
      "fullscreen",
      "import",
      "language-detect",
      "language",
      "undo",
      "redo",
      "format",
      "search",
      "copy",
      "delete",
      "paste",
      "panel",
    ],
  },
  toolbarVariant: {
    type: String,
    default: "default",
  },
});
const emit = defineEmits(["update:editorLanguage", "update:busy"]);
const pendingContentUpdates = ref(0);
let disposed = false;
const updateContentBusy = (change) => {
  pendingContentUpdates.value += change;
  emit("update:busy", pendingContentUpdates.value > 0);
};
console.log("cm-id: ", props.id);
const cmStore = useCodeStore();
const viewRef = ref(null);
const editorTheme = new Compartment();
const langs = new Compartment();
const shikiSyntax = new Compartment();
const editorPlaceholder = new Compartment();
const selectedLanguage = ref(normalizeEditorLanguage(props.editorLanguage, "auto"));
const activeLanguage = ref("plaintext");
const autoDetectedLanguage = ref(null);
const isFormatting = ref(false);
const languageDetectionStatus = ref("idle");
const isFullscreen = ref(false);
const LANGUAGE_DETECTION_BUSY_DELAY = 300;
let docUpdate = false;
let view;
let languageRequestId = 0;
let languageDetectionTimer;
const fileInput = ref(null);

const getLanguageLabel = (language) => {
  const normalizedLanguage = normalizeEditorLanguage(language, "plaintext");
  return t(`editorLanguage.${normalizedLanguage}`);
};

const activeLanguageTitle = computed(() => getLanguageLabel(activeLanguage.value));
const canFormatActiveLanguage = computed(() =>
  canFormatEditorLanguage(activeLanguage.value)
);
const normalizedToolbarActions = computed(
  () =>
    new Set(
      Array.isArray(props.toolbarActions)
        ? props.toolbarActions
        : DEFAULT_TOOLBAR_ACTIONS
    )
);
const isToolbarActionEnabled = (action) =>
  normalizedToolbarActions.value.has(action);
const canToggleToolbarPanel = computed(() => isToolbarActionEnabled("panel"));
const canImportFile = computed(
  () =>
    isToolbarActionEnabled("import") && props.enableImport && !props.isReadOnly
);
const fullscreenTitle = computed(() =>
  isFullscreen.value
    ? t("editorPage.subConfig.basic.url.tips.fullScreenEditCancel")
    : t("editorPage.subConfig.basic.url.tips.fullScreenEdit")
);
const importFileTitle = computed(() =>
  t("editorPage.subConfig.basic.url.tips.importFromFile")
);
const isAutoLanguageSelected = computed(
  () => normalizeEditorLanguage(selectedLanguage.value, "auto") === "auto"
);
const isLanguageDetectionActionVisible = computed(
  () =>
    isAutoLanguageSelected.value &&
    ["detecting", "error"].includes(languageDetectionStatus.value)
);
const languageDetectionTitle = computed(() => {
  if (languageDetectionStatus.value === "detecting") {
    return t("editorLanguage.detect.cancel");
  }
  if (languageDetectionStatus.value === "error") {
    return t("editorLanguage.detect.retry");
  }
  return t("editorLanguage.detect.auto");
});

const languageOptions = computed(() =>
  EDITOR_LANGUAGE_OPTIONS.map((option) =>
    option.value === "auto"
      ? {
          ...option,
          label: autoDetectedLanguage.value
            ? `${getLanguageLabel(autoDetectedLanguage.value)} · ${getLanguageLabel("auto")}`
            : getLanguageLabel(option.value),
        }
      : {
          ...option,
          label: getLanguageLabel(option.value),
        }
  )
);


const createShikiHighlight = (language = activeLanguage.value) =>
  shikiHighlight({
    language,
    dark: isDarkModeEnabled,
  });

const createEditorPlaceholder = () =>
  props.placeholder ? cmPlaceholder(props.placeholder) : [];

const clearLanguageDetectionTimer = () => {
  if (languageDetectionTimer !== undefined) {
    clearTimeout(languageDetectionTimer);
    languageDetectionTimer = undefined;
  }
};

const scheduleLanguageDetectionBusy = (requestId) => {
  clearLanguageDetectionTimer();
  languageDetectionTimer = setTimeout(() => {
    languageDetectionTimer = undefined;
    if (
      requestId === languageRequestId &&
      normalizeEditorLanguage(selectedLanguage.value, "auto") === "auto"
    ) {
      languageDetectionStatus.value = "detecting";
    }
  }, LANGUAGE_DETECTION_BUSY_DELAY);
};

const finishLanguageDetection = (requestId, status = "idle") => {
  if (requestId !== languageRequestId) return;

  clearLanguageDetectionTimer();
  languageDetectionStatus.value = status;
};

// const applyLanguage = async (language, requestId = ++languageRequestId) => {
//   const nextLanguage = normalizeEditorLanguage(language, "plaintext");
//   const resolvedLanguage =
//     nextLanguage === "auto" ? "plaintext" : nextLanguage;

//   if (view && activeLanguage.value === resolvedLanguage) return;
//   const extension = await loadEditorLanguageExtension(resolvedLanguage);

//   if (!view || requestId !== languageRequestId) return;
//   activeLanguage.value = resolvedLanguage;
//   view.dispatch({
//     effects: [
//       langs.reconfigure(extension),
//       shikiSyntax.reconfigure(createShikiHighlight(resolvedLanguage)),
//     ],
//   });
// };

const applyLanguage = async (language, requestId = ++languageRequestId) => {
  const nextLanguage = normalizeEditorLanguage(language, "plaintext");
  if (!view || requestId !== languageRequestId) return;
  if (nextLanguage === activeLanguage.value) return;

  activeLanguage.value = nextLanguage;

  view.dispatch({
    effects: [langs.reconfigure([]), shikiSyntax.reconfigure([])],
  });

  if (nextLanguage === "plaintext") {
    return;
  }

  if (nextLanguage === "javascript") {
    console.log("启用 JavaScript 语法高亮 2  - 使用 codemirror");
    view.dispatch({
      effects: langs.reconfigure(javascript()),
    });
    return;
  }

  if (nextLanguage === "json" || nextLanguage === "json5") {
    console.log(`启用 ${nextLanguage} 语法高亮 3 - 使用 codemirror`);
    view.dispatch({
      effects: langs.reconfigure(json()),
    });
    return;
  }

  const extension = await loadEditorLanguageExtension(nextLanguage);
  if (requestId !== languageRequestId) return;
  console.log(`启用 ${getLanguageLabel(nextLanguage)} 语法高亮 4 - 使用 shiki`);
  view.dispatch({
    effects: [langs.reconfigure(extension), shikiSyntax.reconfigure(createShikiHighlight(nextLanguage))],
  });
};

const syncLanguageForDocument = async (docContent) => {
  const requestId = ++languageRequestId;
  const docSnapshot = docContent || "";
  const manualLanguage = normalizeEditorLanguage(selectedLanguage.value, "auto");

  if (manualLanguage === "auto") {
    languageDetectionStatus.value = "idle";
    scheduleLanguageDetectionBusy(requestId);
    try {
      const detectedLanguage = await detectEditorLanguage(docSnapshot);
      if (
        requestId !== languageRequestId ||
        normalizeEditorLanguage(selectedLanguage.value, "auto") !== "auto" ||
        (view && view.state.doc.toString() !== docSnapshot)
      ) {
        return;
      }

      autoDetectedLanguage.value = detectedLanguage;
      await applyLanguage(detectedLanguage, requestId);
      finishLanguageDetection(requestId);
    } catch (error) {
      console.error("Editor language detection failed", error);
      finishLanguageDetection(requestId, "error");
    }
    return;
  }

  clearLanguageDetectionTimer();
  languageDetectionStatus.value = "idle";
  if (
    requestId !== languageRequestId ||
    normalizeEditorLanguage(selectedLanguage.value, "auto") !== manualLanguage
  ) {
    return;
  }

  await applyLanguage(manualLanguage, requestId);
};

const onLanguageChange = () => {
  selectedLanguage.value = normalizeEditorLanguage(
    selectedLanguage.value,
    "auto"
  );
  emit(
    "update:editorLanguage",
    selectedLanguage.value === "auto" ? undefined : selectedLanguage.value
  );
  syncLanguageForDocument(view?.state.doc.toString() || "");
};

const onLanguageDetectionAction = () => {
  if (languageDetectionStatus.value === "detecting") {
    languageRequestId += 1;
    clearLanguageDetectionTimer();
    languageDetectionStatus.value = "idle";
    return;
  }

  syncLanguageForDocument(view?.state.doc.toString() || "");
};

const CreateView = () => {
  view = new EditorView({
    state: EditorState.create({
      extensions: [
        history(), //历史
        keymap.of([
          indentWithTab,
          ...searchKeymap,
          ...defaultKeymap, // 注释 缩进 等等
          ...historyKeymap,
        ]),
        langs.of([]),
        shikiSyntax.of(createShikiHighlight()),
        editorPlaceholder.of(createEditorPlaceholder()),
        editorTheme.of(lightCode), // 设置初始主题
        EditorState.readOnly.of(props.isReadOnly ? true : false),
        EditorView.lineWrapping, // 换行
        lineNumbers(),
        highlightActiveLine(),
        bracketMatching(),
        highlightSelectionMatches(),
        indentationMarkers(),
        closeBrackets(), // 括号闭合
        autocompletion(), // 代码补全
        EditorView.updateListener.of((update) => {
          if (!update.docChanged) return;
          const docContent = update.state.doc.toString();
          docUpdate = true;
          console.log("更新文档 - CodeValue");
          cmStore.setEditCode([props.id], docContent);
          Length.value = formatLength(docContent.length);
          docUpdate = false;
          if (selectedLanguage.value === "auto") {
            // syncLanguageForDocument(docContent);
            debouncedSyncLanguage(docContent);
          }
        }),
        hyperLink,
        foldGutter({
          closedText: "▸",
          openText: "▾",
        }),
      ],
      doc: cmStore.EditCode[props.id],
    }),
    parent: viewRef.value,
  });

  watch(
    () => cmStore.EditCode[props.id],
    (newValue) => {
      const nextValue = newValue || "";

      if (!docUpdate && nextValue !== view.state.doc.toString()) {
        console.log("Code更新到文档");
        view.dispatch({
          changes: {
            from: 0,
            to: view.state.doc.length,
            insert: nextValue,
          },
        });
        syncLanguageForDocument(nextValue);
      }
    }
  );


};

watch(
  () => props.editorLanguage,
  (language) => {
    const nextLanguage = normalizeEditorLanguage(language, "auto");
    if (selectedLanguage.value === nextLanguage) return;

    selectedLanguage.value = nextLanguage;
    syncLanguageForDocument(view?.state.doc.toString() || "");
  }
);

watch(
  () => props.placeholder,
  () => {
    if (!view) return;

    view.dispatch({
      effects: editorPlaceholder.reconfigure(createEditorPlaceholder()),
    });
  }
);
function formatLength(length) {
  if (length < 1024) {
    return length === 0 ? "" : length + " bytes";
  } else if (length < 1024 * 1024) {
    return (length / 1024).toFixed(2) + " KB";
  } else {
    return (length / (1024 * 1024)).toFixed(2) + " MB";
  }
}
onMounted(() => {
  CreateView();
  const initialCode = cmStore.EditCode[props.id] || "";
  Length.value = formatLength(initialCode.length);
  syncLanguageForDocument(initialCode);
});

onBeforeUnmount(() => {
  disposed = true;
  clearLanguageDetectionTimer();
  clearTimeout(syncTimer);
});

const openPanel = ref(
  canToggleToolbarPanel.value ? localStorage.getItem("openCodePanel") != 1 : true
);
const setPanel = () => {
  if (!canToggleToolbarPanel.value) return;

  if (openPanel.value) {
    openPanel.value = false;
    localStorage.setItem("openCodePanel", 1);
  } else {
    openPanel.value = true;
    localStorage.setItem("openCodePanel", 0);
  }
};

let sopen = true;
const searchs = () => {
  if (sopen) {
    openSearchPanel(view);
    sopen = false;
  } else {
    closeSearchPanel(view);
    sopen = true;
  }
};

// const openLine = () => {
//   gotoLine(view);
// };

const undoCode = () => undo(view);
const redoCode = () => redo(view);

const refreshEditorLayout = () => {
  nextTick(() => {
    view?.requestMeasure?.();
  });
};

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value;
  refreshEditorLayout();
};

const openFilePicker = () => {
  fileInput.value?.click?.();
};

const importFile = async (event) => {
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) return;

  updateContentBusy(1);
  try {
    const content = await file.text();
    if (disposed) return;
    cmStore.setEditCode([props.id], content);
  } catch (e) {
    showNotify({
      type: "danger",
      title: "文件导入失败",
    });
    console.error(e);
  } finally {
    updateContentBusy(-1);
  }
};

async function formatCode() {
  if (!canFormatEditorLanguage(activeLanguage.value)) return;

  isFormatting.value = true;
  updateContentBusy(1);
  try {
    const result = await formatEditorCode(
      activeLanguage.value,
      cmStore.EditCode[props.id] || ""
    );
    if (disposed) return;
    if (result.ok) {
      cmStore.setEditCode([props.id], result.code);
      return;
    }

    console.error(result.error);
    showNotify({
      type: "warning",
      title:
        result.reason === "unsupported"
          ? "当前语言暂不支持格式化"
          : "格式化失败, 内容未修改",
    });
  } finally {
    isFormatting.value = false;
    updateContentBusy(-1);
  }
}

const copyText = async () => {
  const text = cmStore.EditCode[props.id] ?? "";
  try {
    await writeClipboardText(text);
    showNotify({
      type: "success",
      title: "已复制字符串数: " + text.length,
    });
  } catch (error) {
    showNotify({
      type: "danger",
      title: t("globalNotify.copyFailed", { e: error?.message ?? String(error) }),
    });
  }
};

const delAllCode = () => {
  cmStore.setEditCode([props.id], "");
  cmStore.CodeClear([props.id], true);
  showNotify({
    type: "success",
    title: "已清空",
  });
};

const pasteNav = async () => {
  updateContentBusy(1);
  try {
    const clipboardText = await navigator.clipboard.readText();
    if (disposed) return;
    if (clipboardText?.length > 0) {
      cmStore.setEditCode([props.id], clipboardText);
      showNotify({
        type: "success",
        title: "已粘贴字数: " + clipboardText.length,
      });
    }
  } catch (e) {
    showNotify({
      type: "warning",
      title: "获取剪贴板失败: 本地/HTTPS 环境下可用(或手动配置权限)"
    });
  } finally {
    updateContentBusy(-1);
  }
};
</script>

<style lang="scss">
.cm-panels.cm-panels-bottom {
  padding: 10px;
  border-top: none !important;
  border-radius: 15px;
  margin-left: 3%;
  margin-right: 3%;
  margin-top: 30px;
  bottom: 24px !important;
  line-height: 16px;
}

.cmviewRef {
  border-radius: 16px;
}

.cmviewRef.is-fullscreen {
  position: fixed;
  inset: 0;
  z-index: 3000;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  padding: max(env(safe-area-inset-top), 8px) 12px
    max(env(safe-area-inset-bottom), 8px);
  border-radius: 0;
  background: var(--ui-bg);
  overflow: hidden;
}

.cmviewRef.is-fullscreen .cm-editor-host {
  flex: 1 1 auto;
  min-height: 0;
}

.cmviewRef.is-fullscreen .cm-editor {
  height: 100%;
}

.cm-placeholder {
  color: var(--ui-text-muted);
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  vertical-align: top;
  white-space: nowrap;
}

.ͼ1 .cm-button {
  margin: .6em 0.2em .6em .6em !important;
  padding: .2em 1em;
  white-space: pre;
}

.cm-img-button {
  display: flex;
  align-items: center;
  position: sticky;
  top: 0;
  padding-top: 9px;
  padding-bottom: 2px;
  z-index: 10;
  min-height: 40px;
  width: 100%;
  flex-shrink: 0;
  justify-content: flex-end;
  background-color: var(--ui-bg);
  img {
    width: 16px;
    height: 16px;
  }
  button {
    cursor: pointer;
  }
}

.cm-img-button--preview {
  box-sizing: border-box;
  margin-top: 0;
  padding: 8px 12px 4px;
  height: 40px;
  background-color: var(--ui-bg-muted);
  border-bottom: 1px solid var(--ui-border);
}

.cm-toolbar-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: 1 1 auto;
  min-height: 28px;
  min-width: 0;
}

.cm-toolbar-left,
.cm-toolbar-right {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
  min-width: 0;
}

.cm-toolbar-left {
  flex: 0 0 auto;
}

.cm-toolbar-right {
  justify-content: flex-end;
  flex: 1 1 auto;
}

.cm-img-button--preview .cm-toolbar-actions,
.cm-img-button--preview .cm-toolbar-right {
  flex: 0 0 auto;
}

.cm-img-button--preview .cm-toolbar-actions {
  margin-left: auto;
}

.cm-img-button--subscription {
  justify-content: flex-start;
  flex-wrap: wrap;
  gap: 4px;
  padding: 8px;
  border-bottom: 1px solid var(--ui-border);
}
.cm-img-button--subscription .cm-toolbar-actions {
  flex: 0 1 auto;
  flex-wrap: wrap;
  justify-content: flex-start;
  gap: 4px;
}
.cm-img-button--subscription .cm-toolbar-right {
  flex: 0 1 auto;
  justify-content: flex-start;
}
.cmviewRef--subscription .cm-editor-host {
  min-height: 160px;
  padding-block: 8px;
}

.cm-file-input {
  display: none;
}

.cm-img-button svg {
  width: 16px;
  height: 16px;
  color: var(--ui-text-toned);
}

.cm-language-field { display: flex; align-items: center; min-width: 0; }

.cm-button {
  background-image: none !important;
  background-color: var(--ui-bg-muted) !important;
  border: none !important;
  border-radius: 10px !important;
}

.cm-textfield {
  vertical-align: middle;
  color: inherit;
  font-size: 70%;
  border: 1px solid var(--ui-border) !important;
  border-radius: 10px;
  background-color: transparent !important;
  width: 40%;
  padding: 0.2em 0.5em;
  border-color: none !important;
  outline: none;
}

.cm-panel.cm-search input[type="checkbox"] {
  position: absolute;
  width: 12px !important;
  height: 14px !important;
  margin-top: 5px !important;
  background-color: transparent !important;
  -webkit-appearance: none;
  appearance: none;
}

input[type="checkbox"]:checked {
  border: 6px solid var(--ui-primary) !important;
  border-radius: 2px;
}
.cm-button[name="replace"] {
  margin-left: 10px !important;
}
.cm-button[name="prev"] {
  margin-right: 13px !important;
}

.cm-panel.cm-search label {
  margin: 0.2em 0.5em 0.5em 1.2em !important;
}

.cm-panel.cm-search label {
  font-size: 90% !important;
}

.ͼ1.cm-focused {
  outline: none;
}

.ͼ1u .cm-panels.cm-panels-bottom {
  border-top: none;
}

.cm-panels.cm-panels-bottom {
  background: var(--ui-bg) !important;
  box-shadow: 0 0 6px var(--ui-border-accented);
}

.cm-button:active {
  background-color: var(--ui-bg-accented) !important;
}
</style>
