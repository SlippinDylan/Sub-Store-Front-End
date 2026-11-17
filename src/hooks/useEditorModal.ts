import { computed } from "vue";
import { useRoute } from "vue-router";

const resourcePages: Record<string, string> = {
  subs: "/subs",
  collections: "/subs",
  files: "/files",
  sync: "/sync",
  shares: "/shares",
};

export const useEditorModal = () => {
  const route = useRoute();
  const isSubscriptionEditor = computed(() =>
    route.path.startsWith('/edit/') && ['subs', 'collections'].includes(String(route.params.editType)),
  );
  const isPageEditor = computed(() => isSubscriptionEditor.value ||
    route.path.startsWith('/edit/files/') || route.path.startsWith('/edit/sync/') || route.path.startsWith('/edit/shares/'),
  );
  const parentPath = computed(() =>
    route.path.startsWith("/edit/")
      ? resourcePages[route.path.split("/")[2]]
      : undefined,
  );
  return { parentPath, isSubscriptionEditor, isPageEditor };
};
