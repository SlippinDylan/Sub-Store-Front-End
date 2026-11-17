<template>
  <div class="form-block-wrapper" :class="{ 'common-inline': inline }">
    <div class="sticky-title-wrapper">
      <div class="common-title-row">
        <div class="title" @click="!inline && toggleFold()">
          <p>
            {{ $t(`editorPage.subConfig.commonOptions.label`) }}
          </p>
          <AppIcon
            v-if="!inline"
            :name="isFold ? 'rect-right' : 'rect-down'"
            size="12px"
          />
        </div>
        <EditorCommonTips />
      </div>
    </div>
    <ResourceForm v-if="inline || !isFold" class="form common-options-form">
      <div class="quick-option-palette">
        <UButton
          :size="isDesktop ? 'sm' : 'md'"
          v-for="option in quickOptions"
          :key="option.key"
          type="button"
          class="quick-option-chip"
          :class="{ 'quick-option-chip--active': isConfigured(option.key) }"
          @click="toggleQuickOption(option.key)"
          color="neutral"
          variant="outline"
        >
          {{
            $t(`editorPage.subConfig.commonOptions${option.localePath}.label`)
          }}
        </UButton>
      </div>

      <div
        v-if="inline && configuredQuickOptions.length"
        class="quick-option-grid"
      >
        <UCard
          v-for="option in configuredQuickOptions"
          :key="option.key"
          class="quick-option-card"
          :ui="{ body: 'flex flex-col gap-4 p-4 sm:p-4' }"
        >
          <div class="flex items-center justify-between gap-3">
            <h3 class="text-sm font-medium">
              {{
                $t(
                  `editorPage.subConfig.commonOptions${option.localePath}.label`,
                )
              }}
            </h3>
            <UButton
              @click="removeQuickOption(option.key)"
              :aria-label="`${$t('editorPage.subConfig.pop.deleteConfirm')} ${$t(`editorPage.subConfig.commonOptions${option.localePath}.label`)}`"
              icon="i-lucide-x"
              size="xs"
              color="neutral"
              variant="ghost"
            />
          </div>
          <USelect
            v-if="option.control === 'select'"
            v-model="quick.args[option.key]"
            :items="
              option.selectOptions.map((item) => ({
                value: item.value,
                label: $t(
                  `editorPage.subConfig.commonOptions${option.localePath}.options.${item.labelKey}`,
                ),
              }))
            "
            :aria-label="
              $t(`editorPage.subConfig.commonOptions${option.localePath}.label`)
            "
            class="w-full"
          />
          <ChoiceGroup
            v-else
            direction="horizontal"
            v-model="quick.args[option.key]"
            :aria-label="
              $t(`editorPage.subConfig.commonOptions${option.localePath}.label`)
            "
          >
            <ChoiceOption
              v-for="radioOption in getRadioOptions(option)"
              :key="radioOption.value"
              :label="radioOption.value"
            >
              {{
                $t(
                  `editorPage.subConfig.commonOptions${option.localePath}.${radioOption.labelKey}`,
                )
              }}
            </ChoiceOption>
          </ChoiceGroup>
        </UCard>
      </div>
      <template v-if="!inline">
        <ResourceField
          v-for="option in configuredQuickOptions"
          :key="option.key"
          class="configured-option-item"
        >
          <p class="options-label configured-option-label">
            {{
              $t(`editorPage.subConfig.commonOptions${option.localePath}.label`)
            }}
          </p>
          <div
            v-if="option.control === 'select'"
            class="configured-option-control quick-option-select-wrapper"
          >
            <USelect
              v-model="quick.args[option.key]"
              :items="
                option.selectOptions.map((item) => ({
                  value: item.value,
                  label: $t(
                    `editorPage.subConfig.commonOptions${option.localePath}.options.${item.labelKey}`,
                  ),
                }))
              "
              :aria-label="
                $t(
                  `editorPage.subConfig.commonOptions${option.localePath}.label`,
                )
              "
              class="w-full"
            />
          </div>
          <div
            v-else
            class="radio-wrapper options-radio configured-option-radio configured-option-control"
          >
            <ChoiceGroup
              direction="horizontal"
              v-model="quick.args[option.key]"
            >
              <ChoiceOption
                v-for="radioOption in getRadioOptions(option)"
                :key="radioOption.value"
                :label="radioOption.value"
              >
                {{
                  $t(
                    `editorPage.subConfig.commonOptions${option.localePath}.${radioOption.labelKey}`,
                  )
                }}
              </ChoiceOption>
            </ChoiceGroup>
          </div>
          <UButton
            :size="isDesktop ? 'sm' : 'md'"
            type="button"
            class="quick-option-remove"
            :aria-label="$t('editorPage.subConfig.pop.deleteConfirm')"
            @click="removeQuickOption(option.key)"
            color="neutral"
            variant="outline"
          >
            <AppIcon name="mask-close" />
          </UButton>
        </ResourceField>
      </template>
    </ResourceForm>
  </div>
  <!--<div class="form-block-wrapper">-->
  <!--  <div class="sticky-title-wrapper">-->
  <!--    <p>-->
  <!--      {{ $t(`editorPage.subConfig.surgeOptions.label`) }}-->
  <!--    </p>-->
  <!--  </div>-->
  <!--  <ResourceForm class="form">-->
  <!--    <ResourceField>-->
  <!--      <p class="options-label">-->
  <!--        {{ $t(`editorPage.subConfig.surgeOptions.hybrid.label`) }}-->
  <!--      </p>-->
  <!--      <div class="radio-wrapper options-radio">-->
  <!--        <ChoiceGroup-->
  <!--          direction="horizontal"-->
  <!--          v-model="options['surge-hybrid']"-->
  <!--        >-->
  <!--          <ChoiceOption label="DEFAULT"-->
  <!--            >{{ $t(`editorPage.subConfig.surgeOptions.hybrid.default`) }}-->
  <!--          </ChoiceOption>-->
  <!--          <ChoiceOption label="FORCE_OPEN"-->
  <!--            >{{ $t(`editorPage.subConfig.surgeOptions.hybrid.open`) }}-->
  <!--          </ChoiceOption>-->
  <!--          <ChoiceOption label="FORCE_CLOSE"-->
  <!--            >{{ $t(`editorPage.subConfig.surgeOptions.hybrid.close`) }}-->
  <!--          </ChoiceOption>-->
  <!--        </ChoiceGroup>-->
  <!--      </div>-->
  <!--    </ResourceField>-->
  <!--  </ResourceForm>-->
  <!--</div>-->
