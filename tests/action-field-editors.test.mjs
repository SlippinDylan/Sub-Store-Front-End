import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import { computed, nextTick, reactive, ref, shallowRef, watch } from "vue";
import { parse } from "vue/compiler-sfc";
import ts from "typescript";

function readScript(path, code, bindings) {
  const source = ts.createSourceFile(path, code, ts.ScriptTarget.Latest, true);
  const statements = source.statements
    .filter((statement) => !ts.isImportDeclaration(statement))
    .map((statement) => statement.getText(source).replace(/^export /, ""))
    .join("\n");
  return ts.transpile(`${statements}\n;({ ${bindings} })`, {
    target: ts.ScriptTarget.ESNext,
  });
}

function readSetup(component, bindings) {
  const path = `../src/views/editor/${component}.vue`;
  const { descriptor } = parse(readFileSync(new URL(path, import.meta.url), "utf8"));
  return readScript(path, descriptor.scriptSetup.content, bindings);
}

const actionsPath = "../src/utils/actionsOperate.ts";
const { addItem } = runInNewContext(
  readScript(actionsPath, readFileSync(new URL(actionsPath, import.meta.url), "utf8"), "addItem"),
  { shallowRef, nextTick: () => {}, Regex: {}, HandleDuplicate: {} },
);

const regexSetup = readSetup(
  "components/Regex", "rules, mode, createRule, getRuleError, getDraftState, commitPending",
);
const duplicateSetup = readSetup("components/HandleDuplicate", "fields, createField, isClearedField, getDraftState");
const summarySetup = readSetup("ActionSummary", "rows");

function editAction(setup, type, args) {
  const form = reactive({ process: [] });
  addItem(form, [], [], [{ value: type, args: structuredClone(args) }], (key) => key);
  const action = form.process[0];
  const editor = runInNewContext(setup, {
    defineProps: () => ({ type, id: action.id }),
    defineExpose() {},
    actionDialogKey: Symbol("action-dialog"),
    inject: (key) => key === "form" ? form : true,
    useI18n: () => ({ t: (key) => key }),
    computed, ref, watch,
  });
  return { action, ...editor };
}

const editRules = (type, args) => editAction(regexSetup, type, args);

test("saved filter rules open in editable fields and retain their positions on save", () => {
  const args = { keep: false, regex: ["first", "(?i)Traffic|流量", "last"] };
  const { action, rules, getRuleError, commitPending } = editRules("Regex Filter", args);
  assert.deepEqual(Array.from(rules.value, (rule) => rule.expression), args.regex);
  rules.value[1].expression += "|Expire";
  assert.equal(getRuleError(rules.value[1]), "");
  assert.deepEqual(action.args, args);

  commitPending();
  assert.deepEqual(action.args, {
    keep: false,
    regex: ["first", "(?i)Traffic|流量|Expire", "last"],
  });
});

test("filter actions with omitted settings use the backend defaults", () => {
  const { action, rules, mode, commitPending } = editRules("Regex Filter", {});
  assert.equal(mode.value, 0);
  assert.equal(rules.value[0].expression, "");
  commitPending();
  assert.deepEqual(JSON.parse(JSON.stringify(action.args)), { regex: [] });
});

test("the regex filter editor and summary show the mode the backend uses", () => {
  for (const [keep, option] of [[0, 1], [null, 1], [false, 1], [true, 0], [undefined, 0]]) {
    const { action, mode } = editRules("Regex Filter", { keep, regex: ["Traffic"] });
    const { rows } = runInNewContext(summarySetup, {
      defineProps: () => ({ action }),
      useI18n: () => ({ t: (key) => key }),
      computed,
    });
    assert.deepEqual([mode.value, rows.value[0].value], [
      option,
      `editorPage.subConfig.nodeActions['Regex Filter'].options[${option}]`,
    ], `keep=${keep}`);
  }
});

test("regex filters imported with empty array arguments save edits as filter parameters", () => {
  const { action, rules, commitPending } = editRules("Regex Filter", []);
  rules.value[0].expression = "(?i)Traffic";
  commitPending();
  assert.deepEqual(JSON.parse(JSON.stringify(action.args)), {
    keep: true,
    regex: ["(?i)Traffic"],
  });
});

test("regex syntax is handled by the backend, and the editor saves the entered text", () => {
  const { action, rules, getRuleError, commitPending } = editRules("Regex Filter", {});
  rules.value[0].expression = "(?i)[";
  assert.equal(getRuleError(rules.value[0]), "");
  commitPending();
  assert.deepEqual([...action.args.regex], ["(?i)["]);
});

