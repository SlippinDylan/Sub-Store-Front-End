import assert from "node:assert/strict";
import { test } from "node:test";
import {
  getRegexError,
  getScriptArgumentError,
  isOptionalPositiveInteger,
  isOptionalNonNegativeNumber,
  isScriptSourceValid,
} from "../src/views/editor/actionValidation.ts";

test("optional action defaults stay valid while malformed expressions are rejected", () => {
  assert.equal(getRegexError(""), undefined);
  assert.equal(getRegexError("(?<=foo)bar"), undefined);
  assert.match(getRegexError("["), /Invalid regular expression/);
});

test("DNS numeric overrides reject non-finite, fractional and unsafe concurrency", () => {
  for (const value of ["", undefined, "1", 2])
    assert.equal(isOptionalPositiveInteger(value), true);
  for (const value of ["0", "-1", "1.5", "abc", "Infinity", "9007199254740992"])
    assert.equal(isOptionalPositiveInteger(value), false);
  for (const value of ["", "0", "0.5", "600"])
    assert.equal(isOptionalNonNegativeNumber(value), true);
  for (const value of ["-1", "abc", "Infinity"])
    assert.equal(isOptionalNonNegativeNumber(value), false);
});

test("script sources preserve remote URLs, internal API paths and absolute local files", () => {
  for (const value of [
    "",
    "##noCache",
    "/api/file/script",
    "/opt/scripts/test.js",
    "C:\\scripts\\test.js",
    "https://example.org/script.js#key=value#noCache",
    "file:///opt/script.js",
  ])
    assert.equal(isScriptSourceValid(value), true, value);
  for (const value of ["https://", "some text", "javascript:alert(1)"])
    assert.equal(isScriptSourceValid(value), false, value);
});

test("argument rows do not silently discard values without names, and retain duplicate-key semantics", () => {
  assert.equal(getScriptArgumentError([{ key: "", value: "" }], 0), undefined);
  assert.equal(
    getScriptArgumentError([{ key: "", value: "value" }], 0),
    "argumentNameRequired",
  );
  assert.equal(
    getScriptArgumentError([{ key: "", value: false }], 0),
    "argumentNameRequired",
  );
  assert.equal(
    getScriptArgumentError(
      [
        { key: "a", value: "first" },
        { key: "a", value: "last" },
      ],
      1,
    ),
    undefined,
  );
});
