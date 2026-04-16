import { Module } from '@nestjs/common';
import { SchedulerService } from './scheduler.service.js';
import { IndicatorsModule } from '../indicators/indicators.module.js';
import { AlertsModule } from '../alerts/alerts.module.js';
import { UsersModule } from '../users/users.module.js';

@Module({
  imports: [IndicatorsModule, AlertsModule, UsersModule],
  providers: [SchedulerService],
})
export class SchedulerModule {}
