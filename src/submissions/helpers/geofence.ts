import { ProjectLocation } from '../../locations/project-location.entity.js';

export function haversineMetres(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function applyGeofence(
  location: { lat: number; lng: number } | null | undefined,
  allLocations: ProjectLocation[],
): { location_id: string | null; on_site: boolean | null } {
  if (!location) {
    return { location_id: null, on_site: null };
  }

  for (const loc of allLocations) {
    const dist = haversineMetres(location.lat, location.lng, loc.lat, loc.lng);
    if (dist <= loc.radius_m) {
      return { location_id: loc.id, on_site: true };
    }
  }

  return { location_id: null, on_site: false };
}
