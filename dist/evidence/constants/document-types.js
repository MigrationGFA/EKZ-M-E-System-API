"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DOCUMENT_TYPE_CONFIG = exports.DOCUMENT_TYPES = void 0;
exports.isDocumentType = isDocumentType;
exports.computeRetentionUntil = computeRetentionUntil;
exports.isMimeAllowed = isMimeAllowed;
const user_role_enum_js_1 = require("../../common/enums/user-role.enum.js");
exports.DOCUMENT_TYPES = [
    'contractor_supervision_report',
    'contractor_progress_report',
    'third_party_monitoring_report',
    'financial_statement',
    'fund_portfolio_report',
    'beneficiary_tracer_study',
    'beneficiary_assessment',
    'policy_document',
    'mou',
    'incubation_report',
    'roadshow_report',
    'rap_implementation_report',
    'ekdipa_quarterly_report',
    'ekdipa_annual_report',
    'external_data_extract',
    'photo_evidence',
    'audit_report',
    'other',
];
const ADMIN_ME_READ = [
    { roles: [user_role_enum_js_1.UserRole.ADMIN, user_role_enum_js_1.UserRole.ME_STAFF], scope: 'all' },
];
const ADMIN_ME_PROG_READ = [
    {
        roles: [user_role_enum_js_1.UserRole.ADMIN, user_role_enum_js_1.UserRole.ME_STAFF, user_role_enum_js_1.UserRole.PROGRAMME_STAFF],
        scope: 'all',
    },
];
const ADMIN_ME_WRITE = [user_role_enum_js_1.UserRole.ADMIN, user_role_enum_js_1.UserRole.ME_STAFF];
const ADMIN_ME_PROG_WRITE = [
    user_role_enum_js_1.UserRole.ADMIN,
    user_role_enum_js_1.UserRole.ME_STAFF,
    user_role_enum_js_1.UserRole.PROGRAMME_STAFF,
];
const MB = 1024 * 1024;
const DOC_MAX = 50 * MB;
const PHOTO_MAX = 10 * MB;
const DOC_MIME_PREFIXES = [
    'application/pdf',
    'image/',
    'application/vnd.openxmlformats-officedocument.',
    'text/csv',
    'application/zip',
];
const PHOTO_MIME_PREFIXES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
];
const PERIOD_FIELDS = ['reference_period_from', 'reference_period_to'];
exports.DOCUMENT_TYPE_CONFIG = {
    contractor_supervision_report: {
        read: ADMIN_ME_READ,
        write: ADMIN_ME_WRITE,
        retentionYears: 7,
        maxSizeBytes: DOC_MAX,
        allowedMimePrefixes: DOC_MIME_PREFIXES,
        requiredMetadataFields: [...PERIOD_FIELDS, 'contractor_name'],
    },
    contractor_progress_report: {
        read: ADMIN_ME_READ,
        write: ADMIN_ME_WRITE,
        retentionYears: 7,
        maxSizeBytes: DOC_MAX,
        allowedMimePrefixes: DOC_MIME_PREFIXES,
        requiredMetadataFields: [...PERIOD_FIELDS, 'contractor_name'],
    },
    third_party_monitoring_report: {
        read: ADMIN_ME_READ,
        write: ADMIN_ME_WRITE,
        retentionYears: 7,
        maxSizeBytes: DOC_MAX,
        allowedMimePrefixes: DOC_MIME_PREFIXES,
        requiredMetadataFields: [...PERIOD_FIELDS, 'consultant_name'],
    },
    financial_statement: {
        read: ADMIN_ME_READ,
        write: ADMIN_ME_WRITE,
        retentionYears: 10,
        maxSizeBytes: DOC_MAX,
        allowedMimePrefixes: DOC_MIME_PREFIXES,
        requiredMetadataFields: [...PERIOD_FIELDS, 'audited', 'currency'],
    },
    fund_portfolio_report: {
        read: ADMIN_ME_READ,
        write: ADMIN_ME_WRITE,
        retentionYears: 7,
        maxSizeBytes: DOC_MAX,
        allowedMimePrefixes: DOC_MIME_PREFIXES,
        requiredMetadataFields: [...PERIOD_FIELDS, 'fund_manager_name'],
    },
    beneficiary_tracer_study: {
        read: ADMIN_ME_READ,
        write: ADMIN_ME_WRITE,
        retentionYears: 7,
        maxSizeBytes: DOC_MAX,
        allowedMimePrefixes: DOC_MIME_PREFIXES,
        requiredMetadataFields: [...PERIOD_FIELDS, 'cohort_code', 'sample_size'],
    },
    beneficiary_assessment: {
        read: ADMIN_ME_READ,
        write: ADMIN_ME_WRITE,
        retentionYears: 7,
        maxSizeBytes: DOC_MAX,
        allowedMimePrefixes: DOC_MIME_PREFIXES,
        requiredMetadataFields: [...PERIOD_FIELDS, 'methodology'],
    },
    policy_document: {
        read: ADMIN_ME_PROG_READ,
        write: ADMIN_ME_WRITE,
        retentionYears: 100,
        maxSizeBytes: DOC_MAX,
        allowedMimePrefixes: DOC_MIME_PREFIXES,
        requiredMetadataFields: ['policy_status', 'approval_date'],
    },
    mou: {
        read: ADMIN_ME_PROG_READ,
        write: ADMIN_ME_WRITE,
        retentionYears: 100,
        maxSizeBytes: DOC_MAX,
        allowedMimePrefixes: DOC_MIME_PREFIXES,
        requiredMetadataFields: ['counterparty_name', 'effective_date'],
    },
    incubation_report: {
        read: ADMIN_ME_READ,
        write: ADMIN_ME_WRITE,
        retentionYears: 5,
        maxSizeBytes: DOC_MAX,
        allowedMimePrefixes: DOC_MIME_PREFIXES,
        requiredMetadataFields: [...PERIOD_FIELDS, 'centre_id'],
    },
    roadshow_report: {
        read: ADMIN_ME_READ,
        write: ADMIN_ME_WRITE,
        retentionYears: 5,
        maxSizeBytes: DOC_MAX,
        allowedMimePrefixes: DOC_MIME_PREFIXES,
        requiredMetadataFields: ['event_date', 'location', 'attendee_count'],
    },
    rap_implementation_report: {
        read: ADMIN_ME_READ,
        write: ADMIN_ME_WRITE,
        retentionYears: 10,
        maxSizeBytes: DOC_MAX,
        allowedMimePrefixes: DOC_MIME_PREFIXES,
        requiredMetadataFields: [...PERIOD_FIELDS],
    },
    ekdipa_quarterly_report: {
        read: ADMIN_ME_READ,
        write: ADMIN_ME_WRITE,
        retentionYears: 5,
        maxSizeBytes: DOC_MAX,
        allowedMimePrefixes: DOC_MIME_PREFIXES,
        requiredMetadataFields: [...PERIOD_FIELDS, 'quarter_label'],
    },
    ekdipa_annual_report: {
        read: ADMIN_ME_READ,
        write: ADMIN_ME_WRITE,
        retentionYears: 5,
        maxSizeBytes: DOC_MAX,
        allowedMimePrefixes: DOC_MIME_PREFIXES,
        requiredMetadataFields: ['reporting_year'],
    },
    external_data_extract: {
        read: [
            {
                roles: [
                    user_role_enum_js_1.UserRole.ADMIN,
                    user_role_enum_js_1.UserRole.ME_STAFF,
                    user_role_enum_js_1.UserRole.VIEWER,
                    user_role_enum_js_1.UserRole.PROGRAMME_STAFF,
                ],
                scope: 'all',
            },
        ],
        write: ADMIN_ME_WRITE,
        retentionYears: 5,
        maxSizeBytes: DOC_MAX,
        allowedMimePrefixes: DOC_MIME_PREFIXES,
        requiredMetadataFields: ['source_name', 'extract_date'],
    },
    photo_evidence: {
        read: [
            { roles: [user_role_enum_js_1.UserRole.ADMIN, user_role_enum_js_1.UserRole.ME_STAFF], scope: 'all' },
            { roles: [user_role_enum_js_1.UserRole.PROGRAMME_STAFF], scope: 'own' },
        ],
        write: ADMIN_ME_PROG_WRITE,
        retentionYears: 5,
        maxSizeBytes: PHOTO_MAX,
        allowedMimePrefixes: PHOTO_MIME_PREFIXES,
        requiredMetadataFields: [],
    },
    audit_report: {
        read: ADMIN_ME_READ,
        write: ADMIN_ME_WRITE,
        retentionYears: 10,
        maxSizeBytes: DOC_MAX,
        allowedMimePrefixes: DOC_MIME_PREFIXES,
        requiredMetadataFields: ['reporting_year', 'auditor_name', 'audit_scope'],
    },
    other: {
        read: ADMIN_ME_READ,
        write: ADMIN_ME_WRITE,
        retentionYears: 5,
        maxSizeBytes: DOC_MAX,
        allowedMimePrefixes: DOC_MIME_PREFIXES,
        requiredMetadataFields: ['description'],
    },
};
function isDocumentType(value) {
    return exports.DOCUMENT_TYPES.includes(value);
}
function computeRetentionUntil(type, uploadedAt = new Date()) {
    const config = exports.DOCUMENT_TYPE_CONFIG[type];
    const out = new Date(uploadedAt);
    out.setUTCFullYear(out.getUTCFullYear() + config.retentionYears);
    return out;
}
function isMimeAllowed(type, mime) {
    const { allowedMimePrefixes } = exports.DOCUMENT_TYPE_CONFIG[type];
    return allowedMimePrefixes.some((prefix) => prefix.endsWith('/') ? mime.startsWith(prefix) : mime === prefix);
}
//# sourceMappingURL=document-types.js.map