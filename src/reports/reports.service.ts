import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report } from './report.entity.js';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report)
    private readonly reportRepo: Repository<Report>,
  ) {}

  async findAll() {
    const reports = await this.reportRepo.find({
      order: { created_at: 'DESC' },
    });
    return reports.map((r) => ({
      id: r.id,
      title: r.title,
      generated_by: r.generated_by,
      generated_at: r.generated_at,
      format: r.format,
      filters: r.filters,
      download_url: r.download_url,
    }));
  }

  async generate(
    title: string,
    format: string,
    generatedBy: string,
    filters: Record<string, any>,
  ) {
    const report = this.reportRepo.create({
      title,
      format,
      generated_by: generatedBy,
      generated_at: new Date(),
      filters,
      download_url: '#',
    });
    const saved = await this.reportRepo.save(report);

    return {
      report_id: saved.id,
      download_url: saved.download_url,
      format: saved.format,
    };
  }
}
