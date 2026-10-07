import { ExecutionContext } from '@nestjs/common';
declare const JwtOrApiTokenGuard_base: import("@nestjs/passport").Type<import("@nestjs/passport").IAuthGuard>;
export declare class JwtOrApiTokenGuard extends JwtOrApiTokenGuard_base {
    canActivate(context: ExecutionContext): boolean | Promise<boolean> | import("rxjs").Observable<boolean>;
}
export {};
