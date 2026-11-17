import { onScopeDispose, watch } from "vue";
import { useRoute } from "vue-router";
import { usePreviewSession } from "@/store/previewSession";

export const usePreviewRequest = () => {
  const route = useRoute();
  const preview = usePreviewSession();
  let routeRevision = 0;
  let disposed = false;
  watch(() => route.fullPath, () => { routeRevision++; }, { flush: "sync" });
  onScopeDispose(() => { disposed = true; });

  return () => {
    const revision = routeRevision;
    const isLatestRequest = preview.beginRequest();
    return () => !disposed && revision === routeRevision && isLatestRequest();
  };
};
