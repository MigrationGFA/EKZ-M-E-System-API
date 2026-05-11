import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { FormsService } from './forms.service.js';
import { Form } from './form.entity.js';
import { Submission } from '../submissions/submission.entity.js';
import { Indicator } from '../indicators/indicator.entity.js';
import { AuditService } from '../audit/audit.service.js';

// ─── Repo mocks ─────────────────────────────────────────────────────────────

const mockFormRepo = () => ({
  findOne: jest.fn(),
  create: jest.fn((x: Form) => x),
  save: jest.fn((x: Form) =>
    Promise.resolve({ ...x, id: 'form-new', created_at: new Date() }),
  ),
  remove: jest.fn(),
  createQueryBuilder: jest.fn(),
});

const mockSubRepo = () => ({
  count: jest.fn().mockResolvedValue(0),
});

const mockIndicatorRepo = () => ({
  find: jest.fn(),
});

const mockAuditService = () => ({
  log: jest.fn().mockResolvedValue(undefined),
});

// ─── Helpers ────────────────────────────────────────────────────────────────

const baseCreateDto = (
  field_mappings: any[] = [],
): {
  title: string;
  fields: any[];
  indicator_ids: string[];
  assigned_to: string[];
  field_mappings: any[];
  created_by: string;
} => ({
  title: 'Form A',
  fields: [{ id: 'f1', type: 'number' }],
  indicator_ids: ['ind-1'],
  assigned_to: [],
  field_mappings,
  created_by: 'user-1',
});

// ─── Suite ──────────────────────────────────────────────────────────────────

describe('FormsService — assertMappingsAllowed (Phase 7)', () => {
  let service: FormsService;
  let indicatorRepo: ReturnType<typeof mockIndicatorRepo>;
  let formRepo: ReturnType<typeof mockFormRepo>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FormsService,
        { provide: getRepositoryToken(Form), useFactory: mockFormRepo },
        { provide: getRepositoryToken(Submission), useFactory: mockSubRepo },
        {
          provide: getRepositoryToken(Indicator),
          useFactory: mockIndicatorRepo,
        },
        { provide: AuditService, useFactory: mockAuditService },
      ],
    }).compile();

    service = module.get(FormsService);
    indicatorRepo = module.get(getRepositoryToken(Indicator));
    formRepo = module.get(getRepositoryToken(Form));
  });

  it('accepts a form with no field_mappings', async () => {
    indicatorRepo.find.mockResolvedValue([]);
    await expect(
      service.create(baseCreateDto([]), 'actor-1', 'actor@x.test'),
    ).resolves.toBeDefined();
    expect(indicatorRepo.find).not.toHaveBeenCalled();
  });

  it('accepts mappings that reference form_submission indicators', async () => {
    indicatorRepo.find.mockResolvedValue([
      { id: 'ind-1', data_source_type: 'form_submission' },
    ]);
    await expect(
      service.create(
        baseCreateDto([{ form_field_id: 'f1', indicator_id: 'ind-1' }]),
        'actor-1',
        'actor@x.test',
      ),
    ).resolves.toBeDefined();
  });

  it('accepts mappings that reference manual indicators', async () => {
    indicatorRepo.find.mockResolvedValue([
      { id: 'ind-2', data_source_type: 'manual' },
    ]);
    await expect(
      service.create(
        baseCreateDto([{ form_field_id: 'f1', indicator_id: 'ind-2' }]),
        'actor-1',
        'actor@x.test',
      ),
    ).resolves.toBeDefined();
  });

  it('rejects an external_feed mapping with 422 + EXTERNAL_INDICATOR_NOT_MAPPABLE', async () => {
    indicatorRepo.find.mockResolvedValue([
      { id: 'ind-3', data_source_type: 'external_feed' },
    ]);
    await expect(
      service.create(
        baseCreateDto([{ form_field_id: 'f1', indicator_id: 'ind-3' }]),
        'actor-1',
        'actor@x.test',
      ),
    ).rejects.toMatchObject({
      response: {
        code: 'EXTERNAL_INDICATOR_NOT_MAPPABLE',
        indicator_id: 'ind-3',
        data_source_type: 'external_feed',
      },
    });
  });

  it('rejects when any mapping is to an external indicator (mixed payload)', async () => {
    indicatorRepo.find.mockResolvedValue([
      { id: 'ind-a', data_source_type: 'form_submission' },
      { id: 'ind-b', data_source_type: 'financial_statement' },
    ]);
    await expect(
      service.create(
        baseCreateDto([
          { form_field_id: 'f1', indicator_id: 'ind-a' },
          { form_field_id: 'f2', indicator_id: 'ind-b' },
        ]),
        'actor-1',
        'actor@x.test',
      ),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('also enforces on update() when field_mappings is in the patch', async () => {
    formRepo.findOne.mockResolvedValue({
      id: 'form-1',
      title: 'F',
      description: '',
      fields: [],
      indicator_ids: [],
      assigned_to: [],
      field_mappings: [],
      location_ids: [],
      require_gps: false,
      created_by: 'u',
      status: 'draft',
      created_at: new Date(),
    } as Form);
    indicatorRepo.find.mockResolvedValue([
      { id: 'ind-x', data_source_type: 'policy_document' },
    ]);
    await expect(
      service.update(
        'form-1',
        {
          field_mappings: [{ form_field_id: 'f1', indicator_id: 'ind-x' }],
        },
        'actor-1',
        'actor@x.test',
      ),
    ).rejects.toMatchObject({
      response: { code: 'EXTERNAL_INDICATOR_NOT_MAPPABLE' },
    });
  });

  it('throws NotFoundException on update of a missing form (mapping check is conditional)', async () => {
    formRepo.findOne.mockResolvedValue(null);
    await expect(
      service.update('missing', {}, 'actor-1', 'actor@x.test'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
