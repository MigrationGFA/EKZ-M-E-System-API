import { ConfigService } from '@nestjs/config';
export declare class MailService {
    private readonly config;
    private readonly logger;
    private readonly transporter;
    private readonly from;
    private readonly frontendUrl;
    constructor(config: ConfigService);
    sendWelcome(to: string, name: string, defaultPassword: string): void;
    sendPasswordReset(to: string, name: string, defaultPassword: string): void;
    sendAccountDeactivated(to: string, name: string): void;
    sendAccountReactivated(to: string, name: string): void;
    sendRoleChanged(to: string, name: string, oldRole: string, newRole: string): void;
    sendForgotPasswordLink(to: string, name: string, resetLink: string): void;
    sendPasswordChanged(to: string, name: string): void;
    sendSubmissionApproved(to: string, officerName: string, submissionId: string, formTitle: string, approvedByName: string, approvedAt: Date): void;
    sendSubmissionRejected(to: string, officerName: string, submissionId: string, formTitle: string, reason: string, rejectedByName: string, rejectedAt: Date): void;
    sendOffSiteAlert(recipients: string[], submissionId: string, officerName: string): void;
    sendIndicatorStatusAlert(recipients: string[], indicatorName: string, indicatorCode: string, newStatus: string): void;
    sendAlertNotification(to: string, title: string, description: string, alertType: string): void;
    sendFormAssigned(to: string, name: string, formTitle: string): void;
    sendReportReady(to: string, generatorName: string, reportTitle: string, format: string): void;
    sendTokenCreated(recipients: string[], tokenName: string, tokenPrefix: string): void;
    sendTokenRevoked(recipients: string[], tokenName: string): void;
    private send;
    private wrapHtml;
}
