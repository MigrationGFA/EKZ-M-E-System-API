export declare const NODE_TYPES: readonly ["pdo", "alignment", "component", "outcome_statement", "output_statement", "goal", "outcome", "output", "activity"];
export declare class CreateNodeDto {
    type: string;
    code: string;
    title: string;
    description?: string;
    parent_id?: string | null;
    order?: number;
    budget_usd?: number;
    budget_currency?: string;
}
