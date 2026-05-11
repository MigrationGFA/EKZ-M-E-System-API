import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Report } from './report.entity.js';
import { Indicator } from '../indicators/indicator.entity.js';
import { IndicatorProgress } from '../indicators/indicator-progress.entity.js';
import { IndicatorYearTarget } from '../indicators/indicator-year-target.entity.js';
import { Submission } from '../submissions/submission.entity.js';
import { LogframeNode } from '../logframe/logframe-node.entity.js';
import { EvidenceDocument } from '../evidence/evidence-document.entity.js';
import { ReportsService } from './reports.service.js';
import { ReportsController } from './reports.controller.js';
import { UsersModule } from '../users/users.module.js';
import { AuditModule } from '../audit/audit.module.js';
import { ProjectMetaModule } from '../project-meta/project-meta.module.js';
import { IndicatorsModule } from '../indicators/indicators.module.js';
import { StorageModule } from '../storage/storage.module.js';

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
    ]),
    UsersModule,
    AuditModule,
    ProjectMetaModule,
    IndicatorsModule,
    StorageModule,
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
