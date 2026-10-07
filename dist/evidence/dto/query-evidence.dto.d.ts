import type { DocumentType } from '../evidence-document.entity.js';
export declare class QueryEvidenceDto {
    document_type?: DocumentType;
    indicator_id?: string;
    indicator_progress_id?: string;
    location_id?: string;
    orphan?: string;
    due_for_deletion?: string;
    include_deleted?: string;
    q?: string;
    page?: number;
    per_page?: number;
}
