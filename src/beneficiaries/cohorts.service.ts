import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Cohort } from './cohort.entity.js';

@Injectable()
export class CohortsService {
  constructor(
    @InjectRepository(Cohort)
    private readonly repo: Repository<Cohort>,
  ) {}

  findAll(): Promise<Cohort[]> {
    return this.repo.find({ order: { code: 'ASC' } });
  }

  async findByCodeOrThrow(code: string): Promise<Cohort> {
    const cohort = await this.repo.findOne({ where: { code } });
    if (!cohort) {
      throw new NotFoundException(`Cohort with code "${code}" not found`);
    }
    return cohort;
  }

  findByCodes(codes: string[]): Promise<Cohort[]> {
    if (codes.length === 0) return Promise.resolve([]);
    return this.repo.find({ where: { code: In(codes) } });
  }
}
