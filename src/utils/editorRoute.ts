import type { RouteLocationNormalizedLoaded } from "vue-router";

export const getEditorPath = (
  route: Pick<RouteLocationNormalizedLoaded, "path" | "meta">,
) => route.meta.editorPreview ? route.path.replace(/\/preview\/?$/, "") : route.path;
