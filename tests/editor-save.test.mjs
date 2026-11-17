import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import * as vue from "vue";

const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
const source = path => readFileSync(new URL(`../src/${path}`, import.meta.url), "utf8");
const loadFunctions = (path, names, globals) => {
  const script = source(path).match(/<script[^>]*>([\s\S]*?)<\/script>/)[1];
  const tree = ts.createSourceFile(path, script, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const declarations = [];
  for (const statement of tree.statements) {
    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (names.includes(declaration.name.getText(tree))) declarations.push(`const ${declaration.getText(tree)};`);
      }
    } else if (ts.isFunctionDeclaration(statement) && names.includes(statement.name?.text)) declarations.push(statement.getText(tree));
  }
  assert.equal(declarations.length, names.length);
  const exports = {};
  runInNewContext(ts.transpile(`${declarations.join("\n")}\nObject.assign(exports, { ${names.join(", ")} });`, { target: ts.ScriptTarget.ESNext }), { ...globals, exports });
  return exports;
};

const setupEditor = kind => {
  const validation = deferred();
  const request = deferred();
  const navigation = deferred();
  const busy = vue.ref(false);
  let validations = 0, requests = 0, saved = 0, navigations = 0;
  const api = async () => { requests++; return request.promise; };
  let focused = 0;
  const { focusFirstError } = loadFunctions("components/ui/ResourceForm.vue", ["focusFirstError"], {
    nextTick: vue.nextTick,
    form: { value: { $el: { querySelector: () => ({
      querySelector: () => ({ querySelector: () => ({ focus: () => { assert.equal(busy.value, false); focused++; } }) }),
      scrollIntoView() {},
    }) } } },
  });
  const globals = {
    isget: busy, isSubmitting: busy, isEditorBusy: busy, isInit: vue.ref(true),
    ruleForm: { value: { validate: (_, focus) => { assert.equal(focus, false); validations++; return validation.promise; }, focusFirstError } },
    form: vue.reactive({ name: "existing", type: "file", tag: "", process: [] }),
    configName: "existing", editType: "subs", isEditMode: { value: true },
    UNTITLED_FILE_NAMES: [], actionsList: [], ignoreList: [],
    actionsToProcess: process => process,
    normalizeFileType: type => type, normalizeOptionalImageFit: () => undefined,
    normalizeProcessByFileType: () => {},
    filesApi: { editFile: api }, subsApi: { editSub: api },
    artifactsStore: { editArtifact: api },
    subsStore: { updateOneData: async () => {} },
    markSaved: () => { saved++; },
    navigateAfterSave: async () => { assert.equal(busy.value, true); navigations++; await navigation.promise; },
    t: key => key, showNotify: () => {}, Toast: { loading: () => {}, hide: () => {} },
    toRaw: vue.toRaw, nextTick: vue.nextTick,
  };
  const { submit } = loadFunctions(`views/${kind}Editor.vue`, ["submit"], globals);
  return { submit, busy, validation, request, navigation, counts: () => ({ validations, requests, saved, navigations, focused }) };
};

for (const kind of ["Sub", "File", "Sync"]) {
  test(`${kind}: the first click locks before validation and invalid input unlocks without writes`, async () => {
    const state = setupEditor(kind);
    const first = state.submit();
    assert.equal(state.busy.value, true);
    await state.submit();
    assert.equal(state.counts().validations, 1);
    state.validation.resolve({ valid: false });
    await first;
    assert.equal(state.busy.value, false);
    assert.equal(state.counts().requests, 0);
    assert.equal(state.counts().focused, 1);
  });

  test(`${kind}: success stays locked through the request and successful navigation`, async () => {
    const state = setupEditor(kind);
    const first = state.submit();
    state.validation.resolve({ valid: true });
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(state.counts().requests, 1);
    await state.submit();
    assert.equal(state.counts().requests, 1);
    state.request.resolve(kind === "Sync" ? true : { data: { status: "success" } });
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(state.busy.value, true);
    assert.equal(state.counts().saved, 1);
    assert.equal(state.counts().navigations, 1);
    state.navigation.resolve();
    await first;
    assert.equal(state.busy.value, false);
  });

  test(`${kind}: validation and network exceptions unlock and retain the dirty draft`, async () => {
    for (const duringValidation of [true, false]) {
      const state = setupEditor(kind);
      const first = state.submit();
      const rejected = assert.rejects(first, /failed/);
      if (duringValidation) state.validation.reject(new Error("validation failed"));
      else {
        state.validation.resolve({ valid: true });
        await vue.nextTick();
        state.request.reject(new Error("request failed"));
      }
      await rejected;
      assert.equal(state.busy.value, false);
      assert.equal(state.counts().saved, 0);
      assert.equal(state.counts().navigations, 0);
    }
  });
}

