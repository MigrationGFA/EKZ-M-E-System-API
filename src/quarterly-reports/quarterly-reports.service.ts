import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  QuarterlyProgressReport,
  UnanticipatedResult,
} from './quarterly-progress-report.entity.js';
import { UpsertQuarterlyReportDto } from './dto/upsert-quarterly-report.dto.js';
import { AuditService } from '../audit/audit.service.js';

/**
 * Phase 9.5 — QPR narrative store. UPSERT semantics keyed by
 * (year, quarter). One row per period; re-running getOrCreate or
 * upsert with the same period updates in place.
 */
@Injectable()
export class QuarterlyReportsService {
  constructor(
    @InjectRepository(QuarterlyProgressReport)
    private readonly repo: Repository<QuarterlyProgressReport>,
    private readonly auditService: AuditService,
  ) {}

  async findOne(
    year: number,
    quarter: number,
  ): Promise<QuarterlyProgressReport | null> {
    this.assertValidQuarter(quarter);
    return this.repo.findOne({ where: { year, quarter } });
  }

  /**
   * Returns the existing row for (year, quarter), or creates a blank
   * one with all narrative fields defaulted to empty string. Useful for
   * the admin form so the editor opens against a row that exists.
   */
  async getOrCreate(
    year: number,
    quarter: number,
    actorId: string,
    actorName: string,
  ): Promise<QuarterlyProgressReport> {
    this.assertValidQuarter(quarter);
    const existing = await this.repo.findOne({ where: { year, quarter } });
    if (existing) return existing;
    const fresh = this.repo.create({
      year,
      quarter,
      unanticipated_results: [],
    });
    const saved = await this.repo.save(fresh);
    void this.auditService.log({
      user_id: actorId,
      user_name: actorName,
      action: 'create',
      resource: 'quarterly_progress_report',
      resource_id: saved.id,
      after_data: this.snapshot(saved),
    });
    return saved;
  }

  async upsert(
    year: number,
    quarter: number,
    dto: UpsertQuarterlyReportDto,
    actorId: string,
    actorName: string,
  ): Promise<QuarterlyProgressReport> {
    this.assertValidQuarter(quarter);
    const existing = await this.repo.findOne({ where: { year, quarter } });
    if (existing) {
      const before = this.snapshot(existing);
      this.applyDto(existing, dto);
      const saved = await this.repo.save(existing);
      void this.auditService.log({
        user_id: actorId,
        user_name: actorName,
        action: 'update',
        resource: 'quarterly_progress_report',
        resource_id: saved.id,
        before_data: before,
        after_data: this.snapshot(saved),
      });
      return saved;
    }
    const fresh = this.repo.create({
      year,
      quarter,
      unanticipated_results: [],
    });
    this.applyDto(fresh, dto);
    const saved = await this.repo.save(fresh);
    void this.auditService.log({
      user_id: actorId,
      user_name: actorName,
      action: 'create',
      resource: 'quarterly_progress_report',
      resource_id: saved.id,
      after_data: this.snapshot(saved),
    });
    return saved;
  }

  /**
   * Marks a generated_at / generated_by stamp on the row. Called from
   * ReportsService.generate() so the PDF carries an accurate "generated"
   * timestamp on its cover, and the admin form can show "last generated".
   */
  async markGenerated(
    year: number,
    quarter: number,
    generatedBy: string,
  ): Promise<QuarterlyProgressReport> {
    this.assertValidQuarter(quarter);
    const existing = await this.repo.findOne({ where: { year, quarter } });
    if (!existing) {
      throw new NotFoundException(
        `Quarterly report for ${year}-Q${quarter} not found`,
      );
    }
    existing.generated_at = new Date();
    existing.generated_by = generatedBy;
    return this.repo.save(existing);
  }

  private applyDto(
    row: QuarterlyProgressReport,
    dto: UpsertQuarterlyReportDto,
  ): void {
    if (dto.executive_summary !== undefined)
      row.executive_summary = dto.executive_summary;
    if (dto.pdo_assessment !== undefined)
      row.pdo_assessment = dto.pdo_assessment;
    if (dto.unanticipated_results !== undefined)
      row.unanticipated_results =
        dto.unanticipated_results as UnanticipatedResult[];
    if (dto.bank_performance_assessment !== undefined)
      row.bank_performance_assessment = dto.bank_performance_assessment;
    if (dto.borrower_performance_assessment !== undefined)
      row.borrower_performance_assessment = dto.borrower_performance_assessment;
    if (dto.cofinancier_performance_assessment !== undefined)
      row.cofinancier_performance_assessment =
        dto.cofinancier_performance_assessment;
    if (dto.pmt_status !== undefined) row.pmt_status = dto.pmt_status;
    if (dto.awp_planned_next_qtr !== undefined)
      row.awp_planned_next_qtr = dto.awp_planned_next_qtr;
  }

  private assertValidQuarter(quarter: number): void {
    if (!Number.isInteger(quarter) || quarter < 1 || quarter > 4) {
      throw new UnprocessableEntityException(
        `quarter must be an integer 1–4 (got ${quarter})`,
      );
    }
  }

  private snapshot(row: QuarterlyProgressReport) {
    return {
      id: row.id,
      year: row.year,
      quarter: row.quarter,
      executive_summary: row.executive_summary,
      pdo_assessment: row.pdo_assessment,
      unanticipated_results: row.unanticipated_results,
      bank_performance_assessment: row.bank_performance_assessment,
      borrower_performance_assessment: row.borrower_performance_assessment,
      cofinancier_performance_assessment:
        row.cofinancier_performance_assessment,
      pmt_status: row.pmt_status,
      awp_planned_next_qtr: row.awp_planned_next_qtr,
      generated_at: row.generated_at,
      generated_by: row.generated_by,
    };
  }
}
