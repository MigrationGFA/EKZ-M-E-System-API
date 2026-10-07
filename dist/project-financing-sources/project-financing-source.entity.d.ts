import { ProjectMeta } from '../project-meta/project-meta.entity.js';
export declare class ProjectFinancingSource {
    id: string;
    project_meta_id: string;
    project_meta: ProjectMeta;
    source_name: string;
    instrument: string;
    total_approved_ua: number;
    disbursed_ua: number;
    order: number;
    created_at: Date;
    updated_at: Date;
}
