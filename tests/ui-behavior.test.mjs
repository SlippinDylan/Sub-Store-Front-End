import assert from "node:assert/strict";
import { test } from "node:test";
import { validateResourceFields } from "../src/components/ui/formValidation.ts";
import {
  Dialog,
  dialogs,
  dismissDialog,
  performDialogAction,
  Toast,
  notifications,
} from "../src/services/feedback.ts";

test("required and asynchronous uniqueness rules preserve field errors", async () => {
  let uniquenessCalls = 0;
  const fields = [
    {
      name: "name",
      rules: [
        { required: true, message: "required" },
        {
          validator: async (value) => {
            uniquenessCalls++;
            return value !== "existing";
          },
          message: "duplicate",
        },
      ],
    },
    { name: "source", rules: [{ required: true, message: "source required" }] },
  ];
  assert.deepEqual(
    await validateResourceFields({ name: "", source: [] }, fields),
    [
      { prop: "name", message: "required" },
      { prop: "source", message: "source required" },
    ],
  );
  assert.equal(uniquenessCalls, 0);
  assert.deepEqual(
    await validateResourceFields({ name: "existing", source: ["a"] }, fields),
    [{ prop: "name", message: "duplicate" }],
  );
  assert.deepEqual(
    await validateResourceFields({ name: "new", source: [] }, fields, "name"),
    [],
  );
});

test("regex checks and validator failures are exposed", async () => {
  assert.deepEqual(
    await validateResourceFields({ duration: "abc" }, [
      { name: "duration", rules: [{ regex: /^\d+$/, message: "number" }] },
    ]),
    [{ prop: "duration", message: "number" }],
  );
  await assert.rejects(
    validateResourceFields({}, [
      {
        name: "name",
        rules: [
          {
            validator: async () => {
              throw new Error("network");
            },
          },
        ],
      },
    ]),
    /network/,
  );
});

test("closing a managed deletion dialog neither archives nor deletes", async () => {
  let archived = 0,
    deleted = 0,
    closed = 0;
  const options = {
    onCancel: () => archived++,
    onOk: () => deleted++,
    onClosed: () => closed++,
  };
  Dialog(options);
  await dismissDialog(dialogs[0]);
  assert.deepEqual([archived, deleted, closed], [0, 0, 1]);
  Dialog(options);
  await performDialogAction(dialogs[0], "cancel");
  assert.deepEqual([archived, deleted, closed], [1, 0, 2]);
  Dialog(options);
  await performDialogAction(dialogs[0], "ok");
  assert.deepEqual([archived, deleted, closed], [1, 1, 3]);
});

test("confirmation awaits the operation and retains the dialog on failure", async () => {
  let finish;
  Dialog({
    onOk: () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  });
  const action = performDialogAction(dialogs[0], "ok");
  assert.equal(dialogs.length, 1);
  finish();
  await action;
  assert.equal(dialogs.length, 0);
  Dialog({
    onOk: async () => {
      throw new Error("save failed");
    },
  });
  await assert.rejects(performDialogAction(dialogs[0], "ok"), /save failed/);
  assert.equal(dialogs.length, 1);
  await dismissDialog(dialogs[0]);
});

test("loading notifications keep independent IDs and can be dismissed", () => {
  Toast.loading("one", { id: "one" });
  Toast.loading("two", { id: "two" });
  assert.equal(notifications.size, 2);
  Toast.hide("one");
  assert.equal(notifications.has("two"), true);
  Toast.hide();
  assert.equal(notifications.size, 0);
});

test('VueUse exports the functions required by Nuxt UI at browser startup', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const vueuse = await import('@vueuse/core');
  const runtime = fileURLToPath(new URL('../node_modules/@nuxt/ui/dist/runtime/', import.meta.url));
  // Reka UI also imports this function when Nuxt UI initializes its overlays.
  const required = new Set(['useParentElement']);
  for (const file of fs.readdirSync(runtime, { recursive: true })) {
    if (!/\.(js|vue)$/.test(file)) continue;
    const source = fs.readFileSync(path.join(runtime, file), 'utf8');
    for (const match of source.matchAll(/import\s*\{([^}]+)\}\s*from\s*["']@vueuse\/core["']/g)) {
      for (const name of match[1].split(',')) required.add(name.trim().split(/\s+as\s+/)[0]);
    }
  }
  assert.deepEqual([...required].filter(name => !(name in vueuse)), []);
});
