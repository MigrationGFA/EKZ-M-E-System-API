import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityQuarterlyStatus } from './activity-quarterly-status.entity.js';
import { LogframeNode } from '../logframe/logframe-node.entity.js';
import { AwpStatusService } from './awp-status.service.js';
import { AwpStatusController } from './awp-status.controller.js';
import { AuditModule } from '../audit/audit.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([ActivityQuarterlyStatus, LogframeNode]),
    AuditModule,
  ],
  controllers: [AwpStatusController],
  providers: [AwpStatusService],
  exports: [AwpStatusService, TypeOrmModule],
})
export class AwpStatusModule {}
