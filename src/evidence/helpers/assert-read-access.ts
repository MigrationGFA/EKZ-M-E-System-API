import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '../../common/enums/user-role.enum.js';
import { DOCUMENT_TYPE_CONFIG } from '../constants/document-types.js';
import type { EvidenceDocument } from '../evidence-document.entity.js';

export interface ActorContext {
  id: string;
  role: UserRole;
}

/**
 * Per-type read RBAC per ADR 0005 §82. Some types are admin+me_staff only;
 * `photo_evidence` allows programme staff to see their own uploads;
 * `external_data_extract` lets viewers read.
 *
 * Service-layer enforcement keeps the controller's @Roles decorator simple
 * (broad gate) while the per-type narrowing lives where the document is in
 * scope.
 */
export function assertReadAccess(
  doc: Pick<EvidenceDocument, 'document_type' | 'uploaded_by'>,
  actor: ActorContext,
): void {
  const config = DOCUMENT_TYPE_CONFIG[doc.document_type];
  for (const rule of config.read) {
    if (!rule.roles.includes(actor.role)) continue;
    if (rule.scope === 'all') return;
    if (rule.scope === 'own' && doc.uploaded_by === actor.id) return;
  }
  throw new ForbiddenException(
    `Role ${actor.role} cannot read documents of type ${doc.document_type}`,
  );
}

/** True iff the actor can read this document (non-throwing variant). */
export function canRead(
  doc: Pick<EvidenceDocument, 'document_type' | 'uploaded_by'>,
  actor: ActorContext,
): boolean {
  try {
    assertReadAccess(doc, actor);
    return true;
  } catch {
    return false;
  }
}

export function assertWriteAccess(
  documentType: EvidenceDocument['document_type'],
  actor: ActorContext,
): void {
  const config = DOCUMENT_TYPE_CONFIG[documentType];
  if (!config.write.includes(actor.role)) {
    throw new ForbiddenException(
      `Role ${actor.role} cannot upload documents of type ${documentType}`,
    );
  }
}
