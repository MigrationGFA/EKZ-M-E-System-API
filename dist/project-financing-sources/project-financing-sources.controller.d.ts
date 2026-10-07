import { ProjectFinancingSourcesService } from './project-financing-sources.service.js';
import { UpsertFinancingSourceDto } from './dto/upsert-financing-source.dto.js';
import { UserRole } from '../common/enums/user-role.enum.js';
type JwtReq = {
    user: {
        id: string;
        email: string;
        role: UserRole;
    };
};
export declare class ProjectFinancingSourcesController {
    private readonly service;
    constructor(service: ProjectFinancingSourcesService);
    findAll(): Promise<import("./project-financing-source.entity.js").ProjectFinancingSource[]>;
    create(dto: UpsertFinancingSourceDto, req: JwtReq): Promise<import("./project-financing-source.entity.js").ProjectFinancingSource>;
    update(id: string, dto: UpsertFinancingSourceDto, req: JwtReq): Promise<import("./project-financing-source.entity.js").ProjectFinancingSource>;
    remove(id: string, req: JwtReq): Promise<void>;
}
export {};
