export type TargetMode = 'cumulative' | 'incremental' | 'binary';
export interface YearTargetInput {
    year: number;
    target_value: number | string;
}
export interface ExpectedAtIndicator {
    target_mode: string;
    target: number | string;
    baseline: number | string;
}
export interface ExpectedAtOptions {
    baselineDate?: Date;
}
export declare function expectedAt(indicator: ExpectedAtIndicator, yearTargets: YearTargetInput[], asOf: Date, options?: ExpectedAtOptions): number;
