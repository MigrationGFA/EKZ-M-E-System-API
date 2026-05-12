import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectCovenant } from './covenants/project-covenant.entity.js';
import { CovenantsService } from './covenants/covenants.service.js';
import { CovenantsController } from './covenants/covenants.controller.js';
import { AuditModule } from '../audit/audit.module.js';

/**
 * Phase 9.5 — QPR section C.1 compliance umbrella. Bundles covenants,
 * safeguards (slice 3), and audit findings (slice 3) under one module so
 * AppModule imports stay cohesive.
 */
@Module({
  imports: [TypeOrmModule.forFeature([ProjectCovenant]), AuditModule],
  controllers: [CovenantsController],
  providers: [CovenantsService],
  exports: [CovenantsService, TypeOrmModule],
})
export class ComplianceModule {}
