"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateTypeMetadata = validateTypeMetadata;
const common_1 = require("@nestjs/common");
const document_types_js_1 = require("../constants/document-types.js");
function validateTypeMetadata(documentType, metadata, periodFields) {
    const config = document_types_js_1.DOCUMENT_TYPE_CONFIG[documentType];
    const missing = [];
    for (const key of config.requiredMetadataFields) {
        if (key === 'reference_period_from') {
            if (!periodFields.from)
                missing.push(key);
            continue;
        }
        if (key === 'reference_period_to') {
            if (!periodFields.to)
                missing.push(key);
            continue;
        }
        const value = metadata?.[key];
        if (value === undefined || value === null || value === '') {
            missing.push(key);
        }
    }
    if (missing.length > 0) {
        throw new common_1.UnprocessableEntityException({
            message: `Missing required metadata for ${documentType}: ${missing.join(', ')}`,
            missing,
            document_type: documentType,
        });
    }
}
//# sourceMappingURL=validate-type-metadata.js.map