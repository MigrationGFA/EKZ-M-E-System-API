import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectCovenant } from './covenants/project-covenant.entity.js';
import { SafeguardMeasure } from './safeguards/safeguard-measure.entity.js';
import { AuditFinding } from './audit-findings/audit-finding.entity.js';
import { CovenantsService } from './covenants/covenants.service.js';
import { SafeguardsService } from './safeguards/safeguards.service.js';
import { AuditFindingsService } from './audit-findings/audit-findings.service.js';
import { CovenantsController } from './covenants/covenants.controller.js';
import { SafeguardsController } from './safeguards/safeguards.controller.js';
import { AuditFindingsController } from './audit-findings/audit-findings.controller.js';
import { AuditModule } from '../audit/audit.module.js';

/**
 * Phase 9.5 — QPR section C.1 compliance umbrella. Bundles covenants
 * (C.1.1), safeguards (C.1.2), and audit findings (C.1.3) under one
 * module so AppModule imports stay cohesive. Each sub-domain has its
 * own controller for clean URL paths.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([ProjectCovenant, SafeguardMeasure, AuditFinding]),
    AuditModule,
  ],
  controllers: [
    CovenantsController,
    SafeguardsController,
    AuditFindingsController,
  ],
  providers: [CovenantsService, SafeguardsService, AuditFindingsService],
  exports: [
    CovenantsService,
    SafeguardsService,
    AuditFindingsService,
    TypeOrmModule,
  ],
})
export class ComplianceModule {}
