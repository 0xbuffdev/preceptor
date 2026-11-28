import assert from "node:assert/strict";
import * as preceptor from "@0xbuff/preceptor";

assert.deepEqual(Object.keys(preceptor), []);
await assert.rejects(import("@0xbuff/preceptor/dist/index.js"), {
  code: "ERR_PACKAGE_PATH_NOT_EXPORTED",
});
