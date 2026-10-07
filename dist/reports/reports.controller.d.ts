import { ReportsService } from './reports.service.js';
import { GenerateReportDto } from './dto/generate-report.dto.js';
import { ReportPreviewQueryDto } from './dto/report-preview-query.dto.js';
import { UsersService } from '../users/users.service.js';
type JwtReq = {
    user: {
        id: string;
        email: string;
        role: string;
    };
};
export declare class ReportsController {
    private readonly reportsService;
    private readonly usersService;
    constructor(reportsService: ReportsService, usersService: UsersService);
    findAll(): Promise<{
        id: string;
        title: string;
        generatedBy: string;
        generatedAt: Date;
        format: string;
        filters: Record<string, any>;
        downloadUrl: string;
    }[]>;
    preview(query: ReportPreviewQueryDto, req: JwtReq): Promise<import("./reports.service.js").ReportPreviewData>;
    generate(dto: GenerateReportDto, req: JwtReq): Promise<{
        report_id: string;
        download_url: string;
        format: string;
    }>;
}
export {};
