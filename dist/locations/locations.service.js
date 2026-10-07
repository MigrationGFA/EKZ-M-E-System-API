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
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocationsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const project_location_entity_js_1 = require("./project-location.entity.js");
const indicator_entity_js_1 = require("../indicators/indicator.entity.js");
const submission_entity_js_1 = require("../submissions/submission.entity.js");
const form_entity_js_1 = require("../forms/form.entity.js");
const audit_service_js_1 = require("../audit/audit.service.js");
let LocationsService = class LocationsService {
    locRepo;
    indicatorRepo;
    subRepo;
    formRepo;
    auditService;
    constructor(locRepo, indicatorRepo, subRepo, formRepo, auditService) {
        this.locRepo = locRepo;
        this.indicatorRepo = indicatorRepo;
        this.subRepo = subRepo;
        this.formRepo = formRepo;
        this.auditService = auditService;
    }
    async findAll(filters) {
        const qb = this.locRepo.createQueryBuilder('l');
        if (filters.sector) {
            qb.andWhere('l.sector = :sector', { sector: filters.sector });
        }
        const locations = await qb.getMany();
        const allIndicatorIds = [
            ...new Set(locations.flatMap((l) => l.indicator_ids)),
        ];
        let indicatorsMap = new Map();
        if (allIndicatorIds.length > 0) {
            const indicators = await this.indicatorRepo.find({
                where: { id: (0, typeorm_2.In)(allIndicatorIds) },
            });
            indicatorsMap = new Map(indicators.map((i) => [i.id, i]));
        }
        const features = locations.map((loc) => {
            const indicators = loc.indicator_ids
                .map((id) => indicatorsMap.get(id))
                .filter((i) => !!i);
            const { completion, status } = this.computeLocationStatus(indicators);
            return {
                type: 'Feature',
                properties: {
                    id: loc.id,
                    name: loc.name,
                    sector: loc.sector,
                    description: loc.description,
                    lat: loc.lat,
                    lng: loc.lng,
                    radius_m: loc.radius_m,
                    status,
                    completion: Math.round(completion),
                    indicator_ids: loc.indicator_ids,
                    created_by: loc.created_by,
                    createdAt: loc.created_at,
                    updatedAt: loc.updated_at,
                },
                geometry: {
                    type: 'Point',
                    coordinates: [loc.lng, loc.lat],
                },
            };
        });
        const filtered = filters.status
            ? features.filter((f) => f.properties.status === filters.status)
            : features;
        return {
            type: 'FeatureCollection',
            features: filtered,
        };
    }
    async findOne(id) {
        const loc = await this.locRepo.findOne({ where: { id } });
        if (!loc)
            throw new common_1.NotFoundException('Location not found');
        const indicators = await this.getLinkedIndicators(loc.indicator_ids);
        const { completion, status } = this.computeLocationStatus(indicators);
        return {
            id: loc.id,
            name: loc.name,
            sector: loc.sector,
            description: loc.description,
            lat: loc.lat,
            lng: loc.lng,
            radius_m: loc.radius_m,
            status,
            completion: Math.round(completion),
            indicator_ids: loc.indicator_ids,
            created_by: loc.created_by,
            createdAt: loc.created_at,
            updatedAt: loc.updated_at,
        };
    }
    async create(dto, actorId, actorName) {
        const loc = this.locRepo.create({
            name: dto.name,
            sector: dto.sector,
            description: dto.description ?? null,
            lat: dto.lat,
            lng: dto.lng,
            radius_m: dto.radius_m ?? 500,
            indicator_ids: dto.indicator_ids ?? [],
            created_by: dto.created_by,
        });
        const saved = await this.locRepo.save(loc);
        const indicators = await this.getLinkedIndicators(saved.indicator_ids);
        const { completion, status } = this.computeLocationStatus(indicators);
        const result = {
            id: saved.id,
            name: saved.name,
            sector: saved.sector,
            description: saved.description,
            lat: saved.lat,
            lng: saved.lng,
            radius_m: saved.radius_m,
            status,
            completion: Math.round(completion),
            indicator_ids: saved.indicator_ids,
            created_by: saved.created_by,
            createdAt: saved.created_at,
            updatedAt: saved.updated_at,
        };
        if (actorId && actorName) {
            void this.auditService.log({
                user_id: actorId,
                user_name: actorName,
                action: 'create',
                resource: 'location',
                resource_id: saved.id,
                after_data: result,
            });
        }
        return result;
    }
    async update(id, dto, actorId, actorName) {
        const loc = await this.locRepo.findOne({ where: { id } });
        if (!loc)
            throw new common_1.NotFoundException('Location not found');
        const beforeIndicators = await this.getLinkedIndicators(loc.indicator_ids);
        const beforeComputed = this.computeLocationStatus(beforeIndicators);
        const beforeData = {
            id: loc.id,
            name: loc.name,
            sector: loc.sector,
            description: loc.description,
            lat: loc.lat,
            lng: loc.lng,
            radius_m: loc.radius_m,
            status: beforeComputed.status,
            completion: Math.round(beforeComputed.completion),
            indicator_ids: loc.indicator_ids,
            created_by: loc.created_by,
            createdAt: loc.created_at,
            updatedAt: loc.updated_at,
        };
        const updates = Object.fromEntries(Object.entries(dto).filter(([, v]) => v !== undefined));
        Object.assign(loc, updates);
        const saved = await this.locRepo.save(loc);
        const indicators = await this.getLinkedIndicators(saved.indicator_ids);
        const { completion, status } = this.computeLocationStatus(indicators);
        const afterData = {
            id: saved.id,
            name: saved.name,
            sector: saved.sector,
            description: saved.description,
            lat: saved.lat,
            lng: saved.lng,
            radius_m: saved.radius_m,
            status,
            completion: Math.round(completion),
            indicator_ids: saved.indicator_ids,
            created_by: saved.created_by,
            createdAt: saved.created_at,
            updatedAt: saved.updated_at,
        };
        if (actorId && actorName) {
            void this.auditService.log({
                user_id: actorId,
                user_name: actorName,
                action: 'update',
                resource: 'location',
                resource_id: saved.id,
                before_data: beforeData,
                after_data: afterData,
            });
        }
        return afterData;
    }
    async remove(id, actorId, actorName) {
        const loc = await this.locRepo.findOne({ where: { id } });
        if (!loc)
            throw new common_1.NotFoundException('Location not found');
        const submissionCount = await this.subRepo.count({
            where: { location_id: id },
        });
        if (submissionCount > 0) {
            throw new common_1.ConflictException(`Cannot delete location referenced by ${submissionCount} submission(s).`);
        }
        const beforeData = {
            id: loc.id,
            name: loc.name,
            sector: loc.sector,
            description: loc.description,
            lat: loc.lat,
            lng: loc.lng,
            radius_m: loc.radius_m,
            indicator_ids: loc.indicator_ids,
            created_by: loc.created_by,
        };
        await this.locRepo.remove(loc);
        if (actorId && actorName) {
            void this.auditService.log({
                user_id: actorId,
                user_name: actorName,
                action: 'delete',
                resource: 'location',
                resource_id: id,
                before_data: beforeData,
            });
        }
    }
    async getIndicatorLocations(indicatorId) {
        const forms = await this.formRepo
            .createQueryBuilder('f')
            .where(':indicatorId = ANY(f.indicator_ids)', { indicatorId })
            .getMany();
        if (forms.length === 0) {
            return { type: 'FeatureCollection', features: [] };
        }
        const formIds = forms.map((f) => f.id);
        const submissions = await this.subRepo.find({
            where: { form_id: (0, typeorm_2.In)(formIds) },
        });
        const features = submissions
            .filter((s) => s.location)
            .map((s) => ({
            type: 'Feature',
            properties: {
                id: s.id,
                form_id: s.form_id,
                officer_id: s.officer_id,
                submittedAt: s.submitted_at,
                on_site: s.on_site,
            },
            geometry: {
                type: 'Point',
                coordinates: [s.location.lng, s.location.lat],
            },
        }));
        return { type: 'FeatureCollection', features };
    }
    async getLinkedIndicators(indicatorIds) {
        if (indicatorIds.length === 0)
            return [];
        return this.indicatorRepo.find({ where: { id: (0, typeorm_2.In)(indicatorIds) } });
    }
    computeLocationStatus(indicators) {
        if (indicators.length === 0) {
            return { completion: 0, status: 'no_data' };
        }
        const completion = indicators.reduce((sum, i) => {
            const target = Number(i.target);
            if (target === 0)
                return sum;
            return sum + (Number(i.current_value) / target) * 100;
        }, 0) / indicators.length;
        const status = completion >= 90
            ? 'on_track'
            : completion >= 60
                ? 'at_risk'
                : 'off_track';
        return { completion, status };
    }
};
exports.LocationsService = LocationsService;
exports.LocationsService = LocationsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(project_location_entity_js_1.ProjectLocation)),
    __param(1, (0, typeorm_1.InjectRepository)(indicator_entity_js_1.Indicator)),
    __param(2, (0, typeorm_1.InjectRepository)(submission_entity_js_1.Submission)),
    __param(3, (0, typeorm_1.InjectRepository)(form_entity_js_1.Form)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        audit_service_js_1.AuditService])
], LocationsService);
//# sourceMappingURL=locations.service.js.map