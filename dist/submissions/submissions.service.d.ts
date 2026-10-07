import { Repository } from 'typeorm';
import { Submission } from './submission.entity.js';
import { ProjectLocation } from '../locations/project-location.entity.js';
import { Form } from '../forms/form.entity.js';
import { CreateSubmissionDto } from './dto/create-submission.dto.js';
import { UsersService } from '../users/users.service.js';
import { MailService } from '../mail/mail.service.js';
import { AuditService } from '../audit/audit.service.js';
import { AlertsService } from '../alerts/alerts.service.js';
import { IndicatorsService } from '../indicators/indicators.service.js';
import { Beneficiary } from '../beneficiaries/beneficiary.entity.js';
export declare class SubmissionsService {
    private readonly subRepo;
    private readonly locRepo;
    private readonly formRepo;
    private readonly beneficiaryRepo;
    private readonly usersService;
    private readonly mailService;
    private readonly auditService;
    private readonly alertsService;
    private readonly indicatorsService;
    private readonly logger;
    constructor(subRepo: Repository<Submission>, locRepo: Repository<ProjectLocation>, formRepo: Repository<Form>, beneficiaryRepo: Repository<Beneficiary>, usersService: UsersService, mailService: MailService, auditService: AuditService, alertsService: AlertsService, indicatorsService: IndicatorsService);
    findAll(filters: {
        form_id?: string;
        officer_id?: string;
        validation_status?: string;
        page?: number;
        per_page?: number;
    }): Promise<{
        data: {
            id: string;
            formId: string;
            officerId: string;
            data: Record<string, any>;
            location: {
                lat: number;
                lng: number;
            } | null;
            location_id: string | null;
            on_site: boolean | null;
            submittedAt: Date;
            validation_status: string;
            validation_comment: string | null;
        }[];
        total: number;
        page: number;
        per_page: number;
    }>;
    findOne(id: string): Promise<{
        id: string;
        formId: string;
        officerId: string;
        data: Record<string, any>;
        location: {
            lat: number;
            lng: number;
        } | null;
        location_id: string | null;
        on_site: boolean | null;
        submittedAt: Date;
        validation_status: string;
        validation_comment: string | null;
    }>;
    create(dto: CreateSubmissionDto, actorId: string, actorName: string): Promise<{
        id: string;
        status: string;
    }>;
    createBatch(dtos: CreateSubmissionDto[], actorId: string, actorName: string): Promise<{
        accepted: string[];
        rejected: {
            id: string;
            reason: string;
        }[];
    }>;
    private processBatchItem;
    private sendSyncSuccessAlerts;
    validate(id: string, action: string, comment: string | undefined, actorId: string, actorName: string): Promise<{
        id: string;
        formId: string;
        officerId: string;
        data: Record<string, any>;
        location: {
            lat: number;
            lng: number;
        } | null;
        location_id: string | null;
        on_site: boolean | null;
        submittedAt: Date;
        validation_status: string;
        validation_comment: string | null;
    }>;
    private applyFieldMappings;
    private buildMappingBreakdowns;
    private bucketsForMapping;
    private notifyOffSite;
    private serialize;
}
