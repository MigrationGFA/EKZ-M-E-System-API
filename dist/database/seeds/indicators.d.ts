import { type Seeder } from './helpers.js';
type IndicatorKind = 'alignment' | 'outcome' | 'output';
type TargetMode = 'cumulative' | 'incremental' | 'binary';
type Frequency = 'monthly' | 'quarterly' | 'bi_annually' | 'annually' | 'mid_term' | 'one_off';
type DataSourceType = 'form_submission' | 'tracer_study' | 'contractor_report' | 'financial_statement' | 'policy_document' | 'external_feed' | 'manual';
interface IndicatorSpec {
    code: string;
    name: string;
    description: string;
    kind: IndicatorKind;
    level: 'alignment' | 'outcome' | 'output';
    parentNodeCode: string;
    parentNodeType: string;
    unit: string;
    baseline: number;
    target: number;
    target_mode: TargetMode;
    frequency: Frequency;
    data_source_type: DataSourceType;
    rmf_adoa: boolean;
    methodology: string;
    responsible_party: string;
    means_of_verification: string;
    reporting_year_start: number;
    reporting_year_end: number;
    year_targets: {
        year: number;
        target_value: number;
    }[];
}
export declare const ALL_INDICATORS: IndicatorSpec[];
export type { IndicatorSpec };
export declare const seedIndicators: Seeder;
