import { Repository } from 'typeorm';
import { ProjectLocation } from './project-location.entity.js';
import { Indicator } from '../indicators/indicator.entity.js';
import { Submission } from '../submissions/submission.entity.js';
import { Form } from '../forms/form.entity.js';
import { CreateLocationDto } from './dto/create-location.dto.js';
import { UpdateLocationDto } from './dto/update-location.dto.js';
import { AuditService } from '../audit/audit.service.js';
export declare class LocationsService {
    private readonly locRepo;
    private readonly indicatorRepo;
    private readonly subRepo;
    private readonly formRepo;
    private readonly auditService;
    constructor(locRepo: Repository<ProjectLocation>, indicatorRepo: Repository<Indicator>, subRepo: Repository<Submission>, formRepo: Repository<Form>, auditService: AuditService);
    findAll(filters: {
        sector?: string;
        status?: string;
    }): Promise<{
        type: "FeatureCollection";
        features: {
            type: "Feature";
            properties: {
                id: string;
                name: string;
                sector: string;
                description: string | null;
                lat: number;
                lng: number;
                radius_m: number;
                status: string;
                completion: number;
                indicator_ids: string[];
                created_by: string;
                createdAt: Date;
                updatedAt: Date;
            };
            geometry: {
                type: "Point";
                coordinates: number[];
            };
        }[];
    }>;
    findOne(id: string): Promise<{
        id: string;
        name: string;
        sector: string;
        description: string | null;
        lat: number;
        lng: number;
        radius_m: number;
        status: string;
        completion: number;
        indicator_ids: string[];
        created_by: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    create(dto: CreateLocationDto, actorId?: string, actorName?: string): Promise<{
        id: string;
        name: string;
        sector: string;
        description: string | null;
        lat: number;
        lng: number;
        radius_m: number;
        status: string;
        completion: number;
        indicator_ids: string[];
        created_by: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: string, dto: UpdateLocationDto, actorId?: string, actorName?: string): Promise<{
        id: string;
        name: string;
        sector: string;
        description: string | null;
        lat: number;
        lng: number;
        radius_m: number;
        status: string;
        completion: number;
        indicator_ids: string[];
        created_by: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(id: string, actorId?: string, actorName?: string): Promise<void>;
    getIndicatorLocations(indicatorId: string): Promise<{
        type: "FeatureCollection";
        features: {
            type: "Feature";
            properties: {
                id: string;
                form_id: string;
                officer_id: string;
                submittedAt: Date;
                on_site: boolean | null;
            };
            geometry: {
                type: "Point";
                coordinates: number[];
            };
        }[];
    }>;
    private getLinkedIndicators;
    private computeLocationStatus;
}
