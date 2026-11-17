<template>
  <div class="editor-action-card">
    <div
      v-if="type === 'Resolve Domain Operator'"
      class="settings-notice whitespace-pre-line"
    >
      {{ $t("subscriptionEditor.dnsProviderHint") }}
    </div>
    <ResourceField
      prop="dnsProvider"
      :rules="
        type === 'Resolve Domain Operator'
          ? [
              {
                validator: () => !(rdoType === 'IPv6' && value === 'IP-API'),
                message: $t('actionValidation.unsupportedIpv6'),
              },
            ]
          : []
      "
    >
      <template #label>
        {{
          type === "Resolve Domain Operator"
            ? $t("subscriptionEditor.dnsProvider")
            : $t(`editorPage.subConfig.nodeActions['${type}'].des`)
        }}
      </template>
      <div class="radio-wrapper options-radio">
        <ChoiceGroup direction="horizontal" v-model="value">
          <ChoiceOption
            v-for="(key, index) in opt[type]"
            :label="key"
            :key="index"
          >
            <div>
              {{
                $t(
                  `editorPage.subConfig.nodeActions['${type}'].options[${index}]`,
                )
              }}
            </div>
          </ChoiceOption>
        </ChoiceGroup>
      </div>
    </ResourceField>
    <template v-if="type === 'Resolve Domain Operator' && rdoNewVersion">
      <div
        v-if="value === 'Custom'"
        class="settings-notice whitespace-pre-line"
      >
        {{ $t(`editorPage.subConfig.nodeActions['${type}'].customDns`) }}
      </div>
      <ResourceField
        v-if="value === 'Custom'"
        class="radio-wrapper options-radio custom-dns-input-option"
      >
        <template #label>
          {{ $t("subscriptionEditor.customDns") }}
        </template>
        <div
          class="input-wrapper compact-textarea-wrapper compact-textarea-wrapper--custom-dns"
        >
          <FieldTextarea
            :placeholder="
              $t(
                `editorPage.subConfig.nodeActions['${type}'].customDnsPlaceholder`,
              )
            "
            :rows="2"
            :autosize="{ minHeight: 40 }"
            v-model="rdoUrl"
          />
        </div>
      </ResourceField>
      <ResourceField
        v-if="value === 'Custom'"
        class="radio-wrapper options-radio tls-skip-cert-option"
      >
        <template #label>
          {{
            $t(`editorPage.subConfig.nodeActions['${type}'].tlsSkipCertVerify`)
          }}
        </template>
        <ChoiceGroup direction="horizontal" v-model="rdoTlsSkipCertVerify">
          <ChoiceOption
            v-for="(key, index) in rdoTlsSkipCertVerifyOpt"
            :label="key"
            :key="index"
          >
            {{
              $t(
                `editorPage.subConfig.nodeActions['${type}'].tlsSkipCertVerifyOptions[${index}]`,
              )
            }}
          </ChoiceOption>
        </ChoiceGroup>
      </ResourceField>
      <ResourceField
        prop="dnsConcurrency"
        :rules="[
          {
            validator: () => isOptionalPositiveInteger(rdoDnsConcurrency),
            message: $t('actionValidation.positiveInteger'),
          },
        ]"
        v-if="value === 'Custom'"
        class="radio-wrapper options-radio inline-input-option"
      >
        <template #label>
          {{ $t(`editorPage.subConfig.nodeActions['${type}'].dnsConcurrency`) }}
        </template>
        <div
          class="input-wrapper compact-input-wrapper compact-input-wrapper--concurrency"
        >
          <FieldInput
            type="number"
            :placeholder="
              $t(
                `editorPage.subConfig.nodeActions['${type}'].dnsConcurrencyPlaceholder`,
              )
            "
            v-model="rdoDnsConcurrency"
          />
        </div>
      </ResourceField>
      <div class="settings-notice">{{ $t("subscriptionEditor.ednsHint") }}</div>
      <ResourceField class="radio-wrapper options-radio edns-input-option">
        <template #label>EDNS</template>
        <div
          class="input-wrapper compact-input-wrapper compact-input-wrapper--edns"
        >
          <FieldInput
            :placeholder="$t('subscriptionEditor.ednsPlaceholder')"
            v-model="rdoEdns"
          />
        </div>
      </ResourceField>
      <ResourceField
        prop="timeout"
        :rules="[
          {
            validator: () => isOptionalPositiveInteger(rdoTimeout),
            message: $t('actionValidation.positiveInteger'),
          },
        ]"
        class="radio-wrapper options-radio inline-input-option"
      >
        <template #label>
          {{ $t(`editorPage.subConfig.nodeActions['${type}'].timeout`) }}
        </template>
        <div
          class="input-wrapper compact-input-wrapper compact-input-wrapper--concurrency"
        >
          <FieldInput
            type="number"
            :placeholder="
              $t(
                `editorPage.subConfig.nodeActions['${type}'].timeoutPlaceholder`,
              )
            "
            v-model="rdoTimeout"
          />
        </div>
      </ResourceField>
      <ResourceField
        prop="concurrency"
        :rules="[
          {
            validator: () => isOptionalPositiveInteger(rdoConcurrency),
            message: $t('actionValidation.positiveInteger'),
          },
        ]"
        class="radio-wrapper options-radio inline-input-option"
      >
        <template #label>
          {{ $t(`editorPage.subConfig.nodeActions['${type}'].concurrency`) }}
        </template>
        <div
          class="input-wrapper compact-input-wrapper compact-input-wrapper--concurrency"
        >
          <FieldInput
            type="number"
            :placeholder="
              $t(
                `editorPage.subConfig.nodeActions['${type}'].concurrencyPlaceholder`,
              )
            "
            v-model="rdoConcurrency"
          />
        </div>
      </ResourceField>
      <ResourceField class="radio-wrapper options-radio rdo-type-option">
        <template #label>
          <span class="cursor-pointer">
            {{ $t("subscriptionEditor.resolveType") }}
            <HelpTip :help="rdoTypeInfo()" />
          </span>
        </template>
        <ChoiceGroup direction="horizontal" v-model="rdoType">
          <ChoiceOption
            v-for="(key, index) in rdoTypeOpt"
            :label="key"
            :key="index"
          >
            {{
              $t(`editorPage.subConfig.nodeActions['${type}'].types[${index}]`)
            }}
            <!-- <UIcon mode="svg" class="size-4 shrink-0 align-middle" v-if="key === 'IPv6'" @click="rdoTypeInfo" name="i-lucide-circle-help"/> -->
          </ChoiceOption>
        </ChoiceGroup>
      </ResourceField>

      <ResourceField class="radio-wrapper options-radio">
        <template #label>{{ $t("subscriptionEditor.filterResult") }}</template>
        <ChoiceGroup direction="horizontal" v-model="rdoFilter">
          <ChoiceOption
            v-for="(key, index) in rdoFilterOpt"
            :label="key"
            :key="index"
          >
            {{
              $t(
                `editorPage.subConfig.nodeActions['${type}'].filters[${index}]`,
              )
            }}
          </ChoiceOption>
        </ChoiceGroup>
      </ResourceField>
      <ResourceField class="radio-wrapper options-radio">
        <template #label>{{ $t("subscriptionEditor.cache") }}</template>
        <ChoiceGroup direction="horizontal" v-model="rdoCache">
          <ChoiceOption
            v-for="(key, index) in rdoCacheOpt"
            :label="key"
            :key="index"
          >
            {{
              $t(`editorPage.subConfig.nodeActions['${type}'].cache[${index}]`)
            }}
          </ChoiceOption>
        </ChoiceGroup>
      </ResourceField>
      <ResourceField
        prop="cacheTtl"
        :rules="[
          {
            validator: () => isOptionalNonNegativeNumber(rdoCacheTtl),
            message: $t('actionValidation.nonNegativeNumber'),
          },
        ]"
        v-if="rdoCache === 'enabled'"
        class="radio-wrapper options-radio inline-input-option"
      >
        <template #label>
          {{ $t(`editorPage.subConfig.nodeActions['${type}'].cacheTtl`) }}
        </template>
        <div
          class="input-wrapper compact-input-wrapper compact-input-wrapper--concurrency"
        >
          <FieldInput
            type="number"
            :placeholder="
              $t(
                `editorPage.subConfig.nodeActions['${type}'].cacheTtlPlaceholder`,
              )
            "
            v-model="rdoCacheTtl"
          />
        </div>
      </ResourceField>
    </template>
    <template
      v-if="type === 'Flag Operator' && foNewVersion && value === 'add'"
    >
      <ResourceField class="radio-wrapper options-radio">
        <template #label>
          <span class="des-label flag-operator">
            <span>识别为</span>
            <img :src="tw" alt="" />
            <span>时</span>
            <HelpTip :help="showTwTips()" />
          </span>
        </template>
        <ChoiceGroup direction="horizontal" v-model="foTw">
          <ChoiceOption
            v-for="(key, index) in foTwOpt"
            :label="key"
            :key="index"
          >
            {{
              $t(
                `editorPage.subConfig.nodeActions['${type}'].twOptions[${index}]`,
              )
            }}
          </ChoiceOption>
        </ChoiceGroup>
      </ResourceField>
    </template>
  </div>
