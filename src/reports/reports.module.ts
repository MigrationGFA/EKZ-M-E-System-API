import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Report } from './report.entity.js';
import { Indicator } from '../indicators/indicator.entity.js';
import { IndicatorProgress } from '../indicators/indicator-progress.entity.js';
import { IndicatorYearTarget } from '../indicators/indicator-year-target.entity.js';
import { Submission } from '../submissions/submission.entity.js';
import { LogframeNode } from '../logframe/logframe-node.entity.js';
import { EvidenceDocument } from '../evidence/evidence-document.entity.js';
import { ProjectFinancingSource } from '../project-financing-sources/project-financing-source.entity.js';
import { ProjectRisk } from '../project-risks/project-risk.entity.js';
import { ProjectCovenant } from '../compliance/covenants/project-covenant.entity.js';
import { SafeguardMeasure } from '../compliance/safeguards/safeguard-measure.entity.js';
import { AuditFinding } from '../compliance/audit-findings/audit-finding.entity.js';
import { ActivityQuarterlyStatus } from '../awp-status/activity-quarterly-status.entity.js';
import { ReportsService } from './reports.service.js';
import { ReportsController } from './reports.controller.js';
import { UsersModule } from '../users/users.module.js';
import { AuditModule } from '../audit/audit.module.js';
import { ProjectMetaModule } from '../project-meta/project-meta.module.js';
import { IndicatorsModule } from '../indicators/indicators.module.js';
import { StorageModule } from '../storage/storage.module.js';
import { QuarterlyReportsModule } from '../quarterly-reports/quarterly-reports.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Report,
      Indicator,
      IndicatorProgress,
      IndicatorYearTarget,
      Submission,
      LogframeNode,
      EvidenceDocument,
      // Phase 9.5 — QPR entities loaded directly by ReportsService.getQprData().
      ProjectFinancingSource,
      ProjectRisk,
      ProjectCovenant,
      SafeguardMeasure,
      AuditFinding,
      ActivityQuarterlyStatus,
    ]),
    UsersModule,
    AuditModule,
    ProjectMetaModule,
    IndicatorsModule,
    StorageModule,
    QuarterlyReportsModule,
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
