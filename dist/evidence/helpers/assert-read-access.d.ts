import { UserRole } from '../../common/enums/user-role.enum.js';
import type { EvidenceDocument } from '../evidence-document.entity.js';
export interface ActorContext {
    id: string;
    role: UserRole;
}
export declare function assertReadAccess(doc: Pick<EvidenceDocument, 'document_type' | 'uploaded_by'>, actor: ActorContext): void;
export declare function canRead(doc: Pick<EvidenceDocument, 'document_type' | 'uploaded_by'>, actor: ActorContext): boolean;
export declare function assertWriteAccess(documentType: EvidenceDocument['document_type'], actor: ActorContext): void;
