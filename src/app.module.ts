import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { LogframeModule } from './logframe/logframe.module.js';
import { IndicatorsModule } from './indicators/indicators.module.js';
import { FormsModule } from './forms/forms.module.js';
import { SubmissionsModule } from './submissions/submissions.module.js';
import { LocationsModule } from './locations/locations.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
    AuthModule,
    UsersModule,
    IndicatorsModule,
    LogframeModule,
    FormsModule,
    SubmissionsModule,
    LocationsModule,
  ],
})
export class AppModule {}
