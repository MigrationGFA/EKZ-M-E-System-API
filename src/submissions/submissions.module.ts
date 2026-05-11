import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Submission } from './submission.entity.js';
import { ProjectLocation } from '../locations/project-location.entity.js';
import { Form } from '../forms/form.entity.js';
import { Beneficiary } from '../beneficiaries/beneficiary.entity.js';
import { SubmissionsService } from './submissions.service.js';
import { SubmissionsController } from './submissions.controller.js';
import { UsersModule } from '../users/users.module.js';
import { AuditModule } from '../audit/audit.module.js';
import { AlertsModule } from '../alerts/alerts.module.js';
import { IndicatorsModule } from '../indicators/indicators.module.js';
import { BeneficiariesModule } from '../beneficiaries/beneficiaries.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Submission, ProjectLocation, Form, Beneficiary]),
    UsersModule,
    AuditModule,
    AlertsModule,
    IndicatorsModule,
    BeneficiariesModule,
  ],
  controllers: [SubmissionsController],
  providers: [SubmissionsService],
  exports: [SubmissionsService, TypeOrmModule],
})
export class SubmissionsModule {}
