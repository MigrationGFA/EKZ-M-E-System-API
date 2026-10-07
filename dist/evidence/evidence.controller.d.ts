import type { Request as ExpressRequest } from 'express';
import { AzureStorageService } from '../storage/azure-storage.service.js';
import { EvidenceService } from './evidence.service.js';
import { CreateEvidenceDto } from './dto/create-evidence.dto.js';
import { UpdateEvidenceDto } from './dto/update-evidence.dto.js';
import { QueryEvidenceDto } from './dto/query-evidence.dto.js';
import type { ActorContext } from './helpers/assert-read-access.js';
type AuthedRequest = ExpressRequest & {
    user: ActorContext & {
        email: string;
    };
};
export declare class EvidenceController {
    private readonly service;
    private readonly azureStorage;
    constructor(service: EvidenceService, azureStorage: AzureStorageService);
    uploadDocument(file: Express.Multer.File | undefined): Promise<{
        file_url: string;
        file_size_bytes: number;
        mime_type: string;
        sha256: string;
    }>;
    create(dto: CreateEvidenceDto, req: AuthedRequest): Promise<import("./evidence.service.js").SerializedEvidenceDocument>;
    findAll(query: QueryEvidenceDto, req: AuthedRequest): Promise<{
        data: import("./evidence.service.js").SerializedEvidenceDocument[];
        total: number;
        page: number;
        per_page: number;
    }>;
    findOne(id: string, req: AuthedRequest): Promise<import("./evidence.service.js").SerializedEvidenceDocument>;
    update(id: string, dto: UpdateEvidenceDto, req: AuthedRequest): Promise<import("./evidence.service.js").SerializedEvidenceDocument>;
    replace(id: string, file: Express.Multer.File | undefined, body: {
        force?: string;
        title?: string;
        description?: string;
        type_metadata?: string;
    }, req: AuthedRequest): Promise<import("./evidence.service.js").SerializedEvidenceDocument>;
    remove(id: string, req: AuthedRequest): Promise<{
        id: string;
        deleted_at: string;
    }>;
}
export {};
