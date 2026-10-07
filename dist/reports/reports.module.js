"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const report_entity_js_1 = require("./report.entity.js");
const indicator_entity_js_1 = require("../indicators/indicator.entity.js");
const indicator_progress_entity_js_1 = require("../indicators/indicator-progress.entity.js");
const indicator_year_target_entity_js_1 = require("../indicators/indicator-year-target.entity.js");
const submission_entity_js_1 = require("../submissions/submission.entity.js");
const logframe_node_entity_js_1 = require("../logframe/logframe-node.entity.js");
const evidence_document_entity_js_1 = require("../evidence/evidence-document.entity.js");
const project_financing_source_entity_js_1 = require("../project-financing-sources/project-financing-source.entity.js");
const project_risk_entity_js_1 = require("../project-risks/project-risk.entity.js");
const project_covenant_entity_js_1 = require("../compliance/covenants/project-covenant.entity.js");
const safeguard_measure_entity_js_1 = require("../compliance/safeguards/safeguard-measure.entity.js");
const audit_finding_entity_js_1 = require("../compliance/audit-findings/audit-finding.entity.js");
const activity_quarterly_status_entity_js_1 = require("../awp-status/activity-quarterly-status.entity.js");
const reports_service_js_1 = require("./reports.service.js");
const reports_controller_js_1 = require("./reports.controller.js");
const users_module_js_1 = require("../users/users.module.js");
const audit_module_js_1 = require("../audit/audit.module.js");
const project_meta_module_js_1 = require("../project-meta/project-meta.module.js");
const indicators_module_js_1 = require("../indicators/indicators.module.js");
const storage_module_js_1 = require("../storage/storage.module.js");
const quarterly_reports_module_js_1 = require("../quarterly-reports/quarterly-reports.module.js");
let ReportsModule = class ReportsModule {
};
exports.ReportsModule = ReportsModule;
exports.ReportsModule = ReportsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                report_entity_js_1.Report,
                indicator_entity_js_1.Indicator,
                indicator_progress_entity_js_1.IndicatorProgress,
                indicator_year_target_entity_js_1.IndicatorYearTarget,
                submission_entity_js_1.Submission,
                logframe_node_entity_js_1.LogframeNode,
                evidence_document_entity_js_1.EvidenceDocument,
                project_financing_source_entity_js_1.ProjectFinancingSource,
                project_risk_entity_js_1.ProjectRisk,
                project_covenant_entity_js_1.ProjectCovenant,
                safeguard_measure_entity_js_1.SafeguardMeasure,
                audit_finding_entity_js_1.AuditFinding,
                activity_quarterly_status_entity_js_1.ActivityQuarterlyStatus,
            ]),
            users_module_js_1.UsersModule,
            audit_module_js_1.AuditModule,
            project_meta_module_js_1.ProjectMetaModule,
            indicators_module_js_1.IndicatorsModule,
            storage_module_js_1.StorageModule,
            quarterly_reports_module_js_1.QuarterlyReportsModule,
        ],
        controllers: [reports_controller_js_1.ReportsController],
        providers: [reports_service_js_1.ReportsService],
    })
], ReportsModule);
//# sourceMappingURL=reports.module.js.map