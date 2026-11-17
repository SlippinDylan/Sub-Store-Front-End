<template>
  <UPopover
    v-model:open="open"
    :content="{ side: 'top', align: 'start', sideOffset: 8 }"
  >
    <UButton
      :size="isDesktop ? 'sm' : 'md'"
      v-bind="$attrs"
      icon="i-lucide-languages"
      color="neutral"
      :variant="variant === 'sidebar' ? 'ghost' : 'outline'"
      :class="
        variant === 'sidebar' ? 'w-full justify-start px-2.5 py-2 text-sm' : ''
      "
      :ui="{ leadingIcon: variant === 'sidebar' ? 'size-3.5' : 'size-4' }"
      :aria-label="`${t('navBar.langSwitcher.cellTitle')}：${currentLanguage}`"
      :title="currentLanguage"
    >
      <template
        v-if="!collapsed && (variant === 'sidebar' || variant === 'row')"
      >
        <span>语言</span>
        <span class="ms-auto text-xs text-muted">{{ currentLanguage }}</span>
      </template>
    </UButton>
    <template #content>
      <div
        class="flex min-w-40 flex-col gap-1 p-1"
        role="group"
        :aria-label="t('navBar.langSwitcher.cellTitle')"
      >
        <UButton
          :size="isDesktop ? 'sm' : 'md'"
          v-for="lang in SUPPORTED_LOCALES"
          :key="lang.key"
          :label="t(lang.labelKey)"
          :trailing-icon="
            lang.key === currentLocale ? 'i-lucide-check' : undefined
          "
          :color="lang.key === currentLocale ? 'primary' : 'neutral'"
          variant="ghost"
          class="justify-start"
          :ui="{ trailingIcon: 'ms-auto size-3.5' }"
          :aria-pressed="lang.key === currentLocale"
          @click="changeLang(lang.key)"
        />
      </div>
    </template>
  </UPopover>
</template>

<script setup lang="ts">
import { useMediaQuery } from "@vueuse/core";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import {
  SUPPORTED_LOCALES,
  normalizeLocale,
  getLocaleConfig,
  type SupportedLocale,
} from "@/locales/languages";
const isDesktop = useMediaQuery("(min-width: 768px)");

defineOptions({ inheritAttrs: false });
withDefaults(
  defineProps<{
    variant?: "compact" | "icon" | "row" | "sidebar";
    collapsed?: boolean;
  }>(),
  { variant: "compact", collapsed: false },
);
const { t, locale } = useI18n();
const open = ref(false);
const currentLocale = computed(() => normalizeLocale(locale.value));
const currentLanguage = computed(() =>
  t(getLocaleConfig(currentLocale.value).labelKey),
);
const changeLang = (language: SupportedLocale) => {
  locale.value = language;
  localStorage.setItem("locale", language);
  open.value = false;
};
</script>
