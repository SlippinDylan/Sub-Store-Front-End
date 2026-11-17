import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import { onBeforeRouteLeave, onBeforeRouteUpdate, useRouter, type RouteLocationNormalized } from "vue-router";
import { useI18n } from "vue-i18n";
import { Dialog } from "@/services/feedback";

export const useUnsavedChanges = (
  snapshot: () => string,
  ready: () => boolean,
  busy: () => boolean,
  additionalDirty: () => boolean = () => false,
) => {
  const { t } = useI18n();
  const router = useRouter();
  let savedDestination: string | undefined;
  const savedSnapshot = ref<string>();
  const hasUnsavedChanges = computed(
    () =>
      additionalDirty() || (savedSnapshot.value !== undefined && snapshot() !== savedSnapshot.value),
  );
  const markSaved = () => {
    savedSnapshot.value = snapshot();
  };
  watch(
    ready,
    async (loaded) => {
      if (loaded) {
        await nextTick();
        markSaved();
      }
    },
    { immediate: true },
  );

  const confirmLeave = (to: RouteLocationNormalized) => {
    if (busy() && to.fullPath !== savedDestination) return false;
    if (!hasUnsavedChanges.value) return true;
    return new Promise<boolean>((resolve) => {
      Dialog({
        title: t("subscriptionEditor.unsavedTitle"),
        content: t("subscriptionEditor.unsavedDescription"),
        okText: t("subscriptionEditor.discard"),
        cancelText: t("subscriptionEditor.keepEditing"),
        onOk: () => resolve(true),
        onClosed: () => resolve(false),
        closeOnClickOverlay: false,
      });
    });
  };
  onBeforeRouteLeave(confirmLeave);
  onBeforeRouteUpdate((to, from) =>
    to.fullPath === from.fullPath
      || (to.path === from.path && to.meta.editorPreview && from.meta.editorPreview)
      || to.path === `${from.path}/preview` || from.path === `${to.path}/preview`
      ? !busy() : confirmLeave(to),
  );
  const beforeUnload = (event: BeforeUnloadEvent) => {
    if (hasUnsavedChanges.value || busy()) {
      event.preventDefault();
      event.returnValue = "";
    }
  };
  window.addEventListener("beforeunload", beforeUnload);
  onBeforeUnmount(() =>
    window.removeEventListener("beforeunload", beforeUnload),
  );
  const navigateAfterSave = async (destination: string) => {
    savedDestination = destination;
    try {
      await router.replace(destination);
    } finally {
      savedDestination = undefined;
    }
  };
  return { markSaved, navigateAfterSave };
};
