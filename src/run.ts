import { deliverDeadline } from "./course_delivery.ts";

const request = {
  courseId: process.env.COURSE_ID ?? "typescript-101",
  learnerId: process.env.LEARNER_ID ?? "learner-42",
  learnerEmail: process.env.LEARNER_EMAIL,
  deadline: process.env.LEARNER_DEADLINE ?? "2026-12-01T17:00:00.000Z",
  educatorEmail: process.env.EDUCATOR_EMAIL ?? "educator@example.edu",
};

if (!request.learnerEmail) throw new Error("LEARNER_EMAIL is required");
console.log(await deliverDeadline(request));
