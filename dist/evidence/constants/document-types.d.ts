import { UserRole } from '../../common/enums/user-role.enum.js';
import type { DocumentType } from '../evidence-document.entity.js';
export declare const DOCUMENT_TYPES: readonly DocumentType[];
export type ReadAccessScope = 'all' | 'own';
export interface DocumentTypeConfig {
    read: {
        roles: UserRole[];
        scope: ReadAccessScope;
    }[];
    write: UserRole[];
    retentionYears: number;
    maxSizeBytes: number;
    allowedMimePrefixes: string[];
    requiredMetadataFields: string[];
}
export declare const DOCUMENT_TYPE_CONFIG: Record<DocumentType, DocumentTypeConfig>;
export declare function isDocumentType(value: string): value is DocumentType;
export declare function computeRetentionUntil(type: DocumentType, uploadedAt?: Date): Date;
export declare function isMimeAllowed(type: DocumentType, mime: string): boolean;
