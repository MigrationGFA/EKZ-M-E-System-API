import { ageFromDob, deriveCohortCodes } from './derive-cohorts.js';

const FIXED_NOW = new Date('2026-05-11T12:00:00Z');

describe('ageFromDob', () => {
  it('returns null when dob is missing', () => {
    expect(ageFromDob(null, FIXED_NOW)).toBeNull();
    expect(ageFromDob(undefined, FIXED_NOW)).toBeNull();
  });

  it('returns null when dob is unparseable', () => {
    expect(ageFromDob('not-a-date', FIXED_NOW)).toBeNull();
  });

  it('rounds down by birthday-not-yet-occurred', () => {
    expect(ageFromDob('1995-05-10', FIXED_NOW)).toBe(31);
    expect(ageFromDob('1995-05-12', FIXED_NOW)).toBe(30);
  });

  it('treats the birthday itself as fully aged', () => {
    expect(ageFromDob('1995-05-11', FIXED_NOW)).toBe(31);
  });
});

describe('deriveCohortCodes', () => {
  it('returns an empty array when no attributes match', () => {
    expect(
      deriveCohortCodes(
        { sex: 'male', date_of_birth: '1980-01-01', community: 'Ado-Ekiti' },
        FIXED_NOW,
      ),
    ).toEqual([]);
  });

  it('tags youth when age is 18–35 inclusive', () => {
    expect(
      deriveCohortCodes({ date_of_birth: '2008-04-01' }, FIXED_NOW),
    ).toEqual(['youth']);
    expect(
      deriveCohortCodes({ date_of_birth: '1991-04-01' }, FIXED_NOW),
    ).toEqual(['youth']);
  });

  it('does not tag youth at age 17 or 36', () => {
    expect(
      deriveCohortCodes({ date_of_birth: '2009-06-01' }, FIXED_NOW),
    ).toEqual([]);
    expect(
      deriveCohortCodes({ date_of_birth: '1990-01-01' }, FIXED_NOW),
    ).toEqual([]);
  });

  it('tags woman when sex is female', () => {
    expect(deriveCohortCodes({ sex: 'female' }, FIXED_NOW)).toEqual(['woman']);
  });

  it('does not tag woman for sex=other or prefer_not', () => {
    expect(deriveCohortCodes({ sex: 'other' }, FIXED_NOW)).toEqual([]);
    expect(deriveCohortCodes({ sex: 'prefer_not' }, FIXED_NOW)).toEqual([]);
  });

  it('matches Ago Araromi tolerantly and rolls up into resettled', () => {
    const codes = deriveCohortCodes({ community: 'Ago Araromi' }, FIXED_NOW);
    expect(codes).toContain('ekz_affected_ago_araromi');
    expect(codes).toContain('ekz_affected_resettled');
    expect(codes).not.toContain('affected_household_youth');
  });

  it('matches hyphenated variants', () => {
    const codes = deriveCohortCodes(
      { community: 'Ijan-Ekiti Village' },
      FIXED_NOW,
    );
    expect(codes).toContain('ekz_affected_ijan_ekiti');
    expect(codes).toContain('ekz_affected_resettled');
  });

  it('intersects youth + resettled into affected_household_youth', () => {
    const codes = deriveCohortCodes(
      {
        sex: 'female',
        date_of_birth: '2000-03-15',
        community: 'Ago Araromi',
      },
      FIXED_NOW,
    );
    expect(codes).toEqual(
      expect.arrayContaining([
        'youth',
        'woman',
        'ekz_affected_ago_araromi',
        'ekz_affected_resettled',
        'affected_household_youth',
      ]),
    );
  });

  it('tags pwd from disability_status', () => {
    expect(deriveCohortCodes({ disability_status: true }, FIXED_NOW)).toEqual([
      'pwd',
    ]);
  });

  it('returns unique codes only', () => {
    const codes = deriveCohortCodes(
      {
        sex: 'female',
        date_of_birth: '2000-01-01',
        community: 'Ago Araromi',
        disability_status: true,
      },
      FIXED_NOW,
    );
    expect(new Set(codes).size).toBe(codes.length);
  });
});
