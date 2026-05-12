import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { IndicatorsService } from './indicators.service.js';
import { Indicator } from './indicator.entity.js';
import { IndicatorProgress } from './indicator-progress.entity.js';
import { IndicatorYearTarget } from './indicator-year-target.entity.js';
import { Form } from '../forms/form.entity.js';
import { UsersService } from '../users/users.service.js';
import { MailService } from '../mail/mail.service.js';
import { AuditService } from '../audit/audit.service.js';
import { AlertsService } from '../alerts/alerts.service.js';
import { ProjectMetaService } from '../project-meta/project-meta.service.js';
import { DisaggregationService } from './disaggregation.service.js';

/**
 * Phase 9.5 — focused spec for IndicatorsService.getLatestYearTargets.
 *
 * The behaviour matters because:
 *   - Originals (is_original=true) are seeded at PAR time and live forever.
 *   - Revisions (is_original=false) overwrite the live "current" value via
 *     setYearTargets.
 *   - expectedAt() / dashboards / scheduler MUST read the revision when
 *     present, else the original. Otherwise the at-risk math silently
 *     reverts to PAR baselines after a revision lands.
 */
function makeRow(partial: Partial<IndicatorYearTarget>): IndicatorYearTarget {
  return {
    id: partial.id ?? `iyt-${Math.random()}`,
    indicator_id: partial.indicator_id ?? 'ind-1',
    year: partial.year ?? 2024,
    target_value: partial.target_value ?? 0,
    notes: partial.notes ?? null,
    is_original: partial.is_original ?? true,
    revision_year: partial.revision_year ?? null,
    created_at: new Date(),
    updated_at: new Date(),
  };
}

describe('IndicatorsService.getLatestYearTargets', () => {
  let service: IndicatorsService;
  let yearTargetsRepo: { find: jest.Mock };

  beforeEach(async () => {
    yearTargetsRepo = { find: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IndicatorsService,
        {
          provide: getRepositoryToken(Indicator),
          useValue: { find: jest.fn(), findOne: jest.fn(), save: jest.fn() },
        },
        {
          provide: getRepositoryToken(IndicatorProgress),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
            manager: { transaction: jest.fn() },
          },
        },
        {
          provide: getRepositoryToken(IndicatorYearTarget),
          useValue: yearTargetsRepo,
        },
        {
          provide: getRepositoryToken(Form),
          useValue: { createQueryBuilder: jest.fn() },
        },
        {
          provide: UsersService,
          useValue: { findAdminAndMeStaff: jest.fn().mockResolvedValue([]) },
        },
        {
          provide: MailService,
          useValue: { sendIndicatorStatusAlert: jest.fn() },
        },
        { provide: AuditService, useValue: { log: jest.fn() } },
        { provide: AlertsService, useValue: { create: jest.fn() } },
        { provide: ProjectMetaService, useValue: { get: jest.fn() } },
        {
          provide: DisaggregationService,
          useValue: { getRules: jest.fn(), getRollup: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(IndicatorsService);
  });

  it('returns originals when no revisions exist', async () => {
    yearTargetsRepo.find.mockResolvedValue([
      makeRow({ id: 'r1', year: 2024, target_value: 500, is_original: true }),
      makeRow({ id: 'r2', year: 2026, target_value: 2500, is_original: true }),
    ]);
    const result = await service.getLatestYearTargets('ind-1');
    expect(result).toHaveLength(2);
    expect(result.map((r) => Number(r.target_value))).toEqual([500, 2500]);
    expect(result.every((r) => r.is_original)).toBe(true);
  });

  it('prefers revision over original for the same year', async () => {
    yearTargetsRepo.find.mockResolvedValue([
      makeRow({ id: 'r1', year: 2024, target_value: 500, is_original: true }),
      makeRow({
        id: 'r2',
        year: 2024,
        target_value: 650,
        is_original: false,
        revision_year: 2025,
      }),
      makeRow({ id: 'r3', year: 2026, target_value: 2500, is_original: true }),
    ]);
    const result = await service.getLatestYearTargets('ind-1');
    expect(result).toHaveLength(2);
    const y2024 = result.find((r) => r.year === 2024)!;
    const y2026 = result.find((r) => r.year === 2026)!;
    expect(Number(y2024.target_value)).toBe(650);
    expect(y2024.is_original).toBe(false);
    expect(Number(y2026.target_value)).toBe(2500);
    expect(y2026.is_original).toBe(true);
  });

  it('returns revisions when no originals exist (post-revision-only seed)', async () => {
    yearTargetsRepo.find.mockResolvedValue([
      makeRow({
        id: 'r1',
        year: 2024,
        target_value: 600,
        is_original: false,
        revision_year: 2025,
      }),
      makeRow({
        id: 'r2',
        year: 2026,
        target_value: 2700,
        is_original: false,
        revision_year: 2025,
      }),
    ]);
    const result = await service.getLatestYearTargets('ind-1');
    expect(result).toHaveLength(2);
    expect(result.every((r) => !r.is_original)).toBe(true);
  });

  it('returns empty when indicator has no year targets at all', async () => {
    yearTargetsRepo.find.mockResolvedValue([]);
    const result = await service.getLatestYearTargets('ind-1');
    expect(result).toEqual([]);
  });

  it('sorts by year ascending', async () => {
    yearTargetsRepo.find.mockResolvedValue([
      makeRow({ id: 'r3', year: 2028, target_value: 5000, is_original: true }),
      makeRow({ id: 'r1', year: 2024, target_value: 500, is_original: true }),
      makeRow({ id: 'r2', year: 2026, target_value: 2500, is_original: true }),
    ]);
    const result = await service.getLatestYearTargets('ind-1');
    expect(result.map((r) => r.year)).toEqual([2024, 2026, 2028]);
  });
});
