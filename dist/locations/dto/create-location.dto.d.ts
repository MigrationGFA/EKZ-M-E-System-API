export declare class CreateLocationDto {
    name: string;
    sector: string;
    description?: string;
    lat: number;
    lng: number;
    radius_m?: number;
    indicator_ids?: string[];
    created_by: string;
}
