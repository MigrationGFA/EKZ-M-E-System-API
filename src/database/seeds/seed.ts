import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import type { Seeder } from './helpers.js';
import { seedUsers } from './users.js';
import { seedProjectMeta } from './project-meta.js';
import { seedLogframe } from './logframe.js';
import { seedIndicators } from './indicators.js';
import { seedDisaggregation } from './disaggregation.js';
import { seedLocations } from './locations.js';
import { seedCovenants } from './covenants.js';
import { seedSafeguards } from './safeguards.js';

dotenv.config();

const dataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [],
  synchronize: false,
});

/**
 * Phase 10 — Seed real data.
 *
 * The director runs each domain seeder in order. Every seeder is idempotent
 * (skip-if-exists) so re-running on an already-seeded DB is a no-op. The
 * order matters: project_meta is the singleton anchor, the logframe tree
 * must exist before indicators reference its nodes, indicators must exist
 * before year-targets / disaggregation reference them.
 *
 * See ekz-server/docs/afdb-alignment/IMPLEMENTATION_PLAN.md §Phase 10.
 */
const SEEDERS: { name: string; run: Seeder }[] = [
  { name: 'users', run: seedUsers },
  { name: 'project-meta', run: seedProjectMeta },
  { name: 'logframe', run: seedLogframe },
  { name: 'indicators', run: seedIndicators },
  { name: 'disaggregation', run: seedDisaggregation },
  { name: 'locations', run: seedLocations },
  { name: 'covenants', run: seedCovenants },
  { name: 'safeguards', run: seedSafeguards },
];

async function seed() {
  await dataSource.initialize();
  console.log('Connected to database');

  for (const { name, run } of SEEDERS) {
    console.log(`▶ ${name}`);
    await run(dataSource);
  }

  await dataSource.destroy();
  console.log('Seed complete');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
