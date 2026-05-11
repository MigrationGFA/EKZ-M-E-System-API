import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Indicator } from '../indicators/indicator.entity.js';
import { IndicatorProgress } from '../indicators/indicator-progress.entity.js';
import { IndicatorYearTarget } from '../indicators/indicator-year-target.entity.js';
import { Submission } from '../submissions/submission.entity.js';
import { Alert } from '../alerts/alert.entity.js';
import { LogframeNode } from '../logframe/logframe-node.entity.js';
import { DashboardService } from './dashboard.service.js';
import { DashboardController } from './dashboard.controller.js';
import { ProjectMetaModule } from '../project-meta/project-meta.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Indicator,
      IndicatorProgress,
      IndicatorYearTarget,
      Submission,
      Alert,
      LogframeNode,
    ]),
    ProjectMetaModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
