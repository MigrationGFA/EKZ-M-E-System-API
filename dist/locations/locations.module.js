"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocationsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const project_location_entity_js_1 = require("./project-location.entity.js");
const indicator_entity_js_1 = require("../indicators/indicator.entity.js");
const submission_entity_js_1 = require("../submissions/submission.entity.js");
const form_entity_js_1 = require("../forms/form.entity.js");
const locations_service_js_1 = require("./locations.service.js");
const locations_controller_js_1 = require("./locations.controller.js");
const audit_module_js_1 = require("../audit/audit.module.js");
let LocationsModule = class LocationsModule {
};
exports.LocationsModule = LocationsModule;
exports.LocationsModule = LocationsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([project_location_entity_js_1.ProjectLocation, indicator_entity_js_1.Indicator, submission_entity_js_1.Submission, form_entity_js_1.Form]),
            audit_module_js_1.AuditModule,
        ],
        controllers: [locations_controller_js_1.LocationsController],
        providers: [locations_service_js_1.LocationsService],
        exports: [locations_service_js_1.LocationsService, typeorm_1.TypeOrmModule],
    })
], LocationsModule);
//# sourceMappingURL=locations.module.js.map