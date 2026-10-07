import { SubmissionsService } from './submissions.service.js';
import { CreateSubmissionDto } from './dto/create-submission.dto.js';
import { ValidateSubmissionDto } from './dto/validate-submission.dto.js';
export declare class SubmissionsController {
    private readonly submissionsService;
    constructor(submissionsService: SubmissionsService);
    findAll(form_id?: string, officer_id?: string, validation_status?: string, page?: string, per_page?: string): Promise<{
        data: {
            id: string;
            formId: string;
            officerId: string;
            data: Record<string, any>;
            location: {
                lat: number;
                lng: number;
            } | null;
            location_id: string | null;
            on_site: boolean | null;
            submittedAt: Date;
            validation_status: string;
            validation_comment: string | null;
        }[];
        total: number;
        page: number;
        per_page: number;
    }>;
    findOne(id: string): Promise<{
        id: string;
        formId: string;
        officerId: string;
        data: Record<string, any>;
        location: {
            lat: number;
            lng: number;
        } | null;
        location_id: string | null;
        on_site: boolean | null;
        submittedAt: Date;
        validation_status: string;
        validation_comment: string | null;
    }>;
    createBatch(dtos: CreateSubmissionDto[], req: any): Promise<{
        accepted: string[];
        rejected: {
            id: string;
            reason: string;
        }[];
    }>;
    create(dto: CreateSubmissionDto, req: any): Promise<{
        id: string;
        status: string;
    }>;
    validate(id: string, dto: ValidateSubmissionDto, req: any): Promise<{
        id: string;
        formId: string;
        officerId: string;
        data: Record<string, any>;
        location: {
            lat: number;
            lng: number;
        } | null;
        location_id: string | null;
        on_site: boolean | null;
        submittedAt: Date;
        validation_status: string;
        validation_comment: string | null;
    }>;
}
