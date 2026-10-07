"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectRisksModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const project_risk_entity_js_1 = require("./project-risk.entity.js");
const project_risks_service_js_1 = require("./project-risks.service.js");
const project_risks_controller_js_1 = require("./project-risks.controller.js");
const audit_module_js_1 = require("../audit/audit.module.js");
let ProjectRisksModule = class ProjectRisksModule {
};
exports.ProjectRisksModule = ProjectRisksModule;
exports.ProjectRisksModule = ProjectRisksModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([project_risk_entity_js_1.ProjectRisk]), audit_module_js_1.AuditModule],
        controllers: [project_risks_controller_js_1.ProjectRisksController],
        providers: [project_risks_service_js_1.ProjectRisksService],
        exports: [project_risks_service_js_1.ProjectRisksService, typeorm_1.TypeOrmModule],
    })
], ProjectRisksModule);
//# sourceMappingURL=project-risks.module.js.map