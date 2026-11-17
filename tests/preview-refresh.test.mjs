import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import { createPinia, setActivePinia } from "pinia";
import { effectScope } from "vue";
import { parse } from "vue/compiler-sfc";
import ts from "typescript";
import { usePreviewSession } from "../src/store/previewSession.ts";

const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
const tick = () => new Promise(resolve => setImmediate(resolve));
const script = file => {
  const { descriptor } = parse(readFileSync(new URL(`../src/${file}`, import.meta.url), "utf8"));
  return ts.createSourceFile(file, descriptor.scriptSetup.content, ts.ScriptTarget.Latest, true);
};
const handlers = (file, names, context) => {
  const source = script(file);
  const declarations = source.statements.filter(ts.isVariableStatement)
    .flatMap(statement => statement.declarationList.declarations)
    .filter(declaration => names.includes(declaration.name.getText(source)))
    .map(declaration => `const ${declaration.getText(source)};`).join("\n");
  return runInNewContext(ts.transpile(`(() => { ${declarations} return { ${names.join(", ")} }; })()`, { target: ts.ScriptTarget.ESNext }), context);
};

for (const [file, refresh, generate, state] of [
  ["components/SubListItem.vue", "refreshCompare", "fetchCompareData", "compareData"],
  ["components/FileListItem.vue", "refreshPreview", "doPreview", "previewData"],
]) {
  for (const stage of ["source", "compare"]) {
    for (const invalidate of ["clear", "replace"]) {
      test(`${file}: ${invalidate} during ${stage} prevents stale calls and shared-store writes`, async () => {
        setActivePinia(createPinia());
        const preview = usePreviewSession();
        const source = deferred(), comparison = deferred();
        const calls = [];
        const output = { value: "original" };
        const { [refresh]: run } = handlers(file, [refresh, generate], {
          name: "same-name", props: { type: "sub", sub: {}, file: {} },
          subsApi: {
            getOne: () => source.promise,
            compareSub: () => { calls.push("compare"); return comparison.promise; },
          },
          filesApi: { getWholeFile: () => source.promise },
          subsStore: { setOneData: () => calls.push("store") },
          refreshSubFlowsIfNeeded: async () => { calls.push("flow"); },
          [state]: output, Toast: { loading() {}, hide() {} },
          formatPreviewError: String, console,
        });
        preview.open({ kind: "nodes", name: "same-name", returnPath: "/subs", data: "old", refresh: run });
        const pending = preview.refresh();
        const oldSource = { name: "same-name", backend: "A" };
        if (stage === "compare") {
          source.resolve({ data: { status: "success", data: oldSource } });
          await tick();
          assert.deepEqual(calls, ["compare"]);
        }
        if (invalidate === "clear") preview.clear();
        else preview.open({ kind: "file", name: "new", returnPath: "/files", data: "new", refresh: async () => "new" });
        source.resolve({ data: { status: "success", data: oldSource } });
        comparison.resolve({ data: { status: "success", data: "stale" } });
        await pending;
        assert.equal(output.value, "original");
        assert.deepEqual(calls, stage === "compare" ? ["compare"] : []);
        assert.equal(preview.session?.data, invalidate === "clear" ? undefined : "new");
      });
    }
  }

  for (const stage of ["source", "compare"]) {
    test(`${file}: expired ${stage} failure cannot replace preview state or refresh flows`, async () => {
      setActivePinia(createPinia());
      const preview = usePreviewSession();
      const response = deferred();
      const output = { value: "original" };
      let flowCalls = 0;
      const runSource = () => stage === "source" ? response.promise : Promise.resolve({ data: { status: "success", data: {} } });
      const { [refresh]: run } = handlers(file, [refresh, generate], {
        name: "saved", props: { type: "sub", sub: {}, file: {} },
        subsApi: { getOne: runSource, compareSub: () => response.promise },
        filesApi: { getWholeFile: runSource },
        subsStore: { setOneData: () => assert.fail("stale store write") },
        refreshSubFlowsIfNeeded: async () => { flowCalls++; },
        [state]: output, Toast: { loading() {}, hide() {} },
        formatPreviewError: String, console: { error() {} },
      });
      preview.open({ kind: "nodes", name: "saved", returnPath: "/subs", data: null, refresh: run });
      const pending = preview.refresh();
      await tick();
      preview.clear();
      response.reject(new Error("old-backend failure"));
      await pending;
      assert.equal(output.value, "original");
      assert.equal(flowCalls, 0);
      assert.equal(preview.session, undefined);
    });
  }

  test(`${file}: valid refresh survives source scope disposal and publishes its own result`, async () => {
    setActivePinia(createPinia());
    const preview = usePreviewSession();
    const calls = [];
    const output = { value: null };
    const source = { name: "saved" };
    const result = { processed: [] };
    const scope = effectScope();
    scope.run(() => {
      const { [refresh]: run } = handlers(file, [refresh, generate], {
        name: "saved", props: { type: "sub", sub: source, file: source },
        subsApi: { getOne: async () => ({ data: { status: "success", data: source } }), compareSub: async () => ({ data: { status: "success", data: result } }) },
        filesApi: { getWholeFile: async () => ({ data: { status: "success", data: source } }) },
        subsStore: { setOneData: (...args) => calls.push(args) },
        refreshSubFlowsIfNeeded: async () => {},
        [state]: output, Toast: { loading() {}, hide() {} }, formatPreviewError: String, console,
      });
      preview.open({ kind: "nodes", name: "saved", returnPath: "/subs", data: null, refresh: run });
    });
    scope.stop();
    await preview.refresh();
    assert.equal(preview.session.data, result);
    assert.equal(output.value, result);
    assert.equal(calls.length, 1);
    assert.equal(calls[0][2], source);
  });
}

for (const [file, refresh, generate, state] of [
  ["views/SubEditor.vue", "refreshCompare", "fetchCompareData", "compareData"],
  ["views/FileEditor.vue", "refreshPreview", "fetchPreviewData", "previewData"],
]) {
  test(`${file}: expired draft refresh cannot change the editor preview state`, async () => {
    const pending = deferred();
    const output = { value: "original" };
    const { [refresh]: run } = handlers(file, [refresh], { [generate]: () => pending.promise, [state]: output });
    let current = true;
    const request = run(() => current);
    current = false;
    pending.resolve("stale");
    await request;
    assert.equal(output.value, "original");
    const data = await run(() => true);
    assert.equal(data, "stale");
    assert.equal(output.value, data);
  });
}

test("saved-source workspace stops before compare when its refresh session expires", async () => {
  const source = script("views/PreviewWorkspace.vue");
  let callback;
  const find = node => {
    if (ts.isPropertyAssignment(node) && node.name.getText(source) === "refresh") callback = node.initializer.getText(source);
    ts.forEachChild(node, find);
  };
  find(source);
  for (const sourceType of ["sub", "collection", "file"]) {
    const response = deferred();
    let compared = 0;
    const run = runInNewContext(ts.transpile(`(${callback})`, { target: ts.ScriptTarget.ESNext }), {
      sourceType, sourceName: "saved",
      filesApi: { getWholeFile: () => response.promise },
      subsApi: { getOne: () => response.promise, compareSub: async () => { compared++; } },
    });
    let current = true;
    const pending = run(() => current);
    current = false;
    response.resolve({ data: { status: "success", data: {} } });
    await pending;
    assert.equal(compared, 0);
  }
});
