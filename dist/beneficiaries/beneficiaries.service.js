"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var BeneficiariesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BeneficiariesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const beneficiary_entity_js_1 = require("./beneficiary.entity.js");
const cohorts_service_js_1 = require("./cohorts.service.js");
const pii_access_log_service_js_1 = require("./pii-access-log.service.js");
const hash_js_1 = require("./helpers/hash.js");
const derive_cohorts_js_1 = require("./helpers/derive-cohorts.js");
const user_role_enum_js_1 = require("../common/enums/user-role.enum.js");
let BeneficiariesService = BeneficiariesService_1 = class BeneficiariesService {
    repo;
    cohortsService;
    piiAuditService;
    logger = new common_1.Logger(BeneficiariesService_1.name);
    constructor(repo, cohortsService, piiAuditService) {
        this.repo = repo;
        this.cohortsService = cohortsService;
        this.piiAuditService = piiAuditService;
    }
    async findAll(query, actor) {
        if (actor.role === user_role_enum_js_1.UserRole.VIEWER) {
            throw new common_1.ForbiddenException('Viewer role cannot list beneficiaries');
        }
        const qb = this.repo
            .createQueryBuilder('b')
            .leftJoinAndSelect('b.cohorts', 'c');
        const includeInactive = query.include_inactive === 'true' &&
            (actor.role === user_role_enum_js_1.UserRole.ADMIN || actor.role === user_role_enum_js_1.UserRole.ME_STAFF);
        if (!includeInactive) {
            qb.andWhere('b.active = TRUE');
        }
        if (actor.role === user_role_enum_js_1.UserRole.PROGRAMME_STAFF) {
            qb.andWhere('b.created_by = :uid', { uid: actor.id });
        }
        if (query.q) {
            qb.andWhere('b.full_name ILIKE :q', { q: `%${query.q}%` });
        }
        if (query.community) {
            qb.andWhere('b.community = :community', { community: query.community });
        }
        if (query.cohort) {
            qb.andWhere('EXISTS (SELECT 1 FROM beneficiary_cohorts bc JOIN cohorts c2 ON c2.id = bc.cohort_id WHERE bc.beneficiary_id = b.id AND c2.code = :cohortCode)', { cohortCode: query.cohort });
        }
        qb.orderBy('b.created_at', 'DESC').limit(200);
        const rows = await qb.getMany();
        return rows.map((b) => this.serialize(b, { redactPii: true }));
    }
    async findOne(id, actor, request) {
        const entity = await this.repo.findOne({
            where: { id },
            relations: { cohorts: true },
        });
        if (!entity) {
            throw new common_1.NotFoundException(`Beneficiary ${id} not found`);
        }
        this.assertReadAccess(entity, actor);
        await this.piiAuditService.record({
            actor,
            beneficiary_id: id,
            action: 'view',
            request: request ?? null,
        });
        const redact = actor.role === user_role_enum_js_1.UserRole.PROGRAMME_STAFF;
        return this.serialize(entity, { redactPii: redact });
    }
    async create(dto, actor, request) {
        if (actor.role !== user_role_enum_js_1.UserRole.ADMIN &&
            actor.role !== user_role_enum_js_1.UserRole.ME_STAFF &&
            actor.role !== user_role_enum_js_1.UserRole.PROGRAMME_STAFF) {
            throw new common_1.ForbiddenException('Role cannot register beneficiaries');
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
                ? (0, hash_js_1.hashNin)(dto.national_id_raw)
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
        const cohortCodes = new Set([
            ...(0, derive_cohorts_js_1.deriveCohortCodes)({
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
            redactPii: actor.role === user_role_enum_js_1.UserRole.PROGRAMME_STAFF,
        });
    }
    async update(id, dto, actor, request) {
        const entity = await this.repo.findOne({
            where: { id },
            relations: { cohorts: true },
        });
        if (!entity) {
            throw new common_1.NotFoundException(`Beneficiary ${id} not found`);
        }
        this.assertWriteAccess(entity, actor);
        this.applyUpdates(entity, dto);
        const saved = await this.repo.save(entity);
        const reDeriveRelevant = dto.sex !== undefined ||
            dto.date_of_birth !== undefined ||
            dto.community !== undefined ||
            dto.disability_status !== undefined;
        if (reDeriveRelevant) {
            const manualCodes = (entity.cohorts ?? [])
                .map((c) => c.code)
                .filter((code) => !derivedCodeUniverse.has(code));
            const next = new Set([
                ...(0, derive_cohorts_js_1.deriveCohortCodes)({
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
            redactPii: actor.role === user_role_enum_js_1.UserRole.PROGRAMME_STAFF,
        });
    }
    async softDelete(id, actor, request) {
        if (actor.role !== user_role_enum_js_1.UserRole.ADMIN && actor.role !== user_role_enum_js_1.UserRole.ME_STAFF) {
            throw new common_1.ForbiddenException('Role cannot delete beneficiaries');
        }
        const entity = await this.repo.findOne({ where: { id } });
        if (!entity) {
            throw new common_1.NotFoundException(`Beneficiary ${id} not found`);
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
    async attachCohort(id, code, actor) {
        if (actor.role !== user_role_enum_js_1.UserRole.ADMIN && actor.role !== user_role_enum_js_1.UserRole.ME_STAFF) {
            throw new common_1.ForbiddenException('Role cannot edit cohort tags');
        }
        const entity = await this.repo.findOne({
            where: { id },
            relations: { cohorts: true },
        });
        if (!entity) {
            throw new common_1.NotFoundException(`Beneficiary ${id} not found`);
        }
        const cohort = await this.cohortsService.findByCodeOrThrow(code);
        if (!entity.cohorts.some((c) => c.id === cohort.id)) {
            entity.cohorts.push(cohort);
            await this.repo.save(entity);
        }
        const full = await this.loadWithCohorts(id);
        return this.serialize(full, { redactPii: false });
    }
    async detachCohort(id, code, actor) {
        if (actor.role !== user_role_enum_js_1.UserRole.ADMIN && actor.role !== user_role_enum_js_1.UserRole.ME_STAFF) {
            throw new common_1.ForbiddenException('Role cannot edit cohort tags');
        }
        const entity = await this.repo.findOne({
            where: { id },
            relations: { cohorts: true },
        });
        if (!entity) {
            throw new common_1.NotFoundException(`Beneficiary ${id} not found`);
        }
        entity.cohorts = entity.cohorts.filter((c) => c.code !== code);
        await this.repo.save(entity);
        const full = await this.loadWithCohorts(id);
        return this.serialize(full, { redactPii: false });
    }
    async lookup(actor, args) {
        if (actor.role === user_role_enum_js_1.UserRole.VIEWER) {
            throw new common_1.ForbiddenException('Viewer role cannot look up beneficiaries');
        }
        if (!args.phone && !args.hash)
            return [];
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
        if (actor.role === user_role_enum_js_1.UserRole.PROGRAMME_STAFF) {
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
    async batchCreate(items, actor) {
        const accepted = [];
        const rejected = [];
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
                    accepted.push(item.id);
                    continue;
                }
                await this.create(item, actor);
                accepted.push(item.id);
            }
            catch (err) {
                rejected.push({
                    id: itemId,
                    reason: err.message ?? 'Unknown error',
                });
            }
        }
        return { accepted, rejected };
    }
    assertReadAccess(entity, actor) {
        if (actor.role === user_role_enum_js_1.UserRole.VIEWER) {
            throw new common_1.ForbiddenException('Viewer role cannot view beneficiary records');
        }
        if (actor.role === user_role_enum_js_1.UserRole.PROGRAMME_STAFF &&
            entity.created_by !== actor.id) {
            throw new common_1.ForbiddenException('Programme staff may only view beneficiaries they registered');
        }
    }
    assertWriteAccess(entity, actor) {
        if (actor.role !== user_role_enum_js_1.UserRole.ADMIN &&
            actor.role !== user_role_enum_js_1.UserRole.ME_STAFF &&
            !(actor.role === user_role_enum_js_1.UserRole.PROGRAMME_STAFF &&
                entity.created_by === actor.id)) {
            throw new common_1.ForbiddenException('Role cannot edit this beneficiary');
        }
    }
    async replaceCohortsByCode(beneficiaryId, codes) {
        const resolved = await this.cohortsService.findByCodes(codes);
        const known = new Set(resolved.map((c) => c.code));
        const unknown = codes.filter((code) => !known.has(code));
        if (unknown.length > 0) {
            this.logger.warn(`Ignoring unknown cohort codes when tagging beneficiary ${beneficiaryId}: ${unknown.join(', ')}`);
        }
        const entity = await this.repo.findOne({
            where: { id: beneficiaryId },
            relations: { cohorts: true },
        });
        if (!entity)
            return;
        entity.cohorts = resolved;
        await this.repo.save(entity);
    }
    async loadWithCohorts(id) {
        const entity = await this.repo.findOne({
            where: { id },
            relations: { cohorts: true },
        });
        if (!entity) {
            throw new common_1.NotFoundException(`Beneficiary ${id} not found`);
        }
        return entity;
    }
    applyUpdates(entity, dto) {
        const directKeys = [
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
                entity[key] = value;
            }
        }
        if (dto.national_id_raw !== undefined && dto.national_id_raw !== null) {
            entity.national_id_hash = (0, hash_js_1.hashNin)(dto.national_id_raw);
        }
        if (dto.consent_date !== undefined) {
            entity.consent_date = dto.consent_date
                ? new Date(dto.consent_date)
                : null;
        }
    }
    serialize(b, options) {
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
};
exports.BeneficiariesService = BeneficiariesService;
exports.BeneficiariesService = BeneficiariesService = BeneficiariesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(beneficiary_entity_js_1.Beneficiary)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        cohorts_service_js_1.CohortsService,
        pii_access_log_service_js_1.PiiAccessLogService])
], BeneficiariesService);
const derivedCodeUniverse = new Set([
    'youth',
    'woman',
    'ekz_affected_ago_araromi',
    'ekz_affected_ijan_ekiti',
    'ekz_affected_resettled',
    'affected_household_youth',
    'pwd',
]);
//# sourceMappingURL=beneficiaries.service.js.map