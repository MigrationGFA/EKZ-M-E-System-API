export declare enum DisaggregationAxis {
    SEX = "sex",
    AGE_BAND = "age_band",
    COHORT = "cohort",
    SKILL_LEVEL = "skill_level",
    GEOGRAPHY = "geography",
    UNIVERSITY_ORIGIN = "university_origin"
}
export declare class UpsertDisaggregationDto {
    axis: DisaggregationAxis;
    required?: boolean;
    breakdown_target?: Record<string, number>;
    notes?: string;
}
export declare class SetDisaggregationsDto {
    rules: UpsertDisaggregationDto[];
}
export declare class RollupQueryDto {
    axis: DisaggregationAxis;
}
export declare class ProgressBreakdownDto {
    axis: DisaggregationAxis;
    value_breakdown: Record<string, number>;
}
