import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { SubmissionsService } from './submissions.service.js';
import { CreateSubmissionDto } from './dto/create-submission.dto.js';
import { ValidateSubmissionDto } from './dto/validate-submission.dto.js';
import { Roles } from '../auth/roles.decorator.js';
import { UserRole } from '../common/enums/user-role.enum.js';

@ApiTags('Submissions')
@ApiBearerAuth('JWT')
@Controller('submissions')
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.ME_STAFF, UserRole.PROGRAMME_STAFF)
  @ApiOperation({ summary: 'List submissions' })
  @ApiQuery({ name: 'form_id', required: false })
  @ApiQuery({ name: 'officer_id', required: false })
  @ApiQuery({
    name: 'validation_status',
    required: false,
    enum: ['pending', 'approved', 'rejected'],
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'per_page', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Plain array of submission objects',
  })
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
  @ApiOperation({
    summary: 'Batch submit multiple submissions',
    description:
      'Processes each submission independently. Duplicates are silently accepted (idempotent). Geofencing runs on each accepted submission.',
  })
  @ApiBody({ type: [CreateSubmissionDto] })
  @ApiResponse({
    status: 200,
    description: '{ accepted: string[], rejected: { id, reason }[] }',
  })
  createBatch(@Body() dtos: CreateSubmissionDto[]) {
    return this.submissionsService.createBatch(dtos);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.ME_STAFF, UserRole.PROGRAMME_STAFF)
  @ApiOperation({
    summary: 'Submit a single submission',
    description:
      'The id field is client-generated (UUID v4). Returns 409 if id already exists. Geofencing runs server-side.',
  })
  @ApiResponse({ status: 201, description: '{ id, status: "accepted" }' })
  @ApiResponse({
    status: 409,
    description: 'Submission with this ID already exists',
  })
  create(@Body() dto: CreateSubmissionDto) {
    return this.submissionsService.create(dto);
  }

  @Put(':id/validate')
  @Roles(UserRole.ADMIN, UserRole.ME_STAFF)
  @ApiOperation({ summary: 'Approve or reject a submission' })
  @ApiParam({ name: 'id', description: 'Submission UUID' })
  @ApiResponse({ status: 200, description: 'Full updated submission object' })
  @ApiResponse({ status: 404, description: 'Submission not found' })
  validate(@Param('id') id: string, @Body() dto: ValidateSubmissionDto) {
    return this.submissionsService.validate(id, dto.action, dto.comment);
  }
}
