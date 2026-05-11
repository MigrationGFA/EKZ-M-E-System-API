import { join } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    // Raise the JSON body limit from express's 100kb default. File uploads
    // go through multer (multipart) so this only covers metadata-bearing
    // routes — 256kb is comfortable headroom while still being a tight cap.
    // Partially addresses AUDIT_FINDINGS §3.2.
    rawBody: false,
    bodyParser: true,
  });
  app.useBodyParser('json', { limit: '256kb' });
  app.useBodyParser('urlencoded', { extended: true, limit: '256kb' });
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',') ?? ['http://localhost:3001'],
    credentials: true,
  });

  // Swagger / OpenAPI
  const config = new DocumentBuilder()
    .setTitle('EKZ M&E System API')
    .setDescription(
      'Backend API for the Ekiti Knowledge Zone Monitoring & Evaluation System. ' +
        'Tracks programme performance through a logframe hierarchy, collects field data via mobile-friendly forms, ' +
        'and visualises progress through dashboards and GIS maps.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header' },
      'JWT',
    )
    .addTag('Auth', 'Authentication and current user')
    .addTag(
      'Logframe',
      'Logframe node hierarchy (Goal → Outcome → Output → Activity)',
    )
    .addTag('Indicators', 'Performance indicators and progress tracking')
    .addTag('Forms', 'Data collection form definitions')
    .addTag('Submissions', 'Field data submissions with offline sync support')
    .addTag('Locations', 'GIS project locations and geofencing')
    .addTag('Dashboard', 'Executive dashboard aggregations')
    .addTag('Alerts', 'User notifications and alerts')
    .addTag('Audit Log', 'System audit trail')
    .addTag('Users', 'User management')
    .addTag('API Tokens', 'API token lifecycle')
    .addTag('Reports', 'Report metadata')
    .addTag(
      'Project Meta',
      'Project-level metadata (PDO, baseline / completion years, midpoint)',
    )
    .addTag(
      'Evidence',
      'Document & evidence store (ADR 0005) — uploads, per-type metadata, retention',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    jsonDocumentUrl: 'api/docs-json',
    yamlDocumentUrl: 'api/docs-yaml',
  });

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
