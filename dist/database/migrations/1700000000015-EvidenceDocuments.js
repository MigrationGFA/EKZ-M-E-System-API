"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvidenceDocuments_1700000000015 = void 0;
class EvidenceDocuments_1700000000015 {
    async up(queryRunner) {
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS evidence_documents (
        id                    UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
        title                 VARCHAR(500) NOT NULL,
        description           TEXT,
        document_type         VARCHAR(50)  NOT NULL,
        type_metadata         JSONB        NOT NULL DEFAULT '{}'::jsonb,
        reference_period_from DATE,
        reference_period_to   DATE,
        retention_until       TIMESTAMPTZ,
        file_url              TEXT         NOT NULL,
        file_size_bytes       BIGINT       NOT NULL,
        mime_type             VARCHAR(100) NOT NULL,
        sha256                VARCHAR(64)  NOT NULL,
        uploaded_by           UUID         NOT NULL REFERENCES users(id),
        uploaded_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        updated_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        deleted_at            TIMESTAMPTZ,
        supersedes_id         UUID         REFERENCES evidence_documents(id) ON DELETE SET NULL,
        indicator_id          UUID         REFERENCES indicators(id)         ON DELETE SET NULL,
        indicator_progress_id UUID         REFERENCES indicator_progress(id) ON DELETE SET NULL,
        location_id           UUID         REFERENCES project_locations(id)  ON DELETE SET NULL,
        CONSTRAINT evidence_documents_type_check CHECK (document_type IN (
          'contractor_supervision_report',
          'contractor_progress_report',
          'third_party_monitoring_report',
          'financial_statement',
          'fund_portfolio_report',
          'beneficiary_tracer_study',
          'beneficiary_assessment',
          'policy_document',
          'mou',
          'incubation_report',
          'roadshow_report',
          'rap_implementation_report',
          'ekdipa_quarterly_report',
          'ekdipa_annual_report',
          'external_data_extract',
          'photo_evidence',
          'audit_report',
          'other'
        )),
        CONSTRAINT evidence_documents_attachment_check CHECK (
          (CASE WHEN indicator_id          IS NOT NULL THEN 1 ELSE 0 END) +
          (CASE WHEN indicator_progress_id IS NOT NULL THEN 1 ELSE 0 END) +
          (CASE WHEN location_id           IS NOT NULL THEN 1 ELSE 0 END) <= 1
        )
      )
    `);
        await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS evidence_documents_indicator_idx
        ON evidence_documents (indicator_id)
        WHERE deleted_at IS NULL
    `);
        await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS evidence_documents_progress_idx
        ON evidence_documents (indicator_progress_id)
        WHERE deleted_at IS NULL
    `);
        await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS evidence_documents_location_idx
        ON evidence_documents (location_id)
        WHERE deleted_at IS NULL
    `);
        await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS evidence_documents_type_period_idx
        ON evidence_documents (document_type, reference_period_to)
        WHERE deleted_at IS NULL
    `);
        await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS evidence_documents_retention_idx
        ON evidence_documents (retention_until)
        WHERE deleted_at IS NULL AND retention_until IS NOT NULL
    `);
        await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS evidence_documents_supersedes_idx
        ON evidence_documents (supersedes_id)
        WHERE supersedes_id IS NOT NULL
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX IF EXISTS evidence_documents_supersedes_idx`);
        await queryRunner.query(`DROP INDEX IF EXISTS evidence_documents_retention_idx`);
        await queryRunner.query(`DROP INDEX IF EXISTS evidence_documents_type_period_idx`);
        await queryRunner.query(`DROP INDEX IF EXISTS evidence_documents_location_idx`);
        await queryRunner.query(`DROP INDEX IF EXISTS evidence_documents_progress_idx`);
        await queryRunner.query(`DROP INDEX IF EXISTS evidence_documents_indicator_idx`);
        await queryRunner.query(`DROP TABLE IF EXISTS evidence_documents`);
    }
}
exports.EvidenceDocuments_1700000000015 = EvidenceDocuments_1700000000015;
//# sourceMappingURL=1700000000015-EvidenceDocuments.js.map