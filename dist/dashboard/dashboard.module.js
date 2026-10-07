"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const indicator_entity_js_1 = require("../indicators/indicator.entity.js");
const indicator_progress_entity_js_1 = require("../indicators/indicator-progress.entity.js");
const indicator_year_target_entity_js_1 = require("../indicators/indicator-year-target.entity.js");
const submission_entity_js_1 = require("../submissions/submission.entity.js");
const alert_entity_js_1 = require("../alerts/alert.entity.js");
const logframe_node_entity_js_1 = require("../logframe/logframe-node.entity.js");
const dashboard_service_js_1 = require("./dashboard.service.js");
const dashboard_controller_js_1 = require("./dashboard.controller.js");
const project_meta_module_js_1 = require("../project-meta/project-meta.module.js");
let DashboardModule = class DashboardModule {
};
exports.DashboardModule = DashboardModule;
exports.DashboardModule = DashboardModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                indicator_entity_js_1.Indicator,
                indicator_progress_entity_js_1.IndicatorProgress,
                indicator_year_target_entity_js_1.IndicatorYearTarget,
                submission_entity_js_1.Submission,
                alert_entity_js_1.Alert,
                logframe_node_entity_js_1.LogframeNode,
            ]),
            project_meta_module_js_1.ProjectMetaModule,
        ],
        controllers: [dashboard_controller_js_1.DashboardController],
        providers: [dashboard_service_js_1.DashboardService],
    })
], DashboardModule);
//# sourceMappingURL=dashboard.module.js.map