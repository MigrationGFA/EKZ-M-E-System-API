"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.haversineMetres = haversineMetres;
exports.applyGeofence = applyGeofence;
function haversineMetres(lat1, lng1, lat2, lng2) {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
function applyGeofence(location, allLocations) {
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
//# sourceMappingURL=geofence.js.map