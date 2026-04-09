import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Indicator } from './indicator.entity.js';
import { IndicatorProgress } from './indicator-progress.entity.js';
import { IndicatorsService } from './indicators.service.js';
import { IndicatorsController } from './indicators.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Indicator, IndicatorProgress])],
  controllers: [IndicatorsController],
  providers: [IndicatorsService],
  exports: [IndicatorsService, TypeOrmModule],
})
export class IndicatorsModule {}
