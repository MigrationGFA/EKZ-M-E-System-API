import { ProjectRisksService } from './project-risks.service.js';
import { UpsertRiskDto } from './dto/upsert-risk.dto.js';
import { UserRole } from '../common/enums/user-role.enum.js';
type JwtReq = {
    user: {
        id: string;
        email: string;
        role: UserRole;
    };
};
export declare class ProjectRisksController {
    private readonly service;
    constructor(service: ProjectRisksService);
    findAll(include_resolved?: string): Promise<import("./project-risk.entity.js").ProjectRisk[]>;
    create(dto: UpsertRiskDto, req: JwtReq): Promise<import("./project-risk.entity.js").ProjectRisk>;
    update(id: string, dto: UpsertRiskDto, req: JwtReq): Promise<import("./project-risk.entity.js").ProjectRisk>;
    resolve(id: string, req: JwtReq): Promise<import("./project-risk.entity.js").ProjectRisk>;
}
export {};
