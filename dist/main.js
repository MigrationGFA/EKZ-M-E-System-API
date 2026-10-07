"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_path_1 = require("node:path");
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const app_module_js_1 = require("./app.module.js");
const http_exception_filter_js_1 = require("./common/filters/http-exception.filter.js");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_js_1.AppModule, {
        rawBody: false,
        bodyParser: true,
    });
    app.useBodyParser('json', { limit: '256kb' });
    app.useBodyParser('urlencoded', { extended: true, limit: '256kb' });
    app.useStaticAssets((0, node_path_1.join)(process.cwd(), 'uploads'), { prefix: '/uploads' });
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    app.useGlobalFilters(new http_exception_filter_js_1.HttpExceptionFilter());
    app.enableCors({
        origin: process.env.CORS_ORIGINS?.split(',') ?? ['http://localhost:3001'],
        credentials: true,
    });
    const config = new swagger_1.DocumentBuilder()
        .setTitle('EKZ M&E System API')
        .setDescription('Backend API for the Ekiti Knowledge Zone Monitoring & Evaluation System. ' +
        'Tracks programme performance through a logframe hierarchy, collects field data via mobile-friendly forms, ' +
        'and visualises progress through dashboards and GIS maps.')
        .setVersion('1.0')
        .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header' }, 'JWT')
        .addTag('Auth', 'Authentication and current user')
        .addTag('Logframe', 'Logframe node hierarchy (Goal → Outcome → Output → Activity)')
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
        .addTag('Project Meta', 'Project-level metadata (PDO, baseline / completion years, midpoint)')
        .addTag('Evidence', 'Document & evidence store (ADR 0005) — uploads, per-type metadata, retention')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api/docs', app, document, {
        jsonDocumentUrl: 'api/docs-json',
        yamlDocumentUrl: 'api/docs-yaml',
    });
    await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
//# sourceMappingURL=main.js.map