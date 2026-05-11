import { isOverdue } from './overdue.js';

const now = new Date('2026-06-01T08:00:00Z');
const daysAgo = (n: number) => new Date(now.getTime() - n * 86_400_000);

describe('isOverdue', () => {
  // ─── Calendar frequencies ────────────────────────────────────────────────

  it('monthly: 31 days since last → overdue (calendar)', () => {
    const result = isOverdue({ frequency: 'monthly' }, daysAgo(31), null, now);
    expect(result.overdue).toBe(true);
    expect(result.reason).toBe('calendar');
    expect(result.daysSince).toBe(31);
  });

  it('monthly: 29 days since last → not overdue', () => {
    const result = isOverdue({ frequency: 'monthly' }, daysAgo(29), null, now);
    expect(result.overdue).toBe(false);
    expect(result.reason).toBeNull();
  });

  it('quarterly: 89 days since last → not overdue', () => {
    const result = isOverdue(
      { frequency: 'quarterly' },
      daysAgo(89),
      null,
      now,
    );
    expect(result.overdue).toBe(false);
  });

  it('quarterly: 90 days since last → overdue', () => {
    const result = isOverdue(
      { frequency: 'quarterly' },
      daysAgo(90),
      null,
      now,
    );
    expect(result.overdue).toBe(true);
    expect(result.reason).toBe('calendar');
  });

  it('annually: 366 days since last → overdue', () => {
    const result = isOverdue(
      { frequency: 'annually' },
      daysAgo(366),
      null,
      now,
    );
    expect(result.overdue).toBe(true);
    expect(result.reason).toBe('calendar');
  });

  it('calendar with null lastProgressDate → overdue (never reported)', () => {
    const result = isOverdue({ frequency: 'monthly' }, null, null, now);
    expect(result.overdue).toBe(true);
    expect(result.reason).toBe('calendar');
    expect(result.daysSince).toBeNull();
  });

  // ─── Mid-term ────────────────────────────────────────────────────────────

  it('mid_term: null projectMeta → not overdue (silent skip)', () => {
    const result = isOverdue(
      { frequency: 'mid_term' },
      daysAgo(400),
      null,
      now,
    );
    expect(result.overdue).toBe(false);
  });

  it('mid_term: null midpoint_date → not overdue', () => {
    const result = isOverdue(
      { frequency: 'mid_term' },
      daysAgo(400),
      { midpoint_date: null, completion_year: 2028 },
      now,
    );
    expect(result.overdue).toBe(false);
  });

  it('mid_term: now before midpoint → not overdue', () => {
    const future = new Date('2027-01-01T00:00:00Z');
    const result = isOverdue(
      { frequency: 'mid_term' },
      daysAgo(30),
      { midpoint_date: future, completion_year: 2028 },
      now,
    );
    expect(result.overdue).toBe(false);
  });

  it('mid_term: now > midpoint, lastProgress inside ±90d window → not overdue', () => {
    // Midpoint 60 days ago; last progress 30 days ago (inside window).
    const midpoint = daysAgo(60);
    const result = isOverdue(
      { frequency: 'mid_term' },
      daysAgo(30),
      { midpoint_date: midpoint, completion_year: 2028 },
      now,
    );
    expect(result.overdue).toBe(false);
  });

  it('mid_term: now > midpoint, lastProgress outside ±90d window → overdue', () => {
    // Midpoint 180 days ago; last progress 365 days ago (outside window).
    const midpoint = daysAgo(180);
    const result = isOverdue(
      { frequency: 'mid_term' },
      daysAgo(365),
      { midpoint_date: midpoint, completion_year: 2028 },
      now,
    );
    expect(result.overdue).toBe(true);
    expect(result.reason).toBe('mid_term_window');
  });

  it('mid_term: now > midpoint, null lastProgress → overdue', () => {
    const result = isOverdue(
      { frequency: 'mid_term' },
      null,
      { midpoint_date: daysAgo(60), completion_year: 2028 },
      now,
    );
    expect(result.overdue).toBe(true);
    expect(result.reason).toBe('mid_term_window');
  });

  // ─── One-off ─────────────────────────────────────────────────────────────

  it('one_off: now before completion year end → not overdue', () => {
    // now is 2026-06-01. completion_year 2028 → deadline 2028-12-31.
    const result = isOverdue(
      { frequency: 'one_off' },
      null,
      { midpoint_date: null, completion_year: 2028 },
      now,
    );
    expect(result.overdue).toBe(false);
  });

  it('one_off: now > completion year end, null lastProgress → overdue', () => {
    const postCompletion = new Date('2029-01-15T00:00:00Z');
    const result = isOverdue(
      { frequency: 'one_off' },
      null,
      { midpoint_date: null, completion_year: 2028 },
      postCompletion,
    );
    expect(result.overdue).toBe(true);
    expect(result.reason).toBe('one_off_post_completion');
  });

  it('one_off: now > completion year end, has progress → not overdue', () => {
    const postCompletion = new Date('2029-01-15T00:00:00Z');
    const result = isOverdue(
      { frequency: 'one_off' },
      new Date('2028-06-01T00:00:00Z'),
      { midpoint_date: null, completion_year: 2028 },
      postCompletion,
    );
    expect(result.overdue).toBe(false);
  });

  it('one_off: null projectMeta → not overdue', () => {
    const result = isOverdue({ frequency: 'one_off' }, null, null, now);
    expect(result.overdue).toBe(false);
  });

  // ─── Unknown / unsupported ───────────────────────────────────────────────

  it('unknown frequency → not overdue (silent skip)', () => {
    const result = isOverdue({ frequency: 'whenever' }, null, null, now);
    expect(result.overdue).toBe(false);
    expect(result.reason).toBeNull();
  });
});
