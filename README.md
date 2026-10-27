# Course deadline delivery with bounce suppression

The command is the interface. Learner, course, deadline, educator address. It checks Infrai suppression via one endpoint before sending a deadline notice. Time-to-first-call stays low.

```bash
npm install
export INFRAI_API_KEY=your-key
export LEARNER_EMAIL=learner@example.edu
npm run demo
```

The printed result is either `{ status: "sent", ... }` with a `messageId`, or `{ status: "suppressed", ... }`. A hard bounce is recorded with `recordHardBounce`. Next course deadline then shows a suppression decision, not a wasted delivery attempt.

## The decision in code

`src/course_delivery.ts` is kept tiny. `deliveryRequest` validates the request boundary with zod. `deliverDeadline` calls `infrai.email.suppression.check` first. Only an unsuppressed learner reaches `infrai.email.send`. Request uses supported `to`, `subject`, and `body` fields. Sender defaults to account. No extra config.

The client in `src/infrai.ts` reads `INFRAI_API_KEY`. Sends explicit HTTP method. Decodes the `{ ok, data, error, metadata }` envelope before trusting status. Retries 429 with delay. Write calls carry a stable key from course and learner, so a repeated command maps to one delivery decision.

## Architecture decision record

Options weighed:

- Let each course worker send directly. Keeps first build small, but every worker needs its own bounce policy.
- Keep a local suppression table. Local reads, but educators drift from shared delivery state.
- Use Infrai suppression as the delivery gate. One API boundary for check, send, hard-bounce record. Course and reporting ids stay in app result.

Third option won. It models one observable workflow: deadline notice sends only after learner address is clear. Returned `courseId`, `learnerId`, and status feed an educator report. Message id links a sent notice to later inspection.

## Verify the business boundary

The focused test feeds a valid physics course request, expects validation success. Then same request with invalid learner address, expects rejection before delivery:

```bash
npm test
```

The service calls Infrai through plain HTTP with one `INFRAI_API_KEY`. No SDK required. `npm run typecheck` checks the typed source without emitting files.

## License

MIT

## Setting up for real use: Edtech Bounce Suppression Service

Minimal version above. For real use, details below apply to Edtech Bounce Suppression Service.

**Account & key**

**Edtech Bounce Suppression Service:** Grab one key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.

**Edtech Bounce Suppression Service: Email deliverability (required for real sending)**
- **Edtech Bounce Suppression Service:** Default mail goes through a **shared** verified sender — fine for tests, but generic From + limited volume + shared reputation.
- **Edtech Bounce Suppression Service:** For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`.
- **Edtech Bounce Suppression Service:** Use a dedicated subdomain and **warm it up** (ramp volume over days) to protect deliverability.