import { DataSource } from 'typeorm';

export type Seeder = (ds: DataSource) => Promise<void>;

export interface SeedStats {
  inserted: number;
  skipped: number;
}

export function makeStats(): SeedStats {
  return { inserted: 0, skipped: 0 };
}

export function logStats(domain: string, stats: SeedStats): void {
  console.log(
    `  [${domain}] inserted=${stats.inserted} skipped=${stats.skipped}`,
  );
}

export async function query<T = Record<string, unknown>>(
  ds: DataSource,
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  return await ds.query(sql, params);
}

export async function rowExists(
  ds: DataSource,
  sql: string,
  params: unknown[],
): Promise<boolean> {
  const rows = await query<{ id: string }>(ds, sql, params);
  return rows.length > 0;
}

/**
 * Run an UPDATE / INSERT / DELETE and return how many rows were affected.
 *
 * TypeORM's DataSource.query returns `[rows, rowCount]` for write queries
 * (length is always 2), so reading `result.length` to detect a no-op is a
 * trap. This helper handles both shapes — the tuple form from raw write
 * statements, and the bare row array form some drivers return — and
 * surfaces a single integer.
 */
export async function execAffected(
  ds: DataSource,
  sql: string,
  params: unknown[] = [],
): Promise<number> {
  const raw: unknown = await ds.query(sql, params);
  if (Array.isArray(raw) && raw.length === 2 && typeof raw[1] === 'number') {
    return raw[1];
  }
  if (Array.isArray(raw)) {
    return raw.length;
  }
  return 0;
}

/**
 * Resolve a logframe_node id by code (and optional type). Fails fast with a
 * useful message — seed slices reference logframe codes by name, so a
 * missing parent must be surfaced loudly rather than producing a NULL FK.
 */
export async function resolveNodeId(
  ds: DataSource,
  code: string,
  type?: string,
): Promise<string> {
  const params: unknown[] = [code];
  let sql = `SELECT id FROM logframe_nodes WHERE code = $1`;
  if (type) {
    sql += ` AND type = $2`;
    params.push(type);
  }
  const rows = await query<{ id: string }>(ds, sql, params);
  if (rows.length === 0) {
    const where = type ? `code=${code} type=${type}` : `code=${code}`;
    throw new Error(
      `Phase 10 seed: logframe node not found (${where}). ` +
        `A prior slice must seed this node before downstream rows can reference it.`,
    );
  }
  return rows[0].id;
}

/**
 * Resolve an indicator id by (code, kind). Same fail-fast contract as
 * resolveNodeId — indicators carry UNIQUE(code, kind) per Phase 2.
 */
export async function resolveIndicatorId(
  ds: DataSource,
  code: string,
  kind: string,
): Promise<string> {
  const rows = await query<{ id: string }>(
    ds,
    `SELECT id FROM indicators WHERE code = $1 AND kind = $2`,
    [code, kind],
  );
  if (rows.length === 0) {
    throw new Error(
      `Phase 10 seed: indicator not found (code=${code} kind=${kind}).`,
    );
  }
  return rows[0].id;
}
