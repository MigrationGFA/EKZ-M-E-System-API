import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter;
  private readonly from: string;

  constructor(private readonly config: ConfigService) {
    this.from = this.config.get<string>('SMTP_FROM', 'hello@dimpified.com');
    this.transporter = nodemailer.createTransport({
      host: this.config.get<string>('SMTP_HOST'),
      port: this.config.get<number>('SMTP_PORT', 587),
      secure: false,
      auth: {
        user: this.config.get<string>('SMTP_USER'),
        pass: this.config.get<string>('SMTP_PASS'),
      },
    });
  }

  // ── Public send methods ────────────────────────────────────────────

  sendWelcome(to: string, name: string, defaultPassword: string): void {
    void this.send(
      to,
      'Welcome to EKZ M&E System',
      this.wrapHtml(
        'Welcome to EKZ M&E',
        `<p>Hi ${name},</p>
         <p>Your account has been created on the Ekiti Knowledge Zone M&amp;E System.</p>
         <p>Your login credentials:</p>
         <ul>
           <li><strong>Email:</strong> ${to}</li>
           <li><strong>Password:</strong> ${defaultPassword}</li>
         </ul>
         <p>Please log in and change your password immediately.</p>`,
      ),
    );
  }

  sendPasswordReset(to: string, name: string, defaultPassword: string): void {
    void this.send(
      to,
      'Your Password Has Been Reset',
      this.wrapHtml(
        'Password Reset',
        `<p>Hi ${name},</p>
         <p>An administrator has reset your password.</p>
         <p>Your new temporary password: <strong>${defaultPassword}</strong></p>
         <p>Please log in and change your password immediately.</p>`,
      ),
    );
  }

  sendAccountDeactivated(to: string, name: string): void {
    void this.send(
      to,
      'Your Account Has Been Deactivated',
      this.wrapHtml(
        'Account Deactivated',
        `<p>Hi ${name},</p>
         <p>Your account on the EKZ M&amp;E System has been deactivated by an administrator.</p>
         <p>If you believe this is an error, please contact your system administrator.</p>`,
      ),
    );
  }

  sendAccountReactivated(to: string, name: string): void {
    void this.send(
      to,
      'Your Account Has Been Reactivated',
      this.wrapHtml(
        'Account Reactivated',
        `<p>Hi ${name},</p>
         <p>Your account on the EKZ M&amp;E System has been reactivated. You can now log in again.</p>`,
      ),
    );
  }

  sendRoleChanged(
    to: string,
    name: string,
    oldRole: string,
    newRole: string,
  ): void {
    void this.send(
      to,
      'Your Role Has Been Updated',
      this.wrapHtml(
        'Role Updated',
        `<p>Hi ${name},</p>
         <p>Your role has been changed from <strong>${oldRole}</strong> to <strong>${newRole}</strong>.</p>
         <p>Your permissions have been updated accordingly.</p>`,
      ),
    );
  }

  sendForgotPasswordLink(to: string, name: string, resetLink: string): void {
    void this.send(
      to,
      'Reset Your EKZ M&E Password',
      this.wrapHtml(
        'Reset Your Password',
        `<p>Hi ${name},</p>
         <p>We received a request to reset the password for your EKZ M&amp;E System account.</p>
         <p>Click the button below to set a new password. This link expires in <strong>1 hour</strong>.</p>
         <p style="text-align:center;margin:28px 0;">
           <a href="${resetLink}"
              style="background-color:#1a56db;color:#ffffff;padding:13px 28px;border-radius:6px;text-decoration:none;font-weight:600;font-size:15px;display:inline-block;">
             Reset Password
           </a>
         </p>
         <p style="font-size:13px;color:#6b7280;">Or paste this link into your browser:</p>
         <p style="word-break:break-all;font-size:13px;color:#1a56db;">${resetLink}</p>
         <p style="margin-top:24px;font-size:13px;color:#6b7280;">
           If you did not request a password reset, you can safely ignore this email — your password will not change.
         </p>`,
      ),
    );
  }

  sendPasswordChanged(to: string, name: string): void {
    void this.send(
      to,
      'Your Password Has Been Changed',
      this.wrapHtml(
        'Password Changed',
        `<p>Hi ${name},</p>
         <p>Your password was successfully changed.</p>
         <p>If you did not make this change, please contact your administrator immediately.</p>`,
      ),
    );
  }

  sendSubmissionApproved(
    to: string,
    officerName: string,
    submissionId: string,
    formTitle: string,
    approvedByName: string,
    approvedAt: Date,
  ): void {
    const dateStr = approvedAt.toLocaleDateString('en-GB', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
    void this.send(
      to,
      `Submission Approved — ${formTitle}`,
      this.wrapHtml(
        'Submission Approved ✓',
        `<p>Hi ${officerName},</p>
         <p>Your submission has been <strong style="color:#057a55;">approved</strong>.</p>
         <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;">
           <tr style="background:#f9fafb;">
             <td style="padding:8px 12px;color:#6b7280;width:40%;">Form</td>
             <td style="padding:8px 12px;font-weight:600;">${formTitle}</td>
           </tr>
           <tr>
             <td style="padding:8px 12px;color:#6b7280;">Submission ID</td>
             <td style="padding:8px 12px;font-family:monospace;font-size:12px;">${submissionId}</td>
           </tr>
           <tr style="background:#f9fafb;">
             <td style="padding:8px 12px;color:#6b7280;">Approved by</td>
             <td style="padding:8px 12px;">${approvedByName}</td>
           </tr>
           <tr>
             <td style="padding:8px 12px;color:#6b7280;">Date</td>
             <td style="padding:8px 12px;">${dateStr}</td>
           </tr>
         </table>
         <p style="font-size:13px;color:#6b7280;">
           The data from this submission has been recorded in the M&amp;E system.
           No further action is required on your part.
         </p>`,
      ),
    );
  }

  sendSubmissionRejected(
    to: string,
    officerName: string,
    submissionId: string,
    formTitle: string,
    reason: string,
    rejectedByName: string,
    rejectedAt: Date,
  ): void {
    const dateStr = rejectedAt.toLocaleDateString('en-GB', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
    void this.send(
      to,
      `Action Required: Submission Rejected — ${formTitle}`,
      this.wrapHtml(
        'Submission Rejected',
        `<p>Hi ${officerName},</p>
         <p>Your submission has been <strong style="color:#e02424;">rejected</strong>
            and this record is now closed.</p>
         <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;">
           <tr style="background:#f9fafb;">
             <td style="padding:8px 12px;color:#6b7280;width:40%;">Form</td>
             <td style="padding:8px 12px;font-weight:600;">${formTitle}</td>
           </tr>
           <tr>
             <td style="padding:8px 12px;color:#6b7280;">Submission ID</td>
             <td style="padding:8px 12px;font-family:monospace;font-size:12px;">${submissionId}</td>
           </tr>
           <tr style="background:#f9fafb;">
             <td style="padding:8px 12px;color:#6b7280;">Rejected by</td>
             <td style="padding:8px 12px;">${rejectedByName}</td>
           </tr>
           <tr>
             <td style="padding:8px 12px;color:#6b7280;">Date</td>
             <td style="padding:8px 12px;">${dateStr}</td>
           </tr>
         </table>
         <div style="background:#fef2f2;border-left:4px solid #e02424;padding:14px 16px;margin:20px 0;border-radius:0 4px 4px 0;">
           <p style="margin:0 0 4px;font-weight:600;color:#c81e1e;font-size:13px;">Reason for rejection</p>
           <p style="margin:0;color:#1a1a2e;font-size:14px;">${reason}</p>
         </div>
         <p style="font-size:14px;">
           If the data needs to be re-collected, please complete a new form entry from the field
           and submit it through the EKZ M&amp;E app. Do <strong>not</strong> resubmit this same record.
         </p>
         <p style="font-size:13px;color:#6b7280;margin-top:16px;">
           If you believe this rejection is in error, please contact your M&amp;E supervisor directly.
         </p>`,
      ),
    );
  }

  sendOffSiteAlert(
    recipients: string[],
    submissionId: string,
    officerName: string,
  ): void {
    void this.send(
      recipients.join(','),
      'Off-Site Submission Alert',
      this.wrapHtml(
        'Off-Site Submission',
        `<p>A submission was recorded <strong>outside</strong> all project location geofences.</p>
         <ul>
           <li><strong>Submission ID:</strong> ${submissionId}</li>
           <li><strong>Officer:</strong> ${officerName}</li>
         </ul>
         <p>Please review this submission for accuracy.</p>`,
      ),
    );
  }

  sendIndicatorStatusAlert(
    recipients: string[],
    indicatorName: string,
    indicatorCode: string,
    newStatus: string,
  ): void {
    const statusLabel = newStatus === 'at_risk' ? 'At Risk' : 'Off Track';
    void this.send(
      recipients.join(','),
      `Indicator ${statusLabel}: ${indicatorCode}`,
      this.wrapHtml(
        `Indicator ${statusLabel}`,
        `<p>Indicator <strong>${indicatorCode}</strong> — "${indicatorName}" has moved to <strong>${newStatus}</strong>.</p>
         <p>Please review and take corrective action if needed.</p>`,
      ),
    );
  }

  sendAlertNotification(
    to: string,
    title: string,
    description: string,
    alertType: string,
  ): void {
    void this.send(
      to,
      `Alert: ${title}`,
      this.wrapHtml(
        title,
        `<p>${description}</p>
         <p><strong>Type:</strong> ${alertType}</p>`,
      ),
    );
  }

  sendReportReady(
    to: string,
    generatorName: string,
    reportTitle: string,
    format: string,
  ): void {
    void this.send(
      to,
      `Report Ready: ${reportTitle}`,
      this.wrapHtml(
        'Report Generated',
        `<p>Hi ${generatorName},</p>
         <p>Your report "<strong>${reportTitle}</strong>" (${format.toUpperCase()}) has been generated successfully.</p>`,
      ),
    );
  }

  sendTokenCreated(
    recipients: string[],
    tokenName: string,
    tokenPrefix: string,
  ): void {
    void this.send(
      recipients.join(','),
      `API Token Created: ${tokenName}`,
      this.wrapHtml(
        'API Token Created',
        `<p>A new API token has been created.</p>
         <ul>
           <li><strong>Name:</strong> ${tokenName}</li>
           <li><strong>Token:</strong> ${tokenPrefix}</li>
         </ul>`,
      ),
    );
  }

  sendTokenRevoked(recipients: string[], tokenName: string): void {
    void this.send(
      recipients.join(','),
      `API Token Revoked: ${tokenName}`,
      this.wrapHtml(
        'API Token Revoked',
        `<p>The API token "<strong>${tokenName}</strong>" has been revoked and is no longer valid.</p>`,
      ),
    );
  }

  // ── Private helpers ────────────────────────────────────────────────

  private async send(to: string, subject: string, html: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.from,
        to,
        subject,
        html,
      });
      this.logger.log(`Email sent to ${to}: ${subject}`);
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${to}: ${subject}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  private wrapHtml(title: string, body: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
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
}
