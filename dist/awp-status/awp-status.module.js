"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AwpStatusModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const activity_quarterly_status_entity_js_1 = require("./activity-quarterly-status.entity.js");
const logframe_node_entity_js_1 = require("../logframe/logframe-node.entity.js");
const awp_status_service_js_1 = require("./awp-status.service.js");
const awp_status_controller_js_1 = require("./awp-status.controller.js");
const audit_module_js_1 = require("../audit/audit.module.js");
let AwpStatusModule = class AwpStatusModule {
};
exports.AwpStatusModule = AwpStatusModule;
exports.AwpStatusModule = AwpStatusModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([activity_quarterly_status_entity_js_1.ActivityQuarterlyStatus, logframe_node_entity_js_1.LogframeNode]),
            audit_module_js_1.AuditModule,
        ],
        controllers: [awp_status_controller_js_1.AwpStatusController],
        providers: [awp_status_service_js_1.AwpStatusService],
        exports: [awp_status_service_js_1.AwpStatusService, typeorm_1.TypeOrmModule],
    })
], AwpStatusModule);
//# sourceMappingURL=awp-status.module.js.map