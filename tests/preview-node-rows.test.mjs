import assert from "node:assert/strict";
import { test } from "node:test";
import { groupPreviewNodes } from "../src/utils/previewNodeRows.ts";

test("preview groups pair renamed nodes by identity and keep filtered originals", () => {
  const before = [
    { id: 1, name: "before" },
    { id: 2, name: "filtered" },
  ];
  const after = [
    { id: 1, name: "renamed" },
    { id: 3, name: "added" },
  ];
  const groups = groupPreviewNodes(before, after);
  assert.equal(groups.length, 3);
  assert.deepEqual(
    groups.map((group) => group.status),
    ["retained", "retained", "filtered"],
  );
  assert.equal(groups[0].before, before[0]);
  assert.equal(groups[0].after, after[0]);
  assert.equal(groups[1].before, undefined);
  assert.equal(groups[2].before, before[1]);
  assert.equal(groups[2].after, undefined);
});

test("preview handles empty results and fully filtered subscriptions", () => {
  assert.deepEqual(groupPreviewNodes([], []), []);
  const original = [{ id: 1 }, { id: 2 }];
  assert.deepEqual(
    groupPreviewNodes(original, []).map((group) => group.status),
    ["filtered", "filtered"],
  );
  assert.deepEqual(
    groupPreviewNodes([], original).map((group) => group.status),
    ["retained", "retained"],
  );
});
