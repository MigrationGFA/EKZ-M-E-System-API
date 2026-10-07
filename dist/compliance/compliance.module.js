"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComplianceModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const project_covenant_entity_js_1 = require("./covenants/project-covenant.entity.js");
const safeguard_measure_entity_js_1 = require("./safeguards/safeguard-measure.entity.js");
const audit_finding_entity_js_1 = require("./audit-findings/audit-finding.entity.js");
const covenants_service_js_1 = require("./covenants/covenants.service.js");
const safeguards_service_js_1 = require("./safeguards/safeguards.service.js");
const audit_findings_service_js_1 = require("./audit-findings/audit-findings.service.js");
const covenants_controller_js_1 = require("./covenants/covenants.controller.js");
const safeguards_controller_js_1 = require("./safeguards/safeguards.controller.js");
const audit_findings_controller_js_1 = require("./audit-findings/audit-findings.controller.js");
const audit_module_js_1 = require("../audit/audit.module.js");
let ComplianceModule = class ComplianceModule {
};
exports.ComplianceModule = ComplianceModule;
exports.ComplianceModule = ComplianceModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([project_covenant_entity_js_1.ProjectCovenant, safeguard_measure_entity_js_1.SafeguardMeasure, audit_finding_entity_js_1.AuditFinding]),
            audit_module_js_1.AuditModule,
        ],
        controllers: [
            covenants_controller_js_1.CovenantsController,
            safeguards_controller_js_1.SafeguardsController,
            audit_findings_controller_js_1.AuditFindingsController,
        ],
        providers: [covenants_service_js_1.CovenantsService, safeguards_service_js_1.SafeguardsService, audit_findings_service_js_1.AuditFindingsService],
        exports: [
            covenants_service_js_1.CovenantsService,
            safeguards_service_js_1.SafeguardsService,
            audit_findings_service_js_1.AuditFindingsService,
            typeorm_1.TypeOrmModule,
        ],
    })
], ComplianceModule);
//# sourceMappingURL=compliance.module.js.map