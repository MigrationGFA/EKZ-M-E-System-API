import type { Request as ExpressRequest } from 'express';
import { BeneficiariesService, ActorContext } from './beneficiaries.service.js';
import { CreateBeneficiaryDto } from './dto/create-beneficiary.dto.js';
import { UpdateBeneficiaryDto } from './dto/update-beneficiary.dto.js';
import { BeneficiaryQueryDto } from './dto/beneficiary-query.dto.js';
import { BatchBeneficiaryDto, BatchBeneficiaryResult } from './dto/batch-beneficiary.dto.js';
import { AttachCohortDto } from './dto/attach-cohort.dto.js';
type AuthedRequest = ExpressRequest & {
    user: ActorContext;
};
export declare class BeneficiariesController {
    private readonly service;
    constructor(service: BeneficiariesService);
    findAll(query: BeneficiaryQueryDto, req: AuthedRequest): Promise<import("./beneficiaries.service.js").SerializedBeneficiary[]>;
    lookup(phone: string | undefined, hash: string | undefined, req: AuthedRequest): Promise<import("./beneficiaries.service.js").BeneficiaryLookupHit[]>;
    findOne(id: string, req: AuthedRequest): Promise<import("./beneficiaries.service.js").SerializedBeneficiary>;
    create(dto: CreateBeneficiaryDto, req: AuthedRequest): Promise<import("./beneficiaries.service.js").SerializedBeneficiary>;
    batch(dto: BatchBeneficiaryDto, req: AuthedRequest): Promise<BatchBeneficiaryResult>;
    update(id: string, dto: UpdateBeneficiaryDto, req: AuthedRequest): Promise<import("./beneficiaries.service.js").SerializedBeneficiary>;
    softDelete(id: string, req: AuthedRequest): Promise<{
        id: string;
        active: boolean;
    }>;
    attachCohort(id: string, dto: AttachCohortDto, req: AuthedRequest): Promise<import("./beneficiaries.service.js").SerializedBeneficiary>;
    detachCohort(id: string, code: string, req: AuthedRequest): Promise<import("./beneficiaries.service.js").SerializedBeneficiary>;
}
export {};
