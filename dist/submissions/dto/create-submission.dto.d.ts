export declare class CreateSubmissionDto {
    id: string;
    formId: string;
    officerId: string;
    data: Record<string, any>;
    location?: {
        lat: number;
        lng: number;
    } | null;
    submittedAt: string;
    beneficiaryId?: string;
}
