"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogframeModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const logframe_node_entity_js_1 = require("./logframe-node.entity.js");
const logframe_controller_js_1 = require("./logframe.controller.js");
const logframe_service_js_1 = require("./logframe.service.js");
const indicators_module_js_1 = require("../indicators/indicators.module.js");
const audit_module_js_1 = require("../audit/audit.module.js");
let LogframeModule = class LogframeModule {
};
exports.LogframeModule = LogframeModule;
exports.LogframeModule = LogframeModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([logframe_node_entity_js_1.LogframeNode]),
            indicators_module_js_1.IndicatorsModule,
            audit_module_js_1.AuditModule,
        ],
        controllers: [logframe_controller_js_1.LogframeController],
        providers: [logframe_service_js_1.LogframeService],
        exports: [logframe_service_js_1.LogframeService],
    })
], LogframeModule);
//# sourceMappingURL=logframe.module.js.map