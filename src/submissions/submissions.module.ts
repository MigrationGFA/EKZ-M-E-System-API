import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Submission } from './submission.entity.js';
import { ProjectLocation } from '../locations/project-location.entity.js';
import { SubmissionsService } from './submissions.service.js';
import { SubmissionsController } from './submissions.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Submission, ProjectLocation])],
  controllers: [SubmissionsController],
  providers: [SubmissionsService],
  exports: [SubmissionsService, TypeOrmModule],
})
export class SubmissionsModule {}
