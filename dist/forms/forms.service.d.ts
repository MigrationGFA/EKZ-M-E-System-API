import { Repository } from 'typeorm';
import { Form } from './form.entity.js';
import { Submission } from '../submissions/submission.entity.js';
import { Indicator } from '../indicators/indicator.entity.js';
import { CreateFormDto } from './dto/create-form.dto.js';
import { UpdateFormDto } from './dto/update-form.dto.js';
import { AuditService } from '../audit/audit.service.js';
import { AlertsService } from '../alerts/alerts.service.js';
import { UsersService } from '../users/users.service.js';
import { MailService } from '../mail/mail.service.js';
export declare class FormsService {
    private readonly formRepo;
    private readonly subRepo;
    private readonly indicatorRepo;
    private readonly auditService;
    private readonly alertsService;
    private readonly usersService;
    private readonly mailService;
    constructor(formRepo: Repository<Form>, subRepo: Repository<Submission>, indicatorRepo: Repository<Indicator>, auditService: AuditService, alertsService: AlertsService, usersService: UsersService, mailService: MailService);
    private assertMappingsAllowed;
    findAll(filters: {
        status?: string;
        assigned_to?: string;
    }): Promise<{
        id: string;
        title: string;
        description: string;
        fields: any[];
        indicator_ids: string[];
        assigned_to: string[];
        field_mappings: {
            form_field_id: string;
            indicator_id: string;
            transform?: "latest" | "sum" | "average";
            axis?: "sex" | "age_band" | "cohort" | "skill_level";
            beneficiary_attr?: "sex" | "age_band" | "cohort" | "skill_level";
            static_bucket?: string;
        }[];
        location_ids: string[];
        require_gps: boolean;
        created_by: string;
        status: string;
        createdAt: Date;
    }[]>;
    findOne(id: string): Promise<{
        id: string;
        title: string;
        description: string;
        fields: any[];
        indicator_ids: string[];
        assigned_to: string[];
        field_mappings: {
            form_field_id: string;
            indicator_id: string;
            transform?: "latest" | "sum" | "average";
            axis?: "sex" | "age_band" | "cohort" | "skill_level";
            beneficiary_attr?: "sex" | "age_band" | "cohort" | "skill_level";
            static_bucket?: string;
        }[];
        location_ids: string[];
        require_gps: boolean;
        created_by: string;
        status: string;
        createdAt: Date;
    }>;
    create(dto: CreateFormDto, actorId: string, actorName: string): Promise<{
        id: string;
        title: string;
        description: string;
        fields: any[];
        indicator_ids: string[];
        assigned_to: string[];
        field_mappings: {
            form_field_id: string;
            indicator_id: string;
            transform?: "latest" | "sum" | "average";
            axis?: "sex" | "age_band" | "cohort" | "skill_level";
            beneficiary_attr?: "sex" | "age_band" | "cohort" | "skill_level";
            static_bucket?: string;
        }[];
        location_ids: string[];
        require_gps: boolean;
        created_by: string;
        status: string;
        createdAt: Date;
    }>;
    update(id: string, dto: UpdateFormDto, actorId: string, actorName: string): Promise<{
        id: string;
        title: string;
        description: string;
        fields: any[];
        indicator_ids: string[];
        assigned_to: string[];
        field_mappings: {
            form_field_id: string;
            indicator_id: string;
            transform?: "latest" | "sum" | "average";
            axis?: "sex" | "age_band" | "cohort" | "skill_level";
            beneficiary_attr?: "sex" | "age_band" | "cohort" | "skill_level";
            static_bucket?: string;
        }[];
        location_ids: string[];
        require_gps: boolean;
        created_by: string;
        status: string;
        createdAt: Date;
    }>;
    remove(id: string, actorId: string, actorName: string): Promise<void>;
    private notifyNewAssignees;
    private serialize;
}
