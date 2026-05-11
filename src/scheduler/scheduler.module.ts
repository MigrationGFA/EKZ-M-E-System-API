import { Module } from '@nestjs/common';
import { SchedulerService } from './scheduler.service.js';
import { IndicatorsModule } from '../indicators/indicators.module.js';
import { AlertsModule } from '../alerts/alerts.module.js';
import { UsersModule } from '../users/users.module.js';
import { ProjectMetaModule } from '../project-meta/project-meta.module.js';

@Module({
  imports: [IndicatorsModule, AlertsModule, UsersModule, ProjectMetaModule],
  providers: [SchedulerService],
})
export class SchedulerModule {}
