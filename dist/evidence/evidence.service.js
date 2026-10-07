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
var EvidenceService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvidenceService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const evidence_document_entity_js_1 = require("./evidence-document.entity.js");
const document_types_js_1 = require("./constants/document-types.js");
const assert_read_access_js_1 = require("./helpers/assert-read-access.js");
const validate_type_metadata_js_1 = require("./helpers/validate-type-metadata.js");
const audit_service_js_1 = require("../audit/audit.service.js");
const cohort_entity_js_1 = require("../beneficiaries/cohort.entity.js");
const user_role_enum_js_1 = require("../common/enums/user-role.enum.js");
let EvidenceService = EvidenceService_1 = class EvidenceService {
    repo;
    cohortRepo;
    auditService;
    logger = new common_1.Logger(EvidenceService_1.name);
    constructor(repo, cohortRepo, auditService) {
        this.repo = repo;
        this.cohortRepo = cohortRepo;
        this.auditService = auditService;
    }
    async findAll(query, actor) {
        const page = query.page ?? 1;
        const perPage = query.per_page ?? 25;
        const qb = this.repo.createQueryBuilder('d');
        const includeDeleted = query.include_deleted === 'true' && actor.role === user_role_enum_js_1.UserRole.ADMIN;
        if (!includeDeleted) {
            qb.andWhere('d.deleted_at IS NULL');
        }
        if (query.document_type) {
            qb.andWhere('d.document_type = :type', { type: query.document_type });
        }
        if (query.indicator_id) {
            qb.andWhere('d.indicator_id = :iid', { iid: query.indicator_id });
        }
        if (query.indicator_progress_id) {
            qb.andWhere('d.indicator_progress_id = :pid', {
                pid: query.indicator_progress_id,
            });
        }
        if (query.location_id) {
            qb.andWhere('d.location_id = :lid', { lid: query.location_id });
        }
        if (query.orphan === 'true') {
            qb.andWhere(new typeorm_2.Brackets((b) => b
                .where('d.indicator_id IS NULL')
                .andWhere('d.indicator_progress_id IS NULL')
                .andWhere('d.location_id IS NULL')));
        }
        if (query.due_for_deletion === 'true') {
            qb.andWhere('d.retention_until IS NOT NULL').andWhere('d.retention_until < NOW()');
        }
        if (query.q) {
            qb.andWhere('d.title ILIKE :q', { q: `%${query.q}%` });
        }
        const total = await qb.getCount();
        qb.orderBy('d.uploaded_at', 'DESC')
            .skip((page - 1) * perPage)
            .take(perPage);
        const rows = await qb.getMany();
        const visible = rows.filter((d) => (0, assert_read_access_js_1.canRead)(d, actor));
        return {
            data: visible.map((d) => this.serialize(d)),
            total,
            page,
            per_page: perPage,
        };
    }
    async findOne(id, actor) {
        const entity = await this.repo.findOne({ where: { id } });
        if (!entity) {
            throw new common_1.NotFoundException(`Evidence document ${id} not found`);
        }
        (0, assert_read_access_js_1.assertReadAccess)(entity, actor);
        return this.serialize(entity);
    }
    async create(dto, actor, actorEmail) {
        (0, assert_read_access_js_1.assertWriteAccess)(dto.document_type, actor);
        this.assertSingleAttachment(dto);
        await this.validatePayload(dto);
        const entity = this.repo.create({
            title: dto.title,
            description: dto.description ?? null,
            document_type: dto.document_type,
            type_metadata: dto.type_metadata ?? {},
            reference_period_from: dto.reference_period_from ?? null,
            reference_period_to: dto.reference_period_to ?? null,
            retention_until: dto.retention_until !== undefined
                ? new Date(dto.retention_until)
                : (0, document_types_js_1.computeRetentionUntil)(dto.document_type),
            file_url: dto.file_url,
            file_size_bytes: dto.file_size_bytes,
            mime_type: dto.mime_type,
            sha256: dto.sha256,
            uploaded_by: actor.id,
            indicator_id: dto.indicator_id ?? null,
            indicator_progress_id: dto.indicator_progress_id ?? null,
            location_id: dto.location_id ?? null,
        });
        const saved = await this.repo.save(entity);
        await this.auditService.log({
            user_id: actor.id,
            user_name: actorEmail,
            action: 'upload',
            resource: 'evidence_document',
            resource_id: saved.id,
            after_data: {
                title: saved.title,
                document_type: saved.document_type,
                file_size_bytes: saved.file_size_bytes,
                sha256: saved.sha256,
                attached_to: this.describeAttachment(saved),
            },
        });
        return this.serialize(saved);
    }
    async update(id, dto, actor, actorEmail) {
        const entity = await this.repo.findOne({ where: { id } });
        if (!entity) {
            throw new common_1.NotFoundException(`Evidence document ${id} not found`);
        }
        (0, assert_read_access_js_1.assertWriteAccess)(entity.document_type, actor);
        const before = {
            title: entity.title,
            description: entity.description,
            type_metadata: entity.type_metadata,
            reference_period_from: entity.reference_period_from,
            reference_period_to: entity.reference_period_to,
            retention_until: entity.retention_until,
        };
        if (dto.title !== undefined)
            entity.title = dto.title;
        if (dto.description !== undefined)
            entity.description = dto.description;
        if (dto.type_metadata !== undefined)
            entity.type_metadata = dto.type_metadata;
        if (dto.reference_period_from !== undefined)
            entity.reference_period_from = dto.reference_period_from;
        if (dto.reference_period_to !== undefined)
            entity.reference_period_to = dto.reference_period_to;
        if (dto.retention_until !== undefined)
            entity.retention_until = new Date(dto.retention_until);
        await this.validateMetadataOnEntity(entity);
        const saved = await this.repo.save(entity);
        await this.auditService.log({
            user_id: actor.id,
            user_name: actorEmail,
            action: 'update',
            resource: 'evidence_document',
            resource_id: saved.id,
            before_data: before,
            after_data: {
                title: saved.title,
                description: saved.description,
                type_metadata: saved.type_metadata,
                reference_period_from: saved.reference_period_from,
                reference_period_to: saved.reference_period_to,
                retention_until: saved.retention_until,
            },
        });
        return this.serialize(saved);
    }
    async replace(id, uploaded, actor, actorEmail, options = {}) {
        const existing = await this.repo.findOne({ where: { id } });
        if (!existing) {
            throw new common_1.NotFoundException(`Evidence document ${id} not found`);
        }
        (0, assert_read_access_js_1.assertWriteAccess)(existing.document_type, actor);
        if (uploaded.sha256 === existing.sha256) {
            return this.serialize(existing);
        }
        if (options.force !== true) {
            throw new common_1.ConflictException({
                message: 'Checksum mismatch — confirm replace by retrying with force=true',
                code: 'CHECKSUM_MISMATCH',
                existing_sha256: existing.sha256,
                new_sha256: uploaded.sha256,
            });
        }
        if (!(0, document_types_js_1.isMimeAllowed)(existing.document_type, uploaded.mime_type)) {
            throw new common_1.BadRequestException(`MIME ${uploaded.mime_type} not permitted for ${existing.document_type}`);
        }
        const newEntity = this.repo.create({
            title: options.title ?? existing.title,
            description: options.description ?? existing.description,
            document_type: existing.document_type,
            type_metadata: options.type_metadata ?? existing.type_metadata,
            reference_period_from: existing.reference_period_from,
            reference_period_to: existing.reference_period_to,
            retention_until: existing.retention_until ??
                (0, document_types_js_1.computeRetentionUntil)(existing.document_type),
            file_url: uploaded.file_url,
            file_size_bytes: String(uploaded.file_size_bytes),
            mime_type: uploaded.mime_type,
            sha256: uploaded.sha256,
            uploaded_by: actor.id,
            supersedes_id: existing.id,
            indicator_id: existing.indicator_id,
            indicator_progress_id: existing.indicator_progress_id,
            location_id: existing.location_id,
        });
        const savedNew = await this.repo.save(newEntity);
        existing.deleted_at = new Date();
        await this.repo.save(existing);
        await this.auditService.log({
            user_id: actor.id,
            user_name: actorEmail,
            action: 'replace',
            resource: 'evidence_document',
            resource_id: savedNew.id,
            before_data: { sha256: existing.sha256, supersedes_id: existing.id },
            after_data: {
                sha256: savedNew.sha256,
                file_size_bytes: savedNew.file_size_bytes,
                supersedes_id: existing.id,
            },
        });
        return this.serialize(savedNew);
    }
    async softDelete(id, actor, actorEmail) {
        const entity = await this.repo.findOne({ where: { id } });
        if (!entity) {
            throw new common_1.NotFoundException(`Evidence document ${id} not found`);
        }
        (0, assert_read_access_js_1.assertWriteAccess)(entity.document_type, actor);
        if (entity.deleted_at) {
            return { id: entity.id, deleted_at: entity.deleted_at.toISOString() };
        }
        entity.deleted_at = new Date();
        const saved = await this.repo.save(entity);
        await this.auditService.log({
            user_id: actor.id,
            user_name: actorEmail,
            action: 'delete',
            resource: 'evidence_document',
            resource_id: saved.id,
            before_data: {
                title: entity.title,
                document_type: entity.document_type,
            },
        });
        return {
            id: saved.id,
            deleted_at: (saved.deleted_at ?? new Date()).toISOString(),
        };
    }
    assertSingleAttachment(dto) {
        const set = [
            dto.indicator_id,
            dto.indicator_progress_id,
            dto.location_id,
        ].filter((v) => v !== undefined && v !== null && v !== '').length;
        if (set > 1) {
            throw new common_1.BadRequestException('At most one of indicator_id / indicator_progress_id / location_id may be set');
        }
    }
    async validatePayload(dto) {
        const config = document_types_js_1.DOCUMENT_TYPE_CONFIG[dto.document_type];
        if (!(0, document_types_js_1.isMimeAllowed)(dto.document_type, dto.mime_type)) {
            throw new common_1.BadRequestException(`MIME ${dto.mime_type} not permitted for ${dto.document_type}`);
        }
        const sizeBytes = Number(dto.file_size_bytes);
        if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) {
            throw new common_1.BadRequestException('file_size_bytes must be a positive number');
        }
        if (sizeBytes > config.maxSizeBytes) {
            throw new common_1.BadRequestException(`File exceeds the ${Math.round(config.maxSizeBytes / 1024 / 1024)} MB limit for ${dto.document_type}`);
        }
        (0, validate_type_metadata_js_1.validateTypeMetadata)(dto.document_type, dto.type_metadata, {
            from: dto.reference_period_from,
            to: dto.reference_period_to,
        });
        if (dto.document_type === 'beneficiary_tracer_study') {
            const code = (dto.type_metadata?.cohort_code ?? null);
            if (code) {
                const cohort = await this.cohortRepo.findOne({ where: { code } });
                if (!cohort) {
                    throw new common_1.BadRequestException(`Unknown cohort code: ${code}`);
                }
            }
        }
    }
    async validateMetadataOnEntity(entity) {
        (0, validate_type_metadata_js_1.validateTypeMetadata)(entity.document_type, entity.type_metadata, {
            from: entity.reference_period_from,
            to: entity.reference_period_to,
        });
        if (entity.document_type === 'beneficiary_tracer_study') {
            const code = (entity.type_metadata.cohort_code ?? null);
            if (code) {
                const cohort = await this.cohortRepo.findOne({ where: { code } });
                if (!cohort) {
                    throw new common_1.BadRequestException(`Unknown cohort code: ${code}`);
                }
            }
        }
    }
    describeAttachment(d) {
        if (d.indicator_id)
            return `indicator:${d.indicator_id}`;
        if (d.indicator_progress_id)
            return `progress:${d.indicator_progress_id}`;
        if (d.location_id)
            return `location:${d.location_id}`;
        return 'orphan';
    }
    serialize(d) {
        return {
            id: d.id,
            title: d.title,
            description: d.description,
            document_type: d.document_type,
            type_metadata: d.type_metadata ?? {},
            reference_period_from: d.reference_period_from,
            reference_period_to: d.reference_period_to,
            retention_until: d.retention_until
                ? d.retention_until.toISOString()
                : null,
            file_url: d.file_url,
            file_size_bytes: Number(d.file_size_bytes),
            mime_type: d.mime_type,
            sha256: d.sha256,
            uploaded_by: d.uploaded_by,
            uploaded_at: d.uploaded_at.toISOString(),
            updated_at: d.updated_at.toISOString(),
            deleted_at: d.deleted_at ? d.deleted_at.toISOString() : null,
            supersedes_id: d.supersedes_id,
            indicator_id: d.indicator_id,
            indicator_progress_id: d.indicator_progress_id,
            location_id: d.location_id,
        };
    }
};
exports.EvidenceService = EvidenceService;
exports.EvidenceService = EvidenceService = EvidenceService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(evidence_document_entity_js_1.EvidenceDocument)),
    __param(1, (0, typeorm_1.InjectRepository)(cohort_entity_js_1.Cohort)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        audit_service_js_1.AuditService])
], EvidenceService);
//# sourceMappingURL=evidence.service.js.map