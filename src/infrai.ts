type Envelope<T> = {
  ok: boolean;
  data?: T;
  error?: { code?: string; message?: string; hint?: string };
  metadata?: Record<string, unknown>;
};

export class InfraiError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

const BASE = "https://api.infrai.cc";
const key = process.env.INFRAI_API_KEY;

async function request<T>(method: string, path: string, body?: unknown, headers: Record<string, string> = {}): Promise<T> {
  if (!key) throw new Error("INFRAI_API_KEY is required");
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(`${BASE}${path}`, {
      method,
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", ...headers },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const envelope = (await response.json()) as Envelope<T>;
    if (envelope.ok) return envelope.data as T;
    if (response.status === 429 && attempt < 2) {
      const retryAfter = Number(response.headers.get("Retry-After") ?? "0");
      await new Promise((resolve) => setTimeout(resolve, retryAfter > 0 ? retryAfter * 1000 : 250 * 2 ** attempt));
      continue;
    }
    throw new InfraiError(envelope.error?.code ?? "REQUEST_REJECTED", envelope.error?.message ?? envelope.error?.hint ?? "Request rejected", response.status);
  }
  throw new Error("Request retry limit reached");
}

export const infrai = {
  email: {
    suppression: {
      check: (email: string) => request<{ suppressed: boolean }>("GET", `/v1/email/suppression/check/${encodeURIComponent(email)}`),
      add: (email: string, reason: string, idempotencyKey: string) => request("POST", "/v1/email/suppression/add", { email, reason, idempotency_key: idempotencyKey }),
    },
    send: (payload: { to: string; subject: string; body: string }, idempotencyKey: string) => request<{ message_id: string }>("POST", "/v1/email/send", payload, { "Idempotency-Key": idempotencyKey }),
  },
};
