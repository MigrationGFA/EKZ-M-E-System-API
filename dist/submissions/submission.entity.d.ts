import { Form } from '../forms/form.entity.js';
import { User } from '../users/user.entity.js';
import { ProjectLocation } from '../locations/project-location.entity.js';
import { Beneficiary } from '../beneficiaries/beneficiary.entity.js';
export declare class Submission {
    id: string;
    form_id: string;
    form: Form;
    officer_id: string;
    officer: User;
    data: Record<string, any>;
    location: {
        lat: number;
        lng: number;
    } | null;
    location_id: string | null;
    project_location: ProjectLocation | null;
    on_site: boolean | null;
    beneficiary_id: string | null;
    beneficiary: Beneficiary | null;
    submitted_at: Date;
    validation_status: string;
    validation_comment: string | null;
    synced_at: Date;
}
