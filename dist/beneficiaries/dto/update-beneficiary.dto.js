"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateBeneficiaryDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_beneficiary_dto_js_1 = require("./create-beneficiary.dto.js");
class UpdateBeneficiaryDto extends (0, swagger_1.PartialType)((0, swagger_1.OmitType)(create_beneficiary_dto_js_1.CreateBeneficiaryDto, ['id', 'cohort_codes'])) {
}
exports.UpdateBeneficiaryDto = UpdateBeneficiaryDto;
//# sourceMappingURL=update-beneficiary.dto.js.map