test("Share: create and edit both reject repeat clicks and release the lock on failure", async () => {
  for (const mode of ["create", "edit"]) {
    const pending = deferred();
    const busy = vue.ref(false);
    let calls = 0;
    const operation = () => { calls++; return pending.promise; };
    const { handleSubmit } = loadFunctions("views/share/ShareEditorPage.vue", ["handleSubmit"], {
      nextTick: vue.nextTick, ruleForm: { value: { focusFirstError: async () => { assert.equal(busy.value, false); } } },
      isSubmitting: busy, routeMode: { value: mode }, handleCreate: operation, handleEdit: operation, console: { error() {} },
    });
    const first = handleSubmit();
    assert.equal(busy.value, true);
    await handleSubmit();
    assert.equal(calls, 1);
    pending.reject(new Error("failed"));
    await first;
    assert.equal(busy.value, false);
  }
});

const loadGuard = () => {
  let leave, update, unload;
  const busy = vue.ref(false), draft = vue.ref("saved");
  const prompts = [];
  let guardResult;
  const exports = {};
  const compiled = ts.transpile(source("hooks/useUnsavedChanges.ts"), { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.CommonJS });
  runInNewContext(compiled, {
    exports,
    window: { addEventListener: (_, callback) => { unload = callback; }, removeEventListener() {} },
    require: name => {
      if (name === "vue") return { ...vue, onBeforeUnmount() {} };
      if (name === "vue-i18n") return { useI18n: () => ({ t: key => key }) };
      if (name === "@/services/feedback") return { Dialog: prompt => prompts.push(prompt) };
      if (name === "vue-router") return {
        onBeforeRouteLeave: callback => { leave = callback; },
        onBeforeRouteUpdate: callback => { update = callback; },
        useRouter: () => ({ replace: async fullPath => { guardResult = await leave({ fullPath }); } }),
      };
      throw new Error(`Unexpected import ${name}`);
    },
  });
  const scope = vue.effectScope();
  const guard = scope.run(() => exports.useUnsavedChanges(() => draft.value, () => true, () => busy.value));
  return { ...guard, busy, draft, prompts, leave: to => leave({ fullPath: to }), update: (to, from) => update({ path: to.split("?")[0], fullPath: to, meta: { editorPreview: to.split("?")[0].endsWith("/preview") } }, { path: from.split("?")[0], fullPath: from, meta: { editorPreview: from.split("?")[0].endsWith("/preview") } }), unload: event => unload(event), scope, navigationResult: () => guardResult };
};

test("busy guard blocks even clean drafts and preview routes, but admits the successful save destination", async () => {
  const guard = loadGuard();
  await vue.nextTick();
  guard.busy.value = true;
  assert.equal(guard.leave("/other"), false);
  assert.equal(guard.update("/edit/preview", "/edit"), false);
  assert.equal(guard.update("/edit/preview?node=p:0", "/edit/preview"), false);
  let prevented = false;
  guard.unload({ preventDefault: () => { prevented = true; } });
  assert.equal(prevented, true);
  guard.markSaved();
  await guard.navigateAfterSave("/saved");
  assert.equal(guard.navigationResult(), true);
  assert.equal(guard.leave("/saved"), false);
  assert.equal(guard.prompts.length, 0);
  guard.busy.value = false;
  guard.draft.value = "unsaved";
  const leaving = guard.leave("/other");
  assert.equal(guard.prompts.length, 1);
  guard.prompts[0].onClosed();
  assert.equal(await leaving, false);
  assert.equal(guard.update("/edit/preview", "/edit"), true);
  assert.equal(guard.update("/edit/preview?node=p:0", "/edit/preview"), true);
  assert.equal(guard.update("/edit/preview", "/edit/preview?node=p:0"), true);
  const changingShare = guard.update("/shares/edit?token=two", "/shares/edit?token=one");
  assert.equal(guard.prompts.length, 2);
  guard.prompts[1].onClosed();
  assert.equal(await changingShare, false);
  guard.scope.stop();
});

for (const operation of ["importFile", "formatCode", "pasteNav"]) {
  test(`code ${operation}: pending content stays busy until completion and ignores results after disposal`, async () => {
    for (const disposed of [false, true]) {
      const result = deferred();
      const updates = [], writes = [];
      const globals = {
        disposed, props: { id: "editor" }, isFormatting: vue.ref(false), activeLanguage: vue.ref("json"),
        canFormatEditorLanguage: () => true, formatEditorCode: () => result.promise,
        cmStore: { EditCode: { editor: "before" }, setEditCode: (_, code) => writes.push(code) },
        updateContentBusy: change => updates.push(change),
        navigator: { clipboard: { readText: () => result.promise } },
        showNotify() {}, console: { error() {} },
      };
      const functions = loadFunctions("views/editCode/cmView.vue", [operation], globals);
      const pending = functions[operation]({ target: { files: [{ text: () => result.promise }], value: "" } });
      assert.deepEqual(updates, [1]);
      result.resolve(operation === "formatCode" ? { ok: true, code: "after" } : "after");
      await pending;
      assert.deepEqual(updates, [1, -1]);
      assert.deepEqual(writes, disposed ? [] : ["after"]);
    }
  });
}

