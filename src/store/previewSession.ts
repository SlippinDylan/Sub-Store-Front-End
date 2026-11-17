import { defineStore } from "pinia";
import { shallowRef, ref } from "vue";

type PreviewSession = {
  kind: "nodes" | "file";
  source?: { type: "sub" | "collection" | "file"; name: string };
  name: string;
  returnPath: string;
  data: unknown;
  refresh: (isCurrent: () => boolean) => Promise<unknown>;
};

// Draft preview data stays in memory; it must never become URL or storage content.
export const usePreviewSession = defineStore("previewSession", () => {
  const session = shallowRef<PreviewSession>();
  const loading = ref(false);
  let requestId = 0;
  let openingRequestId = 0;
  const beginRequest = () => {
    const id = ++openingRequestId;
    return () => id === openingRequestId;
  };
  const clear = () => {
    requestId++;
    openingRequestId++;
    session.value = undefined;
    loading.value = false;
  };
  const open = (value: PreviewSession) => {
    requestId++;
    openingRequestId++;
    loading.value = false;
    session.value = value;
  };
  const refresh = async () => {
    if (!session.value || loading.value) return;
    const currentRequest = ++requestId;
    loading.value = true;
    try {
      const current = session.value;
      const isCurrent = () => currentRequest === requestId && session.value === current;
      const data = await current.refresh(isCurrent);
      if (isCurrent()) session.value = { ...current, data };
    } finally {
      if (currentRequest === requestId) loading.value = false;
    }
  };
  return { session, loading, open, refresh, clear, beginRequest };
});
