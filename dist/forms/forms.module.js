"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FormsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const form_entity_js_1 = require("./form.entity.js");
const submission_entity_js_1 = require("../submissions/submission.entity.js");
const indicator_entity_js_1 = require("../indicators/indicator.entity.js");
const forms_service_js_1 = require("./forms.service.js");
const forms_controller_js_1 = require("./forms.controller.js");
const audit_module_js_1 = require("../audit/audit.module.js");
const alerts_module_js_1 = require("../alerts/alerts.module.js");
const users_module_js_1 = require("../users/users.module.js");
let FormsModule = class FormsModule {
};
exports.FormsModule = FormsModule;
exports.FormsModule = FormsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([form_entity_js_1.Form, submission_entity_js_1.Submission, indicator_entity_js_1.Indicator]),
            audit_module_js_1.AuditModule,
            alerts_module_js_1.AlertsModule,
            users_module_js_1.UsersModule,
        ],
        controllers: [forms_controller_js_1.FormsController],
        providers: [forms_service_js_1.FormsService],
        exports: [forms_service_js_1.FormsService, typeorm_1.TypeOrmModule],
    })
], FormsModule);
//# sourceMappingURL=forms.module.js.map