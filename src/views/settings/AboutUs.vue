<template>
  <div class="page-wrapper about-cards">
    <UCard
      v-for="card in cards"
      :key="card.id"
      :ui="{ root: 'flex flex-col', body: 'flex-1 p-4 sm:p-4', footer: 'p-0 sm:p-0' }"
    >
      <div class="flex items-center gap-3">
        <div class="about-card-icon">
          <UIcon mode="svg" :name="card.icon" class="size-5" />
        </div>
        <div class="min-w-0">
          <h3 class="text-sm font-semibold">{{ card.title }}</h3>
          <div v-if="card.version" class="mt-1 text-xs text-muted">
            <a v-if="card.hasNewVersion" :href="card.links[0].url" target="_blank" rel="noopener noreferrer">
              <UBadge size="sm" variant="soft">v{{ card.version }} · NEW</UBadge>
            </a>
            <span v-else>v{{ card.version }}</span>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="grid grid-cols-2 divide-x divide-default">
          <UButton
            v-for="link in card.links"
            :key="link.label"
            :to="link.url"
            target="_blank"
            rel="noopener noreferrer"
            :icon="link.icon"
            size="sm"
            color="neutral"
            variant="ghost"
            class="justify-center rounded-none py-3"
          >{{ link.label }}</UButton>
        </div>
      </template>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';
import { useGlobalStore } from '@/store/global';

const { env } = storeToRefs(useGlobalStore());
const { t } = useI18n();
const version = import.meta.env.PACKAGE_VERSION;

type ProjectCard = {
  id: string;
  title: string;
  icon: string;
  version?: string;
  hasNewVersion?: boolean;
  links: { label: string; url: string; icon: string }[];
};
const cards = computed<ProjectCard[]>(() => [
  {
    id: 'frontend',
    title: t('aboutUsPage.projectInfo.fe'),
    icon: 'i-lucide-monitor',
    version,
    links: [
      { label: 'GitHub', url: 'https://github.com/sub-store-org/Sub-Store-Front-End', icon: 'i-lucide-github' },
      { label: t('aboutUsPage.changelogs.title'), url: 'https://github.com/sub-store-org/Sub-Store-Front-End/releases', icon: 'i-lucide-scroll-text' },
    ],
  },
  {
    id: 'backend',
    title: t(env.value.backend === 'Node' ? 'aboutUsPage.projectInfo.be' : 'aboutUsPage.projectInfo.module'),
    icon: 'i-lucide-server',
    version: env.value.version,
    hasNewVersion: env.value.hasNewVersion,
    links: [
      { label: 'GitHub', url: env.value.backend === 'Node' ? 'https://github.com/sub-store-org/Sub-Store/releases' : 'https://github.com/sub-store-org/Sub-Store/tree/master/config', icon: 'i-lucide-github' },
      { label: t('aboutUsPage.changelogs.title'), url: 'https://github.com/sub-store-org/Sub-Store/releases', icon: 'i-lucide-scroll-text' },
    ],
  },
  {
    id: 'team',
    title: t('aboutUsPage.projectInfo.team'),
    icon: 'i-lucide-github',
    links: [
      { label: 'GitHub', url: 'https://github.com/sub-store-org', icon: 'i-lucide-github' },
      { label: 'Telegram', url: 'https://telegram.me/cool_scripts', icon: 'i-lucide-send' },
    ],
  },
  {
    id: 'tutorial',
    title: t('aboutUsPage.projectInfo.scriptTutorial'),
    icon: 'i-lucide-code',
    links: [
      { label: 'GitHub', url: 'https://github.com/sub-store-org/Sub-Store/wiki', icon: 'i-lucide-github' },
      { label: 'Telegram', url: 'https://telegram.me/zhetengsha/214', icon: 'i-lucide-send' },
    ],
  },
]);
</script>

<style scoped>
.about-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr));
  gap: 18px;
}
.about-card-icon {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: var(--ui-bg-muted);
  color: var(--ui-text-toned);
}
</style>
