import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EvidenceDocument } from './evidence-document.entity.js';
import { EvidenceService } from './evidence.service.js';
import { EvidenceController } from './evidence.controller.js';
import { AuditModule } from '../audit/audit.module.js';
import { BeneficiariesModule } from '../beneficiaries/beneficiaries.module.js';
import { StorageModule } from '../storage/storage.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([EvidenceDocument]),
    AuditModule,
    BeneficiariesModule,
    StorageModule,
  ],
  controllers: [EvidenceController],
  providers: [EvidenceService],
  exports: [EvidenceService],
})
export class EvidenceModule {}
