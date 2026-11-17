<template>
  <div class="page-wrapper appearance-settings settings-card-columns">
    <!-- <p class="More-title">
      {{ $t(`themeSettingPage.themeSettingTitle`) }}
    </p> -->

    <SettingsSection :title="$t('workspace.general')">
      <SettingsRow
        :title="$t('navBar.langSwitcher.language')"
        class="cell-item settings-choice-row"
      >
        <template #link>
          <InlineOptions
            :model-value="[currentLanguage]"
            :columns="languageOptions"
            :label="$t('navBar.langSwitcher.language')"
            @confirm="changeLanguage"
          />
        </template>
      </SettingsRow>
      <SettingsRow :title="$t(`moreSettingPage.simple`)" class="cell-item">
        <template v-slot:link>
          <USwitch
            class="my-switch"
            v-model="SimpleSwitch"
            @update:model-value="setSimpleMode"
          />
        </template>
      </SettingsRow>
      <SettingsRow
        v-if="!isDesktop"
        :title="$t(`moreSettingPage.isSimpleReicon`)"
        class="cell-item"
      >
        <template v-slot:link>
          <USwitch
            class="my-switch"
            v-model="awSimpleReicon"
            @update:model-value="setSimpleReicon"
          />
        </template>
      </SettingsRow>
      <SettingsRow
        :title="$t(`moreSettingPage.isSimpleShowRemarks`)"
        class="cell-item"
      >
        <template v-slot:link>
          <USwitch
            class="my-switch"
            v-model="awSimpleShowRemark"
            @update:model-value="setSimpleShowRemark"
          />
        </template>
      </SettingsRow>
    </SettingsSection>
    <SettingsSection :title="$t('workspace.listIcons')">
      <SettingsRow
        :title="$t(`moreSettingPage.isDefaultIcon`)"
        class="cell-item"
      >
        <template v-slot:link>
          <USwitch
            class="my-switch"
            v-model="awIsDefaultIcon"
            @update:model-value="setIsDefaultIcon"
          />
        </template>
      </SettingsRow>
      <SettingsRow :title="$t(`moreSettingPage.isShowIcon`)" class="cell-item">
        <template v-slot:link>
          <USwitch
            class="my-switch"
            v-model="awIsShowIcon"
            @update:model-value="setIsShowIcon"
          />
        </template>
      </SettingsRow>
      <SettingsRow class="cell-item settings-choice-row">
        <template #title>
          <span class="label-with-tip">
            {{ $t(`moreSettingPage.iconFit`) }}
            <HelpTip :help="openImageFitTips()" />
          </span>
        </template>
        <template #link>
          <InlineOptions
            v-model="iconFitValue"
            :columns="imageFitColumns"
            :label="$t(`moreSettingPage.iconFit`)"
            @confirm="iconFitConfirm"
          />
        </template>
      </SettingsRow>
    </SettingsSection>
    <SettingsSection :title="$t('workspace.listEditors')">
      <SettingsRow
        v-if="!isDesktop"
        :title="$t(`moreSettingPage.islr`)"
        class="cell-item"
      >
        <template v-slot:link>
          <USwitch
            class="my-switch"
            v-model="LeftRight"
            @update:model-value="setLeftRight"
          />
        </template>
      </SettingsRow>

      <SettingsRow
        v-if="!isDesktop"
        :title="$t(`moreSettingPage.isSubItemMenuFold`)"
        class="cell-item"
      >
        <template v-slot:link>
          <USwitch
            class="my-switch"
            v-model="awIsSubItemMenuFold"
            @update:model-value="setIsSubItemMenuFold"
          />
        </template>
      </SettingsRow>

      <SettingsRow class="cell-item settings-choice-row">
        <template #title>
          <span>{{ $t(`moreSettingPage.subProgress.title`) }}</span>
        </template>
        <template #link>
          <InlineOptions
            v-model="subProgressStyleValue"
            :columns="[
              {
                text: $t(`moreSettingPage.subProgress.hidden`),
                value: 'hidden',
              },
              {
                text: $t(`moreSettingPage.subProgress.background`),
                value: 'background',
              },
            ]"
            :label="$t(`moreSettingPage.subProgress.title`)"
            @confirm="subProgressStyleConfirm"
          />
        </template>
      </SettingsRow>

      <SettingsRow
        :title="$t(`moreSettingPage.hideOfficialSiteButton`)"
        class="cell-item"
      >
        <template v-slot:link>
          <USwitch
            class="my-switch"
            v-model="hidePublicLinkActionButton"
            @update:model-value="setHidePublicLinkActionButton"
          />
        </template>
      </SettingsRow>

      <SettingsRow
        :title="$t(`moreSettingPage.displayPreviewInWebPage`)"
        class="cell-item"
      >
        <template v-slot:link>
          <USwitch
            class="my-switch"
            v-model="awDisplayPreviewInWebPage"
            @update:model-value="setDisplayPreviewInWebPage"
          />
        </template>
      </SettingsRow>
      <SettingsRow v-if="!isDesktop" class="cell-item settings-choice-row">
        <template #title>
          <span>{{ $t(`moreSettingPage.editorGrouping.title`) }}</span>
        </template>
        <template #link>
          <InlineOptions
            v-model="editorGroupingModeValue"
            :columns="[
              {
                text: $t(`moreSettingPage.editorGrouping.editOnly`),
                value: 'edit-only',
              },
              {
                text: $t(`moreSettingPage.editorGrouping.disabled`),
                value: 'disabled',
              },
              {
                text: $t(`moreSettingPage.editorGrouping.always`),
                value: 'always',
              },
            ]"
            :label="$t(`moreSettingPage.editorGrouping.title`)"
            @confirm="editorGroupingModeConfirm"
          />
        </template>
      </SettingsRow>

      <SettingsRow class="cell-item" :class="{ 'settings-choice-row': !isDesktop }">
        <template #title>
          <span>{{ $t(`moreSettingPage.editorCommon.title`) }}</span>
        </template>
        <template #link>
          <USwitch
            v-if="isDesktop"
            :model-value="editorCommonDisplayModeValue[0] !== 'hidden'"
            :aria-label="$t('moreSettingPage.editorCommon.title')"
            @update:model-value="
              editorCommonDisplayModeConfirm({
                selectedValue: [$event ? 'expanded' : 'hidden'],
              })
            "
          />
          <InlineOptions
            v-else
            v-model="editorCommonDisplayModeValue"
            :columns="[
              {
                text: $t(`moreSettingPage.editorDisplayMode.expanded`),
                value: 'expanded',
              },
              {
                text: $t(`moreSettingPage.editorDisplayMode.collapsed`),
                value: 'collapsed',
              },
              {
                text: $t(`moreSettingPage.editorDisplayMode.hidden`),
                value: 'hidden',
              },
            ]"
            :label="$t(`moreSettingPage.editorCommon.title`)"
            @confirm="editorCommonDisplayModeConfirm"
          />
        </template>
      </SettingsRow>

      <SettingsRow v-if="!isDesktop" class="cell-item settings-choice-row">
        <template #title>
          <span>{{ $t(`moreSettingPage.actionButtons.title`) }}</span>
        </template>
        <template #link>
          <InlineOptions
            v-model="actionButtonsDisplayModeValue"
            :columns="[
              {
                text: $t(`moreSettingPage.actionButtons.responsive`),
                value: 'responsive',
              },
              {
                text: $t(`moreSettingPage.actionButtons.compact`),
                value: 'compact',
              },
              {
                text: $t(`moreSettingPage.actionButtons.loose`),
                value: 'loose',
              },
            ]"
            :label="$t(`moreSettingPage.actionButtons.title`)"
            @confirm="actionButtonsDisplayModeConfirm"
          />
        </template>
      </SettingsRow>

      <SettingsRow class="cell-item settings-choice-row">
        <template #title>
          <span>{{ $t(`moreSettingPage.manualSubscriptions.title`) }}</span>
        </template>
        <template #link>
          <InlineOptions
            v-model="manualSubscriptionsDisplayModeValue"
            :columns="[
              {
                text: $t(`moreSettingPage.editorDisplayMode.expanded`),
                value: 'expanded',
              },
              {
                text: $t(`moreSettingPage.editorDisplayMode.collapsed`),
                value: 'collapsed',
              },
            ]"
            :label="$t(`moreSettingPage.manualSubscriptions.title`)"
            @confirm="manualSubscriptionsDisplayModeConfirm"
          />
        </template>
      </SettingsRow>
    </SettingsSection>

    <SettingsSection v-if="!isDesktop" :title="$t('workspace.shortcuts')">
      <SettingsRow class="cell-item settings-choice-row">
        <template #title>
          <span>{{ $t(`moreSettingPage.createItemPosition.title`) }}</span>
        </template>
        <template #link>
          <InlineOptions
            v-model="createItemPositionValue"
            :columns="[
              {
                text: $t(`moreSettingPage.createItemPosition.top`),
                value: 'top',
              },
              {
                text: $t(`moreSettingPage.createItemPosition.bottom`),
                value: 'bottom',
              },
            ]"
            :label="$t(`moreSettingPage.createItemPosition.title`)"
            @confirm="createItemPositionConfirm"
          />
        </template>
      </SettingsRow>

      <SettingsRow
        :title="$t(`moreSettingPage.showFloatingAddButton`)"
        class="cell-item"
      >
        <template v-slot:link>
          <USwitch
            class="my-switch"
            v-model="awShowFloatingAddButton"
            @update:model-value="setShowFloatingAddButton"
          />
        </template>
      </SettingsRow>
      <SettingsRow
        :title="$t(`moreSettingPage.showFloatingRefreshButton`)"
        class="cell-item"
      >
        <template v-slot:link>
          <USwitch
            class="my-switch"
            v-model="awShowFloatingRefreshButton"
            @update:model-value="setShowFloatingRefreshButton"
          />
        </template>
      </SettingsRow>
      <SettingsRow :title="$t(`moreSettingPage.tabBar2`)" class="cell-item">
        <template v-slot:link>
          <USwitch
            class="my-switch"
            v-model="awtabBar2"
            @update:model-value="settabBar2"
          />
        </template>
      </SettingsRow>
      <SettingsRow :title="$t(`moreSettingPage.tabBar3`)" class="cell-item">
        <template v-slot:link>
          <USwitch
            class="my-switch"
            v-model="awtabBar3"
            @update:model-value="settabBar3"
          />
        </template>
      </SettingsRow>
    </SettingsSection>
  </div>
