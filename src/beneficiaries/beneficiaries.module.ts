import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Beneficiary } from './beneficiary.entity.js';
import { Cohort } from './cohort.entity.js';
import { PiiAccessLog } from './pii-access-log.entity.js';
import { BeneficiariesService } from './beneficiaries.service.js';
import { CohortsService } from './cohorts.service.js';
import { PiiAccessLogService } from './pii-access-log.service.js';
import { BeneficiariesController } from './beneficiaries.controller.js';
import { CohortsController } from './cohorts.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Beneficiary, Cohort, PiiAccessLog])],
  controllers: [BeneficiariesController, CohortsController],
  providers: [BeneficiariesService, CohortsService, PiiAccessLogService],
  exports: [BeneficiariesService, CohortsService, TypeOrmModule],
})
export class BeneficiariesModule {}
