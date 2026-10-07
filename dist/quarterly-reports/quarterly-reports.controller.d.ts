import { QuarterlyReportsService } from './quarterly-reports.service.js';
import { UpsertQuarterlyReportDto } from './dto/upsert-quarterly-report.dto.js';
import { UserRole } from '../common/enums/user-role.enum.js';
type JwtReq = {
    user: {
        id: string;
        email: string;
        role: UserRole;
    };
};
export declare class QuarterlyReportsController {
    private readonly service;
    constructor(service: QuarterlyReportsService);
    findOrCreate(year: number, quarter: number, req: JwtReq): Promise<import("./quarterly-progress-report.entity.js").QuarterlyProgressReport>;
    upsert(year: number, quarter: number, dto: UpsertQuarterlyReportDto, req: JwtReq): Promise<import("./quarterly-progress-report.entity.js").QuarterlyProgressReport>;
}
export {};
