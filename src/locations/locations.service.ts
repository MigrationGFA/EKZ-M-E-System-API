import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ProjectLocation } from './project-location.entity.js';
import { Indicator } from '../indicators/indicator.entity.js';
import { Submission } from '../submissions/submission.entity.js';
import { Form } from '../forms/form.entity.js';
import { CreateLocationDto } from './dto/create-location.dto.js';
import { UpdateLocationDto } from './dto/update-location.dto.js';
import { AuditService } from '../audit/audit.service.js';

@Injectable()
export class LocationsService {
  constructor(
    @InjectRepository(ProjectLocation)
    private readonly locRepo: Repository<ProjectLocation>,
    @InjectRepository(Indicator)
    private readonly indicatorRepo: Repository<Indicator>,
    @InjectRepository(Submission)
    private readonly subRepo: Repository<Submission>,
    @InjectRepository(Form)
    private readonly formRepo: Repository<Form>,
    private readonly auditService: AuditService,
  ) {}

  async findAll(filters: { sector?: string; status?: string }) {
    const qb = this.locRepo.createQueryBuilder('l');
    if (filters.sector) {
      qb.andWhere('l.sector = :sector', { sector: filters.sector });
    }
    const locations = await qb.getMany();

    // Collect all indicator IDs across all locations
    const allIndicatorIds = [
      ...new Set(locations.flatMap((l) => l.indicator_ids)),
    ];

    // Fetch all needed indicators in one query
    let indicatorsMap = new Map<string, Indicator>();
    if (allIndicatorIds.length > 0) {
      const indicators = await this.indicatorRepo.find({
        where: { id: In(allIndicatorIds) },
      });
      indicatorsMap = new Map(indicators.map((i) => [i.id, i]));
    }

    const features = locations.map((loc) => {
      const indicators = loc.indicator_ids
        .map((id) => indicatorsMap.get(id))
        .filter((i): i is Indicator => !!i);

      const { completion, status } = this.computeLocationStatus(indicators);

      return {
        type: 'Feature' as const,
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
          type: 'Point' as const,
          coordinates: [loc.lng, loc.lat],
        },
      };
    });

    // Filter by computed status if requested
    const filtered = filters.status
      ? features.filter((f) => f.properties.status === filters.status)
      : features;

    return {
      type: 'FeatureCollection' as const,
      features: filtered,
    };
  }

  async findOne(id: string) {
    const loc = await this.locRepo.findOne({ where: { id } });
    if (!loc) throw new NotFoundException('Location not found');

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

  async create(dto: CreateLocationDto, actorId?: string, actorName?: string) {
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

  async update(
    id: string,
    dto: UpdateLocationDto,
    actorId?: string,
    actorName?: string,
  ) {
    const loc = await this.locRepo.findOne({ where: { id } });
    if (!loc) throw new NotFoundException('Location not found');

    // Capture before state
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

    const updates = Object.fromEntries(
      Object.entries(dto).filter(([, v]) => v !== undefined),
    );
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

  async remove(id: string, actorId?: string, actorName?: string) {
    const loc = await this.locRepo.findOne({ where: { id } });
    if (!loc) throw new NotFoundException('Location not found');

    const submissionCount = await this.subRepo.count({
      where: { location_id: id },
    });
    if (submissionCount > 0) {
      throw new ConflictException(
        `Cannot delete location referenced by ${submissionCount} submission(s).`,
      );
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

  async getIndicatorLocations(indicatorId: string) {
    // Find forms that include this indicator
    const forms = await this.formRepo
      .createQueryBuilder('f')
      .where(':indicatorId = ANY(f.indicator_ids)', { indicatorId })
      .getMany();

    if (forms.length === 0) {
      return { type: 'FeatureCollection' as const, features: [] };
    }

    const formIds = forms.map((f) => f.id);
    const submissions = await this.subRepo.find({
      where: { form_id: In(formIds) },
    });

    const features = submissions
      .filter((s) => s.location)
      .map((s) => ({
        type: 'Feature' as const,
        properties: {
          id: s.id,
          form_id: s.form_id,
          officer_id: s.officer_id,
          submittedAt: s.submitted_at,
          on_site: s.on_site,
        },
        geometry: {
          type: 'Point' as const,
          coordinates: [s.location!.lng, s.location!.lat],
        },
      }));

    return { type: 'FeatureCollection' as const, features };
  }

  private async getLinkedIndicators(
    indicatorIds: string[],
  ): Promise<Indicator[]> {
    if (indicatorIds.length === 0) return [];
    return this.indicatorRepo.find({ where: { id: In(indicatorIds) } });
  }

  private computeLocationStatus(indicators: Indicator[]): {
    completion: number;
    status: string;
  } {
    if (indicators.length === 0) {
      return { completion: 0, status: 'no_data' };
    }

    const completion =
      indicators.reduce((sum, i) => {
        const target = Number(i.target);
        if (target === 0) return sum;
        return sum + (Number(i.current_value) / target) * 100;
      }, 0) / indicators.length;

    const status =
      completion >= 90
        ? 'on_track'
        : completion >= 60
          ? 'at_risk'
          : 'off_track';

    return { completion, status };
  }
}
