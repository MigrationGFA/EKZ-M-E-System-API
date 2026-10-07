import { ProjectMetaService } from './project-meta.service.js';
import { UpsertProjectMetaDto } from './dto/upsert-project-meta.dto.js';
export declare class ProjectMetaController {
    private readonly metaService;
    constructor(metaService: ProjectMetaService);
    get(): Promise<import("./project-meta.entity.js").ProjectMeta>;
    upsert(dto: UpsertProjectMetaDto, req: {
        user: {
            id: string;
            email: string;
        };
    }): Promise<import("./project-meta.entity.js").ProjectMeta>;
}