</template>

<script lang="ts" setup>
  import { useI18n } from "vue-i18n";
  import { isOptionalPositiveInteger, isOptionalNonNegativeNumber } from "../actionValidation";
  import semverGt from 'semver/functions/gt';
  import { useAppNotifyStore } from '@/store/appNotify';
  import { storeToRefs } from 'pinia';
  import { useGlobalStore } from '@/store/global';
  import { inject, onMounted, ref, watch } from 'vue';
  import tw from '@/assets/icons/tw.png';

  const { t } = useI18n();
  const globalStore = useGlobalStore();

  const { showNotify } = useAppNotifyStore();

  const { env } = storeToRefs(globalStore);

  const { type, id } = defineProps<{
    type: string;
    id: string;
  }>();

  const form = inject<Sub | Collection>('form');

  // 此处 key 需要与 i18n 的 actions 中的 key 相同
  // 值的次序需要与该选项的 options 值 顺序相同
  const opt = {
    'Flag Operator': ['add', 'remove'],
    'Sort Operator': ['asc', 'desc', 'random'],
    'Resolve Domain Operator': ['Google', 'IP-API', 'Cloudflare', 'Ali', 'Tencent', 'Custom'],
  };

  const foTwOpt = ['cn', 'ws', 'tw'];
  const rdoTypeOpt = ['IPv4', 'IPv6'];
  const rdoFilterOpt = ['disabled', 'removeFailed', 'IPOnly', 'IPv4Only', 'IPv6Only'];
  const rdoCacheOpt = ['enabled' , 'disabled'];
  const rdoTlsSkipCertVerifyOpt = ['disabled', 'enabled'];

  const value = ref();
  const rdoNewVersion = ref(true);
  const foNewVersion = ref(true);
  
  // const rdoNewVersion = ref(false);
  // const foNewVersion = ref(false);

  // try {
  //   rdoNewVersion.value = semverGt(env.value.version, '2.14.184')
  // } catch (e) {}
  // try {
  //   foNewVersion.value = semverGt(env.value.version, '2.14.119')
  // } catch (e) {}

  const foTw = ref('cn');
  const rdoType = ref('IPv4');
  const rdoFilter = ref('disabled');
  const rdoCache = ref('enabled');
  const rdoTlsSkipCertVerify = ref('disabled');
  const rdoUrl = ref('');
  const rdoEdns = ref('');
  const rdoDnsConcurrency = ref('');
  const rdoConcurrency = ref('');
  const rdoTimeout = ref('');
  const rdoCacheTtl = ref('');

  const normalizeRdoConcurrency = () => {
    const value = `${rdoConcurrency.value ?? ''}`.trim();
    return value || undefined;
  };

  const getInitialRdoConcurrency = (value) => {
    return `${value ?? ''}`.trim();
  };

  const normalizeRdoDnsConcurrency = () => {
    const value = `${rdoDnsConcurrency.value ?? ''}`.trim();
    return value || undefined;
  };

  const getInitialRdoDnsConcurrency = (value) => {
    return `${value ?? ''}`.trim();
  };

  const normalizeRdoTimeout = () => {
    const value = `${rdoTimeout.value ?? ''}`.trim();
    return value || undefined;
  };

  const getInitialRdoTimeout = (value) => {
    return `${value ?? ''}`.trim();
  };

  const normalizeRdoCacheTtl = () => {
    const value = `${rdoCacheTtl.value ?? ''}`.trim();
    return value || undefined;
  };

  const getInitialRdoCacheTtl = (value) => {
    return `${value ?? ''}`.trim();
  };

  const showTwTips = () => ({
  content:
    "免责声明: 本操作仅将 Emoji 旗帜进行替换以便于显示, 不包含任何政治意味",
});
  const rdoTypeInfo = () => ({
  title: "IP4P 地址格式",
  content:
    "🆕 当选择解析类型为 IPv6 时\n将自动转换其中的 IP4P 地址\n\n来自 NATMap, 将 IPv4 地址和端口同时编码在 DNS AAAA 记录中\n\n使用场景: STUN 内网穿透, 无需公网服务器即可获得 IPv4 公网地址",
  href: "https://github.com/heiher/natmap/wiki/faq#%E5%9F%9F%E5%90%8D%E8%AE%BF%E9%97%AE%E6%98%AF%E5%A6%82%E4%BD%95%E5%AE%9E%E7%8E%B0%E7%9A%84",
});

  // 挂载时读取当前数据，赋值初始状态
  onMounted(() => {
    const item = form.process.find(item => item.id === id);

    if (item) {
      switch (type) {
        case 'Flag Operator':
          value.value = item.args?.mode ?? 'add';
          foTw.value = item.args?.tw ?? 'cn';
          break;
        case 'Sort Operator':
          value.value = item.args ?? 'asc';
          break;
        case 'Resolve Domain Operator':
          value.value = item.args?.provider ?? 'Custom';
          rdoType.value = item.args?.type ?? 'IPv4';
          if (rdoType.value === 'IP4P') {
            rdoType.value = 'IPv6';
          }
          rdoFilter.value = item.args?.filter ?? 'disabled';
          rdoCache.value = item.args?.cache ?? 'enabled';
          rdoTlsSkipCertVerify.value =
            item.args?.tlsSkipCertVerify ?? 'disabled';
          rdoUrl.value = item.args?.url ?? '';
          rdoEdns.value = item.args?.edns;
          rdoDnsConcurrency.value = getInitialRdoDnsConcurrency(
            item.args?.dnsConcurrency
          );
          rdoConcurrency.value = getInitialRdoConcurrency(item.args?.concurrency);
          rdoTimeout.value = getInitialRdoTimeout(item.args?.timeout);
          rdoCacheTtl.value = getInitialRdoCacheTtl(item.args?.cacheTtl);
          break;
      }
    }
  });

  // 值变化时实时修改 form 的数据
  watch([
    value,
    rdoFilter,
    rdoCache,
    rdoTlsSkipCertVerify,
    rdoUrl,
    rdoEdns,
    rdoDnsConcurrency,
    rdoConcurrency,
    rdoTimeout,
    rdoCacheTtl,
    rdoType,
    foTw,
  ], () => {
    const item = form.process.find(item => item.id === id);
    switch (type) {
      case 'Flag Operator':
        item.args = {
          mode: value.value,
          tw: foTw.value,
        };
        break;
      case 'Sort Operator':
        item.args = value.value;
        break;
      case 'Resolve Domain Operator':
        item.args = {
          provider: value.value,
          type: rdoType.value,
          filter: rdoFilter.value,
          cache: rdoCache.value,
          tlsSkipCertVerify: rdoTlsSkipCertVerify.value,
          url: rdoUrl.value,
          edns: rdoEdns.value,
          dnsConcurrency: normalizeRdoDnsConcurrency(),
          concurrency: normalizeRdoConcurrency(),
          timeout: normalizeRdoTimeout(),
          cacheTtl:
            rdoCache.value === 'enabled'
              ? normalizeRdoCacheTtl()
              : undefined,
        };
        break;
    }
  });
  
