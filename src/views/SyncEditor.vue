<template>
  <div class="resource-editor-page" :inert="isSubmitting" :aria-busy="isSubmitting">
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
          <ResourceField
            :label="$t(`syncPage.addArtForm.name.label`)"
            prop="name"
            required
            :rules="[
              {
                required: true,
                message: $t(`syncPage.addArtForm.name.isRequired`),
              },
              {
                validator: nameValidator,
                message: $t(`syncPage.addArtForm.name.isValid`),
              },
              {
                validator: duplicateNameValidator,
                message: $t(`syncPage.addArtForm.name.isExist`),
              },
            ]"
          >
            <FieldInput
              :border="false"
              input-align="right"
              class="plain-input"
              :placeholder="$t(`syncPage.addArtForm.name.placeholder`)"
              :disabled="isEditMode"
              v-model.trim="form.name"
              @click="onClickNameInput"
              @blur="customerBlurValidate('name')"
              type="text"
            />
          </ResourceField>

          <ResourceField
            :label="$t(`syncPage.addArtForm.displayName.label`)"
            prop="displayName"
          >
            <FieldInput
              :border="false"
              input-align="right"
              class="plain-input"
              :placeholder="$t(`syncPage.addArtForm.displayName.placeholder`)"
              v-model.trim="form.displayName"
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
              :placeholder="$t(`editorPage.subConfig.basic.remark.placeholder`)"
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
            {{ $t("resourceEditor.syncOptions") }}
          </h2>
        </template>
        <div class="resource-editor-fields">
          <ResourceField
            :label="$t(`syncPage.addArtForm.source.label`)"
            required
            prop="source"
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
              @change="sourceChange"
            />
          </ResourceField>

          <ResourceField prop="age-public-key">
            <template #label>
              <div class="label-with-tip">
                <p>{{ $t("ageKey.publicKey.label") }}</p>
                <HelpTip :help="ageOutputTips()" />
              </div>
            </template>
            <div class="age-key-field">
              <FieldInput
                :border="false"
                input-align="right"
                class="plain-input"
                :placeholder="$t('ageKey.publicKey.placeholder')"
                v-model.trim="form['age-public-key']"
                type="text"
              />
              <AgeKeyHelper v-model="form['age-public-key']" />
            </div>
          </ResourceField>

          <ResourceField class="upload-wrapper">
            <template #label>
              <div class="label-with-tip">
                <p>{{ $t(`syncPage.addArtForm.upload.label`) }}</p>
                <HelpTip :help="uploadTips()" />
              </div>
            </template>
            <div class="switch-wrapper">
              <USwitch v-model="form.upload" />
            </div>
          </ResourceField>

          <ResourceField class="cron-wrapper" prop="cron">
            <template #label>
              <div class="label-with-tip">
                <p>{{ $t(`syncPage.addArtForm.cron.label`) }}</p>
                <HelpTip :help="cronTips()" />
              </div>
            </template>
            <FieldInput
              :border="false"
              input-align="right"
              class="plain-input"
              :placeholder="$t(`syncPage.addArtForm.cron.placeholder`)"
              v-model.trim="form.cron"
              :disabled="isCronInputDisabled"
              type="text"
            />
          </ResourceField>

          <template
            v-if="
              sourceInput && ['subscription', 'collection'].includes(form.type)
            "
          >
            <ResourceField class="include-unsupported-proxy-wrapper">
              <template #label>
                <div class="label-with-tip">
                  <p>
                    {{
                      $t(`syncPage.addArtForm.includeUnsupportedProxy.label`)
                    }}
                  </p>
                  <HelpTip :help="includeUnsupportedProxyTips()" />
                </div>
              </template>
              <div class="switch-wrapper">
                <USwitch v-model="form.includeUnsupportedProxy" />
              </div>
            </ResourceField>

            <ResourceField :label="$t(`syncPage.addArtForm.prettyYaml.label`)">
              <div class="switch-wrapper">
                <USwitch v-model="form.prettyYaml" />
              </div>
            </ResourceField>

            <ResourceField :label="$t(`syncPage.addArtForm.platform.label`)">
              <ChoiceGroup
                direction="horizontal"
                v-model="form.platform"
                class="artifact-radio-group"
              >
                <ChoiceOption label="Stash">Stash</ChoiceOption>
                <ChoiceOption label="Egern">Egern</ChoiceOption>
                <ChoiceOption label="ClashMeta">mihomo</ChoiceOption>
                <ChoiceOption label="Surfboard">Surfboard</ChoiceOption>
                <ChoiceOption label="Surge">Surge</ChoiceOption>
                <span class="inline-flex items-center gap-1">
                  <ChoiceOption label="SurgeMac">Surge Mac</ChoiceOption>
                  <HelpTip
                    :help="{
                      href: 'https://github.com/sub-store-org/Sub-Store/wiki/%E9%93%BE%E6%8E%A5%E5%8F%82%E6%95%B0%E8%AF%B4%E6%98%8E',
                    }"
                  />
                </span>
                <ChoiceOption label="Loon">Loon</ChoiceOption>
                <ChoiceOption label="ShadowRocket">Shadowrocket</ChoiceOption>
                <span class="inline-flex items-center gap-1">
                  <ChoiceOption label="QX">Quantumult X</ChoiceOption>
                  <HelpTip :help="qxTips()" />
                </span>
                <ChoiceOption label="sing-box">sing-box</ChoiceOption>
                <ChoiceOption label="V2Ray">V2Ray</ChoiceOption>
                <ChoiceOption label="URI">URI</ChoiceOption>
                <ChoiceOption label="JSON">JSON</ChoiceOption>
                <ChoiceOption label="Clash">Clash(Deprecated)</ChoiceOption>
              </ChoiceGroup>
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
            {{ $t("subscriptionEditor.icons") }}
          </h2>
        </template>
        <div class="resource-editor-fields">
          <div
            v-if="appearanceSetting.isShowIcon"
            class="resource-editor-icon-preview"
          >
            <ResourceImage
              :class="{ 'sub-item-customer-icon': !form.isIconColor }"
              :src="syncIcon"
              :fit="formIconFit"
              show-loading
              @click="showIconPopup"
            />
          </div>
          <ResourceField
            :label="$t(`editorPage.subConfig.basic.icon.label`)"
            prop="icon"
          >
            <FieldInput
              :border="false"
              input-align="right"
              class="plain-input"
              :placeholder="$t(`editorPage.subConfig.basic.icon.placeholder`)"
              v-model.trim="form.icon"
              type="text"
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
    </ResourceForm>
    <Teleport defer to="#resource-editor-actions">
      <UButton
        to="/sync"
        icon="i-lucide-arrow-left"
        size="sm"
        color="neutral"
        variant="outline"
        :disabled="isSubmitting"
      >
        {{ $t("workspace.back") }}
      </UButton>
      <UButton
        @click="submit"
        icon="i-lucide-save"
        size="sm"
        :loading="isSubmitting"
        :disabled="isSubmitting || !fetchReady"
      >
        {{ $t("workspace.save") }}
      </UButton>
    </Teleport>
    <tag-popup
      v-model:visible="tagPopupVisible"
      :currentTag="currentTag"
      @setTag="setTagValue"
      type="artifact"
    />
    <icon-popup v-model:visible="iconPopupVisible" @setIcon="setIcon" />
  </div>
