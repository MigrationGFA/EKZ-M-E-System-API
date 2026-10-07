"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeStatus = computeStatus;
function computeStatus(currentValue, expected) {
    if (expected === 0)
        return 'off_track';
    const ratio = currentValue / expected;
    if (ratio >= 0.9)
        return 'on_track';
    if (ratio >= 0.6)
        return 'at_risk';
    return 'off_track';
}
//# sourceMappingURL=compute-status.js.map