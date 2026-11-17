<template>
  <SettingsSection :title="$t('workspace.maintenance')">
    <SettingsRow
      :title="$t('moreSettingPage.clearFrontEndData.label')"
      class="settings-reset-action"
      is-link
      @click.stop="clearFrontEndData"
    />
    <SettingsRow
      :title="$t('moreSettingPage.clearData.label')"
      class="settings-reset-action"
      is-link
      @click.stop="clearData"
    />
  </SettingsSection>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { Dialog } from '@/services/feedback';
import { useAppNotifyStore } from '@/store/appNotify';
import { useSettingsApi } from '@/api/settings';
import { initStores } from '@/utils/initApp';

const { t } = useI18n();
const { showNotify } = useAppNotifyStore();

const clearData = () => {
  Dialog({
    title: t('moreSettingPage.clearData.title'),
    content: t('moreSettingPage.clearData.content'),
    onCancel: () => {},
    onOk: async () => {
      try {
          const res = await useSettingsApi().restoreSettings({ content: JSON.stringify({
            settings: {
              istabBar2: false,
              istabBar3: false
            }
          }) });
          if (res?.data?.status === "success") {
            await initStores(false, true, true);
            showNotify({
              type: "success",
              title: t(`moreSettingPage.clearData.succeed`),
            });
          } else {
            throw new Error('clear data failed')
          }
      } catch (e) {
        showNotify({
          type: "danger",
          title: t(`moreSettingPage.clearData.failed`),
        });
        console.error(e);
      }
    },
    popClass: 'auto-dialog',
    cancelText: t('moreSettingPage.clearData.cancel'),
    okText: t('moreSettingPage.clearData.conform'),
    closeOnPopstate: true,
    lockScroll: false,
  });
};
const clearFrontEndData = () => {
  Dialog({
    title: t('moreSettingPage.clearFrontEndData.title'),
    content: t('moreSettingPage.clearFrontEndData.content'),
    onCancel: () => {},
    onOk: async () => {
      try {
        localStorage.clear()
        window.location.reload()
      } catch (e) {
        showNotify({
          type: "danger",
          title: t(`moreSettingPage.clearFrontEndData.failed`),
        });
        console.error(e);
      }
    },
    popClass: 'auto-dialog',
    cancelText: t('moreSettingPage.clearFrontEndData.cancel'),
    okText: t('moreSettingPage.clearFrontEndData.conform'),
    closeOnPopstate: true,
    lockScroll: false,
  });
};
</script>