for (const kind of ["Sub", "File", "Sync"]) {
  test(`${kind}: a rejected response unlocks without marking the draft saved or leaving`, async () => {
    const state = setupEditor(kind);
    const pending = state.submit();
    state.validation.resolve({ valid: true });
    await new Promise(resolve => setImmediate(resolve));
    state.request.resolve(kind === "Sync" ? false : { data: { status: "failed", error: { message: "rejected" } } });
    await pending;
    assert.equal(state.busy.value, false);
    assert.equal(state.counts().saved, 0);
    assert.equal(state.counts().navigations, 0);
  });
}

test("operation dialog cannot confirm, close, import or switch type during a pending code update", async () => {
  const busy = vue.ref(true);
  let validations = 0, confirmations = 0, changes = 0;
  const validation = deferred();
  const functions = loadFunctions("views/editor/ActionEditorDialog.vue", ["confirm", "requestClose", "requestImport", "requestTypeChange"], {
    isBusy: busy, ruleForm: { value: { validate: () => { validations++; return validation.promise; } } },
    selectedType: { value: "Script Operator" }, confirmDiscard: () => { confirmations++; return true; },
    selectType: () => { changes++; }, emit: () => { changes++; },
  });
  await functions.confirm();
  await functions.requestClose();
  await functions.requestImport();
  await functions.requestTypeChange("Regex Filter");
  assert.deepEqual([validations, confirmations, changes], [0, 0, 0]);
  busy.value = false;
  const confirming = functions.confirm();
  busy.value = true;
  validation.resolve({ valid: true });
  await confirming;
  assert.equal(changes, 0);
});

test("concurrent code updates keep their parent locked until the last update finishes", () => {
  const states = [];
  const { updateContentBusy } = loadFunctions("views/editCode/cmView.vue", ["updateContentBusy"], {
    pendingContentUpdates: vue.ref(0), emit: (_, busy) => states.push(busy),
  });
  updateContentBusy(1);
  updateContentBusy(1);
  updateContentBusy(-1);
  updateContentBusy(-1);
  assert.deepEqual(states, [true, true, true, false]);
});

test("pasted operations lock before clipboard IO, reject repeat imports and never publish disposed drafts", async () => {
  for (const disposed of [false, true]) {
    const read = deferred();
    const events = [];
    let reads = 0;
    const globals = {
      disposed, isPasting: vue.ref(false), showPasteboard: vue.ref(false), pasteboard: vue.ref(""),
      navigator: { clipboard: { readText: () => { reads++; return read.promise; } } },
      sourceType: "sub", ADD_PROXIES_FROM_SUBSCRIPTION_OPERATOR: "Add Proxies from Subscription", isMihomoConfigFile: vue.ref(false),
      emit: (event, value) => events.push([event, value]), console: { error() {} }, Toast: { text() {} },
    };
    const { paste } = loadFunctions("views/editor/ActionBlock.vue", ["paste"], globals);
    const pending = paste();
    assert.equal(globals.isPasting.value, true);
    assert.deepEqual(events, [["update:busy", true]]);
    await paste();
    assert.equal(reads, 1);
    read.resolve(JSON.stringify({ source: "sub", data: { id: "a", type: "Regex Filter", args: [] } }));
    await pending;
    assert.equal(globals.isPasting.value, false);
    assert.equal(events.some(([event]) => event === "addAction"), !disposed);
    if (!disposed) assert.deepEqual(events.at(-1), ["update:busy", false]);
  }
});

test("denied clipboard permission opens manual import after releasing the main editor lock", async () => {
  const busy = vue.ref(false), manual = vue.ref(false);
  const events = [];
  const { paste } = loadFunctions("views/editor/ActionBlock.vue", ["paste"], {
    disposed: false, isPasting: busy, showPasteboard: manual, pasteboard: vue.ref(""),
    navigator: { clipboard: { readText: async () => { throw new Error("denied"); } } },
    emit: (event, value) => events.push([event, value]), console: { error() {} }, Toast: { text() {} },
  });
  await paste();
  assert.equal(busy.value, false);
  assert.equal(manual.value, true);
  assert.deepEqual(events, [["update:busy", true], ["update:busy", false]]);
});
