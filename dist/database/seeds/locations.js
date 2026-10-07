"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedLocations = void 0;
const helpers_js_1 = require("./helpers.js");
const LOCATIONS = [
    {
        name: 'Ado-Ekiti — EKZ main site',
        sector: 'Project HQ',
        description: 'Primary Ekiti Knowledge Zone construction site (Smart Green City innovation park).',
        lat: 7.6208,
        lng: 5.2236,
        radius_m: 2000,
    },
    {
        name: 'Ago Araromi community',
        sector: 'Affected community',
        description: 'Community whose livelihoods were impacted by EKZ land demarcation. Resettlement / livelihood-restoration site.',
        lat: 7.6118,
        lng: 5.2151,
        radius_m: 1000,
    },
    {
        name: 'Ijan-Ekiti community',
        sector: 'Affected community',
        description: 'Community whose livelihoods were impacted by EKZ land demarcation. Resettlement / livelihood-restoration site.',
        lat: 7.7388,
        lng: 5.1853,
        radius_m: 1000,
    },
    {
        name: 'Ekiti State University (EKSU) — innovation hub',
        sector: 'University hub',
        description: 'Innovation centre of excellence and laboratory hosted at EKSU under the EKZ alliance.',
        lat: 7.6534,
        lng: 5.2716,
        radius_m: 1500,
    },
    {
        name: 'Federal University Oye-Ekiti (FUOYE) — innovation hub',
        sector: 'University hub',
        description: 'Innovation centre of excellence and laboratory hosted at FUOYE under the EKZ alliance.',
        lat: 7.8156,
        lng: 5.3214,
        radius_m: 1500,
    },
];
const seedLocations = async (ds) => {
    const stats = (0, helpers_js_1.makeStats)();
    const admin = await (0, helpers_js_1.query)(ds, `SELECT id FROM users WHERE email = $1 LIMIT 1`, ['admin@ekz.com']);
    if (admin.length === 0) {
        throw new Error('Phase 10 locations: admin@ekz.com user missing — slice 1 should seed it first.');
    }
    const adminId = admin[0].id;
    for (const loc of LOCATIONS) {
        const existing = await (0, helpers_js_1.query)(ds, `SELECT id FROM project_locations WHERE name = $1`, [loc.name]);
        if (existing.length > 0) {
            stats.skipped += 1;
            continue;
        }
        await ds.query(`INSERT INTO project_locations
         (name, sector, description, lat, lng, radius_m, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`, [
            loc.name,
            loc.sector,
            loc.description,
            loc.lat,
            loc.lng,
            loc.radius_m,
            adminId,
        ]);
        stats.inserted += 1;
    }
    (0, helpers_js_1.logStats)('project_locations', stats);
};
exports.seedLocations = seedLocations;
//# sourceMappingURL=locations.js.map