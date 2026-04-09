import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { SubmissionsService } from './submissions.service.js';
import { CreateSubmissionDto } from './dto/create-submission.dto.js';
import { ValidateSubmissionDto } from './dto/validate-submission.dto.js';
import { Roles } from '../auth/roles.decorator.js';
import { UserRole } from '../common/enums/user-role.enum.js';

@Controller('submissions')
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.ME_STAFF, UserRole.PROGRAMME_STAFF)
  findAll(
    @Query('form_id') form_id?: string,
    @Query('officer_id') officer_id?: string,
    @Query('validation_status') validation_status?: string,
    @Query('page') page?: string,
    @Query('per_page') per_page?: string,
  ) {
    return this.submissionsService.findAll({
      form_id,
      officer_id,
      validation_status,
      page: page ? Number(page) : undefined,
      per_page: per_page ? Number(per_page) : undefined,
    });
  }

  // IMPORTANT: batch route BEFORE single POST to avoid :id matching
  @Post('batch')
  @Roles(UserRole.ADMIN, UserRole.ME_STAFF, UserRole.PROGRAMME_STAFF)
  createBatch(@Body() dtos: CreateSubmissionDto[]) {
    return this.submissionsService.createBatch(dtos);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.ME_STAFF, UserRole.PROGRAMME_STAFF)
  create(@Body() dto: CreateSubmissionDto) {
    return this.submissionsService.create(dto);
  }

  @Put(':id/validate')
  @Roles(UserRole.ADMIN, UserRole.ME_STAFF)
  validate(@Param('id') id: string, @Body() dto: ValidateSubmissionDto) {
    return this.submissionsService.validate(id, dto.action, dto.comment);
  }
}
