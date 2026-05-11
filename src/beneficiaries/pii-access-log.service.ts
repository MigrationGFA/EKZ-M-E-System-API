import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Request } from 'express';
import { PiiAccessLog, PiiAccessAction } from './pii-access-log.entity.js';

export interface PiiAuditActor {
  id: string;
  email: string;
}

export interface PiiAuditInput {
  actor: PiiAuditActor;
  beneficiary_id: string | null;
  action: PiiAccessAction;
  reason?: string | null;
  request?: Pick<Request, 'ip' | 'headers'> | null;
}

@Injectable()
export class PiiAccessLogService {
  private readonly logger = new Logger(PiiAccessLogService.name);

  constructor(
    @InjectRepository(PiiAccessLog)
    private readonly repo: Repository<PiiAccessLog>,
  ) {}

  /**
   * Writes one row. ADR 0006 §83-102 mandates immutability — only INSERT;
   * never UPDATE or DELETE in production. We don't enforce that in DDL
   * (Phase 5 leaves it to PG role grants) so the rule is service-layer
   * only: nothing else in this service mutates rows.
   *
   * Errors here are logged but never raised — the caller's primary
   * operation (e.g. read a beneficiary) must not fail because the audit
   * write hiccuped.
   */
  async record(input: PiiAuditInput): Promise<void> {
    try {
      const requestId = input.request?.headers?.['x-request-id'];
      const userAgent = input.request?.headers?.['user-agent'];
      const entry = this.repo.create({
        user_id: input.actor.id,
        user_email: input.actor.email,
        beneficiary_id: input.beneficiary_id,
        action: input.action,
        reason: input.reason ?? null,
        request_id: typeof requestId === 'string' ? requestId : null,
        ip_address: input.request?.ip ?? null,
        user_agent: typeof userAgent === 'string' ? userAgent : null,
      });
      await this.repo.save(entry);
    } catch (err) {
      this.logger.error(
        `Failed to write pii_access_log for ${input.action} on ${input.beneficiary_id ?? '<none>'}: ${(err as Error).message}`,
      );
    }
  }
}
