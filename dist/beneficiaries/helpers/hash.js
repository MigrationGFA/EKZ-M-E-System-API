"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashNin = hashNin;
const node_crypto_1 = require("node:crypto");
function getHashSalt() {
    const value = process.env.BENEFICIARY_HASH_SALT;
    if (!value || value.length === 0) {
        throw new Error('BENEFICIARY_HASH_SALT is not set. Configure it in your environment before registering beneficiaries.');
    }
    return value;
}
function hashNin(raw) {
    const salt = getHashSalt();
    return (0, node_crypto_1.createHash)('sha256')
        .update(salt + raw)
        .digest('hex');
}
//# sourceMappingURL=hash.js.map