import { Resend } from "resend";

type InviteEmailInput = {
  inviteeEmail: string;
  inviterEmail: string;
  inviteRole: string;
  inviteUrl: string;
  organizationName: string;
};

type InviteEmailResult =
  | { status: "sent" }
  | { status: "skipped"; reason: string }
  | { status: "failed"; reason: string };

function requiredInviteEnv() {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    return {
      ok: false as const,
      reason: "Invite created, but email delivery is not configured. Set RESEND_API_KEY and EMAIL_FROM.",
    };
  }

  return {
    ok: true as const,
    apiKey,
    from,
  };
}

function emailSubject(input: InviteEmailInput) {
  return `You're invited to join ${input.organizationName}`;
}

function emailText(input: InviteEmailInput) {
  return [
    `You have been invited to join ${input.organizationName} as a ${input.inviteRole}.`,
    "",
    `Invited by: ${input.inviterEmail}`,
    `Accept invite: ${input.inviteUrl}`,
    "",
    "If this was unexpected, you can ignore this email.",
  ].join("\n");
}

function emailHtml(input: InviteEmailInput) {
  return `
    <div style="font-family: Georgia, serif; background: #f6efe5; padding: 32px;">
      <div style="max-width: 640px; margin: 0 auto; background: #fffdf9; border: 1px solid #d7c8b2; border-radius: 24px; padding: 32px;">
        <p style="margin: 0 0 12px; color: #1f6b52; font-size: 12px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase;">Organization Invite</p>
        <h1 style="margin: 0 0 16px; color: #1a1712; font-size: 34px; line-height: 1.05;">
          Join ${input.organizationName}
        </h1>
        <p style="margin: 0 0 12px; color: #665f54; font-size: 16px; line-height: 1.6;">
          ${input.inviterEmail} invited <strong>${input.inviteeEmail}</strong> to join
          <strong>${input.organizationName}</strong> as a <strong>${input.inviteRole}</strong>.
        </p>
        <p style="margin: 0 0 24px; color: #665f54; font-size: 16px; line-height: 1.6;">
          Accept the invite to continue onboarding in the app.
        </p>
        <a href="${input.inviteUrl}" style="display: inline-block; background: #1f6b52; color: #ffffff; text-decoration: none; padding: 14px 20px; border-radius: 999px; font-weight: 700;">
          Accept invite
        </a>
        <p style="margin: 24px 0 0; color: #665f54; font-size: 13px; line-height: 1.6;">
          Or paste this URL into your browser:<br />
          <span style="font-family: 'Courier New', monospace;">${input.inviteUrl}</span>
        </p>
      </div>
    </div>
  `;
}

export async function sendInviteEmail(input: InviteEmailInput): Promise<InviteEmailResult> {
  const env = requiredInviteEnv();

  if (!env.ok) {
    return {
      status: "skipped",
      reason: env.reason,
    };
  }

  try {
    const resend = new Resend(env.apiKey);

    await resend.emails.send({
      from: env.from,
      to: input.inviteeEmail,
      subject: emailSubject(input),
      text: emailText(input),
      html: emailHtml(input),
    });

    return { status: "sent" };
  } catch (error) {
    return {
      status: "failed",
      reason: error instanceof Error ? error.message : "Invite email failed unexpectedly.",
    };
  }
}
