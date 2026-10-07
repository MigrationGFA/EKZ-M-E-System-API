"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertReadAccess = assertReadAccess;
exports.canRead = canRead;
exports.assertWriteAccess = assertWriteAccess;
const common_1 = require("@nestjs/common");
const document_types_js_1 = require("../constants/document-types.js");
function assertReadAccess(doc, actor) {
    const config = document_types_js_1.DOCUMENT_TYPE_CONFIG[doc.document_type];
    for (const rule of config.read) {
        if (!rule.roles.includes(actor.role))
            continue;
        if (rule.scope === 'all')
            return;
        if (rule.scope === 'own' && doc.uploaded_by === actor.id)
            return;
    }
    throw new common_1.ForbiddenException(`Role ${actor.role} cannot read documents of type ${doc.document_type}`);
}
function canRead(doc, actor) {
    try {
        assertReadAccess(doc, actor);
        return true;
    }
    catch {
        return false;
    }
}
function assertWriteAccess(documentType, actor) {
    const config = document_types_js_1.DOCUMENT_TYPE_CONFIG[documentType];
    if (!config.write.includes(actor.role)) {
        throw new common_1.ForbiddenException(`Role ${actor.role} cannot upload documents of type ${documentType}`);
    }
}
//# sourceMappingURL=assert-read-access.js.map