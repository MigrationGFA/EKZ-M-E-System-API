"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuarterlyReportsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const quarterly_progress_report_entity_js_1 = require("./quarterly-progress-report.entity.js");
const quarterly_reports_service_js_1 = require("./quarterly-reports.service.js");
const quarterly_reports_controller_js_1 = require("./quarterly-reports.controller.js");
const audit_module_js_1 = require("../audit/audit.module.js");
let QuarterlyReportsModule = class QuarterlyReportsModule {
};
exports.QuarterlyReportsModule = QuarterlyReportsModule;
exports.QuarterlyReportsModule = QuarterlyReportsModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([quarterly_progress_report_entity_js_1.QuarterlyProgressReport]), audit_module_js_1.AuditModule],
        controllers: [quarterly_reports_controller_js_1.QuarterlyReportsController],
        providers: [quarterly_reports_service_js_1.QuarterlyReportsService],
        exports: [quarterly_reports_service_js_1.QuarterlyReportsService, typeorm_1.TypeOrmModule],
    })
], QuarterlyReportsModule);
//# sourceMappingURL=quarterly-reports.module.js.map