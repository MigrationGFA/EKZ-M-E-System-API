import { LogframeNode } from '../logframe/logframe-node.entity.js';
export declare class ActivityQuarterlyStatus {
    id: string;
    logframe_node_id: string;
    logframe_node: LogframeNode;
    year: number;
    quarter: number;
    status: string;
    pct_achievement: number;
    comments: string;
    planned_for_next_qtr: boolean;
    deadline: Date | null;
    created_at: Date;
    updated_at: Date;
}