</script>

<style lang="scss" scoped>
  .des-label {
    font-size: 12px;
    margin-bottom: 8px;
    color: var(--ui-text-muted);
    &.flag-operator {
      display: flex;
      align-items: center;
      cursor: pointer;
      img {
        width: 14px;
        height: 14px;
      }
      span {
        margin: 0 4px;
      }
    }
  }
  .input-wrapper {
    display: flex;
    align-items: center;
  }
  .compact-input-wrapper {
  }
  .compact-input-wrapper--custom-dns,
  .compact-input-wrapper--edns {
    max-width: 520px;
  }
  .compact-input-wrapper--custom-dns {
    max-width: 760px;
  }
  .compact-textarea-wrapper {
  }
  .compact-textarea-wrapper--custom-dns {
    width: 100%;
    max-width: 760px;
  }
  .compact-input-wrapper--concurrency {
    flex: 0 1 280px;
    max-width: 280px;
  }
  .custom-dns-input-option {
    margin-top: 8px;
  }
  .tls-skip-cert-option {
    margin-top: 10px;
  }
  .custom-dns-input-option,
  .tls-skip-cert-option,
  .edns-input-option {
    .des-label {
      margin-bottom: 2px;
    }
  }
  .inline-input-option {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 4px 0 6px;

    .des-label {
      flex: 0 0 auto;
      margin-bottom: 0;
    }

    .input-wrapper {
      flex: 1;
      min-width: 0;
    }
  }
  .rdo-type-option {
    margin-top: 10px;
  }
</style>
