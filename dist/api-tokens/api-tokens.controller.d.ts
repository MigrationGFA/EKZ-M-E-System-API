import { ApiTokensService } from './api-tokens.service.js';
import { CreateTokenDto } from './dto/create-token.dto.js';
export declare class ApiTokensController {
    private readonly apiTokensService;
    constructor(apiTokensService: ApiTokensService);
    findAll(): Promise<{
        id: string;
        name: string;
        tokenPart: string;
        createdAt: Date;
    }[]>;
    create(dto: CreateTokenDto, req: any): Promise<{
        id: string;
        name: string;
        tokenPart: string;
        createdAt: Date;
        rawToken: string;
    }>;
    remove(id: string, req: any): Promise<{
        success: boolean;
    }>;
}
