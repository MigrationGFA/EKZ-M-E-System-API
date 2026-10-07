"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expectedAt = expectedAt;
function expectedAt(indicator, yearTargets, asOf, options) {
    if (yearTargets.length === 0) {
        return Number(indicator.target);
    }
    const sorted = [...yearTargets]
        .map((t) => ({ year: t.year, target_value: Number(t.target_value) }))
        .sort((a, b) => a.year - b.year);
    switch (indicator.target_mode) {
        case 'binary':
            return binaryExpected(sorted, asOf);
        case 'incremental':
            return incrementalExpected(sorted, asOf);
        case 'cumulative':
        default:
            return cumulativeExpected(sorted, Number(indicator.baseline), asOf, options?.baselineDate);
    }
}
function binaryExpected(sorted, asOf) {
    const asOfYear = asOf.getUTCFullYear();
    let result = 0;
    for (const t of sorted) {
        if (t.year <= asOfYear)
            result = t.target_value;
    }
    return result;
}
function incrementalExpected(sorted, asOf) {
    const asOfYear = asOf.getUTCFullYear();
    let total = 0;
    for (const t of sorted) {
        if (t.year < asOfYear) {
            total += t.target_value;
        }
        else if (t.year === asOfYear) {
            total += t.target_value * yearFraction(asOf);
        }
    }
    return total;
}
function cumulativeExpected(sorted, baseline, asOf, baselineDate) {
    const first = sorted[0];
    const firstDate = jan1Utc(first.year);
    if (asOf < firstDate) {
        if (baselineDate && baselineDate < firstDate) {
            const clampedAsOf = asOf < baselineDate ? baselineDate : asOf;
            return interpolateByYear(baselineDate.getUTCFullYear(), baseline, first.year, first.target_value, clampedAsOf);
        }
        return baseline;
    }
    for (let i = 0; i < sorted.length - 1; i++) {
        const lowerDate = jan1Utc(sorted[i].year);
        const upperDate = jan1Utc(sorted[i + 1].year);
        if (asOf >= lowerDate && asOf < upperDate) {
            return interpolateByYear(sorted[i].year, sorted[i].target_value, sorted[i + 1].year, sorted[i + 1].target_value, asOf);
        }
    }
    return sorted[sorted.length - 1].target_value;
}
function jan1Utc(year) {
    return new Date(Date.UTC(year, 0, 1));
}
function yearFraction(asOf) {
    const year = asOf.getUTCFullYear();
    const start = Date.UTC(year, 0, 1);
    const end = Date.UTC(year + 1, 0, 1);
    return (asOf.getTime() - start) / (end - start);
}
function interpolateByYear(fromYear, v1, toYear, v2, asOf) {
    const span = toYear - fromYear;
    if (span === 0)
        return v1;
    const yearsElapsed = asOf.getUTCFullYear() - fromYear + yearFraction(asOf);
    return v1 + (v2 - v1) * (yearsElapsed / span);
}
//# sourceMappingURL=expected-progress.js.map