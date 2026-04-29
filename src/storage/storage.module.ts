import { Module } from '@nestjs/common';
import { AzureStorageService } from './azure-storage.service.js';
import { UploadsController } from './uploads.controller.js';

@Module({
  controllers: [UploadsController],
  providers: [AzureStorageService],
  exports: [AzureStorageService],
})
export class StorageModule {}