test("clearing an existing regex requires correcting or explicitly removing the row", () => {
  const { action, rules, getRuleError, commitPending } = editRules(
    "Regex Filter", { keep: true, regex: ["US"] },
  );
  rules.value[0].expression = "";
  assert.equal(getRuleError(rules.value[0]), "actionValidation.fillOrRemove");
  assert.deepEqual([...action.args.regex], ["US"]);

  rules.value.pop();
  commitPending();
  assert.deepEqual([...action.args.regex], []);
});

test("a blank new row does not hide the removal of a saved empty regex", () => {
  const { rules, createRule, getDraftState } = editRules(
    "Regex Filter", { regex: [""] },
  );
  const original = JSON.stringify(getDraftState());
  rules.value.push(createRule());
  assert.equal(JSON.stringify(getDraftState()), original);
  rules.value.shift();
  assert.notEqual(JSON.stringify(getDraftState()), original);
});

test("sorting rules can move, add and delete independently of editing", () => {
  const { action, rules, mode, createRule, commitPending } = editRules(
    "Regex Sort Operator", ["first", "second", "third"],
  );
  const [first] = rules.value.splice(0, 1);
  rules.value.splice(1, 1);
  rules.value.push(first, createRule(), createRule("new"));
  mode.value = "original";
  commitPending();
  assert.deepEqual(JSON.parse(JSON.stringify(action.args)), {
    order: "original",
    expressions: ["second", "first", "new"],
  });
});

test("rename rows keep their replacement on edit and preserve explicitly saved empty expressions", () => {
  const args = [{ expr: "(?i)traffic", now: "Traffic" }, { expr: "", now: "-" }];
  const { action, rules, createRule, getRuleError, commitPending } = editRules(
    "Regex Rename Operator", args,
  );
  assert.equal(rules.value[0].replacement, "Traffic");
  rules.value[0].replacement = "";
  const newRule = createRule();
  newRule.replacement = "missing expression";
  assert.equal(getRuleError(newRule), "actionValidation.expressionRequired");
  assert.equal(getRuleError(rules.value[1]), "");
  commitPending();
  assert.deepEqual(JSON.parse(JSON.stringify(action.args)), [
    { expr: "(?i)traffic", now: "" },
    { expr: "", now: "-" },
  ]);
});

test("saved deduplication field paths can be edited directly without shifting", async () => {
  const args = { action: "delete", field: ["name", "server", "port"] };
  const { action, fields, createField } = editAction(
    duplicateSetup, "Handle Duplicate Operator", args,
  );
  assert.deepEqual(Array.from(fields.value, (field) => field.path), args.field);

  const middle = fields.value[1];
  middle.path = "ws-opts.path";
  fields.value.push(createField());
  await nextTick();
  assert.equal(fields.value[1], middle);
  assert.deepEqual([...action.args.field], ["name", "ws-opts.path", "port"]);

  fields.value.pop();
  const [last] = fields.value.splice(2, 1);
  fields.value.splice(0, 1, last, createField("type"));
  await nextTick();
  assert.deepEqual([...action.args.field], ["port", "type", "ws-opts.path"]);
});

test("deduplication preserves saved empty paths and defaults an omitted field list to name", async () => {
  const omitted = editAction(duplicateSetup, "Handle Duplicate Operator", {});
  assert.deepEqual([...omitted.action.args.field], ["name"]);

  const { action, fields } = editAction(
    duplicateSetup, "Handle Duplicate Operator", { field: ["", "name"] },
  );
  fields.value[1].path = "server";
  await nextTick();
  assert.deepEqual([...action.args.field], ["", "server"]);
});

test("deduplication imported with empty array arguments saves edits as deduplication parameters", async () => {
  const { action, fields } = editAction(duplicateSetup, "Handle Duplicate Operator", []);
  assert.equal(fields.value[0].path, "name");
  fields.value[0].path = "server";
  await nextTick();
  assert.deepEqual(JSON.parse(JSON.stringify(action.args)), {
    action: "rename",
    link: "-",
    position: "back",
    template: "0 1 2 3 4 5 6 7 8 9",
    field: ["server"],
  });
});

test("clearing a saved deduplication field keeps its value until the row is corrected or removed", async () => {
  const { action, fields, isClearedField, getDraftState } = editAction(
    duplicateSetup, "Handle Duplicate Operator", { action: "delete", field: ["name"] },
  );
  const original = JSON.stringify(getDraftState());
  fields.value[0].path = "";
  await nextTick();
  assert.equal(isClearedField(fields.value[0]), true);
  assert.notEqual(JSON.stringify(getDraftState()), original);
  assert.deepEqual([...action.args.field], ["name"]);

  fields.value[0].path = "server";
  await nextTick();
  assert.equal(isClearedField(fields.value[0]), false);
  assert.deepEqual([...action.args.field], ["server"]);

  fields.value.pop();
  await nextTick();
  assert.deepEqual([...action.args.field], []);
});
