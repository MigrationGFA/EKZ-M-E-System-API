import { type Seeder } from './helpers.js';
interface NodeSpec {
    code: string;
    type: 'pdo' | 'alignment' | 'outcome_statement' | 'component' | 'output_statement' | 'activity';
    title: string;
    description: string | null;
    parentCode: string | null;
    parentType: string | null;
    order: number;
    budget_usd: number | null;
}
export declare const NODES: NodeSpec[];
export type { NodeSpec };
export declare const seedLogframe: Seeder;
