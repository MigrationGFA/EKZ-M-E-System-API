import { Repository } from 'typeorm';
import type { Request } from 'express';
import { ApiToken } from './api-token.entity.js';
import { UserRole } from '../common/enums/user-role.enum.js';
declare const ApiTokenStrategy_base: new (...args: [] | [options: import("passport-custom").StrategyOptions]) => import("passport-custom") & {
    validate(...args: any[]): unknown;
};
export declare class ApiTokenStrategy extends ApiTokenStrategy_base {
    private readonly tokenRepo;
    constructor(tokenRepo: Repository<ApiToken>);
    validate(req: Request): Promise<{
        id: string;
        email: string;
        role: UserRole;
    }>;
}
export {};
