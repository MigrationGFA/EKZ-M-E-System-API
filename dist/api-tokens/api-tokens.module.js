"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiTokensModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const passport_1 = require("@nestjs/passport");
const api_token_entity_js_1 = require("./api-token.entity.js");
const api_tokens_service_js_1 = require("./api-tokens.service.js");
const api_tokens_controller_js_1 = require("./api-tokens.controller.js");
const api_token_strategy_js_1 = require("./api-token.strategy.js");
const users_module_js_1 = require("../users/users.module.js");
const audit_module_js_1 = require("../audit/audit.module.js");
let ApiTokensModule = class ApiTokensModule {
};
exports.ApiTokensModule = ApiTokensModule;
exports.ApiTokensModule = ApiTokensModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([api_token_entity_js_1.ApiToken]),
            users_module_js_1.UsersModule,
            audit_module_js_1.AuditModule,
            passport_1.PassportModule,
        ],
        controllers: [api_tokens_controller_js_1.ApiTokensController],
        providers: [api_tokens_service_js_1.ApiTokensService, api_token_strategy_js_1.ApiTokenStrategy],
    })
], ApiTokensModule);
//# sourceMappingURL=api-tokens.module.js.map