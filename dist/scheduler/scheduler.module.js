"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchedulerModule = void 0;
const common_1 = require("@nestjs/common");
const scheduler_service_js_1 = require("./scheduler.service.js");
const indicators_module_js_1 = require("../indicators/indicators.module.js");
const alerts_module_js_1 = require("../alerts/alerts.module.js");
const users_module_js_1 = require("../users/users.module.js");
const project_meta_module_js_1 = require("../project-meta/project-meta.module.js");
let SchedulerModule = class SchedulerModule {
};
exports.SchedulerModule = SchedulerModule;
exports.SchedulerModule = SchedulerModule = __decorate([
    (0, common_1.Module)({
        imports: [indicators_module_js_1.IndicatorsModule, alerts_module_js_1.AlertsModule, users_module_js_1.UsersModule, project_meta_module_js_1.ProjectMetaModule],
        providers: [scheduler_service_js_1.SchedulerService],
    })
], SchedulerModule);
//# sourceMappingURL=scheduler.module.js.map