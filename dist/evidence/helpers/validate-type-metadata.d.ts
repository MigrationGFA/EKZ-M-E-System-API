import type { DocumentType } from '../evidence-document.entity.js';
export declare function validateTypeMetadata(documentType: DocumentType, metadata: Record<string, unknown> | undefined, periodFields: {
    from?: string | null;
    to?: string | null;
}): void;
