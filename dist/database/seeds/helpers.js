"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeStats = makeStats;
exports.logStats = logStats;
exports.query = query;
exports.rowExists = rowExists;
exports.execAffected = execAffected;
exports.resolveNodeId = resolveNodeId;
exports.resolveIndicatorId = resolveIndicatorId;
function makeStats() {
    return { inserted: 0, skipped: 0 };
}
function logStats(domain, stats) {
    console.log(`  [${domain}] inserted=${stats.inserted} skipped=${stats.skipped}`);
}
async function query(ds, sql, params = []) {
    return await ds.query(sql, params);
}
async function rowExists(ds, sql, params) {
    const rows = await query(ds, sql, params);
    return rows.length > 0;
}
async function execAffected(ds, sql, params = []) {
    const raw = await ds.query(sql, params);
    if (Array.isArray(raw) && raw.length === 2 && typeof raw[1] === 'number') {
        return raw[1];
    }
    if (Array.isArray(raw)) {
        return raw.length;
    }
    return 0;
}
async function resolveNodeId(ds, code, type) {
    const params = [code];
    let sql = `SELECT id FROM logframe_nodes WHERE code = $1`;
    if (type) {
        sql += ` AND type = $2`;
        params.push(type);
    }
    const rows = await query(ds, sql, params);
    if (rows.length === 0) {
        const where = type ? `code=${code} type=${type}` : `code=${code}`;
        throw new Error(`Phase 10 seed: logframe node not found (${where}). ` +
            `A prior slice must seed this node before downstream rows can reference it.`);
    }
    return rows[0].id;
}
async function resolveIndicatorId(ds, code, kind) {
    const rows = await query(ds, `SELECT id FROM indicators WHERE code = $1 AND kind = $2`, [code, kind]);
    if (rows.length === 0) {
        throw new Error(`Phase 10 seed: indicator not found (code=${code} kind=${kind}).`);
    }
    return rows[0].id;
}
//# sourceMappingURL=helpers.js.map