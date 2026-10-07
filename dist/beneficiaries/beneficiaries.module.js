"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BeneficiariesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const beneficiary_entity_js_1 = require("./beneficiary.entity.js");
const cohort_entity_js_1 = require("./cohort.entity.js");
const pii_access_log_entity_js_1 = require("./pii-access-log.entity.js");
const beneficiaries_service_js_1 = require("./beneficiaries.service.js");
const cohorts_service_js_1 = require("./cohorts.service.js");
const pii_access_log_service_js_1 = require("./pii-access-log.service.js");
const beneficiaries_controller_js_1 = require("./beneficiaries.controller.js");
const cohorts_controller_js_1 = require("./cohorts.controller.js");
let BeneficiariesModule = class BeneficiariesModule {
};
exports.BeneficiariesModule = BeneficiariesModule;
exports.BeneficiariesModule = BeneficiariesModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([beneficiary_entity_js_1.Beneficiary, cohort_entity_js_1.Cohort, pii_access_log_entity_js_1.PiiAccessLog])],
        controllers: [beneficiaries_controller_js_1.BeneficiariesController, cohorts_controller_js_1.CohortsController],
        providers: [beneficiaries_service_js_1.BeneficiariesService, cohorts_service_js_1.CohortsService, pii_access_log_service_js_1.PiiAccessLogService],
        exports: [beneficiaries_service_js_1.BeneficiariesService, cohorts_service_js_1.CohortsService, typeorm_1.TypeOrmModule],
    })
], BeneficiariesModule);
//# sourceMappingURL=beneficiaries.module.js.map