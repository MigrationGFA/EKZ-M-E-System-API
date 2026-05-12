import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectRisk } from './project-risk.entity.js';
import { ProjectRisksService } from './project-risks.service.js';
import { ProjectRisksController } from './project-risks.controller.js';
import { AuditModule } from '../audit/audit.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([ProjectRisk]), AuditModule],
  controllers: [ProjectRisksController],
  providers: [ProjectRisksService],
  exports: [ProjectRisksService, TypeOrmModule],
})
export class ProjectRisksModule {}
