import { Repository } from 'typeorm';
import type { Request } from 'express';
import { Beneficiary } from './beneficiary.entity.js';
import { CreateBeneficiaryDto } from './dto/create-beneficiary.dto.js';
import { UpdateBeneficiaryDto } from './dto/update-beneficiary.dto.js';
import { BeneficiaryQueryDto } from './dto/beneficiary-query.dto.js';
import { BatchBeneficiaryResult } from './dto/batch-beneficiary.dto.js';
import { CohortsService } from './cohorts.service.js';
import { PiiAccessLogService } from './pii-access-log.service.js';
import { UserRole } from '../common/enums/user-role.enum.js';
export interface ActorContext {
    id: string;
    email: string;
    role: UserRole;
}
export interface SerializedBeneficiary {
    id: string;
    full_name: string;
    sex: string;
    date_of_birth: string | null;
    age_band: string | null;
    community: string | null;
    household_id: string | null;
    phone_e164: string | null;
    national_id_hash: string | null;
    skill_level: string | null;
    disability_status: boolean;
    notes: string | null;
    consent_given: boolean;
    consent_date: string | null;
    consent_method: string | null;
    active: boolean;
    withdrawn_at: string | null;
    created_by: string;
    created_at: string;
    updated_at: string;
    cohorts: Array<{
        id: string;
        code: string;
        name: string;
    }>;
}
export interface BeneficiaryLookupHit {
    id: string;
    full_name: string;
    community: string | null;
    cohort_codes: string[];
}
export declare class BeneficiariesService {
    private readonly repo;
    private readonly cohortsService;
    private readonly piiAuditService;
    private readonly logger;
    constructor(repo: Repository<Beneficiary>, cohortsService: CohortsService, piiAuditService: PiiAccessLogService);
    findAll(query: BeneficiaryQueryDto, actor: ActorContext): Promise<SerializedBeneficiary[]>;
    findOne(id: string, actor: ActorContext, request?: Pick<Request, 'ip' | 'headers'>): Promise<SerializedBeneficiary>;
    create(dto: CreateBeneficiaryDto, actor: ActorContext, request?: Pick<Request, 'ip' | 'headers'>): Promise<SerializedBeneficiary>;
    update(id: string, dto: UpdateBeneficiaryDto, actor: ActorContext, request?: Pick<Request, 'ip' | 'headers'>): Promise<SerializedBeneficiary>;
    softDelete(id: string, actor: ActorContext, request?: Pick<Request, 'ip' | 'headers'>): Promise<{
        id: string;
        active: boolean;
    }>;
    attachCohort(id: string, code: string, actor: ActorContext): Promise<SerializedBeneficiary>;
    detachCohort(id: string, code: string, actor: ActorContext): Promise<SerializedBeneficiary>;
    lookup(actor: ActorContext, args: {
        phone?: string;
        hash?: string;
    }): Promise<BeneficiaryLookupHit[]>;
    batchCreate(items: CreateBeneficiaryDto[], actor: ActorContext): Promise<BatchBeneficiaryResult>;
    private assertReadAccess;
    private assertWriteAccess;
    private replaceCohortsByCode;
    private loadWithCohorts;
    private applyUpdates;
    private serialize;
}
