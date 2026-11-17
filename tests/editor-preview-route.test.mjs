import assert from "node:assert/strict";
import { test } from "node:test";
import { createMemoryHistory, createRouter } from "vue-router";
import { getEditorPath } from "../src/utils/editorRoute.ts";

test("preview resource names stay distinct from preview child routes", () => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{
      path: "/edit/:editType(subs|collections|files)/:id",
      component: {},
      children: [{ path: "preview", component: {}, meta: { editorPreview: true } }],
    }],
  });
  for (const type of ["subs", "collections", "files"]) {
    for (const name of ["ordinary", "preview", "a%2Fb"]) {
      const path = `/edit/${type}/${name}`;
      const editor = router.resolve(path);
      assert.notEqual(editor.meta.editorPreview, true);
      assert.equal(getEditorPath(editor), path);
      for (const suffix of ["/preview", "/preview/"]) {
        const preview = router.resolve(path + suffix);
        assert.equal(preview.meta.editorPreview, true);
        assert.equal(getEditorPath(preview), path);
      }
    }
  }
});
