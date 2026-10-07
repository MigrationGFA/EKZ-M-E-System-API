import { LogframeService } from './logframe.service.js';
import { CreateNodeDto } from './dto/create-node.dto.js';
import { UpdateNodeDto } from './dto/update-node.dto.js';
import { LinkIndicatorDto } from './dto/link-indicator.dto.js';
export declare class LogframeController {
    private readonly logframeService;
    constructor(logframeService: LogframeService);
    getTree(): Promise<import("./logframe.service.js").LogframeTreeNode[]>;
    createNode(dto: CreateNodeDto, req: any): Promise<{
        indicators: never[];
        children: never[];
        id: string;
        logframe_id: string;
        type: string;
        code: string;
        title: string;
        description: string | null;
        parent_id: string | null;
        parent: import("./logframe-node.entity.js").LogframeNode | null;
        order: number;
        budget_usd: number | null;
        budget_currency: string;
        created_at: Date;
        updated_at: Date;
    }>;
    updateNode(id: string, dto: UpdateNodeDto, req: any): Promise<{
        indicators: import("./logframe.service.js").SerializedIndicator[];
        children: never[];
        id: string;
        logframe_id: string;
        type: string;
        code: string;
        title: string;
        description: string | null;
        parent_id: string | null;
        parent: import("./logframe-node.entity.js").LogframeNode | null;
        order: number;
        budget_usd: number | null;
        budget_currency: string;
        created_at: Date;
        updated_at: Date;
    }>;
    deleteNode(id: string, req: any): Promise<void>;
    linkIndicator(id: string, dto: LinkIndicatorDto, req: any): Promise<{
        success: boolean;
    }>;
    unlinkIndicator(nodeId: string, indicatorId: string, req: any): Promise<void>;
}
