/**
 * Standalone SMTP smoke test — no NestJS DI required.
 * Sends one of every email type to the target address.
 *
 * Run: ts-node -r tsconfig-paths/register src/mail/mail-smoke-test.ts
 */

import * as nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';

dotenv.config();

const TO = 'fofama9304@soppat.com';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(
      `✗  Missing required env var: ${name}. Populate .env before running.`,
    );
    process.exit(1);
  }
  return value;
}

const SMTP = {
  host: requireEnv('SMTP_HOST'),
  port: Number(process.env.SMTP_PORT ?? 587),
  user: requireEnv('SMTP_USER'),
  pass: requireEnv('SMTP_PASS'),
  from: requireEnv('SMTP_FROM'),
};

const transporter = nodemailer.createTransport({
  host: SMTP.host,
  port: SMTP.port,
  secure: false,
  auth: { user: SMTP.user, pass: SMTP.pass },
  tls: { rejectUnauthorized: false },
});

// ── HTML wrapper ────────────────────────────────────────────────────────────

function wrapHtml(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;">
          <tr>
            <td style="background-color:#1a56db;padding:24px 32px;">
              <h1 style="margin:0;color:#ffffff;font-size:20px;">EKZ M&amp;E System</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <h2 style="margin:0 0 16px;color:#1a1a2e;font-size:18px;">${title}</h2>
              ${body}
            </td>
          </tr>
          <tr>
            <td style="background-color:#f4f4f7;padding:16px 32px;text-align:center;color:#6b7280;font-size:12px;">
              <p style="margin:0;">Ekiti Knowledge Zone — Monitoring &amp; Evaluation System</p>
              <p style="margin:4px 0 0;">This is an automated message. Please do not reply.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── Email definitions ────────────────────────────────────────────────────────

const emails: { label: string; subject: string; html: string }[] = [
  {
    label: '1 — Welcome (new user invite)',
    subject: 'Welcome to EKZ M&E System',
    html: wrapHtml(
      'Welcome to EKZ M&E',
      `<p>Hi Grace Okonkwo,</p>
       <p>Your account has been created on the Ekiti Knowledge Zone M&amp;E System.</p>
       <p>Your login credentials:</p>
       <ul>
         <li><strong>Email:</strong> grace.okonkwo@ekz.com</li>
         <li><strong>Password:</strong> &lt;temporary-password&gt;</li>
       </ul>
       <p>Please log in and change your password immediately.</p>`,
    ),
  },
  {
    label: '2 — Password Reset (admin triggered)',
    subject: 'Your Password Has Been Reset',
    html: wrapHtml(
      'Password Reset',
      `<p>Hi Grace Okonkwo,</p>
       <p>An administrator has reset your password.</p>
       <p>Your new temporary password: <strong>&lt;temporary-password&gt;</strong></p>
       <p>Please log in and change your password immediately.</p>`,
    ),
  },
  {
    label: '3 — Account Deactivated',
    subject: 'Your Account Has Been Deactivated',
    html: wrapHtml(
      'Account Deactivated',
      `<p>Hi Grace Okonkwo,</p>
       <p>Your account on the EKZ M&amp;E System has been deactivated by an administrator.</p>
       <p>If you believe this is an error, please contact your system administrator.</p>`,
    ),
  },
  {
    label: '4 — Account Reactivated',
    subject: 'Your Account Has Been Reactivated',
    html: wrapHtml(
      'Account Reactivated',
      `<p>Hi Grace Okonkwo,</p>
       <p>Your account on the EKZ M&amp;E System has been reactivated. You can now log in again.</p>`,
    ),
  },
  {
    label: '5 — Role Changed',
    subject: 'Your Role Has Been Updated',
    html: wrapHtml(
      'Role Updated',
      `<p>Hi Grace Okonkwo,</p>
       <p>Your role has been changed from <strong>viewer</strong> to <strong>me_staff</strong>.</p>
       <p>Your permissions have been updated accordingly.</p>`,
    ),
  },
  {
    label: '6 — Password Changed (self)',
    subject: 'Your Password Has Been Changed',
    html: wrapHtml(
      'Password Changed',
      `<p>Hi Grace Okonkwo,</p>
       <p>Your password was successfully changed.</p>
       <p>If you did not make this change, please contact your administrator immediately.</p>`,
    ),
  },
  {
    label: '7 — Submission Approved',
    subject: 'Submission Approved',
    html: wrapHtml(
      'Submission Approved',
      `<p>Hi Grace Okonkwo,</p>
       <p>Your submission <strong>a1b2c3d4-0000-0000-0000-111122223333</strong> has been approved.</p>`,
    ),
  },
  {
    label: '8 — Submission Rejected',
    subject: 'Submission Rejected',
    html: wrapHtml(
      'Submission Rejected',
      `<p>Hi Grace Okonkwo,</p>
       <p>Your submission <strong>a1b2c3d4-0000-0000-0000-111122223333</strong> has been rejected.</p>
       <p><strong>Reason:</strong> GPS coordinates do not match the declared project site.</p>
       <p>Please review and resubmit if necessary.</p>`,
    ),
  },
  {
    label: '9 — Off-Site Submission Alert (admin notification)',
    subject: 'Off-Site Submission Alert',
    html: wrapHtml(
      'Off-Site Submission',
      `<p>A submission was recorded <strong>outside</strong> all project location geofences.</p>
       <ul>
         <li><strong>Submission ID:</strong> a1b2c3d4-0000-0000-0000-111122223333</li>
         <li><strong>Officer:</strong> Grace Okonkwo</li>
       </ul>
       <p>Please review this submission for accuracy.</p>`,
    ),
  },
  {
    label: '10 — Indicator At Risk',
    subject: 'Indicator At Risk: OUT-1.1',
    html: wrapHtml(
      'Indicator At Risk',
      `<p>Indicator <strong>OUT-1.1</strong> — "Number of youths completing technical training" has moved to <strong>at_risk</strong>.</p>
       <p>Please review and take corrective action if needed.</p>`,
    ),
  },
  {
    label: '11 — Indicator Off Track',
    subject: 'Indicator Off Track: OUT-2.3',
    html: wrapHtml(
      'Indicator Off Track',
      `<p>Indicator <strong>OUT-2.3</strong> — "Number of SMEs receiving business development support" has moved to <strong>off_track</strong>.</p>
       <p>Please review and take corrective action if needed.</p>`,
    ),
  },
  {
    label: '12 — Alert Notification (deadline type)',
    subject: 'Alert: Q2 Reporting Deadline Tomorrow',
    html: wrapHtml(
      'Q2 Reporting Deadline Tomorrow',
      `<p>Your Q2 indicator reports are due tomorrow. Please ensure all progress entries are submitted before midnight.</p>
       <p><strong>Type:</strong> deadline</p>`,
    ),
  },
  {
    label: '13 — Report Generated',
    subject: 'Report Ready: Q1 2026 Programme Performance',
    html: wrapHtml(
      'Report Generated',
      `<p>Hi Adebola Johnson,</p>
       <p>Your report "<strong>Q1 2026 Programme Performance</strong>" (PDF) has been generated successfully.</p>`,
    ),
  },
  {
    label: '14 — API Token Created (admin notification)',
    subject: 'API Token Created: Mobile Sync Service',
    html: wrapHtml(
      'API Token Created',
      `<p>A new API token has been created.</p>
       <ul>
         <li><strong>Name:</strong> Mobile Sync Service</li>
         <li><strong>Token:</strong> ekz_LIVE_a3f2****...b9c</li>
       </ul>`,
    ),
  },
  {
    label: '15 — API Token Revoked (admin notification)',
    subject: 'API Token Revoked: Mobile Sync Service',
    html: wrapHtml(
      'API Token Revoked',
      `<p>The API token "<strong>Mobile Sync Service</strong>" has been revoked and is no longer valid.</p>`,
    ),
  },
];

// ── Runner ───────────────────────────────────────────────────────────────────

async function run() {
  console.log(`\nEKZ M&E — SMTP Smoke Test`);
  console.log(`To:   ${TO}`);
  console.log(`Via:  ${SMTP.host}:${SMTP.port}`);
  console.log(`From: ${SMTP.from}`);
  console.log(`─────────────────────────────────────────────\n`);

  // Verify connection first
  try {
    await transporter.verify();
    console.log(`✓  SMTP connection verified\n`);
  } catch (err) {
    console.error(`✗  SMTP connection FAILED:`, err);
    process.exit(1);
  }

  let passed = 0;
  let failed = 0;

  for (const email of emails) {
    try {
      await transporter.sendMail({
        from: SMTP.from,
        to: TO,
        subject: email.subject,
        html: email.html,
      });
      console.log(`✓  ${email.label}`);
      passed++;
    } catch (err) {
      console.error(`✗  ${email.label}`);
      console.error(`   ${err instanceof Error ? err.message : String(err)}`);
      failed++;
    }
  }

  console.log(`\n─────────────────────────────────────────────`);
  console.log(`Sent: ${passed}/${emails.length}   Failed: ${failed}`);
  console.log(`─────────────────────────────────────────────\n`);
}

run().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
