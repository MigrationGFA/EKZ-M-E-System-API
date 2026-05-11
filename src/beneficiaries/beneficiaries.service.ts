import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Request } from 'express';
import { Beneficiary } from './beneficiary.entity.js';
import { CreateBeneficiaryDto } from './dto/create-beneficiary.dto.js';
import { UpdateBeneficiaryDto } from './dto/update-beneficiary.dto.js';
import { BeneficiaryQueryDto } from './dto/beneficiary-query.dto.js';
import { BatchBeneficiaryResult } from './dto/batch-beneficiary.dto.js';
import { CohortsService } from './cohorts.service.js';
import { PiiAccessLogService } from './pii-access-log.service.js';
import { hashNin } from './helpers/hash.js';
import { deriveCohortCodes } from './helpers/derive-cohorts.js';
import { UserRole } from '../common/enums/user-role.enum.js';

export interface ActorContext {
  id: string;
  email: string;
  role: UserRole;
}

export interface SerializedBeneficiary {
  id: string;
  full_name: string;
  sex: string;
  date_of_birth: string | null;
  age_band: string | null;
  community: string | null;
  household_id: string | null;
  phone_e164: string | null;
  national_id_hash: string | null;
  skill_level: string | null;
  disability_status: boolean;
  notes: string | null;
  consent_given: boolean;
  consent_date: string | null;
  consent_method: string | null;
  active: boolean;
  withdrawn_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  cohorts: Array<{ id: string; code: string; name: string }>;
}

/**
 * Lookup hits used by the offline autocomplete picker. Always redacted —
 * never includes PII columns. Returned to all roles that can register
 * beneficiaries (programme_staff included).
 */
export interface BeneficiaryLookupHit {
  id: string;
  full_name: string;
  community: string | null;
  cohort_codes: string[];
}

@Injectable()
export class BeneficiariesService {
  private readonly logger = new Logger(BeneficiariesService.name);

  constructor(
    @InjectRepository(Beneficiary)
    private readonly repo: Repository<Beneficiary>,
    private readonly cohortsService: CohortsService,
    private readonly piiAuditService: PiiAccessLogService,
  ) {}

  async findAll(
    query: BeneficiaryQueryDto,
    actor: ActorContext,
  ): Promise<SerializedBeneficiary[]> {
    if (actor.role === UserRole.VIEWER) {
      throw new ForbiddenException('Viewer role cannot list beneficiaries');
    }

    const qb = this.repo
      .createQueryBuilder('b')
      .leftJoinAndSelect('b.cohorts', 'c');

    const includeInactive =
      query.include_inactive === 'true' &&
      (actor.role === UserRole.ADMIN || actor.role === UserRole.ME_STAFF);
    if (!includeInactive) {
      qb.andWhere('b.active = TRUE');
    }

    if (actor.role === UserRole.PROGRAMME_STAFF) {
      qb.andWhere('b.created_by = :uid', { uid: actor.id });
    }

    if (query.q) {
      qb.andWhere('b.full_name ILIKE :q', { q: `%${query.q}%` });
    }
    if (query.community) {
      qb.andWhere('b.community = :community', { community: query.community });
    }
    if (query.cohort) {
      qb.andWhere(
        'EXISTS (SELECT 1 FROM beneficiary_cohorts bc JOIN cohorts c2 ON c2.id = bc.cohort_id WHERE bc.beneficiary_id = b.id AND c2.code = :cohortCode)',
        { cohortCode: query.cohort },
      );
    }

    qb.orderBy('b.created_at', 'DESC').limit(200);

    const rows = await qb.getMany();
    return rows.map((b) => this.serialize(b, { redactPii: true }));
  }

  async findOne(
    id: string,
    actor: ActorContext,
    request?: Pick<Request, 'ip' | 'headers'>,
  ): Promise<SerializedBeneficiary> {
    const entity = await this.repo.findOne({
      where: { id },
      relations: { cohorts: true },
    });
    if (!entity) {
      throw new NotFoundException(`Beneficiary ${id} not found`);
    }
    this.assertReadAccess(entity, actor);

    await this.piiAuditService.record({
      actor,
      beneficiary_id: id,
      action: 'view',
      request: request ?? null,
    });

    const redact = actor.role === UserRole.PROGRAMME_STAFF;
    return this.serialize(entity, { redactPii: redact });
  }

