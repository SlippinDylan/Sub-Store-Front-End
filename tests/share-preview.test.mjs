import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import { parse } from "vue/compiler-sfc";
import ts from "typescript";

// Execute the real event handler with isolated navigation and dialog effects.
const { descriptor } = parse(readFileSync(new URL("../src/components/ShareListItem.vue", import.meta.url), "utf8"));
const source = ts.createSourceFile("ShareListItem.ts", descriptor.scriptSetup.content, ts.ScriptTarget.Latest, true);
const handler = source.statements
  .filter(ts.isVariableStatement)
  .flatMap(statement => statement.declarationList.declarations)
  .find(declaration => declaration.name.getText(source) === "onClickPreviews")
  .initializer.getText(source);

test("disabled share cards never navigate or open a preview dialog", () => {
  for (const desktop of [true, false]) {
    let navigations = 0;
    let dialogs = 0;
    const onClick = runInNewContext(`(${handler})`, {
      props: { disabled: true },
      isDesktop: { value: desktop },
      router: { push: () => navigations++ },
      Dialog: () => dialogs++,
      name: { value: "share" },
      displayName: { value: "Share" },
      getShareUrl: () => "https://example.test/share",
      type: { value: "sub" },
    });
    onClick();
    assert.equal(navigations, 0);
    assert.equal(dialogs, 0);
  }
});
