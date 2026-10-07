import { CohortsService } from './cohorts.service.js';
export declare class CohortsController {
    private readonly service;
    constructor(service: CohortsService);
    findAll(): Promise<import("./cohort.entity.js").Cohort[]>;
}