  async create(
    dto: CreateBeneficiaryDto,
    actor: ActorContext,
    request?: Pick<Request, 'ip' | 'headers'>,
  ): Promise<SerializedBeneficiary> {
    if (
      actor.role !== UserRole.ADMIN &&
      actor.role !== UserRole.ME_STAFF &&
      actor.role !== UserRole.PROGRAMME_STAFF
    ) {
      throw new ForbiddenException('Role cannot register beneficiaries');
    }

    const entity = this.repo.create({
      ...(dto.id ? { id: dto.id } : {}),
      full_name: dto.full_name,
      sex: dto.sex,
      date_of_birth: dto.date_of_birth ?? null,
      age_band: dto.age_band ?? null,
      community: dto.community ?? null,
      household_id: dto.household_id ?? null,
      phone_e164: dto.phone_e164 ?? null,
      national_id_hash: dto.national_id_raw
        ? hashNin(dto.national_id_raw)
        : null,
      skill_level: dto.skill_level ?? null,
      disability_status: dto.disability_status ?? false,
      notes: dto.notes ?? null,
      consent_given: dto.consent_given,
      consent_date: dto.consent_date ? new Date(dto.consent_date) : null,
      consent_method: dto.consent_method ?? null,
      active: true,
      created_by: actor.id,
    });
    const saved = await this.repo.save(entity);

    const cohortCodes = new Set<string>([
      ...deriveCohortCodes({
        sex: saved.sex,
        date_of_birth: saved.date_of_birth,
        community: saved.community,
        disability_status: saved.disability_status,
      }),
      ...(dto.cohort_codes ?? []),
    ]);
    await this.replaceCohortsByCode(saved.id, Array.from(cohortCodes));

    await this.piiAuditService.record({
      actor,
      beneficiary_id: saved.id,
      action: 'create',
      request: request ?? null,
    });

    const full = await this.loadWithCohorts(saved.id);
    return this.serialize(full, {
      redactPii: actor.role === UserRole.PROGRAMME_STAFF,
    });
  }

  async update(
    id: string,
    dto: UpdateBeneficiaryDto,
    actor: ActorContext,
    request?: Pick<Request, 'ip' | 'headers'>,
  ): Promise<SerializedBeneficiary> {
    const entity = await this.repo.findOne({
      where: { id },
      relations: { cohorts: true },
    });
    if (!entity) {
      throw new NotFoundException(`Beneficiary ${id} not found`);
    }
    this.assertWriteAccess(entity, actor);

    this.applyUpdates(entity, dto);
    const saved = await this.repo.save(entity);

    // Re-derive cohorts when the attributes that feed deriveCohortCodes change.
    const reDeriveRelevant =
      dto.sex !== undefined ||
      dto.date_of_birth !== undefined ||
      dto.community !== undefined ||
      dto.disability_status !== undefined;
    if (reDeriveRelevant) {
      const manualCodes = (entity.cohorts ?? [])
        .map((c) => c.code)
        .filter((code) => !derivedCodeUniverse.has(code));
      const next = new Set<string>([
        ...deriveCohortCodes({
          sex: saved.sex,
          date_of_birth: saved.date_of_birth,
          community: saved.community,
          disability_status: saved.disability_status,
        }),
        ...manualCodes,
      ]);
      await this.replaceCohortsByCode(saved.id, Array.from(next));
    }

    await this.piiAuditService.record({
      actor,
      beneficiary_id: saved.id,
      action: 'update',
      request: request ?? null,
    });

    const full = await this.loadWithCohorts(saved.id);
    return this.serialize(full, {
      redactPii: actor.role === UserRole.PROGRAMME_STAFF,
    });
  }

  async softDelete(
    id: string,
    actor: ActorContext,
    request?: Pick<Request, 'ip' | 'headers'>,
  ): Promise<{ id: string; active: boolean }> {
    if (actor.role !== UserRole.ADMIN && actor.role !== UserRole.ME_STAFF) {
      throw new ForbiddenException('Role cannot delete beneficiaries');
    }
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException(`Beneficiary ${id} not found`);
    }
    entity.active = false;
    await this.repo.save(entity);

