"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedProjectMeta = void 0;
const helpers_js_1 = require("./helpers.js");
const PROJECT_META = {
    name: 'Ekiti Knowledge Zone Project',
    sap_code: 'P-NG-K00-009',
    pdo_text: 'To promote knowledge economy value chain through innovation and entrepreneurship in technology industry.',
    baseline_year: 2022,
    completion_year: 2028,
    midpoint_date: '2025-06-30',
    sector: 'ICT, Innovation & Industry',
    country: 'Nigeria',
    executing_agency: 'EKDIPA — Ekiti Development and Investment Promotion Agency',
    responsible_project_staff: 'EKDIPA PIU Project Coordinator (TBD — admin to assign)',
    original_disbursement_deadline: '2029-06-30',
    revised_disbursement_deadline: null,
};
const FINANCING_SOURCES = [
    {
        source_name: 'AfDB ADB Loan',
        instrument: 'loan',
        total_approved_ua: 50_000_000,
        disbursed_ua: 0,
        order: 1,
    },
    {
        source_name: 'AfDB ADF Grant',
        instrument: 'grant',
        total_approved_ua: 5_000_000,
        disbursed_ua: 0,
        order: 2,
    },
    {
        source_name: 'Federal Government of Nigeria — Counterpart',
        instrument: 'counterpart',
        total_approved_ua: 3_000_000,
        disbursed_ua: 0,
        order: 3,
    },
    {
        source_name: 'Ekiti State Government — Counterpart',
        instrument: 'counterpart',
        total_approved_ua: 2_000_000,
        disbursed_ua: 0,
        order: 4,
    },
];
async function upsertProjectMeta(ds) {
    const existing = await (0, helpers_js_1.query)(ds, `SELECT id FROM project_meta LIMIT 1`);
    if (existing.length === 0) {
        const inserted = await (0, helpers_js_1.query)(ds, `INSERT INTO project_meta (
         name, sap_code, pdo_text,
         baseline_year, completion_year, midpoint_date,
         sector, country, executing_agency, responsible_project_staff,
         original_disbursement_deadline, revised_disbursement_deadline
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING id`, [
            PROJECT_META.name,
            PROJECT_META.sap_code,
            PROJECT_META.pdo_text,
            PROJECT_META.baseline_year,
            PROJECT_META.completion_year,
            PROJECT_META.midpoint_date,
            PROJECT_META.sector,
            PROJECT_META.country,
            PROJECT_META.executing_agency,
            PROJECT_META.responsible_project_staff,
            PROJECT_META.original_disbursement_deadline,
            PROJECT_META.revised_disbursement_deadline,
        ]);
        return { id: inserted[0].id, created: true, backfilled: [] };
    }
    const id = existing[0].id;
    await enforceAnchorDates(ds, id);
    const backfilled = await backfillCoverFields(ds, id);
    return { id, created: false, backfilled };
}
async function enforceAnchorDates(ds, id) {
    await (0, helpers_js_1.execAffected)(ds, `UPDATE project_meta
       SET baseline_year   = $1,
           completion_year = $2,
           midpoint_date   = $3
       WHERE id = $4
         AND (baseline_year <> $1
              OR completion_year <> $2
              OR midpoint_date IS DISTINCT FROM $3::date)`, [
        PROJECT_META.baseline_year,
        PROJECT_META.completion_year,
        PROJECT_META.midpoint_date,
        id,
    ]);
}
async function backfillCoverFields(ds, id) {
    const filled = [];
    const textCols = [
        { col: 'name', val: PROJECT_META.name },
        { col: 'sap_code', val: PROJECT_META.sap_code },
        { col: 'pdo_text', val: PROJECT_META.pdo_text },
        { col: 'sector', val: PROJECT_META.sector },
        { col: 'executing_agency', val: PROJECT_META.executing_agency },
        {
            col: 'responsible_project_staff',
            val: PROJECT_META.responsible_project_staff,
        },
    ];
    for (const { col, val } of textCols) {
        const affected = await (0, helpers_js_1.execAffected)(ds, `UPDATE project_meta
         SET ${col} = $1
         WHERE id = $2 AND (${col} IS NULL OR ${col} = '')`, [val, id]);
        if (affected > 0)
            filled.push(col);
    }
    const nullableCols = [
        {
            col: 'original_disbursement_deadline',
            val: PROJECT_META.original_disbursement_deadline,
        },
    ];
    for (const { col, val } of nullableCols) {
        const affected = await (0, helpers_js_1.execAffected)(ds, `UPDATE project_meta
         SET ${col} = $1
         WHERE id = $2 AND ${col} IS NULL`, [val, id]);
        if (affected > 0)
            filled.push(col);
    }
    return filled;
}
const seedProjectMeta = async (ds) => {
    const stats = (0, helpers_js_1.makeStats)();
    const result = await upsertProjectMeta(ds);
    if (result.created) {
        stats.inserted += 1;
    }
    else {
        stats.skipped += 1;
        if (result.backfilled.length > 0) {
            console.log(`  [project_meta] backfilled NULL/empty cover fields: ${result.backfilled.join(', ')}`);
        }
    }
    const metaId = result.id;
    (0, helpers_js_1.logStats)('project_meta', stats);
    const finStats = (0, helpers_js_1.makeStats)();
    for (const fs of FINANCING_SOURCES) {
        const exists = await (0, helpers_js_1.query)(ds, `SELECT id FROM project_financing_sources
         WHERE project_meta_id = $1 AND source_name = $2`, [metaId, fs.source_name]);
        if (exists.length > 0) {
            finStats.skipped += 1;
            continue;
        }
        await ds.query(`INSERT INTO project_financing_sources (
         project_meta_id, source_name, instrument,
         total_approved_ua, disbursed_ua, "order"
       ) VALUES ($1, $2, $3, $4, $5, $6)`, [
            metaId,
            fs.source_name,
            fs.instrument,
            fs.total_approved_ua,
            fs.disbursed_ua,
            fs.order,
        ]);
        finStats.inserted += 1;
    }
    (0, helpers_js_1.logStats)('project_financing_sources', finStats);
};
exports.seedProjectMeta = seedProjectMeta;
//# sourceMappingURL=project-meta.js.map