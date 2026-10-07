import { LogframeNode } from '../logframe/logframe-node.entity.js';
export declare class Indicator {
    id: string;
    code: string;
    name: string;
    description: string;
    level: string;
    kind: string;
    unit: string;
    baseline: number;
    target: number;
    current_value: number;
    status: string;
    frequency: string;
    methodology: string | null;
    rmf_adoa: boolean;
    target_mode: string;
    data_source_type: string;
    reporting_year_start: number | null;
    reporting_year_end: number | null;
    logframe_level_id: string | null;
    logframe_node: LogframeNode | null;
    sdg_ids: number[];
    responsible_party: string;
    means_of_verification: string;
    created_at: Date;
    updated_at: Date;
}
