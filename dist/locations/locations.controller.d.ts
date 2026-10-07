import { LocationsService } from './locations.service.js';
import { CreateLocationDto } from './dto/create-location.dto.js';
import { UpdateLocationDto } from './dto/update-location.dto.js';
export declare class LocationsController {
    private readonly locationsService;
    constructor(locationsService: LocationsService);
    findAll(sector?: string, status?: string): Promise<{
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
    create(dto: CreateLocationDto, req: any): Promise<{
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
    update(id: string, dto: UpdateLocationDto, req: any): Promise<{
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
    remove(id: string, req: any): Promise<void>;
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
}
