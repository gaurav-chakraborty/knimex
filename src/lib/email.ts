import { Resend } from 'resend';

let resendClient: Resend | null = null;
let attempted = false;

/**
 * Lazily instantiates the Resend client. Returns null when RESEND_API_KEY
 * isn't configured so callers can no-op instead of crashing — mirrors the
 * degrade-gracefully pattern used by src/lib/stripe.ts.
 */
function getResend(): Resend | null {
  if (attempted) return resendClient;
  attempted = true;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;

  resendClient = new Resend(apiKey);
  return resendClient;
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

const FROM_ADDRESS = process.env.EMAIL_FROM || 'FileX <notifications@knimex.space>';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

async function sendEmail(to: string, subject: string, html: string) {
  const resend = getResend();
  if (!resend) {
    console.log(`[email] Skipping "${subject}" to ${to} — RESEND_API_KEY not set.`);
    return;
  }

  try {
    await resend.emails.send({ from: FROM_ADDRESS, to, subject, html });
  } catch (error) {
    console.error(`Failed to send email "${subject}" to ${to}:`, error);
  }
}

export async function sendUsageLimitReachedEmail(to: string, plan: string, limit: number) {
  await sendEmail(
    to,
    "You've hit today's file limit on FileX",
    `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Daily limit reached</h2>
        <p>You've processed ${limit} files today on the <strong>${plan}</strong> plan, which is today's cap.</p>
        <p>Upgrade to Pro for unlimited metadata processing, or come back tomorrow — your limit resets at midnight UTC.</p>
        <p><a href="${SITE_URL}/pricing" style="display:inline-block;padding:12px 24px;background:#7c3aed;color:#fff;border-radius:8px;text-decoration:none;">Upgrade to Pro</a></p>
      </div>
    `
  );
}

export async function sendUpgradeConfirmationEmail(to: string, plan: string) {
  await sendEmail(
    to,
    `You're now on the FileX ${plan} plan`,
    `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Welcome to ${plan}!</h2>
        <p>Your subscription is active. Unlimited processing and priority support are live on your account.</p>
        <p><a href="${SITE_URL}/account" style="display:inline-block;padding:12px 24px;background:#7c3aed;color:#fff;border-radius:8px;text-decoration:none;">View your account</a></p>
      </div>
    `
  );
}

export async function sendSubscriptionCanceledEmail(to: string) {
  await sendEmail(
    to,
    'Your FileX subscription has ended',
    `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Subscription ended</h2>
        <p>Your paid plan has ended and your account is now on the free Starter plan (5 files/day).</p>
        <p><a href="${SITE_URL}/pricing" style="display:inline-block;padding:12px 24px;background:#7c3aed;color:#fff;border-radius:8px;text-decoration:none;">Resubscribe</a></p>
      </div>
    `
  );
}
