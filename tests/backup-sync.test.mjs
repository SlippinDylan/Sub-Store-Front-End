import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { parse } from "vue/compiler-sfc";

const { descriptor } = parse(readFileSync(new URL("../src/views/My.vue", import.meta.url), "utf8"));
const source = ts.createSourceFile("My.ts", descriptor.scriptSetup.content, ts.ScriptTarget.Latest, true);
const names = new Set(["sync", "fileChange", "reloadRestoredSettings"]);
const declarations = source.statements.filter(ts.isVariableStatement)
  .flatMap(statement => statement.declarationList.declarations)
  .filter(declaration => names.has(declaration.name.getText(source)))
  .map(declaration => `const ${declaration.getText(source)};`).join("\n");
const compiled = ts.transpile(`${declarations}\n;({sync, fileChange})`, { target: ts.ScriptTarget.ESNext });
const tick = () => new Promise(resolve => setImmediate(resolve));
const fixture = ({ failAt, pauseAt, workerSupport = true, cacheSupport = true } = {}) => {
  const calls = [], notices = [], errors = [];
  const uploadIsLoading = { value: false }, downloadIsLoading = { value: false }, restoreIsLoading = { value: false };
  const isBusy = { get value() { return uploadIsLoading.value || downloadIsLoading.value || restoreIsLoading.value; } };
  const globalStore = { fetchResult: true };
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  const step = async (name, result) => {
    calls.push(name);
    if (failAt === name) throw new Error(`${name} failed`);
    if (pauseAt === name) await gate;
    return result;
  };
  const response = () => ({ data: { status: failAt === "response" ? "failed" : "success" } });
  const cache = { keys: () => step("cacheKeys", ["old"]), delete: () => step("cacheDelete", true) };
  const file = { text: () => step("read", "backup content") };
  const event = { target: { files: [file], value: "selected.json" } };
  const { sync, fileChange } = runInNewContext(compiled, {
    uploadIsLoading, downloadIsLoading, restoreIsLoading, isBusy,
    useSettingsApi: () => ({ syncSettings: () => step("request", response()), restoreSettings: data => { assert.equal(data.content, "backup content"); return step("request", response()); } }),
    useSettingsStore: () => ({ fetchSettings: () => step("refresh") }),
    useGlobalStore: () => globalStore,
    initStores: async () => { await step("refresh"); globalStore.fetchResult = failAt !== "refreshResult"; },
    navigator: workerSupport ? { serviceWorker: { getRegistrations: () => step("workers", [{ unregister: () => step("unregister") }]) } } : {},
    caches: cache,
    window: { ...(cacheSupport ? { caches: cache } : {}), location: { reload: () => calls.push("reload") } },
    setTimeout: callback => { calls.push("delay"); if (pauseAt === "delay") gate.then(callback); else queueMicrotask(callback); },
    showNotify: notice => notices.push(notice), t: key => key,
    console: { error: error => errors.push(error) },
  });
  return { calls, notices, errors, event, sync, fileChange, isBusy, release };
};

for (const mode of ["upload", "download", "restore"]) {
  const invoke = f => mode === "restore" ? f.fileChange(f.event) : f.sync(mode);
  test(`${mode}: network failure releases the entire settings page and reports failure`, async () => {
    const f = fixture({ failAt: "request" });
    await invoke(f);
    assert.equal(f.isBusy.value, false);
    assert.equal(f.notices.length, 1);
    assert.equal(f.notices[0].type, "danger");
    assert.equal(f.calls.includes("reload"), false);
  });
  const failures = mode === "upload" ? ["response", "refresh"]
    : ["response", "refresh", "refreshResult", "workers", "unregister", "cacheKeys", "cacheDelete", ...(mode === "restore" ? ["read"] : [])];
  for (const failAt of failures) {
    test(`${mode}: ${failAt} failure unlocks without success or reload`, async () => {
      const f = fixture({ failAt });
      await invoke(f);
      assert.equal(f.isBusy.value, false);
      assert.equal(f.notices.length, 1);
      assert.equal(f.notices[0].type, "danger");
      assert.equal(f.calls.includes("reload"), false);
    });
  }
  const pauses = mode === "upload" ? ["request", "refresh"]
    : ["request", "refresh", "workers", "unregister", "cacheKeys", "cacheDelete", "delay", ...(mode === "restore" ? ["read"] : [])];
  for (const pauseAt of pauses) {
    test(`${mode}: ${pauseAt} stays locked and blocks a second operation`, async () => {
      const f = fixture({ pauseAt });
      const pending = invoke(f);
      await tick();
      assert.equal(f.isBusy.value, true);
      const count = f.calls.length;
      await f.sync(mode === "upload" ? "download" : "upload");
      await f.fileChange(f.event);
      assert.equal(f.calls.length, count);
      f.release();
      await pending;
      assert.equal(f.isBusy.value, false);
      assert.deepEqual(f.notices.map(notice => notice.type), ["success"]);
      assert.equal(f.calls.includes("reload"), mode !== "upload");
      if (mode === "restore") assert.equal(f.event.target.value, "");
    });
  }
}

test("canceling the file picker starts no restore", async () => {
  const f = fixture();
  await f.fileChange({ target: { files: [], value: "" } });
  assert.deepEqual(f.calls, []);
  assert.equal(f.isBusy.value, false);
});

for (const workerSupport of [true, false]) {
  for (const cacheSupport of [true, false]) {
    test(`restore succeeds with serviceWorker=${workerSupport}, caches=${cacheSupport}`, async () => {
      const f = fixture({ workerSupport, cacheSupport });
      await f.fileChange(f.event);
      assert.equal(f.isBusy.value, false);
      assert.equal(f.calls.includes("workers"), workerSupport);
      assert.equal(f.calls.includes("cacheKeys"), cacheSupport);
      assert.equal(f.calls.includes("reload"), true);
      assert.deepEqual(f.notices.map(notice => notice.type), ["success"]);
    });
  }
}

test("a failed read allows retrying the same selected file", async () => {
  const f = fixture({ failAt: "read" });
  await f.fileChange(f.event);
  assert.equal(f.isBusy.value, false);
  assert.equal(f.event.target.value, "");
  f.event.target.files[0].text = async () => "backup content";
  f.event.target.value = "selected.json";
  await f.fileChange(f.event);
  assert.equal(f.event.target.value, "");
  assert.equal(f.isBusy.value, false);
  assert.deepEqual(f.notices.map(notice => notice.type), ["danger", "success"]);
});
