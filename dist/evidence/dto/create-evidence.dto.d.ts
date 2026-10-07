import type { DocumentType } from '../evidence-document.entity.js';
export declare class CreateEvidenceDto {
    title: string;
    description?: string;
    document_type: DocumentType;
    type_metadata?: Record<string, unknown>;
    reference_period_from?: string;
    reference_period_to?: string;
    file_url: string;
    file_size_bytes: string;
    mime_type: string;
    sha256: string;
    retention_until?: string;
    indicator_id?: string;
    indicator_progress_id?: string;
    location_id?: string;
}
