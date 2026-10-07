"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvidenceModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const evidence_document_entity_js_1 = require("./evidence-document.entity.js");
const evidence_service_js_1 = require("./evidence.service.js");
const evidence_controller_js_1 = require("./evidence.controller.js");
const audit_module_js_1 = require("../audit/audit.module.js");
const beneficiaries_module_js_1 = require("../beneficiaries/beneficiaries.module.js");
const storage_module_js_1 = require("../storage/storage.module.js");
let EvidenceModule = class EvidenceModule {
};
exports.EvidenceModule = EvidenceModule;
exports.EvidenceModule = EvidenceModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([evidence_document_entity_js_1.EvidenceDocument]),
            audit_module_js_1.AuditModule,
            beneficiaries_module_js_1.BeneficiariesModule,
            storage_module_js_1.StorageModule,
        ],
        controllers: [evidence_controller_js_1.EvidenceController],
        providers: [evidence_service_js_1.EvidenceService],
        exports: [evidence_service_js_1.EvidenceService],
    })
], EvidenceModule);
//# sourceMappingURL=evidence.module.js.map