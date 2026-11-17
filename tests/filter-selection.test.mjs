import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import { parse } from "vue/compiler-sfc";
import ts from "typescript";
import { reactive, ref, computed, watch, nextTick, toRef } from "vue";

const setupScript = (path, expose) => {
  const { descriptor } = parse(readFileSync(new URL(path, import.meta.url), "utf8"));
  const source = ts.createSourceFile(path, descriptor.scriptSetup.content, ts.ScriptTarget.Latest, true);
  const script = source.statements.filter(statement => !ts.isImportDeclaration(statement))
    .map(statement => statement.getText(source)).join("\n");
  return ts.transpile(`${script}\n;(${expose})`, { target: ts.ScriptTarget.ESNext });
};
const filterScript = setupScript("../src/views/editor/components/FilterSelect.vue", "{ value, mode }");
const groupScript = setupScript("../src/components/ui/SelectionGroup.vue", "undefined");

for (const [type, selected] of [["Type Filter", "ss"], ["Region Filter", "JP"]]) {
  for (const legacy of [true, false]) {
    test(`${type}: replacing checkbox arrays updates the saved draft and dirty state (${legacy ? "legacy" : "current"} args)`, async () => {
      const form = reactive({ process: [{ id: "filter", type, args: legacy ? [] : { keep: false, value: [] } }] });
      const mounted = [];
      const filter = runInNewContext(filterScript, {
        inject: () => form,
        defineProps: () => ({ type, id: "filter" }),
        ref, computed, watch,
        onMounted: callback => mounted.push(callback),
        useGlobalStore: () => ({}),
        storeToRefs: () => ({ env: ref({}) }),
        useAppNotifyStore: () => ({ showNotify() {} }),
      });
      mounted.forEach(callback => callback());
      await nextTick();
      const baseline = JSON.stringify(form.process);
      const props = reactive({ modelValue: filter.value.value });
      const stop = watch(() => filter.value.value, value => { props.modelValue = value; }, { flush: "sync" });
      let group;
      runInNewContext(groupScript, {
        defineProps: () => props,
        withDefaults: props => props,
        defineEmits: () => (event, value) => { if (event === "update:modelValue") filter.value.value = value; },
        provide: (_key, value) => { group = value; },
        selectionKey: Symbol("selection"),
        toRef,
      });
      group.select(selected, true);
      await nextTick();
      assert.deepEqual([...form.process[0].args.value], [selected]);
      assert.notEqual(JSON.stringify(form.process), baseline);
      group.select(selected, false);
      await nextTick();
      assert.deepEqual([...form.process[0].args.value], []);
      stop();
    });
  }
}
