import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Request,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request as ExpressRequest } from 'express';
import {
  BeneficiariesService,
  ActorContext,
} from './beneficiaries.service.js';
import { CreateBeneficiaryDto } from './dto/create-beneficiary.dto.js';
import { UpdateBeneficiaryDto } from './dto/update-beneficiary.dto.js';
import { BeneficiaryQueryDto } from './dto/beneficiary-query.dto.js';
import {
  BatchBeneficiaryDto,
  BatchBeneficiaryResult,
} from './dto/batch-beneficiary.dto.js';
import { AttachCohortDto } from './dto/attach-cohort.dto.js';
import { Roles } from '../auth/roles.decorator.js';
import { UserRole } from '../common/enums/user-role.enum.js';

type AuthedRequest = ExpressRequest & { user: ActorContext };

@ApiTags('Beneficiaries')
@ApiBearerAuth('JWT')
@Controller('beneficiaries')
export class BeneficiariesController {
  constructor(private readonly service: BeneficiariesService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.ME_STAFF, UserRole.PROGRAMME_STAFF)
  @ApiOperation({
    summary: 'List beneficiaries',
    description:
      'Always redacts phone/NIN/notes per ADR 0006 §70. Programme staff see their own registrations only.',
  })
  @ApiQuery({ name: 'q', required: false })
  @ApiQuery({ name: 'community', required: false })
  @ApiQuery({ name: 'cohort', required: false })
  @ApiQuery({ name: 'include_inactive', required: false })
  findAll(
    @Query() query: BeneficiaryQueryDto,
    @Request() req: AuthedRequest,
  ) {
    return this.service.findAll(query, req.user);
  }

  @Get('lookup')
  @Roles(UserRole.ADMIN, UserRole.ME_STAFF, UserRole.PROGRAMME_STAFF)
  @ApiOperation({
    summary: 'Autocomplete lookup by phone or NIN hash',
    description:
      'Returns redacted lookup hits for the BeneficiaryPicker. Always PII-free.',
  })
  @ApiQuery({ name: 'phone', required: false, description: 'E.164 phone' })
  @ApiQuery({
    name: 'hash',
    required: false,
    description: 'SHA-256 of salt+NIN',
  })
  lookup(
    @Query('phone') phone: string | undefined,
    @Query('hash') hash: string | undefined,
    @Request() req: AuthedRequest,
  ) {
    return this.service.lookup(req.user, { phone, hash });
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.ME_STAFF, UserRole.PROGRAMME_STAFF)
  @ApiOperation({
    summary: 'Get one beneficiary',
    description:
      'Audited PII read. Programme staff only see their own registrations.',
  })
  @ApiParam({ name: 'id', description: 'Beneficiary UUID' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: AuthedRequest,
  ) {
    return this.service.findOne(id, req.user, req);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.ME_STAFF, UserRole.PROGRAMME_STAFF)
  @ApiOperation({ summary: 'Register a beneficiary' })
  @ApiResponse({ status: 201, description: 'Created' })
  create(@Body() dto: CreateBeneficiaryDto, @Request() req: AuthedRequest) {
    return this.service.create(dto, req.user, req);
  }

  @Post('batch')
  @Roles(UserRole.ADMIN, UserRole.ME_STAFF, UserRole.PROGRAMME_STAFF)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Batch register (offline sync)',
    description:
      'Drains the offline registration queue. Returns accepted + rejected ids; idempotent on existing ids.',
  })
  batch(
    @Body() dto: BatchBeneficiaryDto,
    @Request() req: AuthedRequest,
  ): Promise<BatchBeneficiaryResult> {
    return this.service.batchCreate(dto.items, req.user);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.ME_STAFF, UserRole.PROGRAMME_STAFF)
  @ApiOperation({ summary: 'Update a beneficiary' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBeneficiaryDto,
    @Request() req: AuthedRequest,
  ) {
    return this.service.update(id, dto, req.user, req);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.ME_STAFF)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Soft-delete a beneficiary',
    description: 'Sets active = false. Record survives for audit (ADR §69).',
  })
  softDelete(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: AuthedRequest,
  ) {
    return this.service.softDelete(id, req.user, req);
  }

  @Post(':id/cohorts')
  @Roles(UserRole.ADMIN, UserRole.ME_STAFF)
  @ApiOperation({ summary: 'Attach a cohort tag' })
  attachCohort(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AttachCohortDto,
    @Request() req: AuthedRequest,
  ) {
    return this.service.attachCohort(id, dto.code, req.user);
  }

  @Delete(':id/cohorts/:code')
  @Roles(UserRole.ADMIN, UserRole.ME_STAFF)
  @ApiOperation({ summary: 'Detach a cohort tag' })
  detachCohort(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('code') code: string,
    @Request() req: AuthedRequest,
  ) {
    return this.service.detachCohort(id, code, req.user);
  }
}
