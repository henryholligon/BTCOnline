/**
 * Email sending via Resend.
 *
 * Requires RESEND_API_KEY in environment. FROM_EMAIL defaults to
 * Resend's shared onboarding address (delivers only to the Resend account
 * owner's email — fine for testing). Set FROM_EMAIL to a verified
 * domain address (e.g. noreply@yourdomain.com) for production use.
 */

import { Resend } from "resend";

let _client: Resend | null = null;

function getClient(): Resend {
  if (!_client) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error("RESEND_API_KEY is not configured");
    _client = new Resend(key);
  }
  return _client;
}

export function emailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}

function getFromAddress(): string {
  return process.env.FROM_EMAIL || "onboarding@resend.dev";
}

function buildResetEmailHtml(resetUrl: string, expiryMinutes = 60): string {
  // Callers must pass a fully-qualified URL; relative paths are not safe in emails.
  if (!resetUrl.startsWith("http")) {
    throw new Error(`sendPasswordResetEmail: resetUrl must be absolute, got: ${resetUrl}`);
  }
  const fullUrl = resetUrl;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset your password</title>
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;border:1px solid #e5e7eb;overflow:hidden;">
          <tr>
            <td style="background:#f97316;padding:24px 32px;">
              <p style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">&#8383; BTCOnline</p>
              <p style="margin:4px 0 0;color:#fff7ed;font-size:13px;">Bitcoin Merchant Directory</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <h1 style="margin:0 0 12px;font-size:22px;color:#111827;">Reset your password</h1>
              <p style="margin:0 0 24px;font-size:15px;color:#4b5563;line-height:1.6;">
                We received a request to reset the password for your BTCOnline account.
                Click the button below to choose a new password.
              </p>
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius:6px;background:#f97316;">
                    <a href="${fullUrl}"
                       style="display:inline-block;padding:12px 28px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:6px;">
                      Reset password
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 0;font-size:13px;color:#6b7280;line-height:1.5;">
                This link expires in <strong>${expiryMinutes} minutes</strong>.
                If you didn't request a password reset you can safely ignore this email —
                your account and Nostr identity are unchanged.
              </p>
              <p style="margin:16px 0 0;font-size:12px;color:#9ca3af;word-break:break-all;">
                Or copy this link into your browser:<br />
                <a href="${fullUrl}" style="color:#f97316;">${fullUrl}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px;border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                BTCOnline &mdash; An open-source directory of merchants that accept Bitcoin.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Send a password-reset email.
 * Returns true on success, false if Resend is not configured.
 * Throws on Resend delivery errors.
 */
export async function sendPasswordResetEmail(
  toEmail: string,
  resetUrl: string
): Promise<boolean> {
  if (!emailConfigured()) return false;

  const resend = getClient();
  const html = buildResetEmailHtml(resetUrl);

  const { error } = await resend.emails.send({
    from: getFromAddress(),
    to: toEmail,
    subject: "Reset your BTCOnline password",
    html,
  });

  if (error) {
    throw new Error(`Resend delivery failed: ${error.message}`);
  }

  return true;
}
