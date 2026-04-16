import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report } from './report.entity.js';
import { MailService } from '../mail/mail.service.js';
import { AuditService } from '../audit/audit.service.js';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report)
    private readonly reportRepo: Repository<Report>,
    private readonly mailService: MailService,
    private readonly auditService: AuditService,
  ) {}

  async findAll() {
    const reports = await this.reportRepo.find({
      order: { created_at: 'DESC' },
    });
    return reports.map((r) => ({
      id: r.id,
      title: r.title,
      generatedBy: r.generated_by,
      generatedAt: r.generated_at,
      format: r.format,
      filters: r.filters,
      downloadUrl: r.download_url,
    }));
  }

  async generate(
    title: string,
    format: string,
    generatedBy: string,
    filters: Record<string, any>,
    generatorEmail: string,
    actorId: string,
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

    void this.auditService.log({
      user_id: actorId,
      user_name: generatorEmail,
      action: 'create',
      resource: 'report',
      resource_id: saved.id,
      after_data: { title, format, filters, generated_by: generatedBy },
    });

    void this.mailService.sendReportReady(
      generatorEmail,
      generatedBy,
      title,
      format,
    );

    return {
      report_id: saved.id,
      download_url: saved.download_url,
      format: saved.format,
    };
  }
}
