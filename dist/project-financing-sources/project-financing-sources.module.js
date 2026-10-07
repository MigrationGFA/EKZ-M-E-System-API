"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectFinancingSourcesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const project_financing_source_entity_js_1 = require("./project-financing-source.entity.js");
const project_meta_entity_js_1 = require("../project-meta/project-meta.entity.js");
const project_financing_sources_service_js_1 = require("./project-financing-sources.service.js");
const project_financing_sources_controller_js_1 = require("./project-financing-sources.controller.js");
const audit_module_js_1 = require("../audit/audit.module.js");
let ProjectFinancingSourcesModule = class ProjectFinancingSourcesModule {
};
exports.ProjectFinancingSourcesModule = ProjectFinancingSourcesModule;
exports.ProjectFinancingSourcesModule = ProjectFinancingSourcesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([project_financing_source_entity_js_1.ProjectFinancingSource, project_meta_entity_js_1.ProjectMeta]),
            audit_module_js_1.AuditModule,
        ],
        controllers: [project_financing_sources_controller_js_1.ProjectFinancingSourcesController],
        providers: [project_financing_sources_service_js_1.ProjectFinancingSourcesService],
        exports: [project_financing_sources_service_js_1.ProjectFinancingSourcesService, typeorm_1.TypeOrmModule],
    })
], ProjectFinancingSourcesModule);
//# sourceMappingURL=project-financing-sources.module.js.map