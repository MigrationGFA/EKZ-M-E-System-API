import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectMeta } from './project-meta.entity.js';
import { LogframeNode } from '../logframe/logframe-node.entity.js';
import { ProjectMetaService } from './project-meta.service.js';
import { ProjectMetaController } from './project-meta.controller.js';
import { AuditModule } from '../audit/audit.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProjectMeta, LogframeNode]),
    AuditModule,
  ],
  controllers: [ProjectMetaController],
  providers: [ProjectMetaService],
  exports: [ProjectMetaService],
})
export class ProjectMetaModule {}
