import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Form } from './form.entity.js';
import { FormsService } from './forms.service.js';
import { FormsController } from './forms.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Form])],
  controllers: [FormsController],
  providers: [FormsService],
  exports: [FormsService, TypeOrmModule],
})
export class FormsModule {}
