import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Indicator } from './indicator.entity.js';
import { IndicatorProgress } from './indicator-progress.entity.js';
import { IndicatorYearTarget } from './indicator-year-target.entity.js';
import { Form } from '../forms/form.entity.js';
import { IndicatorsService } from './indicators.service.js';
import { IndicatorsController } from './indicators.controller.js';
import { UsersModule } from '../users/users.module.js';
import { AuditModule } from '../audit/audit.module.js';
import { AlertsModule } from '../alerts/alerts.module.js';
import { ProjectMetaModule } from '../project-meta/project-meta.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Indicator,
      IndicatorProgress,
      IndicatorYearTarget,
      Form,
    ]),
    UsersModule,
    AuditModule,
    AlertsModule,
    ProjectMetaModule,
  ],
  controllers: [IndicatorsController],
  providers: [IndicatorsService],
  exports: [IndicatorsService, TypeOrmModule],
})
export class IndicatorsModule {}
