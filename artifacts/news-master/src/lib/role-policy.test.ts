import test from "node:test";
import assert from "node:assert/strict";

import { canAccessAdmin, destinationForRole } from "./role-policy.ts";

test("role policy grants the admin panel only to owners and admins", () => {
  assert.equal(canAccessAdmin("owner"), true);
  assert.equal(canAccessAdmin("admin"), true);
  assert.equal(canAccessAdmin("moderator"), false);
  assert.equal(canAccessAdmin("reader"), false);
});

test("role policy sends moderators and readers to stories", () => {
  assert.equal(destinationForRole("owner"), "/admin");
  assert.equal(destinationForRole("admin"), "/admin");
  assert.equal(destinationForRole("moderator"), "/stories");
  assert.equal(destinationForRole("reader"), "/stories");
});
