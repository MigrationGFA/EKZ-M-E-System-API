import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectFinancingSource } from './project-financing-source.entity.js';
import { ProjectMeta } from '../project-meta/project-meta.entity.js';
import { ProjectFinancingSourcesService } from './project-financing-sources.service.js';
import { ProjectFinancingSourcesController } from './project-financing-sources.controller.js';
import { AuditModule } from '../audit/audit.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProjectFinancingSource, ProjectMeta]),
    AuditModule,
  ],
  controllers: [ProjectFinancingSourcesController],
  providers: [ProjectFinancingSourcesService],
  exports: [ProjectFinancingSourcesService, TypeOrmModule],
})
export class ProjectFinancingSourcesModule {}
