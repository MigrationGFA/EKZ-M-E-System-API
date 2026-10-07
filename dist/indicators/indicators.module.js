"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IndicatorsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const indicator_entity_js_1 = require("./indicator.entity.js");
const indicator_progress_entity_js_1 = require("./indicator-progress.entity.js");
const indicator_year_target_entity_js_1 = require("./indicator-year-target.entity.js");
const indicator_disaggregation_entity_js_1 = require("./indicator-disaggregation.entity.js");
const indicator_progress_breakdown_entity_js_1 = require("./indicator-progress-breakdown.entity.js");
const form_entity_js_1 = require("../forms/form.entity.js");
const indicators_service_js_1 = require("./indicators.service.js");
const disaggregation_service_js_1 = require("./disaggregation.service.js");
const indicators_controller_js_1 = require("./indicators.controller.js");
const users_module_js_1 = require("../users/users.module.js");
const audit_module_js_1 = require("../audit/audit.module.js");
const alerts_module_js_1 = require("../alerts/alerts.module.js");
const project_meta_module_js_1 = require("../project-meta/project-meta.module.js");
let IndicatorsModule = class IndicatorsModule {
};
exports.IndicatorsModule = IndicatorsModule;
exports.IndicatorsModule = IndicatorsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                indicator_entity_js_1.Indicator,
                indicator_progress_entity_js_1.IndicatorProgress,
                indicator_year_target_entity_js_1.IndicatorYearTarget,
                indicator_disaggregation_entity_js_1.IndicatorDisaggregation,
                indicator_progress_breakdown_entity_js_1.IndicatorProgressBreakdown,
                form_entity_js_1.Form,
            ]),
            users_module_js_1.UsersModule,
            audit_module_js_1.AuditModule,
            alerts_module_js_1.AlertsModule,
            project_meta_module_js_1.ProjectMetaModule,
        ],
        controllers: [indicators_controller_js_1.IndicatorsController],
        providers: [indicators_service_js_1.IndicatorsService, disaggregation_service_js_1.DisaggregationService],
        exports: [indicators_service_js_1.IndicatorsService, disaggregation_service_js_1.DisaggregationService, typeorm_1.TypeOrmModule],
    })
], IndicatorsModule);
//# sourceMappingURL=indicators.module.js.map