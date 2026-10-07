import { DataSource } from 'typeorm';
export type Seeder = (ds: DataSource) => Promise<void>;
export interface SeedStats {
    inserted: number;
    skipped: number;
}
export declare function makeStats(): SeedStats;
export declare function logStats(domain: string, stats: SeedStats): void;
export declare function query<T = Record<string, unknown>>(ds: DataSource, sql: string, params?: unknown[]): Promise<T[]>;
export declare function rowExists(ds: DataSource, sql: string, params: unknown[]): Promise<boolean>;
export declare function execAffected(ds: DataSource, sql: string, params?: unknown[]): Promise<number>;
export declare function resolveNodeId(ds: DataSource, code: string, type?: string): Promise<string>;
export declare function resolveIndicatorId(ds: DataSource, code: string, kind: string): Promise<string>;
