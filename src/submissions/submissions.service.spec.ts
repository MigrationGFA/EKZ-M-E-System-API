import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { SubmissionsService } from './submissions.service.js';
import { Submission } from './submission.entity.js';
import { ProjectLocation } from '../locations/project-location.entity.js';
import { Form } from '../forms/form.entity.js';
import { Beneficiary } from '../beneficiaries/beneficiary.entity.js';
import { UsersService } from '../users/users.service.js';
import { MailService } from '../mail/mail.service.js';
import { AuditService } from '../audit/audit.service.js';
import { AlertsService } from '../alerts/alerts.service.js';
import { IndicatorsService } from '../indicators/indicators.service.js';

// ─── Minimal stub factory ────────────────────────────────────────────────────

function makeSubmission(overrides: Partial<Submission> = {}): Submission {
  return {
    id: 'sub-1',
    form_id: 'form-1',
    officer_id: 'user-1',
    data: {},
    location: null,
    location_id: null,
    on_site: null,
    submitted_at: new Date('2026-01-01T00:00:00Z'),
    validation_status: 'pending',
    validation_comment: null,
    synced_at: new Date(),
    form: {} as any,
    officer: {} as any,
    project_location: null,
    ...overrides,
  };
}

const BASE_DTO = {
  id: 'sub-1',
  formId: 'form-1',
  officerId: 'user-1',
  data: { field1: 'value' },
  submittedAt: '2026-01-01T00:00:00Z',
};

// ─── Repository mocks ────────────────────────────────────────────────────────

const mockSubRepo = () => ({
  createQueryBuilder: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  existsBy: jest.fn(),
});

const mockLocRepo = () => ({
  find: jest.fn().mockResolvedValue([]),
});

const mockFormRepo = () => ({
  existsBy: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn().mockResolvedValue({
    id: 'form-1',
    title: 'Test Form',
    field_mappings: [],
    location_ids: [],
    require_gps: false,
  }),
});

const mockBeneficiaryRepo = () => ({
  findOne: jest.fn().mockResolvedValue(null),
  find: jest.fn().mockResolvedValue([]),
  findBy: jest.fn().mockResolvedValue([]),
});

const mockIndicatorsService = () => ({
  addProgress: jest.fn().mockResolvedValue(undefined),
});

const mockUsersService = () => ({
  findById: jest.fn().mockResolvedValue(null),
  findAdminAndMeStaff: jest.fn().mockResolvedValue([]),
});

const mockMailService = () => ({
  sendSubmissionApproved: jest.fn(),
  sendSubmissionRejected: jest.fn(),
  sendOffSiteAlert: jest.fn(),
});

const mockAuditService = () => ({
  log: jest.fn(),
});

