import { AwpStatusService } from './awp-status.service.js';
import { UpsertAwpStatusDto } from './dto/upsert-awp-status.dto.js';
import { UserRole } from '../common/enums/user-role.enum.js';
type JwtReq = {
    user: {
        id: string;
        email: string;
        role: UserRole;
    };
};
export declare class AwpStatusController {
    private readonly service;
    constructor(service: AwpStatusService);
    findByPeriod(year: number, quarter: number): Promise<import("./activity-quarterly-status.entity.js").ActivityQuarterlyStatus[]>;
    upsert(nodeId: string, year: number, quarter: number, dto: UpsertAwpStatusDto, req: JwtReq): Promise<import("./activity-quarterly-status.entity.js").ActivityQuarterlyStatus>;
}
export {};
