import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Form } from './form.entity.js';
import { CreateFormDto } from './dto/create-form.dto.js';
import { UpdateFormDto } from './dto/update-form.dto.js';

@Injectable()
export class FormsService {
  constructor(
    @InjectRepository(Form)
    private readonly formRepo: Repository<Form>,
  ) {}

  async findAll(filters: { status?: string; assigned_to?: string }) {
    const qb = this.formRepo.createQueryBuilder('f');

    if (filters.status) {
      qb.andWhere('f.status = :status', { status: filters.status });
    }
    if (filters.assigned_to) {
      qb.andWhere(':userId = ANY(f.assigned_to)', {
        userId: filters.assigned_to,
      });
    }

    qb.orderBy('f.created_at', 'DESC');
    const forms = await qb.getMany();
    return forms.map((f) => this.serialize(f));
  }

  async findOne(id: string) {
    const form = await this.formRepo.findOne({ where: { id } });
    if (!form) throw new NotFoundException('Form not found');
    return this.serialize(form);
  }

  async create(dto: CreateFormDto) {
    const form = this.formRepo.create({
      title: dto.title,
      description: dto.description ?? '',
      fields: dto.fields ?? [],
      indicator_ids: dto.indicator_ids ?? [],
      assigned_to: dto.assigned_to ?? [],
      created_by: dto.created_by,
      status: dto.status ?? 'draft',
    });
    const saved = await this.formRepo.save(form);
    return this.serialize(saved);
  }

  async update(id: string, dto: UpdateFormDto) {
    const form = await this.formRepo.findOne({ where: { id } });
    if (!form) throw new NotFoundException('Form not found');
    const updates = Object.fromEntries(
      Object.entries(dto).filter(([, v]) => v !== undefined),
    );
    Object.assign(form, updates);
    const saved = await this.formRepo.save(form);
    return this.serialize(saved);
  }

  async remove(id: string) {
    const form = await this.formRepo.findOne({ where: { id } });
    if (!form) throw new NotFoundException('Form not found');
    await this.formRepo.remove(form);
  }

  private serialize(f: Form) {
    return {
      id: f.id,
      title: f.title,
      description: f.description,
      fields: f.fields,
      indicator_ids: f.indicator_ids,
      assigned_to: f.assigned_to,
      created_by: f.created_by,
      status: f.status,
      createdAt: f.created_at,
    };
  }
}
