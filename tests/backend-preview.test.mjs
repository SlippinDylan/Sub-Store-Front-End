import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import { createPinia, setActivePinia } from "pinia";
import ts from "typescript";
import { usePreviewSession } from "../src/store/previewSession.ts";

const source = ts.createSourceFile("global.ts", readFileSync(new URL("../src/store/global.ts", import.meta.url), "utf8"), ts.ScriptTarget.Latest, true);
let action;
const findAction = node => {
  if (ts.isMethodDeclaration(node) && node.name.getText(source) === "setHostAPI") action = node.getText(source);
  ts.forEachChild(node, findAction);
};
findAction(source);
const compiled = ts.transpile(`({ ${action} })`, { target: ts.ScriptTarget.ESNext });

test("backend switching clears preview before initialization, including skipInit", async () => {
  for (const skipInit of [false, true]) {
    setActivePinia(createPinia());
    const preview = usePreviewSession();
    const backend = { ishostApi: "A" };
    const service = { defaults: { baseURL: "A" } };
    let initializations = 0;
    const { setHostAPI } = runInNewContext(compiled, {
      usePreviewSession: () => preview,
      service,
      initStores: async () => {
        initializations++;
        assert.equal(preview.session, undefined);
        assert.equal(service.defaults.baseURL, "B");
      },
    });
    preview.open({ kind: "nodes", name: "same-name", returnPath: "/subs", data: { backend: "A" }, refresh: async () => ({}) });
    await setHostAPI.call(backend, "A", { skipInit: true });
    assert.equal(preview.session.data.backend, "A");
    await setHostAPI.call(backend, "B", { skipInit });
    assert.equal(preview.session, undefined);
    assert.equal(backend.ishostApi, "B");
    assert.equal(service.defaults.baseURL, "B");
    assert.equal(initializations, skipInit ? 0 : 1);
  }
});
