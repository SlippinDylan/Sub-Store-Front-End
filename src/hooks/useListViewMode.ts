import { computed } from 'vue';

export const useListViewMode = () => {
  // Workspace rows stay in one column without overwriting saved appearance settings.
  const effectiveListViewMode = computed<ListPageViewMode>(() => 'single-column');
  const showListViewToggle = computed(() => false);

  return { effectiveListViewMode, showListViewToggle };
};
