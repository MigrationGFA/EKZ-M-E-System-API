import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuarterlyProgressReport } from './quarterly-progress-report.entity.js';
import { QuarterlyReportsService } from './quarterly-reports.service.js';
import { QuarterlyReportsController } from './quarterly-reports.controller.js';
import { AuditModule } from '../audit/audit.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([QuarterlyProgressReport]), AuditModule],
  controllers: [QuarterlyReportsController],
  providers: [QuarterlyReportsService],
  exports: [QuarterlyReportsService, TypeOrmModule],
})
export class QuarterlyReportsModule {}
