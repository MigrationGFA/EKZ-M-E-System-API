import { DataSource } from 'typeorm';
import { logStats, makeStats, query, type Seeder } from './helpers.js';

/**
 * Phase 10 — project_locations seed.
 *
 * Coordinates are reasonable approximations for the Ekiti area; radius_m
 * is a sensible geofence default per site type. The admin UI surveys real
 * GPS on first field visit and updates the rows.
 *
 * Each location is owned by the admin user (admin@ekz.com) so the FK is
 * satisfied even on a fresh DB; admins may transfer ownership later.
 */

interface LocationSpec {
  name: string;
  sector: string;
  description: string;
  lat: number;
  lng: number;
  radius_m: number;
}

const LOCATIONS: LocationSpec[] = [
  {
    name: 'Ado-Ekiti — EKZ main site',
    sector: 'Project HQ',
    description:
      'Primary Ekiti Knowledge Zone construction site (Smart Green City innovation park).',
    lat: 7.6208,
    lng: 5.2236,
    radius_m: 2000,
  },
  {
    name: 'Ago Araromi community',
    sector: 'Affected community',
    description:
      'Community whose livelihoods were impacted by EKZ land demarcation. Resettlement / livelihood-restoration site.',
    lat: 7.6118,
    lng: 5.2151,
    radius_m: 1000,
  },
  {
    name: 'Ijan-Ekiti community',
    sector: 'Affected community',
    description:
      'Community whose livelihoods were impacted by EKZ land demarcation. Resettlement / livelihood-restoration site.',
    lat: 7.7388,
    lng: 5.1853,
    radius_m: 1000,
  },
  {
    name: 'Ekiti State University (EKSU) — innovation hub',
    sector: 'University hub',
    description:
      'Innovation centre of excellence and laboratory hosted at EKSU under the EKZ alliance.',
    lat: 7.6534,
    lng: 5.2716,
    radius_m: 1500,
  },
  {
    name: 'Federal University Oye-Ekiti (FUOYE) — innovation hub',
    sector: 'University hub',
    description:
      'Innovation centre of excellence and laboratory hosted at FUOYE under the EKZ alliance.',
    lat: 7.8156,
    lng: 5.3214,
    radius_m: 1500,
  },
];

export const seedLocations: Seeder = async (ds: DataSource) => {
  const stats = makeStats();
  const admin = await query<{ id: string }>(
    ds,
    `SELECT id FROM users WHERE email = $1 LIMIT 1`,
    ['admin@ekz.com'],
  );
  if (admin.length === 0) {
    throw new Error(
      'Phase 10 locations: admin@ekz.com user missing — slice 1 should seed it first.',
    );
  }
  const adminId = admin[0].id;

  for (const loc of LOCATIONS) {
    const existing = await query<{ id: string }>(
      ds,
      `SELECT id FROM project_locations WHERE name = $1`,
      [loc.name],
    );
    if (existing.length > 0) {
      stats.skipped += 1;
      continue;
    }
    await ds.query(
      `INSERT INTO project_locations
         (name, sector, description, lat, lng, radius_m, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        loc.name,
        loc.sector,
        loc.description,
        loc.lat,
        loc.lng,
        loc.radius_m,
        adminId,
      ],
    );
    stats.inserted += 1;
  }
  logStats('project_locations', stats);
};