const mockAlertsService = () => ({
  create: jest.fn(),
});

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('SubmissionsService', () => {
  let service: SubmissionsService;
  let subRepo: ReturnType<typeof mockSubRepo>;
  let locRepo: ReturnType<typeof mockLocRepo>;
  let formRepo: ReturnType<typeof mockFormRepo>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubmissionsService,
        { provide: getRepositoryToken(Submission), useFactory: mockSubRepo },
        {
          provide: getRepositoryToken(ProjectLocation),
          useFactory: mockLocRepo,
        },
        { provide: getRepositoryToken(Form), useFactory: mockFormRepo },
        {
          provide: getRepositoryToken(Beneficiary),
          useFactory: mockBeneficiaryRepo,
        },
        { provide: UsersService, useFactory: mockUsersService },
        { provide: MailService, useFactory: mockMailService },
        { provide: AuditService, useFactory: mockAuditService },
        { provide: AlertsService, useFactory: mockAlertsService },
        { provide: IndicatorsService, useFactory: mockIndicatorsService },
      ],
    }).compile();

    service = module.get(SubmissionsService);
    subRepo = module.get(getRepositoryToken(Submission));
    locRepo = module.get(getRepositoryToken(ProjectLocation));
    formRepo = module.get(getRepositoryToken(Form));
  });

  // ── create() ──────────────────────────────────────────────────────────────

  describe('create()', () => {
    it('throws UnprocessableEntityException when formId does not exist', async () => {
      formRepo.findOne.mockResolvedValue(null);
      await expect(
        service.create(BASE_DTO, 'actor-id', 'actor@test.com'),
      ).rejects.toBeInstanceOf(UnprocessableEntityException);
    });

    it('throws ConflictException when submission id already exists', async () => {
      subRepo.findOne.mockResolvedValue(makeSubmission());

      await expect(
        service.create(BASE_DTO, 'actor-id', 'actor@test.com'),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('saves once with geofence applied (no double save)', async () => {
      formRepo.existsBy.mockResolvedValue(true);
      subRepo.findOne.mockResolvedValue(null);
      locRepo.find.mockResolvedValue([]);
      const created = makeSubmission();
      subRepo.create.mockReturnValue(created);
      subRepo.save.mockResolvedValue(created);

      const result = await service.create(
        BASE_DTO,
        'actor-id',
        'actor@test.com',
      );

      expect(subRepo.save).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ id: 'sub-1', status: 'accepted' });
    });

    it('sets on_site true when GPS falls within a location radius', async () => {
      formRepo.existsBy.mockResolvedValue(true);
      subRepo.findOne.mockResolvedValue(null);
      locRepo.find.mockResolvedValue([
        { id: 'loc-1', lat: 7.0, lng: 5.0, radius_m: 1000 } as ProjectLocation,
      ]);

      let capturedEntity: any;
      subRepo.create.mockImplementation((e: any) => {
        capturedEntity = e;
        return e;
      });
      subRepo.save.mockImplementation(async (e: any) => e);

      await service.create(
        { ...BASE_DTO, location: { lat: 7.0, lng: 5.0 } },
        'actor-id',
        'actor@test.com',
      );

      expect(capturedEntity.on_site).toBe(true);
      expect(capturedEntity.location_id).toBe('loc-1');
    });

    it('sets on_site false when GPS is outside all location radii', async () => {
      formRepo.existsBy.mockResolvedValue(true);
      subRepo.findOne.mockResolvedValue(null);
      locRepo.find.mockResolvedValue([
        { id: 'loc-1', lat: 0.0, lng: 0.0, radius_m: 10 } as ProjectLocation,
      ]);

      let capturedEntity: any;
      subRepo.create.mockImplementation((e: any) => {
        capturedEntity = e;
        return e;
      });
      subRepo.save.mockImplementation(async (e: any) => e);

      await service.create(
        { ...BASE_DTO, location: { lat: 7.0, lng: 5.0 } },
        'actor-id',
        'actor@test.com',
      );

      expect(capturedEntity.on_site).toBe(false);
      expect(capturedEntity.location_id).toBeNull();
    });
  });

  // ── createBatch() ─────────────────────────────────────────────────────────

  describe('createBatch()', () => {
    it('silently accepts already-persisted ids (idempotent)', async () => {
      locRepo.find.mockResolvedValue([]);
      // Existing IDs query returns sub-1
      subRepo.find.mockResolvedValue([{ id: 'sub-1' }]);
      formRepo.find.mockResolvedValue([{ id: 'form-1' }]);

      const result = await service.createBatch(
        [BASE_DTO],
        'actor-id',
        'actor@test.com',
      );

      expect(result.accepted).toContain('sub-1');
      expect(result.rejected).toHaveLength(0);
      expect(subRepo.save).not.toHaveBeenCalled();
    });

    it('rejects submissions whose formId does not exist', async () => {
      locRepo.find.mockResolvedValue([]);
      subRepo.find.mockResolvedValue([]);
      formRepo.find.mockResolvedValue([]); // no valid forms

      const result = await service.createBatch(
        [BASE_DTO],
        'actor-id',
        'actor@test.com',
      );

      expect(result.rejected[0].id).toBe('sub-1');
      expect(result.rejected[0].reason).toMatch(/form-1 does not exist/i);
    });

    it('saves each new submission exactly once', async () => {
      locRepo.find.mockResolvedValue([]);
      subRepo.find.mockResolvedValue([]);
      formRepo.find.mockResolvedValue([{ id: 'form-1' }]);
      subRepo.create.mockImplementation((e: any) => e);
      subRepo.save.mockResolvedValue(makeSubmission());

      const dtos = [
        { ...BASE_DTO, id: 'sub-a' },
        { ...BASE_DTO, id: 'sub-b' },
      ];
      const result = await service.createBatch(
        dtos,
        'actor-id',
        'actor@test.com',
      );

      expect(subRepo.save).toHaveBeenCalledTimes(2);
      expect(result.accepted).toEqual(['sub-a', 'sub-b']);
      expect(result.rejected).toHaveLength(0);
    });

    it('uses a single bulk query for duplicate detection', async () => {
      locRepo.find.mockResolvedValue([]);
      subRepo.find.mockResolvedValue([]);
      formRepo.find.mockResolvedValue([{ id: 'form-1' }]);
      subRepo.create.mockImplementation((e: any) => e);
      subRepo.save.mockResolvedValue(makeSubmission());

      await service.createBatch(
        [
          { ...BASE_DTO, id: 'sub-a' },
          { ...BASE_DTO, id: 'sub-b' },
          { ...BASE_DTO, id: 'sub-c' },
        ],
        'actor-id',
        'actor@test.com',
      );

      // subRepo.find called once for bulk dedup, not 3 times
      expect(subRepo.find).toHaveBeenCalledTimes(1);
    });
  });

  // ── validate() ────────────────────────────────────────────────────────────

  describe('validate()', () => {
    it('throws NotFoundException when submission does not exist', async () => {
      subRepo.findOne.mockResolvedValue(null);
      await expect(
        service.validate(
          'missing',
          'approve',
          undefined,
          'actor-id',
          'actor@test.com',
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws BadRequestException when submission is already approved', async () => {
      subRepo.findOne.mockResolvedValue(
        makeSubmission({ validation_status: 'approved' }),
      );
      await expect(
        service.validate(
          'sub-1',
          'reject',
          undefined,
          'actor-id',
          'actor@test.com',
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws BadRequestException when submission is already rejected', async () => {
      subRepo.findOne.mockResolvedValue(
        makeSubmission({ validation_status: 'rejected' }),
      );
      await expect(
        service.validate(
          'sub-1',
          'approve',
          undefined,
          'actor-id',
          'actor@test.com',
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('approves a pending submission and returns serialized result', async () => {
      const pending = makeSubmission({ validation_status: 'pending' });
      subRepo.findOne.mockResolvedValue(pending);
      subRepo.save.mockImplementation(async (s: any) => s);

      const result = await service.validate(
        'sub-1',
        'approve',
        'Looks good',
        'actor-id',
        'actor@test.com',
      );

      expect(result.validation_status).toBe('approved');
      expect(result.validation_comment).toBe('Looks good');
    });

    it('rejects a pending submission', async () => {
      const pending = makeSubmission({ validation_status: 'pending' });
      subRepo.findOne.mockResolvedValue(pending);
      subRepo.save.mockImplementation(async (s: any) => s);

      const result = await service.validate(
        'sub-1',
        'reject',
        'Bad data',
        'actor-id',
        'actor@test.com',
      );

      expect(result.validation_status).toBe('rejected');
    });
  });
});
