import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Form } from './form.entity.js';
import { Submission } from '../submissions/submission.entity.js';
import { Indicator } from '../indicators/indicator.entity.js';
import { FormsService } from './forms.service.js';
import { FormsController } from './forms.controller.js';
import { AuditModule } from '../audit/audit.module.js';
import { AlertsModule } from '../alerts/alerts.module.js';
import { UsersModule } from '../users/users.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Form, Submission, Indicator]),
    AuditModule,
    AlertsModule,
    UsersModule,
  ],
  controllers: [FormsController],
  providers: [FormsService],
  exports: [FormsService, TypeOrmModule],
})
export class FormsModule {}