    await this.piiAuditService.record({
      actor,
      beneficiary_id: id,
      action: 'delete',
      request: request ?? null,
    });
    return { id, active: false };
  }

  async attachCohort(
    id: string,
    code: string,
    actor: ActorContext,
  ): Promise<SerializedBeneficiary> {
    if (actor.role !== UserRole.ADMIN && actor.role !== UserRole.ME_STAFF) {
      throw new ForbiddenException('Role cannot edit cohort tags');
    }
    const entity = await this.repo.findOne({
      where: { id },
      relations: { cohorts: true },
    });
    if (!entity) {
      throw new NotFoundException(`Beneficiary ${id} not found`);
    }
    const cohort = await this.cohortsService.findByCodeOrThrow(code);
    if (!entity.cohorts.some((c) => c.id === cohort.id)) {
      entity.cohorts.push(cohort);
      await this.repo.save(entity);
    }
    const full = await this.loadWithCohorts(id);
    return this.serialize(full, { redactPii: false });
  }

  async detachCohort(
    id: string,
    code: string,
    actor: ActorContext,
  ): Promise<SerializedBeneficiary> {
    if (actor.role !== UserRole.ADMIN && actor.role !== UserRole.ME_STAFF) {
      throw new ForbiddenException('Role cannot edit cohort tags');
    }
    const entity = await this.repo.findOne({
      where: { id },
      relations: { cohorts: true },
    });
    if (!entity) {
      throw new NotFoundException(`Beneficiary ${id} not found`);
    }
    entity.cohorts = entity.cohorts.filter((c) => c.code !== code);
    await this.repo.save(entity);
    const full = await this.loadWithCohorts(id);
    return this.serialize(full, { redactPii: false });
  }

  async lookup(
    actor: ActorContext,
    args: { phone?: string; hash?: string },
  ): Promise<BeneficiaryLookupHit[]> {
    if (actor.role === UserRole.VIEWER) {
      throw new ForbiddenException('Viewer role cannot look up beneficiaries');
    }
    if (!args.phone && !args.hash) return [];

    const qb = this.repo
      .createQueryBuilder('b')
      .leftJoinAndSelect('b.cohorts', 'c')
      .andWhere('b.active = TRUE');

    if (args.phone) {
      qb.andWhere('b.phone_e164 = :phone', { phone: args.phone });
    }
    if (args.hash) {
      qb.andWhere('b.national_id_hash = :hash', { hash: args.hash });
    }

    if (actor.role === UserRole.PROGRAMME_STAFF) {
      qb.andWhere('b.created_by = :uid', { uid: actor.id });
    }

    const rows = await qb.limit(5).getMany();
    return rows.map((b) => ({
      id: b.id,
      full_name: b.full_name,
      community: b.community,
      cohort_codes: (b.cohorts ?? []).map((c) => c.code),
    }));
  }

  async batchCreate(
    items: CreateBeneficiaryDto[],
    actor: ActorContext,
  ): Promise<BatchBeneficiaryResult> {
    const accepted: string[] = [];
    const rejected: Array<{ id: string; reason: string }> = [];

    for (const item of items) {
      const itemId = item.id ?? '<unknown>';
      try {
        if (!item.id) {
          rejected.push({
            id: itemId,
            reason: 'Offline batch entries must include a client-generated id',
          });
          continue;
        }
        const existing = await this.repo.findOne({ where: { id: item.id } });
        if (existing) {
          // Idempotent: a re-sync of an already-accepted row counts as accepted.
          accepted.push(item.id);
          continue;
        }
        await this.create(item, actor);
        accepted.push(item.id);
      } catch (err) {
        rejected.push({
          id: itemId,
          reason: (err as Error).message ?? 'Unknown error',
        });
      }
    }
    return { accepted, rejected };
  }

  private assertReadAccess(entity: Beneficiary, actor: ActorContext): void {
    if (actor.role === UserRole.VIEWER) {
      throw new ForbiddenException(
        'Viewer role cannot view beneficiary records',
      );
    }
    if (
      actor.role === UserRole.PROGRAMME_STAFF &&
      entity.created_by !== actor.id
    ) {
      throw new ForbiddenException(
        'Programme staff may only view beneficiaries they registered',
      );
    }
  }

  private assertWriteAccess(entity: Beneficiary, actor: ActorContext): void {
    if (
      actor.role !== UserRole.ADMIN &&
      actor.role !== UserRole.ME_STAFF &&
      !(
        actor.role === UserRole.PROGRAMME_STAFF &&
        entity.created_by === actor.id
      )
    ) {
      throw new ForbiddenException('Role cannot edit this beneficiary');
    }
  }

  private async replaceCohortsByCode(
    beneficiaryId: string,
    codes: string[],
  ): Promise<void> {
    const resolved = await this.cohortsService.findByCodes(codes);
    const known = new Set(resolved.map((c) => c.code));
    const unknown = codes.filter((code) => !known.has(code));
    if (unknown.length > 0) {
      this.logger.warn(
        `Ignoring unknown cohort codes when tagging beneficiary ${beneficiaryId}: ${unknown.join(', ')}`,
      );
    }

    const entity = await this.repo.findOne({
      where: { id: beneficiaryId },
      relations: { cohorts: true },
    });
    if (!entity) return;
    entity.cohorts = resolved;
    await this.repo.save(entity);
  }

  private async loadWithCohorts(id: string): Promise<Beneficiary> {
    const entity = await this.repo.findOne({
      where: { id },
      relations: { cohorts: true },
    });
    if (!entity) {
      throw new NotFoundException(`Beneficiary ${id} not found`);
    }
    return entity;
  }

  private applyUpdates(entity: Beneficiary, dto: UpdateBeneficiaryDto): void {
    const directKeys: Array<keyof UpdateBeneficiaryDto & keyof Beneficiary> = [
      'full_name',
      'sex',
      'date_of_birth',
      'age_band',
      'community',
      'household_id',
      'phone_e164',
      'skill_level',
      'disability_status',
      'notes',
      'consent_given',
      'consent_method',
    ];
    for (const key of directKeys) {
      const value = dto[key];
      if (value !== undefined) {
        (entity as unknown as Record<string, unknown>)[key] = value;
      }
    }
    if (dto.national_id_raw !== undefined && dto.national_id_raw !== null) {
      entity.national_id_hash = hashNin(dto.national_id_raw);
    }
    if (dto.consent_date !== undefined) {
      entity.consent_date = dto.consent_date
        ? new Date(dto.consent_date)
        : null;
    }
  }

  private serialize(
    b: Beneficiary,
    options: { redactPii: boolean },
  ): SerializedBeneficiary {
    return {
      id: b.id,
      full_name: b.full_name,
      sex: b.sex,
      date_of_birth: b.date_of_birth,
      age_band: b.age_band,
      community: b.community,
      household_id: b.household_id,
      phone_e164: options.redactPii ? null : b.phone_e164,
      national_id_hash: options.redactPii ? null : b.national_id_hash,
      skill_level: b.skill_level,
      disability_status: b.disability_status,
      notes: options.redactPii ? null : b.notes,
      consent_given: b.consent_given,
      consent_date: b.consent_date ? b.consent_date.toISOString() : null,
      consent_method: b.consent_method,
      active: b.active,
      withdrawn_at: b.withdrawn_at ? b.withdrawn_at.toISOString() : null,
      created_by: b.created_by,
      created_at: b.created_at.toISOString(),
      updated_at: b.updated_at.toISOString(),
      cohorts: (b.cohorts ?? []).map((c) => ({
        id: c.id,
        code: c.code,
        name: c.name,
      })),
    };
  }
}

/**
 * The codes deriveCohortCodes can ever produce. Used by `update` to
 * preserve manual tags while re-deriving the auto-tagged ones.
 */
const derivedCodeUniverse = new Set([
  'youth',
  'woman',
  'ekz_affected_ago_araromi',
  'ekz_affected_ijan_ekiti',
  'ekz_affected_resettled',
  'affected_household_youth',
  'pwd',
]);
