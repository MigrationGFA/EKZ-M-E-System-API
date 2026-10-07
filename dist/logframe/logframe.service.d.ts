import { Repository } from 'typeorm';
import { LogframeNode } from './logframe-node.entity.js';
import { Indicator } from '../indicators/indicator.entity.js';
import { CreateNodeDto } from './dto/create-node.dto.js';
import { UpdateNodeDto } from './dto/update-node.dto.js';
import { AuditService } from '../audit/audit.service.js';
export interface SerializedIndicator {
    id: string;
    code: string;
    name: string;
    description: string;
    level: string;
    unit: string;
    baseline: number;
    target: number;
    current_value: number;
    status: string;
    frequency: string;
    logframe_level_id: string | null;
    sdg_ids: number[];
    responsible_party: string;
    means_of_verification: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface LogframeTreeNode {
    id: string;
    logframe_id: string;
    type: string;
    code: string;
    title: string;
    description: string | null;
    parent_id: string | null;
    order: number;
    budget_usd: number | null;
    budget_currency: string;
    indicators: SerializedIndicator[];
    children: LogframeTreeNode[];
}
export declare class LogframeService {
    private readonly nodeRepo;
    private readonly indicatorRepo;
    private readonly auditService;
    constructor(nodeRepo: Repository<LogframeNode>, indicatorRepo: Repository<Indicator>, auditService: AuditService);
    getTree(): Promise<LogframeTreeNode[]>;
    createNode(dto: CreateNodeDto, actorId: string, actorName: string): Promise<{
        indicators: never[];
        children: never[];
        id: string;
        logframe_id: string;
        type: string;
        code: string;
        title: string;
        description: string | null;
        parent_id: string | null;
        parent: LogframeNode | null;
        order: number;
        budget_usd: number | null;
        budget_currency: string;
        created_at: Date;
        updated_at: Date;
    }>;
    updateNode(id: string, dto: UpdateNodeDto, actorId: string, actorName: string): Promise<{
        indicators: SerializedIndicator[];
        children: never[];
        id: string;
        logframe_id: string;
        type: string;
        code: string;
        title: string;
        description: string | null;
        parent_id: string | null;
        parent: LogframeNode | null;
        order: number;
        budget_usd: number | null;
        budget_currency: string;
        created_at: Date;
        updated_at: Date;
    }>;
    deleteNode(id: string, actorId: string, actorName: string): Promise<void>;
    linkIndicator(nodeId: string, indicatorId: string, actorId: string, actorName: string): Promise<{
        success: boolean;
    }>;
    unlinkIndicator(nodeId: string, indicatorId: string, actorId: string, actorName: string): Promise<void>;
    private validateParentConstraint;
    private validateAtMostOneOfType;
    private serializeIndicator;
}
