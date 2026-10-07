"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAPPABLE_DATA_SOURCE_TYPES = void 0;
exports.isMappableDataSourceType = isMappableDataSourceType;
exports.MAPPABLE_DATA_SOURCE_TYPES = [
    'form_submission',
    'manual',
];
function isMappableDataSourceType(value) {
    return exports.MAPPABLE_DATA_SOURCE_TYPES.includes(value);
}
//# sourceMappingURL=data-source.js.map