export type EmailDeliveryResult =
  | { status: "sent" }
  | { status: "skipped"; reason: string }
  | { status: "failed"; reason: string };

export function requiredEmailEnv(missingReason: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    return {
      ok: false as const,
      reason: missingReason,
    };
  }

  return {
    ok: true as const,
    apiKey,
    from,
  };
}

export function renderEmailShell(input: {
  eyebrow: string;
  title: string;
  body: string[];
  actionLabel?: string;
  actionUrl?: string;
  footer?: string[];
}) {
  const bodyHtml = input.body.map((paragraph) => `<p style="margin: 0 0 12px; color: #697180; font-size: 16px; line-height: 1.65;">${paragraph}</p>`).join("");
  const footerHtml = (input.footer ?? [])
    .map((paragraph) => `<p style="margin: 0 0 8px; color: #697180; font-size: 13px; line-height: 1.6;">${paragraph}</p>`)
    .join("");

  return `
    <div style="font-family: Instrument Sans, Segoe UI, sans-serif; background: #f3f5f8; padding: 32px;">
      <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border: 1px solid rgba(17, 19, 24, 0.08); border-radius: 18px; padding: 32px; box-shadow: 0 18px 50px rgba(15, 23, 42, 0.08);">
        <p style="margin: 0 0 12px; color: #697180; font-size: 12px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase;">${input.eyebrow}</p>
        <h1 style="margin: 0 0 18px; color: #111318; font-size: 34px; line-height: 1.05; letter-spacing: -0.05em;">
          ${input.title}
        </h1>
        ${bodyHtml}
        ${
          input.actionLabel && input.actionUrl
            ? `<a href="${input.actionUrl}" style="display: inline-block; margin-top: 12px; background: #171c26; color: #ffffff; text-decoration: none; padding: 14px 18px; border-radius: 12px; font-weight: 600;">${input.actionLabel}</a>`
            : ""
        }
        ${footerHtml ? `<div style="margin-top: 24px;">${footerHtml}</div>` : ""}
      </div>
    </div>
  `;
}