</template>

<script lang="ts" setup>
import { useMediaQuery } from "@vueuse/core";
  import EditorCommonTips from '@/components/EditorCommonTips.vue';
  import { useRoute } from 'vue-router';
  import { computed, inject, watchEffect, ref, watch } from 'vue';
  import {
    getEditorFoldState,
    getEditorIsFolded,
    setEditorFoldState,
  } from '@/utils/editorFoldState';
const isDesktop = useMediaQuery("(min-width: 768px)");
  const route = useRoute();
  const props = withDefaults(defineProps<{
    defaultFolded?: boolean
    inline?: boolean
  }>(), {
    defaultFolded: false,
    inline: false,
  });

  const storageKey = 'common-block-fold';

  function getFoldState() {
    return getEditorIsFolded(storageKey, route.path, props.defaultFolded);
  }
  function setFoldState(isFold) {
    setEditorFoldState(storageKey, route.path, isFold);
  }
  const isFold = ref(getFoldState());

  type QuickOptionKey =
    | 'useless'
    | 'udp'
    | 'scert'
    | 'tfo'
    | 'vmess aead'
    | 'reuse'
    | 'block-quic'
    | 'ecn'
    | 'ip-version';
  type QuickOptionRadio = {
    value: string;
    labelKey: string;
  };
  type QuickOption = {
    key: QuickOptionKey;
    localePath: string;
    emptyValue: string;
    defaultValue?: string;
    control?: 'radio' | 'select';
    radioOptions?: QuickOptionRadio[];
    selectOptions?: {
      value: string;
      labelKey: string;
    }[];
  };

  const quickOptions: QuickOption[] = [
    { key: 'useless', localePath: '.useless', emptyValue: 'DISABLED' },
    { key: 'udp', localePath: '.udp', emptyValue: 'DEFAULT' },
    { key: 'scert', localePath: '.scert', emptyValue: 'DEFAULT' },
    { key: 'tfo', localePath: '.tfo', emptyValue: 'DEFAULT' },
    { key: 'vmess aead', localePath: "['vmess aead']", emptyValue: 'DEFAULT' },
    { key: 'reuse', localePath: '.reuse', emptyValue: 'DEFAULT' },
    {
      key: 'block-quic',
      localePath: "['block-quic']",
      emptyValue: 'DEFAULT',
      defaultValue: 'auto',
      radioOptions: [
        { value: 'auto', labelKey: 'auto' },
        { value: 'on', labelKey: 'enabled' },
        { value: 'off', labelKey: 'disabled' },
      ],
    },
    { key: 'ecn', localePath: '.ecn', emptyValue: 'DEFAULT' },
    {
      key: 'ip-version',
      localePath: "['ip-version']",
      emptyValue: 'DEFAULT',
      defaultValue: 'dual',
      control: 'select',
      selectOptions: [
        { value: 'dual', labelKey: 'dual' },
        { value: 'v4-only', labelKey: 'v4Only' },
        { value: 'v6-only', labelKey: 'v6Only' },
        { value: 'prefer-v4', labelKey: 'preferV4' },
        { value: 'prefer-v6', labelKey: 'preferV6' },
      ],
    },
  ];

  const createDefaultQuickArgs = () => ({
    useless: 'DISABLED',
    udp: 'DEFAULT',
    scert: 'DEFAULT',
    tfo: 'DEFAULT',
    'vmess aead': 'DEFAULT',
    reuse: 'DEFAULT',
    'block-quic': 'DEFAULT',
    ecn: 'DEFAULT',
    'ip-version': 'DEFAULT',
  });
  const defaultRadioOptions: QuickOptionRadio[] = [
    { value: 'ENABLED', labelKey: 'enabled' },
    { value: 'DISABLED', labelKey: 'disabled' },
  ];

  const form = inject<Sub | Collection>('form');
  if (!Array.isArray(form.process)) {
    form.process = [];
  }
  const quick = form.process.find(
    item => item.type === 'Quick Setting Operator'
  ) || (() => {
    const item = {
      type: 'Quick Setting Operator',
      args: createDefaultQuickArgs(),
    };
    form.process.unshift(item);
    return item;
  })();

  const getQuickOption = (key: QuickOptionKey) => quickOptions.find(item => item.key === key);
  const getRadioOptions = (option: QuickOption) => option.radioOptions || defaultRadioOptions;
  const ensureQuickArgs = () => {
    if (!quick.args) {
      quick.args = createDefaultQuickArgs();
    }

    return quick.args as Record<QuickOptionKey, string>;
  };
  ensureQuickArgs();

  const isConfigured = (key: QuickOptionKey) => {
    const option = getQuickOption(key);
    if (!option) return false;

    const value = ensureQuickArgs()[key];
    return Boolean(value) && value !== option.emptyValue;
  };
  const configuredQuickOptions = computed(() => quickOptions.filter(option => isConfigured(option.key)));
  const addQuickOption = (key: QuickOptionKey) => {
    const args = ensureQuickArgs();
    if (isConfigured(key)) return;

    args[key] = getQuickOption(key)?.defaultValue || 'ENABLED';
  };
  const removeQuickOption = (key: QuickOptionKey) => {
    const option = getQuickOption(key);
    if (!option) return;

    ensureQuickArgs()[key] = option.emptyValue;
  };
  const toggleQuickOption = (key: QuickOptionKey) => {
    if (isConfigured(key)) {
      removeQuickOption(key);
      return;
    }

    addQuickOption(key);
  };

  const toggleFold = () => {
    isFold.value = !isFold.value;
    setFoldState(isFold.value)
  };
  watch(
    () => props.defaultFolded,
    (defaultFolded) => {
      if (getEditorFoldState(storageKey, route.path) === undefined) {
        isFold.value = defaultFolded;
      }
    },
  );
  watchEffect(() => {
    ensureQuickArgs();
  });
</script>

<style scoped>
.form-block-wrapper.common-inline {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px 24px;
}
.common-inline > .sticky-title-wrapper {
  flex: 0 0 auto;
  margin: 0;
}
.common-inline .title {
  cursor: default;
}
.common-inline .common-options-form {
  display: contents;
}
.common-inline .quick-option-palette {
  display: flex;
  flex: 1 1 0;
  min-width: min(100%, 320px);
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}
.common-inline .quick-option-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 260px), 1fr));
  gap: 16px;
  flex: 0 0 calc(100% + 32px);
  min-width: 0;
  margin-inline: -16px;
  padding: 16px 16px 0;
  border-top: 1px solid var(--ui-border);
}
.quick-option-card {
  min-width: 0;
}
</style>
