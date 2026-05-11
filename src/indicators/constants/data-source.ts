/**
 * Phase 7 (External Data-Source Indicators):
 * Only these `data_source_type` values may be referenced by a Form's
 * `field_mappings`. Everything else (external_feed, tracer_study,
 * contractor_report, financial_statement, policy_document) gets its progress
 * via manual entry or API-token posts — not via form auto-population.
 *
 * Keep in sync with frontend ekz/lib/dataSource.ts (hand-maintained sibling).
 */
export const MAPPABLE_DATA_SOURCE_TYPES = [
  'form_submission',
  'manual',
] as const;

export type MappableDataSourceType =
  (typeof MAPPABLE_DATA_SOURCE_TYPES)[number];

export function isMappableDataSourceType(value: string): boolean {
  return (MAPPABLE_DATA_SOURCE_TYPES as readonly string[]).includes(value);
}
