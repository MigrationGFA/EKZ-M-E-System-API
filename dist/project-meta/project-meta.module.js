"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectMetaModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const project_meta_entity_js_1 = require("./project-meta.entity.js");
const logframe_node_entity_js_1 = require("../logframe/logframe-node.entity.js");
const project_meta_service_js_1 = require("./project-meta.service.js");
const project_meta_controller_js_1 = require("./project-meta.controller.js");
const audit_module_js_1 = require("../audit/audit.module.js");
let ProjectMetaModule = class ProjectMetaModule {
};
exports.ProjectMetaModule = ProjectMetaModule;
exports.ProjectMetaModule = ProjectMetaModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([project_meta_entity_js_1.ProjectMeta, logframe_node_entity_js_1.LogframeNode]), audit_module_js_1.AuditModule],
        controllers: [project_meta_controller_js_1.ProjectMetaController],
        providers: [project_meta_service_js_1.ProjectMetaService],
        exports: [project_meta_service_js_1.ProjectMetaService],
    })
], ProjectMetaModule);
//# sourceMappingURL=project-meta.module.js.map