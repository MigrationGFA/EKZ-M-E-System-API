import { Repository } from 'typeorm';
import type { Request } from 'express';
import { PiiAccessLog, PiiAccessAction } from './pii-access-log.entity.js';
export interface PiiAuditActor {
    id: string;
    email: string;
}
export interface PiiAuditInput {
    actor: PiiAuditActor;
    beneficiary_id: string | null;
    action: PiiAccessAction;
    reason?: string | null;
    request?: Pick<Request, 'ip' | 'headers'> | null;
}
export declare class PiiAccessLogService {
    private readonly repo;
    private readonly logger;
    constructor(repo: Repository<PiiAccessLog>);
    record(input: PiiAuditInput): Promise<void>;
}
