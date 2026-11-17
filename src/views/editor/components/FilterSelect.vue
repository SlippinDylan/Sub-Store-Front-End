<template>
  <div class="editor-action-card">
    <ResourceField>
      <template #label>
        {{ $t(`editorPage.subConfig.nodeActions['${type}'].des[1]`) }}
      </template>
      <ChoiceGroup direction="horizontal" v-model="mode">
        <ChoiceOption
          v-for="(key, index) in opt[type].mode"
          :label="key"
          :key="index"
        >
          {{
            $t(
              `editorPage.subConfig.nodeActions['${type}'].modeOptions[${index}]`,
            )
          }}
        </ChoiceOption>
      </ChoiceGroup>
    </ResourceField>
    <ResourceField>
      <template #label>
        {{ $t(`editorPage.subConfig.nodeActions['${type}'].des[0]`) }}
      </template>
      <SelectionGroup class="checkbox-group" v-model="value">
        <SelectionOption
          :icon-size="16"
          v-for="(item, index) in opt[type].value"
          :key="item"
          :label="item"
        >
          <span class="item" v-if="type === 'Region Filter' && item === 'TW'">
            <img :src="tw" alt="" />
            &nbsp;{{ item }}
          </span>
          <span v-else>
            {{
              $t(
                `editorPage.subConfig.nodeActions['${type}'].options[${index}]`,
              )
            }}
          </span>
        </SelectionOption>
      </SelectionGroup>
    </ResourceField>
  </div>
</template>

<script lang="ts" setup>
  import { computed, inject, ref, watch, onMounted } from 'vue';
  import tw from '@/assets/icons/tw.png';
  import semverGt from 'semver/functions/gt';
  import { useAppNotifyStore } from '@/store/appNotify';
  import { storeToRefs } from 'pinia';
  import { useGlobalStore } from '@/store/global';

  const globalStore = useGlobalStore();
  const { env } = storeToRefs(globalStore);

  const { showNotify } = useAppNotifyStore();

  const { type, id } = defineProps<{
    type: string;
    id: string;
  }>();

  const form = inject<Sub | Collection>('form');

  // 此处 key 需要与 i18n 的 actions 中的 key 相同
  // 值的次序需要与该选项的 options 值 顺序相同
  const opt = {
    'Region Filter': {
      mode: [0, 1],
      value: ['HK', 'TW', 'SG', 'JP', 'UK', 'US', 'DE', 'KR']
    },
    'Type Filter': {
      mode: [0, 1],
      value: [
        'ss',
        'ssr',
        'vmess',
        'vless',
        'trojan',
        'http',
        'h2-connect',
        'socks5',
        'snell',
        'tuic',
        'hysteria',
        'hysteria2',
        'juicity',
        'mieru',
        'sudoku',
        'masque',
        'masque-surge',
        'shadowquic',
        'naive',
        'anytls',
        'trusttunnel',
        'openvpn',
        'gost-relay',
        'zerotier',
        'tailscale',
        'easytier',
        'wireguard',
        'ssh',
        'external',
        'direct'
      ]
    },
  };

  const value = computed({
    get: () => form.process.find(item => item.id === id).args.value,
    set: (selected) => {
      form.process.find(item => item.id === id).args.value = selected;
    },
  });
  const mode = ref();

  // try {
  //   if(!semverGt(env.value.version, '2.16.63')) {
  //     showNotify({
  //       title: `请更新后端, 版本应大于 2.16.63`,
  //       type: 'danger',
  //     });
  //   }
  // } catch (e) {}

  // Normalize legacy array arguments before editing the filter.
  onMounted(() => {
    const item = form.process.find(item => item.id === id);
    if (item) {
      let v = item.args?.value || item.args;
      if (!Array.isArray(v)){
        v = [];
      }
      const keep = item.args?.keep ?? true;
      item.args = { keep, value: v };
      mode.value = item.args.keep ? 0 : 1;
    }
  });

  watch(mode, () => {
    const item = form.process.find(item => item.id === id);
    item.args.keep = !mode.value;
  });
</script>

<style lang="scss" scoped>
  .des-label {
    font-size: 12px;
    margin-bottom: 8px;
    color: var(--ui-text-muted);

    &:not(:first-child) {
      margin-top: 16px;
    }
  }
  .checkbox-group {
    display: grid;
    grid-template-columns: 1fr 1fr;
    .item {
      display: flex;
      align-items: center;
      img {
        width: 14px;
        height: 14px;
      }
    }

    view {
      margin-bottom: 16px;
    }
  }
</style>
