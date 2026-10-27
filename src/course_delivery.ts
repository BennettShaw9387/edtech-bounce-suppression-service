import { z } from "zod";
import { infrai } from "./infrai.ts";

export const deliveryRequest = z.object({
  courseId: z.string().min(1),
  learnerId: z.string().min(1),
  learnerEmail: z.string().email(),
  deadline: z.string().datetime(),
  educatorEmail: z.string().email(),
});

export type DeliveryRequest = z.infer<typeof deliveryRequest>;
export type DeliveryDecision = { status: "sent" | "suppressed"; courseId: string; learnerId: string; messageId?: string };

export async function deliverDeadline(raw: unknown): Promise<DeliveryDecision> {
  const input = deliveryRequest.parse(raw);
  const suppression = await infrai.email.suppression.check(input.learnerEmail);
  if (suppression.suppressed) return { status: "suppressed", courseId: input.courseId, learnerId: input.learnerId };

  const sent = await infrai.email.send({
    to: input.learnerEmail,
    subject: `Deadline for course ${input.courseId}`,
    body: `Your course deadline is ${input.deadline}. Questions? Contact ${input.educatorEmail}.`,
  }, `deadline:${input.courseId}:${input.learnerId}`);
  return { status: "sent", courseId: input.courseId, learnerId: input.learnerId, messageId: sent.message_id };
}

export async function recordHardBounce(email: string, courseId: string, learnerId: string): Promise<void> {
  await infrai.email.suppression.add(email, "hard_bounce", `bounce:${courseId}:${learnerId}`);
}
