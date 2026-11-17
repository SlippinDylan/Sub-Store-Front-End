import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import { parse } from "vue/compiler-sfc";
import ts from "typescript";

const entries = [
  ["components/SubListItem.vue", "compareSub", "fetchCompareData", "openComparePanel", "compareData"],
  ["components/FileListItem.vue", "previewFile", "doPreview", "openPreviewPanel", "previewData"],
  ["views/SubEditor.vue", "compare", "fetchCompareData", "openComparePanel", "compareData"],
  ["views/FileEditor.vue", "compare", "fetchPreviewData", "openPreviewPanel", "previewData"],
];

for (const [file, entry, fetch, open, result] of entries) {
  const { descriptor } = parse(readFileSync(new URL(`../src/${file}`, import.meta.url), "utf8"));
  const source = ts.createSourceFile(file, descriptor.scriptSetup.content, ts.ScriptTarget.Latest, true);
  const handler = source.statements.filter(ts.isVariableStatement)
    .flatMap(statement => statement.declarationList.declarations)
    .find(declaration => declaration.name.getText(source) === entry).initializer.getText(source);
  const compiled = ts.transpile(`(${handler})`, { target: ts.ScriptTarget.ESNext });

  test(`${file}: expired initial preview cannot publish a result or navigate`, async () => {
    let current = true;
    let finish;
    let opened = 0;
    const response = new Promise(resolve => { finish = resolve; });
    const state = { value: "unchanged" };
    const click = runInNewContext(compiled, {
      beginPreviewRequest: () => () => current,
      ruleForm: { value: { validate: async () => ({ valid: true }) } },
      props: { file: {} },
      [fetch]: () => response,
      [result]: state,
      [open]: () => opened++,
    });
    const pending = click();
    await new Promise(resolve => setImmediate(resolve));
    current = false;
    finish({ processed: ["old-backend"] });
    await pending;
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(opened, 0);
    assert.equal(state.value, "unchanged");
  });

  test(`${file}: the latest request opens its own result despite out-of-order responses`, async () => {
    let requestId = 0;
    const responses = [];
    const opened = [];
    const state = { value: null };
    const click = runInNewContext(compiled, {
      beginPreviewRequest: () => {
        const id = ++requestId;
        return () => id === requestId;
      },
      ruleForm: { value: { validate: async () => ({ valid: true }) } },
      props: { file: {} },
      [fetch]: () => new Promise(resolve => responses.push(resolve)),
      [result]: state,
      [open]: () => opened.push(state.value),
    });
    const first = click();
    await new Promise(resolve => setImmediate(resolve));
    const second = click();
    await new Promise(resolve => setImmediate(resolve));
    const latest = { processed: ["latest"] };
    responses[1](latest);
    await second;
    responses[0]({ processed: ["stale"] });
    await first;
    assert.deepEqual(opened, [latest]);
    assert.equal(state.value, latest);
  });
}
