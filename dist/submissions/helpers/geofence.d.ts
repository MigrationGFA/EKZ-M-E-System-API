import { ProjectLocation } from '../../locations/project-location.entity.js';
export declare function haversineMetres(lat1: number, lng1: number, lat2: number, lng2: number): number;
export declare function applyGeofence(location: {
    lat: number;
    lng: number;
} | null | undefined, allLocations: ProjectLocation[]): {
    location_id: string | null;
    on_site: boolean | null;
};
