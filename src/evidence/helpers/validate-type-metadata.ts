import { UnprocessableEntityException } from '@nestjs/common';
import { DOCUMENT_TYPE_CONFIG } from '../constants/document-types.js';
import type { DocumentType } from '../evidence-document.entity.js';

/**
 * Enforces per-type required-fields per ADR 0005 §57.
 *
 * The `type_metadata` JSONB column accepts any shape at the DB level; this
 * helper is the load-bearing check that, when document_type=financial_statement,
 * the payload includes `audited` + `currency` (plus the period columns which
 * live on the row itself, not in JSONB).
 *
 * Date-typed fields (`approval_date`, `effective_date`, `event_date`,
 * `extract_date`) and the period columns are normalised by the caller; this
 * helper only checks presence + non-empty.
 */
export function validateTypeMetadata(
  documentType: DocumentType,
  metadata: Record<string, unknown> | undefined,
  periodFields: { from?: string | null; to?: string | null },
): void {
  const config = DOCUMENT_TYPE_CONFIG[documentType];
  const missing: string[] = [];

  for (const key of config.requiredMetadataFields) {
    if (key === 'reference_period_from') {
      if (!periodFields.from) missing.push(key);
      continue;
    }
    if (key === 'reference_period_to') {
      if (!periodFields.to) missing.push(key);
      continue;
    }

    const value = metadata?.[key];
    if (value === undefined || value === null || value === '') {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new UnprocessableEntityException({
      message: `Missing required metadata for ${documentType}: ${missing.join(', ')}`,
      missing,
      document_type: documentType,
    });
  }
}
