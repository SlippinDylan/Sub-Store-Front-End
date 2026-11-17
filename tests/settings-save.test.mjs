import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

const source = ts.createSourceFile('settings.ts', readFileSync(new URL('../src/store/settings.ts', import.meta.url), 'utf8'), ts.ScriptTarget.Latest, true);
const helpers = new Set(['createAppearanceSettingPatch', 'isEditorGroupingMode', 'hasRemoteAppearanceSetting', 'hasRemoteEditorGroupingMode']);
const declarations = [];
let action;
const visit = node => {
  if (ts.isVariableStatement(node) && node.declarationList.declarations.some(item => helpers.has(item.name.getText(source)))) declarations.push(node.getText(source));
  if (ts.isMethodDeclaration(node) && node.name.getText(source) === 'changeAppearanceSetting') action = node.getText(source);
  ts.forEachChild(node, visit);
};
visit(source);
const compiled = ts.transpile(`const appearanceSaves = new WeakMap();\n${declarations.join('\n')}\n({ ${action} })`, { target: ts.ScriptTarget.ESNext });
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
const fixture = () => {
  const requests = [];
  const backend = { ishostApi: "A" };
  const { changeAppearanceSetting } = runInNewContext(compiled, {
    Toast: { loading() {}, hide() {} },
    useGlobalStore: () => backend,
    useAppNotifyStore: () => ({ showNotify() {} }),
    settingsApi: { setSettings: data => {
      const response = deferred();
      requests.push({ data, ...response });
      return response.promise;
    } },
  });
  const store = {
    appearanceSetting: { isShowIcon: false, isSimpleMode: false },
    hasRemoteAppearanceSetting: true,
    hasRemoteEditorGroupingMode: false,
    hasCachedEditorGroupingMode: false,
    applyAppearanceSetting(next) { this.appearanceSetting = next; },
  };
  const save = patch => changeAppearanceSetting.call(store, { appearanceSetting: patch });
  const succeed = index => requests[index].resolve({ data: { status: 'success', data: { appearanceSetting: requests[index].data.appearanceSetting } } });
  return { store, requests, save, succeed, backend };
};

test('appearance writes preserve the last rapid toggle and unrelated changes in request order', async () => {
  const f = fixture();
  const first = f.save({ isShowIcon: true });
  const second = f.save({ isSimpleMode: true });
  const last = f.save({ isShowIcon: false });
  await Promise.resolve();
  assert.equal(f.requests.length, 1);
  f.succeed(0);
  await first;
  await Promise.resolve();
  assert.equal(f.requests.length, 2);
  assert.deepEqual(Object.keys(f.requests[1].data.appearanceSetting), ['isSimpleMode']);
  f.succeed(1);
  await second;
  await Promise.resolve();
  assert.equal(f.requests.length, 3);
  assert.equal(f.requests[2].data.appearanceSetting.isShowIcon, false);
  f.succeed(2);
  await last;
  assert.equal(f.store.appearanceSetting.isShowIcon, false);
  assert.equal(f.store.appearanceSetting.isSimpleMode, true);
});

test('an appearance request failure does not stop later queued changes', async () => {
  const f = fixture();
  const failed = f.save({ isShowIcon: true });
  const rejection = assert.rejects(failed, /network/);
  const next = f.save({ isSimpleMode: true });
  await Promise.resolve();
  f.requests[0].reject(new Error('network'));
  await rejection;
  await Promise.resolve();
  assert.equal(f.requests.length, 2);
  f.succeed(1);
  await next;
  assert.equal(f.store.appearanceSetting.isShowIcon, false);
  assert.equal(f.store.appearanceSetting.isSimpleMode, true);
});

const mySource = ts.createSourceFile('my.ts', readFileSync(new URL('../src/views/My.vue', import.meta.url), 'utf8').split('<script lang="ts" setup>')[1].split('</script>')[0], ts.ScriptTarget.Latest, true);
const saveConfigurationDeclaration = mySource.statements.find(node => ts.isVariableStatement(node) && node.declarationList.declarations.some(item => item.name.getText(mySource) === 'saveConfiguration'));
const compiledConfiguration = ts.transpile(`${saveConfigurationDeclaration.getText(mySource)}\n({saveConfiguration})`, { target: ts.ScriptTarget.ESNext });
const configurationFixture = () => {
  const isEditLoading = { value: false };
  const response = deferred();
  const submitted = [], displayed = [], notices = [];
  const isBusy = { get value() { return isEditLoading.value; } };
  const { saveConfiguration } = runInNewContext(compiledConfiguration, {
    isBusy, isEditLoading,
    settingsStore: {
      changeSettings: data => { submitted.push(data); return response.promise; },
      fetchSettings: async () => {},
    },
    createSettingsPayload: scope => ({ scope, draft: 'typed input' }),
    setDisplayInfo: scope => displayed.push(scope),
    resetAvatarState() {},
    showNotify: notice => notices.push(notice),
    console: { error() {} },
  });
  return { isEditLoading, response, submitted, displayed, notices, saveConfiguration };
};

test('configuration saves prevent repeated submission and reset only the successful scope', async () => {
  for (const scope of ['github', 'request', 'cache']) {
    const f = configurationFixture();
    const first = f.saveConfiguration(scope);
    assert.equal(f.isEditLoading.value, true);
    await f.saveConfiguration(scope);
    assert.equal(f.submitted.length, 1);
    assert.deepEqual(f.displayed, []);
    f.response.resolve(true);
    await first;
    assert.deepEqual(f.displayed, [scope]);
    assert.equal(f.isEditLoading.value, false);
  }
});

test('failed configuration saves retain drafts and release the editing lock', async () => {
  for (const scope of ['github', 'request', 'cache']) {
    for (const networkFailure of [false, true]) {
      const f = configurationFixture();
      const pending = f.saveConfiguration(scope);
      if (networkFailure) f.response.reject(new Error('network'));
      else f.response.resolve(false);
      await pending;
      assert.deepEqual(f.displayed, []);
      assert.equal(f.isEditLoading.value, false);
      assert.equal(f.notices.length, networkFailure ? 1 : 0);
    }
  }
});

test('all configuration scopes refuse entry while another save is active', async () => {
  const f = configurationFixture();
  f.isEditLoading.value = true;
  for (const scope of ['github', 'request', 'cache', 'frontEnd']) await f.saveConfiguration(scope);
  assert.deepEqual(f.submitted, []);
  assert.deepEqual(f.displayed, []);
});


test('backend changes discard old responses and queued writes while allowing new backend saves', async () => {
  const f = fixture();
  const oldPending = f.save({ isShowIcon: true });
  const oldQueued = f.save({ isSimpleMode: true });
  await Promise.resolve();
  assert.equal(f.requests.length, 1);
  f.backend.ishostApi = 'B';
  const newSave = f.save({ isSimpleMode: true });
  f.succeed(0);
  await oldPending;
  await oldQueued;
  await Promise.resolve();
  assert.equal(f.store.appearanceSetting.isShowIcon, false);
  assert.equal(f.requests.length, 2);
  assert.deepEqual(Object.keys(f.requests[1].data.appearanceSetting), ['isSimpleMode']);
  f.succeed(1);
  await newSave;
  assert.equal(f.store.appearanceSetting.isShowIcon, false);
  assert.equal(f.store.appearanceSetting.isSimpleMode, true);
});
