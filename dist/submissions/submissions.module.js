"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubmissionsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const submission_entity_js_1 = require("./submission.entity.js");
const project_location_entity_js_1 = require("../locations/project-location.entity.js");
const form_entity_js_1 = require("../forms/form.entity.js");
const beneficiary_entity_js_1 = require("../beneficiaries/beneficiary.entity.js");
const submissions_service_js_1 = require("./submissions.service.js");
const submissions_controller_js_1 = require("./submissions.controller.js");
const users_module_js_1 = require("../users/users.module.js");
const audit_module_js_1 = require("../audit/audit.module.js");
const alerts_module_js_1 = require("../alerts/alerts.module.js");
const indicators_module_js_1 = require("../indicators/indicators.module.js");
const beneficiaries_module_js_1 = require("../beneficiaries/beneficiaries.module.js");
let SubmissionsModule = class SubmissionsModule {
};
exports.SubmissionsModule = SubmissionsModule;
exports.SubmissionsModule = SubmissionsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([submission_entity_js_1.Submission, project_location_entity_js_1.ProjectLocation, form_entity_js_1.Form, beneficiary_entity_js_1.Beneficiary]),
            users_module_js_1.UsersModule,
            audit_module_js_1.AuditModule,
            alerts_module_js_1.AlertsModule,
            indicators_module_js_1.IndicatorsModule,
            beneficiaries_module_js_1.BeneficiariesModule,
        ],
        controllers: [submissions_controller_js_1.SubmissionsController],
        providers: [submissions_service_js_1.SubmissionsService],
        exports: [submissions_service_js_1.SubmissionsService, typeorm_1.TypeOrmModule],
    })
], SubmissionsModule);
//# sourceMappingURL=submissions.module.js.map