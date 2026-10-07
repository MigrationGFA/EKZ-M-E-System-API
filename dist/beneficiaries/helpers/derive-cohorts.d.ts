export interface DeriveInput {
    sex?: string | null;
    date_of_birth?: string | null;
    community?: string | null;
    disability_status?: boolean | null;
}
export declare function ageFromDob(dob: string | null | undefined, now?: Date): number | null;
export declare function deriveCohortCodes(input: DeriveInput, now?: Date): string[];