</template>
<script lang="ts" setup>
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import ResourceSourceOptions from "@/components/ResourceSourceOptions.vue";
import TagPopup from "@/components/TagPopup.vue";
import AgeKeyHelper from "@/components/AgeKeyHelper.vue";
import ImageFitPicker from "@/components/ImageFitPicker.vue";
import IconPopup from "@/views/icon/IconPopup.vue";
import { useAppNotifyStore } from "@/store/appNotify";
import { useArtifactsStore } from "@/store/artifacts";
import { useSettingsStore } from "@/store/settings";
import { useSubsStore } from "@/store/subs";
import { useBackend } from "@/hooks/useBackend";
import { resolveArtifactIcon } from "@/utils/artifactIcon";
import { createGithubProxyUrlRewriter } from "@/utils/githubProxy";
import { normalizeOptionalImageFit, resolveImageFit } from "@/utils/iconFit";
import { Dialog, Toast } from '@/services/feedback';
import { storeToRefs } from "pinia";
import { computed, nextTick, reactive, ref, toRaw, watch, watchEffect, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const configName = route.params.id as string;

const artifactsStore = useArtifactsStore();
const subsStore = useSubsStore();
const settingsStore = useSettingsStore();
const { showNotify } = useAppNotifyStore();
const { env } = useBackend();
const { appearanceSetting, githubProxy, githubProxyRegex } = storeToRefs(settingsStore);

const routeConfigName = computed(() => route.params.id as string);
const isEditMode = computed(() => routeConfigName.value !== "UNTITLED");
const isInit = ref(false);
const fetchReady = ref(!isEditMode.value);
const isSubmitting = ref(false);
const ruleForm = ref<any>(null);

const sourceInput = ref("");
const sourceModel = ref<string[]>([]);
const tagPopupVisible = ref(false);
const iconPopupVisible = ref(false);
const isCronInputDisabled = computed(() => {
  return Boolean(env.value?.backend && env.value.backend !== "Node");
});

const githubUrlRewriter = computed(() => {
  return createGithubProxyUrlRewriter(githubProxy.value, githubProxyRegex.value);
});
const rewriteGithubUrl = (url?: string | null) => {
  return githubUrlRewriter.value(url);
};

const form = reactive<any>({
  name: "",
  displayName: "",
  remark: "",
  tag: "",
  icon: "",
  isIconColor: true,
  iconFit: undefined,
  source: "",
  type: "file",
  platform: "Stash",
  sync: false,
  cron: "",
  upload: true,
  includeUnsupportedProxy: false,
  prettyYaml: false,
});

const { markSaved, navigateAfterSave } = useUnsavedChanges(
  () => JSON.stringify(form),
  () => isInit.value,
  () => isSubmitting.value,
);

const syncIcon = computed(() => {
  const icon = resolveArtifactIcon({
    artifact: form,
    isDefaultIcon: appearanceSetting.value.isDefaultIcon,
  });

  return rewriteGithubUrl(icon) || icon;
});
const formIconFit = computed(() => resolveImageFit(form.iconFit, appearanceSetting.value.iconFit));

const sourceOptions = computed(() => {
  const subsNameList = subsStore.subs.map(sub => ({
    name: sub.name,
    displayName: sub.displayName || sub["display-name"] || sub.name,
  }));
  const collectionNameList = subsStore.collections.map(collection => ({
    name: collection.name,
    displayName:
      collection.displayName || collection["display-name"] || collection.name,
  }));
  const filesNameList = subsStore.files.map(file => ({
    name: file.name,
    displayName: file.displayName || file["display-name"] || file.name,
  }));

  const options: any[] = [];
  if (subsNameList.length > 0) {
    options.push({
      value: "subscription",
      text: t("specificWord.singleSub"),
      children: subsNameList.map(item => ({
        value: item.name,
        text: item.displayName,
      })),
    });
  }

  if (collectionNameList.length > 0) {
    options.push({
      value: "collection",
      text: t("specificWord.collectionSub"),
      children: collectionNameList.map(item => ({
        value: item.name,
        text: item.displayName,
      })),
    });
  }

  if (filesNameList.length > 0) {
    options.push({
      value: "file",
      text: t("specificWord.file"),
      children: filesNameList.map(item => ({
        value: item.name,
        text: item.displayName,
      })),
    });
  }

  return options;
});

const displayType = computed(() => {
  return (
    sourceOptions.value.find(item => item.value === form.type)?.text ??
    t("specificWord.unknown")
  );
});

const displaySourceName = computed(() => {
  const typeObj = sourceOptions.value.find(item => item.value === form.type);
  return (
    typeObj?.children?.find(item => item.value === form.source)?.text ??
    (form.source
      ? `${form.source}(🚫)`
      : t("specificWord.unknownSource"))
  );
});

const updateSourceInput = () => {
  if (!form.type || !form.source) {
    sourceInput.value = "";
    return;
  }
  sourceInput.value = `${displayType.value} - ${displaySourceName.value}`;
};

const sourceChange = (value: string[]) => {
  form.type = value[0];
  form.source = value[1];
  updateSourceInput();
};

const currentTag = computed(() => form.tag || "");
const showTagPopup = () => {
  tagPopupVisible.value = true;
};
const setTagValue = (tag: string) => {
  form.tag = tag;
};

watchEffect(() => {
  if (isInit.value) return;

  if (!isEditMode.value) {
    isInit.value = true;
    return;
  }

  const artifact = artifactsStore.artifacts.find(item => item.name === configName);
  if (!artifact) {
    if (!fetchReady.value) return;
    router.replace("/sync");
    return;
  }

  const sourceData = JSON.parse(JSON.stringify(toRaw(artifact)));
  form.name = sourceData.name;
  form.displayName = sourceData.displayName || sourceData["display-name"] || "";
  form.remark = sourceData.remark || "";
  form.tag = Array.isArray(sourceData.tag) ? sourceData.tag.join(", ") : sourceData.tag || "";
  form.icon = sourceData.icon || "";
  form.isIconColor = sourceData.isIconColor !== false;
  form.iconFit = normalizeOptionalImageFit(sourceData.iconFit);
  form.source = sourceData.source;
  form.type = sourceData.type;
  form["age-public-key"] = sourceData["age-public-key"] || "";
  form.platform = sourceData.platform || "Stash";
  form.sync = sourceData.sync ?? false;
  form.cron = sourceData.cron || "";
  form.upload = sourceData.upload !== false;
  form.includeUnsupportedProxy = sourceData.includeUnsupportedProxy ?? false;
  form.prettyYaml = sourceData.prettyYaml ?? false;
  form.updated = sourceData.updated;
  form.url = sourceData.url;
  sourceModel.value = [form.type, form.source];
  updateSourceInput();
  isInit.value = true;
});

watch(
  [sourceOptions, () => form.type, () => form.source],
  () => {
    updateSourceInput();
  },
  { deep: true }
);

onMounted(async () => {
  if (isEditMode.value && artifactsStore.artifacts.length === 0) {
    await artifactsStore.fetchArtifactsData();
  }
  fetchReady.value = true;
});

const onClickNameInput = () => {
  if (isEditMode.value) {
    Toast.warn("同步配置的名称不支持修改", { duration: 1000 });
  }
};

const showIconPopup = () => {
  iconPopupVisible.value = true;
};

const setIcon = (icon: any) => {
  form.icon = icon.url;
};

const includeUnsupportedProxyTips = () => ({
  href: "https://github.com/sub-store-org/Sub-Store/wiki/%E9%93%BE%E6%8E%A5%E5%8F%82%E6%95%B0%E8%AF%B4%E6%98%8E",
});

const uploadTips = () => ({
  title: t("syncPage.addArtForm.upload.tips.title"),
  content: t("syncPage.addArtForm.upload.tips.content"),
});

const cronTips = () => ({
  title: t("syncPage.addArtForm.cron.tips.title"),
  content: t("syncPage.addArtForm.cron.tips.content"),
});

const ageOutputTips = () => ({
  title: t("ageKey.publicKey.tips.title"),
  content: t("ageKey.publicKey.tips.content"),
});

const qxTips = () => ({
  content:
    "由于 QX 资源解析器对 QX 格式的输入支持不完善, 请勿对 Sub-Store 链接启用资源解析器. 如果一定要用资源解析器, 请手动选择 V2Ray 输出, 将形如 ?target=V2Ray 的链接填入 QX",
});

const nameValidator = (value: string): Promise<boolean> => {
  const name = value ?? form.name;
  return new Promise(resolve => {
    if (name === "UNTITLED") {
      resolve(false);
      return;
    }
    resolve(/^[a-zA-Z\d._-]*$/.test(name));
  });
};

const duplicateNameValidator = (value: string): Promise<boolean> => {
  const name = value ?? form.name;
  return new Promise(resolve => {
    if (isEditMode.value) {
      resolve(true);
      return;
    }
    const duplicate = artifactsStore.artifacts.find(
      artifact => artifact.name === name
    );
    resolve(!duplicate);
  });
};

const customerBlurValidate = (prop: string) => {
  ruleForm.value.validate(prop);
};

const submit = async () => {
  if (isSubmitting.value) {
    showNotify({
      type: "success",
      title: "请勿重复点击...",
    });
    return;
  }

  isSubmitting.value = true;
  try {
    const { valid } = await ruleForm.value.validate(undefined, false);
    if (!valid) {
      return;
    }

    const data: any = JSON.parse(JSON.stringify(toRaw(form)));
    const iconFit = normalizeOptionalImageFit(form.iconFit);
    if (iconFit) {
      data.iconFit = iconFit;
    } else if (isEditMode.value) {
      data.iconFit = null;
    } else {
      delete data.iconFit;
    }
    const agePublicKey = `${data["age-public-key"] || ""}`.trim();
    if (agePublicKey) {
      data["age-public-key"] = agePublicKey;
    } else if (isEditMode.value) {
      data["age-public-key"] = null;
    } else {
      delete data["age-public-key"];
    }
    data.tag = [
      ...new Set(
        (form.tag || "")
          .split(",")
          .map((item: string) => item.trim())
          .filter((item: string) => item.length)
      ),
    ];
    data["display-name"] = data.displayName;
    data.cron = `${data.cron || ""}`.trim();

    Toast.loading(t("syncPage.addArtForm.submitLoading"), {
      cover: true,
      id: "artifact-submit-loading",
    });

    const isSuccess = isEditMode.value
      ? await artifactsStore.editArtifact(configName, data)
      : await artifactsStore.createArtifact(data);

    if (isSuccess) {
      markSaved();
      await navigateAfterSave("/sync");
    }
  } finally {
    Toast.hide("artifact-submit-loading");
    isSubmitting.value = false;
    await nextTick();
    await ruleForm.value?.focusFirstError();
  }
};
</script>
