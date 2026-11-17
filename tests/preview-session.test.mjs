import assert from "node:assert/strict";
import { test } from "node:test";
import { createPinia, setActivePinia } from "pinia";
import { usePreviewSession } from "../src/store/previewSession.ts";

test("refresh keeps the active preview when an older request finishes", async () => {
  setActivePinia(createPinia());
  const preview = usePreviewSession();
  let resolve;
  const response = new Promise((done) => { resolve = done; });
  preview.open({ kind: "nodes", name: "first", returnPath: "/subs", data: { original: [] }, refresh: () => response });
  const pending = preview.refresh();
  assert.equal(preview.loading, true);
  preview.open({ kind: "file", name: "second", returnPath: "/files", data: { processed: "new" }, refresh: async () => ({ processed: "refreshed" }) });
  resolve({ processed: [{ name: "old" }] });
  await pending;
  assert.equal(preview.session.name, "second");
  assert.deepEqual(preview.session.data, { processed: "new" });
  assert.equal(preview.loading, false);
  await preview.refresh();
  assert.deepEqual(preview.session.data, { processed: "refreshed" });
});

test("refresh exposes failures and clears the loading state", async () => {
  setActivePinia(createPinia());
  const preview = usePreviewSession();
  preview.open({ kind: "nodes", name: "draft", returnPath: "/edit/subs/UNTITLED", data: {}, refresh: async () => { throw new Error("failed"); } });
  await assert.rejects(preview.refresh(), /failed/);
  assert.equal(preview.loading, false);
});

test("clearing a backend session discards its data and ignores pending responses", async () => {
  setActivePinia(createPinia());
  const preview = usePreviewSession();
  let resolveOld;
  let resolveNew;
  preview.open({ kind: "nodes", name: "same-name", returnPath: "/subs", data: { backend: "A" }, refresh: () => new Promise(resolve => { resolveOld = resolve; }) });
  const oldRequest = preview.refresh();
  preview.clear();
  assert.equal(preview.session, undefined);
  assert.equal(preview.loading, false);
  await preview.refresh();
  preview.open({ kind: "nodes", name: "same-name", returnPath: "/subs", data: null, refresh: () => new Promise(resolve => { resolveNew = resolve; }) });
  const newRequest = preview.refresh();
  resolveOld({ backend: "A" });
  await oldRequest;
  assert.equal(preview.session.data, null);
  assert.equal(preview.loading, true);
  resolveNew({ backend: "B" });
  await newRequest;
  assert.deepEqual(preview.session.data, { backend: "B" });
  assert.equal(preview.loading, false);
});
