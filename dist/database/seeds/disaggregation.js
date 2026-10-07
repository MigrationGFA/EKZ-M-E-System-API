"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedDisaggregation = void 0;
const helpers_js_1 = require("./helpers.js");
const RULES = [
    {
        indicatorCode: '1.1',
        indicatorKind: 'outcome',
        axis: 'sex',
        required: true,
        breakdown_target: { female: 0.4, male: 0.6 },
        notes: 'RF target: 40% women.',
    },
    {
        indicatorCode: '1.1',
        indicatorKind: 'outcome',
        axis: 'age_band',
        required: true,
        breakdown_target: { youth: 0.7, adult: 0.3 },
        notes: 'RF target: 70% youth (age 18–35).',
    },
    {
        indicatorCode: '1.2',
        indicatorKind: 'outcome',
        axis: 'sex',
        required: true,
        breakdown_target: { female: 0.4, male: 0.6 },
        notes: 'RF target: 40% women. Estimated from mid-term tracer study.',
    },
    {
        indicatorCode: '1.2',
        indicatorKind: 'outcome',
        axis: 'age_band',
        required: true,
        breakdown_target: { youth: 0.7, adult: 0.3 },
        notes: 'RF target: 70% youth (age 18–35).',
    },
    {
        indicatorCode: '2.1',
        indicatorKind: 'outcome',
        axis: 'sex',
        required: true,
        breakdown_target: null,
        notes: 'Required by RF; no explicit % target.',
    },
    {
        indicatorCode: '2.2',
        indicatorKind: 'outcome',
        axis: 'sex',
        required: true,
        breakdown_target: { female: 0.4, male: 0.6 },
        notes: 'RF target: 40% women founders.',
    },
    {
        indicatorCode: '2.2',
        indicatorKind: 'outcome',
        axis: 'age_band',
        required: true,
        breakdown_target: { youth: 0.9, adult: 0.1 },
        notes: 'RF target: 90% youth founders.',
    },
    {
        indicatorCode: '3.1',
        indicatorKind: 'outcome',
        axis: 'sex',
        required: false,
        breakdown_target: null,
        notes: 'RF notes leadership disaggregation; not target-bound.',
    },
    {
        indicatorCode: '3.3',
        indicatorKind: 'output',
        axis: 'sex',
        required: true,
        breakdown_target: { female: 0.5, male: 0.5 },
        notes: 'Selected from poorest / vulnerable households; mixed sex.',
    },
    {
        indicatorCode: '3.3',
        indicatorKind: 'output',
        axis: 'cohort',
        required: true,
        breakdown_target: null,
        notes: 'Tagged against the social-registry cohorts (low-income HH; affected-livelihood HH) per ADR 0003.',
    },
    {
        indicatorCode: '4.1',
        indicatorKind: 'output',
        axis: 'sex',
        required: true,
        breakdown_target: { female: 0.4, male: 0.6 },
        notes: 'RF target: 40% female trainees.',
    },
    {
        indicatorCode: '4.1',
        indicatorKind: 'output',
        axis: 'cohort',
        required: true,
        breakdown_target: { affected_livelihood: 0.0625 },
        notes: 'RF target: at least 500 trainees from households with affected livelihoods (Ago Araromi / Ijan-Ekiti).',
    },
    {
        indicatorCode: '4.1',
        indicatorKind: 'output',
        axis: 'skill_level',
        required: true,
        breakdown_target: { advanced: 0.1, basic_intermediate: 0.9 },
        notes: 'RF target: at least 10% trained in advanced-level skills.',
    },
];
const seedDisaggregation = async (ds) => {
    const stats = (0, helpers_js_1.makeStats)();
    for (const rule of RULES) {
        const indicatorId = await (0, helpers_js_1.resolveIndicatorId)(ds, rule.indicatorCode, rule.indicatorKind);
        const existing = await (0, helpers_js_1.query)(ds, `SELECT id FROM indicator_disaggregations
        WHERE indicator_id = $1 AND axis = $2`, [indicatorId, rule.axis]);
        if (existing.length > 0) {
            stats.skipped += 1;
            continue;
        }
        await ds.query(`INSERT INTO indicator_disaggregations
         (indicator_id, axis, required, breakdown_target, notes)
       VALUES ($1, $2, $3, $4::jsonb, $5)`, [
            indicatorId,
            rule.axis,
            rule.required,
            rule.breakdown_target ? JSON.stringify(rule.breakdown_target) : null,
            rule.notes,
        ]);
        stats.inserted += 1;
    }
    (0, helpers_js_1.logStats)('indicator_disaggregations', stats);
};
exports.seedDisaggregation = seedDisaggregation;
//# sourceMappingURL=disaggregation.js.map