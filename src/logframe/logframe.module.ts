import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LogframeNode } from './logframe-node.entity.js';
import { LogframeController } from './logframe.controller.js';
import { LogframeService } from './logframe.service.js';
import { IndicatorsModule } from '../indicators/indicators.module.js';
import { AuditModule } from '../audit/audit.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([LogframeNode]), IndicatorsModule, AuditModule],
  controllers: [LogframeController],
  providers: [LogframeService],
  exports: [LogframeService],
})
export class LogframeModule {}
