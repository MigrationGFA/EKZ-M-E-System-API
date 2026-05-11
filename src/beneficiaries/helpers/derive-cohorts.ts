/**
 * Derive cohort codes for a beneficiary from their attributes per ADR 0003.
 *
 * Pure function — no DB access. The service layer composes this with
 * persistence + the manual cohort tags supplied by the registering officer.
 *
 * Rules (ADR 0003 §42–47):
 *  - `youth` when 18 ≤ age ≤ 35 (sticky from date_of_birth at intake).
 *  - `woman` when sex = 'female'.
 *  - `ekz_affected_ago_araromi` when community contains "ago araromi"
 *    (case-insensitive substring; tolerates "Ago-Araromi", "Ago Araromi Village", …).
 *  - `ekz_affected_ijan_ekiti` when community contains "ijan-ekiti" or "ijan ekiti".
 *  - `ekz_affected_resettled` is a rollup: any beneficiary in either community
 *    affected pool joins this cohort automatically.
 *  - `affected_household_youth` is the youth ∩ resettled intersection — the
 *    500-youth target in Output 4.1.
 *  - `pwd` when disability_status = true.
 *
 * Codes returned here are merged with explicit `cohort_codes` from the DTO;
 * derived codes always win (idempotent).
 */
export interface DeriveInput {
  sex?: string | null;
  date_of_birth?: string | null;
  community?: string | null;
  disability_status?: boolean | null;
}

export function ageFromDob(
  dob: string | null | undefined,
  now: Date = new Date(),
): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return null;
  let age = now.getFullYear() - birth.getFullYear();
  const mDiff = now.getMonth() - birth.getMonth();
  if (mDiff < 0 || (mDiff === 0 && now.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age;
}

export function deriveCohortCodes(
  input: DeriveInput,
  now: Date = new Date(),
): string[] {
  const codes = new Set<string>();

  const age = ageFromDob(input.date_of_birth ?? null, now);
  if (age !== null && age >= 18 && age <= 35) {
    codes.add('youth');
  }

  if (input.sex === 'female') {
    codes.add('woman');
  }

  const community = (input.community ?? '').toLowerCase();
  const isAgoAraromi = /ago[\s-]?araromi/.test(community);
  const isIjanEkiti = /ijan[\s-]?ekiti/.test(community);

  if (isAgoAraromi) codes.add('ekz_affected_ago_araromi');
  if (isIjanEkiti) codes.add('ekz_affected_ijan_ekiti');

  if (isAgoAraromi || isIjanEkiti) {
    codes.add('ekz_affected_resettled');
    if (codes.has('youth')) {
      codes.add('affected_household_youth');
    }
  }

  if (input.disability_status === true) {
    codes.add('pwd');
  }

  return Array.from(codes);
}
