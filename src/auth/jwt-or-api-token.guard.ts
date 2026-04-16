import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtOrApiTokenGuard extends AuthGuard(['jwt', 'api-token']) {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }
}
