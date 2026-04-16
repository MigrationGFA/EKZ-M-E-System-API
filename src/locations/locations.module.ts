import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectLocation } from './project-location.entity.js';
import { Indicator } from '../indicators/indicator.entity.js';
import { Submission } from '../submissions/submission.entity.js';
import { Form } from '../forms/form.entity.js';
import { LocationsService } from './locations.service.js';
import { LocationsController } from './locations.controller.js';
import { AuditModule } from '../audit/audit.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProjectLocation, Indicator, Submission, Form]),
    AuditModule,
  ],
  controllers: [LocationsController],
  providers: [LocationsService],
  exports: [LocationsService, TypeOrmModule],
})
export class LocationsModule {}
