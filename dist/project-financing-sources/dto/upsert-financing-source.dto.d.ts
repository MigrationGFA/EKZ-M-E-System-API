export declare const FINANCING_INSTRUMENTS: readonly ["loan", "grant", "cofinancing", "counterpart"];
export declare class UpsertFinancingSourceDto {
    source_name: string;
    instrument: string;
    total_approved_ua: number;
    disbursed_ua?: number;
    order?: number;
}
