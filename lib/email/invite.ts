import { Resend } from "resend";
import { requiredEmailEnv, renderEmailShell, type EmailDeliveryResult } from "./shared";

type InviteEmailInput = {
  inviteeEmail: string;
  inviterEmail: string;
  inviteRole: string;
  inviteUrl: string;
  organizationName: string;
};

type InviteEmailResult = EmailDeliveryResult;

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
  return renderEmailShell({
    eyebrow: "Organization Invite",
    title: `Join ${input.organizationName}`,
    body: [
      `${input.inviterEmail} invited ${input.inviteeEmail} to join ${input.organizationName} as a ${input.inviteRole}.`,
      "Accept the invite to continue onboarding in the app.",
    ],
    actionLabel: "Accept invite",
    actionUrl: input.inviteUrl,
    footer: [`Or paste this URL into your browser: ${input.inviteUrl}`],
  });
}

export async function sendInviteEmail(input: InviteEmailInput): Promise<InviteEmailResult> {
  const env = requiredEmailEnv("Invite created, but email delivery is not configured. Set RESEND_API_KEY and EMAIL_FROM.");

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
