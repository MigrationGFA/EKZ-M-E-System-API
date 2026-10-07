export declare class ProjectMeta {
    id: string;
    name: string;
    sap_code: string | null;
    pdo_text: string;
    baseline_year: number;
    completion_year: number;
    midpoint_date: Date | null;
    pdo_node_id: string | null;
    sector: string | null;
    country: string;
    executing_agency: string | null;
    responsible_project_staff: string | null;
    original_disbursement_deadline: Date | null;
    revised_disbursement_deadline: Date | null;
    created_at: Date;
    updated_at: Date;
}
