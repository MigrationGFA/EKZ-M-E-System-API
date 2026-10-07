"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const throttler_1 = require("@nestjs/throttler");
const schedule_1 = require("@nestjs/schedule");
const mail_module_js_1 = require("./mail/mail.module.js");
const health_module_js_1 = require("./health/health.module.js");
const auth_module_js_1 = require("./auth/auth.module.js");
const users_module_js_1 = require("./users/users.module.js");
const logframe_module_js_1 = require("./logframe/logframe.module.js");
const indicators_module_js_1 = require("./indicators/indicators.module.js");
const forms_module_js_1 = require("./forms/forms.module.js");
const submissions_module_js_1 = require("./submissions/submissions.module.js");
const locations_module_js_1 = require("./locations/locations.module.js");
const dashboard_module_js_1 = require("./dashboard/dashboard.module.js");
const alerts_module_js_1 = require("./alerts/alerts.module.js");
const audit_module_js_1 = require("./audit/audit.module.js");
const api_tokens_module_js_1 = require("./api-tokens/api-tokens.module.js");
const reports_module_js_1 = require("./reports/reports.module.js");
const scheduler_module_js_1 = require("./scheduler/scheduler.module.js");
const storage_module_js_1 = require("./storage/storage.module.js");
const project_meta_module_js_1 = require("./project-meta/project-meta.module.js");
const beneficiaries_module_js_1 = require("./beneficiaries/beneficiaries.module.js");
const evidence_module_js_1 = require("./evidence/evidence.module.js");
const project_financing_sources_module_js_1 = require("./project-financing-sources/project-financing-sources.module.js");
const project_risks_module_js_1 = require("./project-risks/project-risks.module.js");
const compliance_module_js_1 = require("./compliance/compliance.module.js");
const awp_status_module_js_1 = require("./awp-status/awp-status.module.js");
const quarterly_reports_module_js_1 = require("./quarterly-reports/quarterly-reports.module.js");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            throttler_1.ThrottlerModule.forRoot([{ ttl: 60000, limit: 10 }]),
            schedule_1.ScheduleModule.forRoot(),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (config) => ({
                    type: 'postgres',
                    url: config.get('DATABASE_URL'),
                    entities: [__dirname + '/**/*.entity{.ts,.js}'],
                    migrations: [__dirname + '/database/migrations/*{.ts,.js}'],
                    synchronize: false,
                    migrationsRun: true,
                }),
            }),
            mail_module_js_1.MailModule,
            health_module_js_1.HealthModule,
            auth_module_js_1.AuthModule,
            users_module_js_1.UsersModule,
            indicators_module_js_1.IndicatorsModule,
            logframe_module_js_1.LogframeModule,
            forms_module_js_1.FormsModule,
            submissions_module_js_1.SubmissionsModule,
            locations_module_js_1.LocationsModule,
            dashboard_module_js_1.DashboardModule,
            alerts_module_js_1.AlertsModule,
            audit_module_js_1.AuditModule,
            api_tokens_module_js_1.ApiTokensModule,
            reports_module_js_1.ReportsModule,
            scheduler_module_js_1.SchedulerModule,
            storage_module_js_1.StorageModule,
            project_meta_module_js_1.ProjectMetaModule,
            beneficiaries_module_js_1.BeneficiariesModule,
            evidence_module_js_1.EvidenceModule,
            project_financing_sources_module_js_1.ProjectFinancingSourcesModule,
            project_risks_module_js_1.ProjectRisksModule,
            compliance_module_js_1.ComplianceModule,
            awp_status_module_js_1.AwpStatusModule,
            quarterly_reports_module_js_1.QuarterlyReportsModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map