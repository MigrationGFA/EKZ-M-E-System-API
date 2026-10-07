import { CovenantsService } from './covenants.service.js';
import { UpsertCovenantDto } from './dto/upsert-covenant.dto.js';
import { UserRole } from '../../common/enums/user-role.enum.js';
type JwtReq = {
    user: {
        id: string;
        email: string;
        role: UserRole;
    };
};
export declare class CovenantsController {
    private readonly service;
    constructor(service: CovenantsService);
    findAll(): Promise<import("./project-covenant.entity.js").ProjectCovenant[]>;
    create(dto: UpsertCovenantDto, req: JwtReq): Promise<import("./project-covenant.entity.js").ProjectCovenant>;
    update(id: string, dto: UpsertCovenantDto, req: JwtReq): Promise<import("./project-covenant.entity.js").ProjectCovenant>;
    remove(id: string, req: JwtReq): Promise<void>;
}
export {};
