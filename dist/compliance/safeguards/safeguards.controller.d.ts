import { SafeguardsService } from './safeguards.service.js';
import { UpsertSafeguardDto } from './dto/upsert-safeguard.dto.js';
import { UserRole } from '../../common/enums/user-role.enum.js';
type JwtReq = {
    user: {
        id: string;
        email: string;
        role: UserRole;
    };
};
export declare class SafeguardsController {
    private readonly service;
    constructor(service: SafeguardsService);
    findAll(): Promise<import("./safeguard-measure.entity.js").SafeguardMeasure[]>;
    create(dto: UpsertSafeguardDto, req: JwtReq): Promise<import("./safeguard-measure.entity.js").SafeguardMeasure>;
    update(id: string, dto: UpsertSafeguardDto, req: JwtReq): Promise<import("./safeguard-measure.entity.js").SafeguardMeasure>;
    remove(id: string, req: JwtReq): Promise<void>;
}
export {};
