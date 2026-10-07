"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sha256Hex = sha256Hex;
const node_crypto_1 = require("node:crypto");
function sha256Hex(buffer) {
    return (0, node_crypto_1.createHash)('sha256').update(buffer).digest('hex');
}
//# sourceMappingURL=sha256.js.map