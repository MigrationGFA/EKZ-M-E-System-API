export declare const MAPPABLE_DATA_SOURCE_TYPES: readonly ["form_submission", "manual"];
export type MappableDataSourceType = (typeof MAPPABLE_DATA_SOURCE_TYPES)[number];
export declare function isMappableDataSourceType(value: string): boolean;
