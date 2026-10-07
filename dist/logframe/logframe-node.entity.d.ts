export declare class LogframeNode {
    id: string;
    logframe_id: string;
    type: string;
    code: string;
    title: string;
    description: string | null;
    parent_id: string | null;
    parent: LogframeNode | null;
    children: LogframeNode[];
    order: number;
    budget_usd: number | null;
    budget_currency: string;
    created_at: Date;
    updated_at: Date;
}
