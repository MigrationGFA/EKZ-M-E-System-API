import { ProgressBreakdownDto } from './disaggregation.dto.js';
export declare class CreateProgressDto {
    value: number;
    date: string;
    notes?: string;
    submittedBy: string;
    breakdowns?: ProgressBreakdownDto[];
}
