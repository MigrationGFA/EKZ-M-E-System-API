"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Beneficiaries_1700000000014 = void 0;
class Beneficiaries_1700000000014 {
    async up(queryRunner) {
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS beneficiaries (
        id               UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
        full_name        VARCHAR(255) NOT NULL,
        sex              VARCHAR(10)  NOT NULL,
        date_of_birth    DATE,
        age_band         VARCHAR(20),
        community        VARCHAR(255),
        household_id     VARCHAR(100),
        phone_e164       VARCHAR(20),
        national_id_hash VARCHAR(64),
        skill_level      VARCHAR(40),
        disability_status BOOLEAN     NOT NULL DEFAULT FALSE,
        notes            TEXT,
        consent_given    BOOLEAN      NOT NULL DEFAULT FALSE,
        consent_date     TIMESTAMPTZ,
        consent_method   VARCHAR(50),
        active           BOOLEAN      NOT NULL DEFAULT TRUE,
        withdrawn_at     TIMESTAMPTZ,
        created_by       UUID         NOT NULL REFERENCES users(id),
        created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        CONSTRAINT beneficiaries_sex_chk
          CHECK (sex IN ('female','male','other','prefer_not')),
        CONSTRAINT beneficiaries_age_band_chk
          CHECK (age_band IS NULL OR age_band IN ('under_18','18_24','25_34','35_plus')),
        CONSTRAINT beneficiaries_consent_method_chk
          CHECK (consent_method IS NULL OR consent_method IN
            ('paper_signature','digital_signature','verbal_recorded','sms_opt_in'))
      )
    `);
        await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS beneficiaries_phone_idx
        ON beneficiaries (phone_e164)
    `);
        await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS beneficiaries_community_idx
        ON beneficiaries (community)
    `);
        await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS beneficiaries_national_id_hash_idx
        ON beneficiaries (national_id_hash)
    `);
        await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS beneficiaries_active_idx
        ON beneficiaries (active)
    `);
        await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS beneficiaries_created_by_idx
        ON beneficiaries (created_by)
    `);
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS cohorts (
        id          UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
        code        VARCHAR(64)  UNIQUE NOT NULL,
        name        VARCHAR(255) NOT NULL,
        description TEXT,
        color       VARCHAR(20),
        created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
      )
    `);
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS beneficiary_cohorts (
        beneficiary_id UUID         NOT NULL REFERENCES beneficiaries(id) ON DELETE CASCADE,
        cohort_id      UUID         NOT NULL REFERENCES cohorts(id)       ON DELETE CASCADE,
        added_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        PRIMARY KEY (beneficiary_id, cohort_id)
      )
    `);
        await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS beneficiary_cohorts_cohort_idx
        ON beneficiary_cohorts (cohort_id)
    `);
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS pii_access_log (
        id             UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id        UUID         NOT NULL REFERENCES users(id),
        user_email     VARCHAR(255) NOT NULL,
        beneficiary_id UUID         REFERENCES beneficiaries(id),
        action         VARCHAR(30)  NOT NULL,
        reason         TEXT,
        request_id     VARCHAR(40),
        ip_address     INET,
        user_agent     TEXT,
        accessed_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        CONSTRAINT pii_access_log_action_chk
          CHECK (action IN ('view','export','update','withdraw','create','delete'))
      )
    `);
        await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS pii_access_log_beneficiary_idx
        ON pii_access_log (beneficiary_id)
    `);
        await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS pii_access_log_user_idx
        ON pii_access_log (user_id)
    `);
        await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS pii_access_log_accessed_idx
        ON pii_access_log (accessed_at)
    `);
        await queryRunner.query(`
      ALTER TABLE submissions
        ADD COLUMN IF NOT EXISTS beneficiary_id UUID REFERENCES beneficiaries(id)
    `);
        await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS submissions_beneficiary_idx
        ON submissions (beneficiary_id)
    `);
        await queryRunner.query(`
      INSERT INTO cohorts (code, name, description) VALUES
        ('ekz_affected_ago_araromi', 'Ago Araromi (affected)',
          'Households in Ago Araromi community whose livelihoods were affected by EKZ land demarcation.'),
        ('ekz_affected_ijan_ekiti', 'Ijan-Ekiti (affected)',
          'Households in Ijan-Ekiti community whose livelihoods were affected by EKZ land demarcation.'),
        ('ekz_affected_resettled', 'EKZ Resettlement Beneficiary',
          'Roll-up of Ago Araromi + Ijan-Ekiti affected populations; receives RAP compensation under Output 6.5.'),
        ('youth', 'Youth (18–35)',
          'Per Nigerian National Youth Policy (2019). Used for the 70% youth target.'),
        ('woman', 'Woman',
          'Female beneficiaries. Used for the 40% women target.'),
        ('female_led_startup', 'Female-led Startup',
          'Startup with female founder, CEO, or majority female leadership team.'),
        ('affected_household_youth', 'Youth from Affected Household',
          'Subset of youth whose household is in the EKZ-affected resettled pool. The 500-youth target in Output 4.1.'),
        ('advanced_skill_trainee', 'Advanced ICT Skill Trainee',
          'Beneficiaries trained at advanced level (per the 10% target in Output 4.1).'),
        ('vulnerable_household', 'Vulnerable Household',
          'From Ekiti State social registry''s poorest-and-vulnerable pool.'),
        ('pwd', 'Person Living with Disability',
          'Standard cross-cutting cohort per AfDB Operational Safeguard 2.'),
        ('ago_araromi_resident', 'Ago Araromi Resident (non-affected)',
          'Resident of Ago Araromi but not in the resettlement-affected pool.'),
        ('ijan_ekiti_resident', 'Ijan-Ekiti Resident (non-affected)',
          'Resident of Ijan-Ekiti but not in the resettlement-affected pool.')
      ON CONFLICT (code) DO NOTHING
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`
      DROP INDEX IF EXISTS submissions_beneficiary_idx
    `);
        await queryRunner.query(`
      ALTER TABLE submissions DROP COLUMN IF EXISTS beneficiary_id
    `);
        await queryRunner.query(`DROP TABLE IF EXISTS pii_access_log`);
        await queryRunner.query(`DROP TABLE IF EXISTS beneficiary_cohorts`);
        await queryRunner.query(`DROP TABLE IF EXISTS cohorts`);
        await queryRunner.query(`DROP TABLE IF EXISTS beneficiaries`);
    }
}
exports.Beneficiaries_1700000000014 = Beneficiaries_1700000000014;
//# sourceMappingURL=1700000000014-Beneficiaries.js.map