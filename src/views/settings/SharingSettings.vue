<template>
  <SettingsSection v-if="env.feature?.share" :title="$t('workspace.sharing')">
    <SettingsRow :title="$t('moreSettingPage.invalidShareFakeNode')">
      <template #link>
        <USwitch
          :model-value="appearanceSetting.invalidShareFakeNode"
          @update:model-value="setInvalidShareFakeNode"
        />
      </template>
    </SettingsRow>
  </SettingsSection>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useBackend } from '@/hooks/useBackend';
import { useSettingsStore } from '@/store/settings';

const { env } = useBackend();
const settingsStore = useSettingsStore();
const { appearanceSetting } = storeToRefs(settingsStore);
const { changeAppearanceSetting } = settingsStore;

const setInvalidShareFakeNode = (invalidShareFakeNode: boolean) => {
  const data = {
    invalidShareFakeNode: invalidShareFakeNode
  }
  changeAppearanceSetting({ appearanceSetting: data });
};
</script>
