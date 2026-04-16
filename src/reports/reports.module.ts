import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Report } from './report.entity.js';
import { ReportsService } from './reports.service.js';
import { ReportsController } from './reports.controller.js';
import { UsersModule } from '../users/users.module.js';
import { AuditModule } from '../audit/audit.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([Report]), UsersModule, AuditModule],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
