import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import * as vue from "vue";
import { createPinia, setActivePinia } from "pinia";
import ts from "typescript";
import { usePreviewSession } from "../src/store/previewSession.ts";

const compiled = ts.transpile(readFileSync(new URL("../src/hooks/usePreviewRequest.ts", import.meta.url), "utf8"), { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.CommonJS });
const setup = () => {
  setActivePinia(createPinia());
  const route = vue.reactive({ fullPath: "/subs" });
  const preview = usePreviewSession();
  const exports = {};
  runInNewContext(compiled, {
    exports,
    require: name => {
      if (name === "vue") return vue;
      if (name === "vue-router") return { useRoute: () => route };
      if (name === "@/store/previewSession") return { usePreviewSession: () => preview };
      throw new Error(`Unexpected import: ${name}`);
    },
  });
  const scope = vue.effectScope();
  const begin = scope.run(exports.usePreviewRequest);
  return { route, preview, scope, begin };
};

test("leaving and returning to the same page still expires its original request", () => {
  const { route, scope, begin } = setup();
  const isCurrent = begin();
  assert.equal(isCurrent(), true);
  route.fullPath = "/my";
  route.fullPath = "/subs";
  assert.equal(isCurrent(), false);
  scope.stop();
});

test("unmounting the origin expires its pending preview", () => {
  const { scope, begin } = setup();
  const isCurrent = begin();
  scope.stop();
  assert.equal(isCurrent(), false);
});

test("backend clearing and newer previews expire pending opening requests", () => {
  const { preview, scope, begin } = setup();
  const old = begin();
  const latest = begin();
  assert.equal(old(), false);
  assert.equal(latest(), true);
  preview.clear();
  assert.equal(latest(), false);
  const pending = begin();
  preview.open({ kind: "file", name: "new", returnPath: "/files", data: {}, refresh: async () => ({}) });
  assert.equal(pending(), false);
  scope.stop();
});

test("starting an opening request does not strand an active refresh in loading state", async () => {
  const { preview, scope, begin } = setup();
  let finish;
  preview.open({ kind: "file", name: "existing", returnPath: "/files", data: {}, refresh: () => new Promise(resolve => { finish = resolve; }) });
  const refreshing = preview.refresh();
  begin();
  finish({ processed: "done" });
  await refreshing;
  assert.equal(preview.loading, false);
  scope.stop();
});
