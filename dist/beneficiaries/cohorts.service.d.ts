import { Repository } from 'typeorm';
import { Cohort } from './cohort.entity.js';
export declare class CohortsService {
    private readonly repo;
    constructor(repo: Repository<Cohort>);
    findAll(): Promise<Cohort[]>;
    findByCodeOrThrow(code: string): Promise<Cohort>;
    findByCodes(codes: string[]): Promise<Cohort[]>;
}
