import { Repository } from 'typeorm';
import { EvidenceDocument } from './evidence-document.entity.js';
import type { DocumentType } from './evidence-document.entity.js';
import { CreateEvidenceDto } from './dto/create-evidence.dto.js';
import { UpdateEvidenceDto } from './dto/update-evidence.dto.js';
import { QueryEvidenceDto } from './dto/query-evidence.dto.js';
import { type ActorContext } from './helpers/assert-read-access.js';
import { AuditService } from '../audit/audit.service.js';
import { Cohort } from '../beneficiaries/cohort.entity.js';
export interface SerializedEvidenceDocument {
    id: string;
    title: string;
    description: string | null;
    document_type: DocumentType;
    type_metadata: Record<string, unknown>;
    reference_period_from: string | null;
    reference_period_to: string | null;
    retention_until: string | null;
    file_url: string;
    file_size_bytes: number;
    mime_type: string;
    sha256: string;
    uploaded_by: string;
    uploaded_at: string;
    updated_at: string;
    deleted_at: string | null;
    supersedes_id: string | null;
    indicator_id: string | null;
    indicator_progress_id: string | null;
    location_id: string | null;
}
export interface UploadedFileDescriptor {
    file_url: string;
    file_size_bytes: number;
    mime_type: string;
    sha256: string;
}
interface ReplaceOptions {
    force?: boolean;
    title?: string;
    description?: string;
    type_metadata?: Record<string, unknown>;
}
export declare class EvidenceService {
    private readonly repo;
    private readonly cohortRepo;
    private readonly auditService;
    private readonly logger;
    constructor(repo: Repository<EvidenceDocument>, cohortRepo: Repository<Cohort>, auditService: AuditService);
    findAll(query: QueryEvidenceDto, actor: ActorContext): Promise<{
        data: SerializedEvidenceDocument[];
        total: number;
        page: number;
        per_page: number;
    }>;
    findOne(id: string, actor: ActorContext): Promise<SerializedEvidenceDocument>;
    create(dto: CreateEvidenceDto, actor: ActorContext, actorEmail: string): Promise<SerializedEvidenceDocument>;
    update(id: string, dto: UpdateEvidenceDto, actor: ActorContext, actorEmail: string): Promise<SerializedEvidenceDocument>;
    replace(id: string, uploaded: UploadedFileDescriptor, actor: ActorContext, actorEmail: string, options?: ReplaceOptions): Promise<SerializedEvidenceDocument>;
    softDelete(id: string, actor: ActorContext, actorEmail: string): Promise<{
        id: string;
        deleted_at: string;
    }>;
    private assertSingleAttachment;
    private validatePayload;
    private validateMetadataOnEntity;
    private describeAttachment;
    private serialize;
}
export {};
