import assert from "node:assert/strict";
import test from "node:test";
import { deliveryRequest } from "../src/course_delivery.ts";

test("deadline request accepts the fields needed for educator reporting", () => {
  const result = deliveryRequest.safeParse({
    courseId: "physics-201",
    learnerId: "learner-7",
    learnerEmail: "learner@example.edu",
    deadline: "2026-11-30T17:00:00.000Z",
    educatorEmail: "teacher@example.edu",
  });
  assert.equal(result.success, true);
});

test("invalid learner email is rejected before delivery", () => {
  const result = deliveryRequest.safeParse({
    courseId: "physics-201",
    learnerId: "learner-7",
    learnerEmail: "not-an-email",
    deadline: "2026-11-30T17:00:00.000Z",
    educatorEmail: "teacher@example.edu",
  });
  assert.equal(result.success, false);
});
