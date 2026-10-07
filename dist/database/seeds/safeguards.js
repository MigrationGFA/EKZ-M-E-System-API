"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedSafeguards = void 0;
const helpers_js_1 = require("./helpers.js");
const SAFEGUARDS = [
    {
        type: 'esmp',
        measure_name: 'Environmental & Social Management Plan (ESMP)',
        budget_allocated_ua: 500_000,
        order: 1,
    },
    {
        type: 'rap',
        measure_name: 'Resettlement Action Plan (RAP) — Ago Araromi & Ijan-Ekiti',
        budget_allocated_ua: 1_850_000,
        order: 2,
    },
];
const seedSafeguards = async (ds) => {
    const stats = (0, helpers_js_1.makeStats)();
    for (const s of SAFEGUARDS) {
        const existing = await (0, helpers_js_1.query)(ds, `SELECT id FROM safeguard_measures WHERE type = $1 AND measure_name = $2`, [s.type, s.measure_name]);
        if (existing.length > 0) {
            stats.skipped += 1;
            continue;
        }
        await ds.query(`INSERT INTO safeguard_measures (
         type, measure_name,
         total_count, not_started_count, ongoing_count, completed_count,
         budget_allocated_ua, amount_disbursed_ua, "order"
       ) VALUES ($1, $2, 0, 0, 0, 0, $3, 0, $4)`, [s.type, s.measure_name, s.budget_allocated_ua, s.order]);
        stats.inserted += 1;
    }
    (0, helpers_js_1.logStats)('safeguard_measures', stats);
};
exports.seedSafeguards = seedSafeguards;
//# sourceMappingURL=safeguards.js.map