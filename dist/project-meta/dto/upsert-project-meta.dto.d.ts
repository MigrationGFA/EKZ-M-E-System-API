export declare class UpsertProjectMetaDto {
    name: string;
    sap_code?: string;
    pdo_text: string;
    baseline_year: number;
    completion_year: number;
    midpoint_date?: string;
    pdo_node_id?: string | null;
    sector?: string;
    country?: string;
    executing_agency?: string;
    responsible_project_staff?: string;
    original_disbursement_deadline?: string;
    revised_disbursement_deadline?: string;
}
