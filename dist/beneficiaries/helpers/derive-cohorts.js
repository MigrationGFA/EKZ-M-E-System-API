"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ageFromDob = ageFromDob;
exports.deriveCohortCodes = deriveCohortCodes;
function ageFromDob(dob, now = new Date()) {
    if (!dob)
        return null;
    const birth = new Date(dob);
    if (Number.isNaN(birth.getTime()))
        return null;
    let age = now.getFullYear() - birth.getFullYear();
    const mDiff = now.getMonth() - birth.getMonth();
    if (mDiff < 0 || (mDiff === 0 && now.getDate() < birth.getDate())) {
        age -= 1;
    }
    return age;
}
function deriveCohortCodes(input, now = new Date()) {
    const codes = new Set();
    const age = ageFromDob(input.date_of_birth ?? null, now);
    if (age !== null && age >= 18 && age <= 35) {
        codes.add('youth');
    }
    if (input.sex === 'female') {
        codes.add('woman');
    }
    const community = (input.community ?? '').toLowerCase();
    const isAgoAraromi = /ago[\s-]?araromi/.test(community);
    const isIjanEkiti = /ijan[\s-]?ekiti/.test(community);
    if (isAgoAraromi)
        codes.add('ekz_affected_ago_araromi');
    if (isIjanEkiti)
        codes.add('ekz_affected_ijan_ekiti');
    if (isAgoAraromi || isIjanEkiti) {
        codes.add('ekz_affected_resettled');
        if (codes.has('youth')) {
            codes.add('affected_household_youth');
        }
    }
    if (input.disability_status === true) {
        codes.add('pwd');
    }
    return Array.from(codes);
}
//# sourceMappingURL=derive-cohorts.js.map