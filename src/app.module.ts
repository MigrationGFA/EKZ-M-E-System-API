import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { MailModule } from './mail/mail.module.js';
import { HealthModule } from './health/health.module.js';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { LogframeModule } from './logframe/logframe.module.js';
import { IndicatorsModule } from './indicators/indicators.module.js';
import { FormsModule } from './forms/forms.module.js';
import { SubmissionsModule } from './submissions/submissions.module.js';
import { LocationsModule } from './locations/locations.module.js';
import { DashboardModule } from './dashboard/dashboard.module.js';
import { AlertsModule } from './alerts/alerts.module.js';
import { AuditModule } from './audit/audit.module.js';
import { ApiTokensModule } from './api-tokens/api-tokens.module.js';
import { ReportsModule } from './reports/reports.module.js';
import { SchedulerModule } from './scheduler/scheduler.module.js';
import { StorageModule } from './storage/storage.module.js';
import { ProjectMetaModule } from './project-meta/project-meta.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 10 }]),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        url: config.get<string>('DATABASE_URL'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        migrations: [__dirname + '/database/migrations/*{.ts,.js}'],
        synchronize: false,
        migrationsRun: true,
      }),
    }),
    MailModule,
    HealthModule,
    AuthModule,
    UsersModule,
    IndicatorsModule,
    LogframeModule,
    FormsModule,
    SubmissionsModule,
    LocationsModule,
    DashboardModule,
    AlertsModule,
    AuditModule,
    ApiTokensModule,
    ReportsModule,
    SchedulerModule,
    StorageModule,
    ProjectMetaModule,
  ],
})
export class AppModule {}