</template>

<script lang="ts" setup>
  import { useMediaQuery } from "@vueuse/core";
  import InlineOptions from '@/components/InlineOptions.vue';
  import { SUPPORTED_LOCALES, normalizeLocale } from '@/locales/languages';

  import { useSettingsStore } from '@/store/settings';
  import { storeToRefs } from 'pinia';
  import { useGlobalStore } from '@/store/global';
  import { computed, ref, watchEffect } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { DEFAULT_IMAGE_FIT, IMAGE_FIT_OPTIONS, normalizeImageFit, type ImageFit } from "@/utils/iconFit";
  // import { Dialog } from '@/services/feedback';

const isDesktop = useMediaQuery("(min-width: 768px)");
const { t, locale } = useI18n();
const currentLanguage = computed(() => normalizeLocale(locale.value));
const languageOptions = computed(() => SUPPORTED_LOCALES.map(language => ({ value: language.key, text: t(language.labelKey) })));
const changeLanguage = ({ selectedValue }: { selectedValue: (string | number)[] }) => {
  const language = normalizeLocale(String(selectedValue[0]));
  locale.value = language;
  localStorage.setItem('locale', language);
};
  const settingsStore = useSettingsStore();
  const globalStore = useGlobalStore();
  const {
    // env,
    // isSimpleMode,
    // isLeftRight,
    ishostApi,
    // isIconColor,
    // isDefaultIcon,
    // isEditorCommon,
    // isSimpleReicon,
    // showFloatingRefreshButton,
    // istabBar2,
    // subProgressStyle,
  } = storeToRefs(globalStore);
  // 外观设置
  const { changeAppearanceSetting } = settingsStore;
  const { appearanceSetting } = storeToRefs(settingsStore);
  const InputHostApi = ref('');
  const SimpleSwitch = ref(false);
  const LeftRight = ref(false);
  const awIsDefaultIcon = ref(false);
  const awIsShowIcon = ref(true);
  const awIsSubItemMenuFold = ref(true);
  const awSimpleReicon = ref(true);
  const awSimpleShowRemark = ref(false);
  const awShowFloatingRefreshButton = ref(false);
  const awShowFloatingAddButton = ref(true);
  const createItemPositionValue = ref<CreateItemPosition[]>(['bottom']);
  const awDisplayPreviewInWebPage = ref(true);
  const awtabBar2 = ref(true);
  const awtabBar3 = ref(false);
  const hidePublicLinkActionButton = ref(false);
  // const isEditing = ref(false);
  const isInit = ref(false);
  const subProgressStyleValue = ref(['hidden']);
  const iconFitValue = ref<ImageFit[]>([DEFAULT_IMAGE_FIT]);
  const editorCommonDisplayModeValue = ref<EditorCommonDisplayMode[]>(['expanded']);
  const actionButtonsDisplayModeValue = ref<ActionButtonsDisplayMode[]>(['responsive']);
  const manualSubscriptionsDisplayModeValue = ref<EditorSectionFoldMode[]>(['collapsed']);
  const editorGroupingModeValue = ref<EditorGroupingMode[]>(['edit-only']);

  // const isEditLoading = ref(false);
  const imageFitColumns = computed(() => {
    return IMAGE_FIT_OPTIONS.map((value) => ({
      text: t(`imageFit.${value}`),
      value,
    }));
  });
  const subProgressStyleConfirm = ({ selectedValue }) => {
    // globalStore.setSubProgressStyle(selectedValue[0]);
    const data = {
      subProgressStyle: selectedValue[0]
    }
    changeAppearanceSetting({ appearanceSetting: data });
  };
  const iconFitConfirm = ({ selectedValue }) => {
    const iconFit = normalizeImageFit(selectedValue[0]);
    iconFitValue.value = [iconFit];
    const data = {
      iconFit,
    }
    changeAppearanceSetting({ appearanceSetting: data });
  };
  const openImageFitTips = () => ({
  title: t("imageFit.tips.title"),
  content: t("imageFit.tips.content"),
});
  const createItemPositionConfirm = ({ selectedValue }) => {
    const data = {
      createItemPosition: selectedValue[0]
    }
    changeAppearanceSetting({ appearanceSetting: data });
  };
  const editorCommonDisplayModeConfirm = ({ selectedValue }) => {
    const editorCommonDisplayMode = selectedValue[0] || 'expanded';
    const data = {
      editorCommonDisplayMode,
      isEditorCommon: editorCommonDisplayMode !== 'hidden',
    }
    changeAppearanceSetting({ appearanceSetting: data });
  };
  const actionButtonsDisplayModeConfirm = ({ selectedValue }) => {
    const data = {
      actionButtonsDisplayMode: selectedValue[0] || 'responsive',
    }
    changeAppearanceSetting({ appearanceSetting: data });
  };
  const editorGroupingModeConfirm = ({ selectedValue }) => {
    const data = {
      editorGroupingMode: selectedValue[0] || 'edit-only',
    }
    changeAppearanceSetting({ appearanceSetting: data });
  };
  const manualSubscriptionsDisplayModeConfirm = ({ selectedValue }) => {
    const data = {
      manualSubscriptionsDisplayMode: selectedValue[0] || 'collapsed'
    }
    changeAppearanceSetting({ appearanceSetting: data });
  };
  const setSimpleMode = (isSimpleMode: boolean) => {
    // globalStore.setSimpleMode(isSimpleMode);
    const data = {
      isSimpleMode: isSimpleMode
    }
    changeAppearanceSetting({ appearanceSetting: data });
  };

  const setLeftRight = (isLeftRight: boolean) => {
    // globalStore.setLeftRight(isLeftRight);
    const data = {
      isLeftRight: isLeftRight
    }
    changeAppearanceSetting({ appearanceSetting: data });
  };

  const setIsDefaultIcon = (isDefaultIcon: boolean) => {
    // globalStore.setIsDefaultIcon(isDefaultIcon);
    const data = {
      isDefaultIcon: isDefaultIcon
    }
    changeAppearanceSetting({ appearanceSetting: data });
  };

  const setIsShowIcon = (isShowIcon: boolean) => {
    // globalStore.setIsDefaultIcon(isDefaultIcon);
    const data = {
      isShowIcon: isShowIcon
    }
    changeAppearanceSetting({ appearanceSetting: data });
  };

  const setIsSubItemMenuFold = (isSubItemMenuFold: boolean) => {
    // globalStore.setIsDefaultIcon(isDefaultIcon);
    const data = {
      isSubItemMenuFold: isSubItemMenuFold
    }
    changeAppearanceSetting({ appearanceSetting: data });
  };

  const setSimpleReicon = (isSimpleReicon: boolean) => {
    // globalStore.setSimpleReicon(isSimpleReicon);
    const data = {
      isSimpleReicon: isSimpleReicon
    }
    changeAppearanceSetting({ appearanceSetting: data });
  };

  const setSimpleShowRemark = (isSimpleShowRemark: boolean) => {
    // globalStore.setSimpleReicon(isSimpleReicon);
    const data = {
      isSimpleShowRemark: isSimpleShowRemark
    }
    changeAppearanceSetting({ appearanceSetting: data });
  };

  const setShowFloatingRefreshButton = (showFloatingRefreshButton: boolean) => {
    // globalStore.setShowFloatingRefreshButton(showFloatingRefreshButton);
    const data = {
      showFloatingRefreshButton: showFloatingRefreshButton
    }
    changeAppearanceSetting({ appearanceSetting: data });
  };

  const setShowFloatingAddButton = (showFloatingAddButton: boolean) => {
    const data = {
      showFloatingAddButton: showFloatingAddButton
    }
    changeAppearanceSetting({ appearanceSetting: data });
  };

  const setDisplayPreviewInWebPage = (displayPreviewInWebPage: boolean) => {
    const data = {
      displayPreviewInWebPage: displayPreviewInWebPage
    }
    changeAppearanceSetting({ appearanceSetting: data });
  };
  const setHidePublicLinkActionButton = (value: boolean) => {
    const data = {
      hidePublicLinkActionButton: value
    }
    changeAppearanceSetting({ appearanceSetting: data });
  };
  const settabBar2 = (istabBar2: boolean) => {
    // globalStore.settabBar2(istabBar2);
    const data = {
      istabBar2: istabBar2
    }
    changeAppearanceSetting({ appearanceSetting: data });
  };
  const settabBar3 = (istabBar3: boolean) => {
    const data = {
      istabBar3: istabBar3
    }
    changeAppearanceSetting({ appearanceSetting: data });
  };



  const setDisplayInfo = () => {
    InputHostApi.value = ishostApi.value
      ? ishostApi.value.slice(0, 9) + '************'
      : t(`moreSettingPage.yhostapi`);
  };
  // const exitEditMode = () => {
  //   setDisplayInfo();
  //   isEditing.value = false;
  //   isEditLoading.value = false;
  // };

  // const toggleEditMode = async () => {
  //   isEditLoading.value = true;
  //   console.log(`location.protocol`, location.protocol);
  //   console.log(`InputHostApi`, InputHostApi.value);
  //   if (
  //     location.protocol === 'https:' &&
  //     !/^(https):\/\/\S+$|^http:\/\/(localhost|127\.0\.0\.1)/.test(
  //       InputHostApi.value
  //     ) &&
  //     isEditing.value &&
  //     InputHostApi.value !== ''
  //   ) {
  //     console.log('InputHostApi失败');
  //     Dialog({
  //       title: t(`moreSettingPage.InputHostApi.title`),
  //       content: t(`moreSettingPage.InputHostApi.content`),
  //       popClass: 'auto-dialog',
  //       noCancelBtn: true,
  //       okText: t(`editorPage.subConfig.pop.errorBtn`),
  //       closeOnClickOverlay: true,
  //     });
  //     isEditing.value = false;
  //     isEditLoading.value = false;
  //     setDisplayInfo();
  //   } else {
  //     if (isEditing.value) {
  //       globalStore.sethostApi(InputHostApi.value);
  //       setDisplayInfo();
  //     } else {
  //       InputHostApi.value = ishostApi.value;
  //     }
  //     isEditLoading.value = false;
  //     isEditing.value = !isEditing.value;
  //   }
  // };

  // const clearEditor = () => {
  //   Dialog({
  //     title: t('editorPage.subConfig.pop.clearTitle'),
  //     content: t('editorPage.subConfig.pop.clearDes'),
  //     popClass: 'auto-dialog',
  //     okText: t(`editorPage.subConfig.pop.clearConfirm`),
  //     cancelText: t(`editorPage.subConfig.pop.clearCancel`),
  //     onOk: () => {
  //       InputHostApi.value = '';
  //     },
  //     closeOnClickOverlay: true,
  //   });
  // };

  watchEffect(() => {
    SimpleSwitch.value = appearanceSetting.value.isSimpleMode;
    LeftRight.value = appearanceSetting.value.isLeftRight;
    awIsDefaultIcon.value = appearanceSetting.value.isDefaultIcon;
    awIsShowIcon.value = appearanceSetting.value.isShowIcon;
    iconFitValue.value = [normalizeImageFit(appearanceSetting.value.iconFit)];
    awIsSubItemMenuFold.value = appearanceSetting.value.isSubItemMenuFold;
    awSimpleReicon.value = appearanceSetting.value.isSimpleReicon;
    awSimpleShowRemark.value = appearanceSetting.value.isSimpleShowRemark;
    awShowFloatingRefreshButton.value = appearanceSetting.value.showFloatingRefreshButton;
    awShowFloatingAddButton.value = appearanceSetting.value.showFloatingAddButton;
    createItemPositionValue.value = [appearanceSetting.value.createItemPosition || 'bottom'];
    awDisplayPreviewInWebPage.value = appearanceSetting.value.displayPreviewInWebPage;
    awtabBar2.value = appearanceSetting.value.istabBar2;
    awtabBar3.value = appearanceSetting.value.istabBar3 ?? false;
    hidePublicLinkActionButton.value = appearanceSetting.value.hidePublicLinkActionButton ?? false;
    subProgressStyleValue.value = [appearanceSetting.value.subProgressStyle];
    editorCommonDisplayModeValue.value = [appearanceSetting.value.editorCommonDisplayMode || 'expanded'];
    actionButtonsDisplayModeValue.value = [appearanceSetting.value.actionButtonsDisplayMode || 'responsive'];
    manualSubscriptionsDisplayModeValue.value = [appearanceSetting.value.manualSubscriptionsDisplayMode || 'collapsed'];
    editorGroupingModeValue.value = [appearanceSetting.value.editorGroupingMode || 'edit-only'];
    // SimpleSwitch.value = isSimpleMode.value;
    // LeftRight.value = isLeftRight.value;
    // awIconColor.value = isIconColor.value;
    // awIsDefaultIcon.value = isDefaultIcon.value;
    // awEditorCommon.value = isEditorCommon.value;
    // awEditorCommon.value = isEditorCommon.value;
    // awSimpleReicon.value = isSimpleReicon.value;
    // awShowFloatingRefreshButton.value = showFloatingRefreshButton.value;
    // awtabBar2.value = istabBar2.value;
    // subProgressStyleValue.value = [subProgressStyle.value];
    if (!isInit.value) {
      setDisplayInfo();
      isInit.value = true;
    }
  });
</script>
