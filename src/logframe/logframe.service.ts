import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LogframeNode } from './logframe-node.entity.js';
import { Indicator } from '../indicators/indicator.entity.js';
import { CreateNodeDto } from './dto/create-node.dto.js';
import { UpdateNodeDto } from './dto/update-node.dto.js';
import { AuditService } from '../audit/audit.service.js';

const PARENT_TYPE_MAP: Record<string, string | null> = {
  goal: null,
  outcome: 'goal',
  output: 'outcome',
  activity: 'output',
};

export interface SerializedIndicator {
  id: string;
  code: string;
  name: string;
  description: string;
  level: string;
  unit: string;
  baseline: number;
  target: number;
  current_value: number;
  status: string;
  frequency: string;
  logframe_level_id: string | null;
  sdg_ids: number[];
  responsible_party: string;
  means_of_verification: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LogframeTreeNode {
  id: string;
  logframe_id: string;
  type: string;
  code: string;
  title: string;
  description: string | null;
  parent_id: string | null;
  order: number;
  indicators: SerializedIndicator[];
  children: LogframeTreeNode[];
}

@Injectable()
export class LogframeService {
  constructor(
    @InjectRepository(LogframeNode)
    private readonly nodeRepo: Repository<LogframeNode>,
    @InjectRepository(Indicator)
    private readonly indicatorRepo: Repository<Indicator>,
    private readonly auditService: AuditService,
  ) {}

  async getTree() {
    const nodes = await this.nodeRepo.find({ order: { order: 'ASC' } });
    const indicators = await this.indicatorRepo.find();

    // Build indicator lookup by logframe_level_id
    const indicatorsByNode = new Map<string, SerializedIndicator[]>();
    for (const ind of indicators) {
      if (ind.logframe_level_id) {
        if (!indicatorsByNode.has(ind.logframe_level_id)) {
          indicatorsByNode.set(ind.logframe_level_id, []);
        }
        indicatorsByNode
          .get(ind.logframe_level_id)!
          .push(this.serializeIndicator(ind));
      }
    }

    // Build tree in memory
    const nodeMap = new Map<string, LogframeTreeNode>();
    for (const node of nodes) {
      nodeMap.set(node.id, {
        id: node.id,
        logframe_id: node.logframe_id,
        type: node.type,
        code: node.code,
        title: node.title,
        description: node.description,
        parent_id: node.parent_id,
        order: node.order,
        indicators: indicatorsByNode.get(node.id) ?? [],
        children: [],
      });
    }

    const roots: LogframeTreeNode[] = [];
    for (const node of nodeMap.values()) {
      if (node.parent_id && nodeMap.has(node.parent_id)) {
        nodeMap.get(node.parent_id)!.children.push(node);
      } else if (!node.parent_id) {
        roots.push(node);
      }
    }

    return roots;
  }

  async createNode(dto: CreateNodeDto, actorId: string, actorName: string) {
    await this.validateParentConstraint(dto.type, dto.parent_id ?? null);

    const node = this.nodeRepo.create({
      type: dto.type,
      code: dto.code,
      title: dto.title,
      description: dto.description ?? null,
      parent_id: dto.parent_id ?? null,
      order: dto.order ?? 0,
    });

    const saved = await this.nodeRepo.save(node);
    const result = {
      ...saved,
      indicators: [],
      children: [],
    };

    void this.auditService.log({
      user_id: actorId,
      user_name: actorName,
      action: 'create',
      resource: 'logframe_node',
      resource_id: saved.id,
      after_data: {
        id: saved.id,
        type: saved.type,
        code: saved.code,
        title: saved.title,
        parent_id: saved.parent_id,
      },
    });

    return result;
  }

  async updateNode(
    id: string,
    dto: UpdateNodeDto,
    actorId: string,
    actorName: string,
  ) {
    const node = await this.nodeRepo.findOne({ where: { id } });
    if (!node) throw new NotFoundException('Node not found');

    const beforeData = {
      id: node.id,
      type: node.type,
      code: node.code,
      title: node.title,
      description: node.description,
      parent_id: node.parent_id,
      order: node.order,
    };

    const newType = dto.type ?? node.type;
    const newParentId =
      dto.parent_id !== undefined ? dto.parent_id : node.parent_id;
    await this.validateParentConstraint(newType, newParentId ?? null);

    const updates = Object.fromEntries(
      Object.entries(dto).filter(([, v]) => v !== undefined),
    );
    Object.assign(node, updates);
    const saved = await this.nodeRepo.save(node);

    // Fetch indicators linked to this node
    const indicators = await this.indicatorRepo.find({
      where: { logframe_level_id: saved.id },
    });

    const afterData = {
      id: saved.id,
      type: saved.type,
      code: saved.code,
      title: saved.title,
      description: saved.description,
      parent_id: saved.parent_id,
      order: saved.order,
    };

    void this.auditService.log({
      user_id: actorId,
      user_name: actorName,
      action: 'update',
      resource: 'logframe_node',
      resource_id: saved.id,
      before_data: beforeData,
      after_data: afterData,
    });

    return {
      ...saved,
      indicators: indicators.map((i) => this.serializeIndicator(i)),
      children: [],
    };
  }

  async deleteNode(id: string, actorId: string, actorName: string) {
    const node = await this.nodeRepo.findOne({ where: { id } });
    if (!node) throw new NotFoundException('Node not found');

    const childCount = await this.nodeRepo.count({
      where: { parent_id: id },
    });
    if (childCount > 0) {
      throw new BadRequestException(
        'Cannot delete node with children. Remove children first.',
      );
    }

    const beforeData = {
      id: node.id,
      type: node.type,
      code: node.code,
      title: node.title,
      description: node.description,
      parent_id: node.parent_id,
      order: node.order,
    };

    await this.nodeRepo.remove(node);

    void this.auditService.log({
      user_id: actorId,
      user_name: actorName,
      action: 'delete',
      resource: 'logframe_node',
      resource_id: id,
      before_data: beforeData,
    });
  }

  async linkIndicator(
    nodeId: string,
    indicatorId: string,
    actorId: string,
    actorName: string,
  ) {
    const node = await this.nodeRepo.findOne({ where: { id: nodeId } });
    if (!node) throw new NotFoundException('Node not found');

    const indicator = await this.indicatorRepo.findOne({
      where: { id: indicatorId },
    });
    if (!indicator) throw new NotFoundException('Indicator not found');

    if (indicator.logframe_level_id === nodeId) {
      throw new ConflictException('Indicator already linked to this node');
    }

    indicator.logframe_level_id = nodeId;
    await this.indicatorRepo.save(indicator);

    void this.auditService.log({
      user_id: actorId,
      user_name: actorName,
      action: 'update',
      resource: 'indicator',
      resource_id: indicatorId,
      after_data: { logframe_level_id: nodeId },
    });

    return { success: true };
  }

  async unlinkIndicator(
    nodeId: string,
    indicatorId: string,
    actorId: string,
    actorName: string,
  ) {
    const indicator = await this.indicatorRepo.findOne({
      where: { id: indicatorId, logframe_level_id: nodeId },
    });
    if (!indicator) throw new NotFoundException('Indicator link not found');

    indicator.logframe_level_id = null;
    await this.indicatorRepo.save(indicator);

    void this.auditService.log({
      user_id: actorId,
      user_name: actorName,
      action: 'update',
      resource: 'indicator',
      resource_id: indicatorId,
      after_data: { logframe_level_id: null },
    });
  }

  private async validateParentConstraint(
    type: string,
    parentId: string | null,
  ) {
    const requiredParentType = PARENT_TYPE_MAP[type];

    if (requiredParentType === null) {
      if (parentId !== null) {
        throw new BadRequestException(
          `A "${type}" node must not have a parent`,
        );
      }
      return;
    }

    if (!parentId) {
      throw new BadRequestException(
        `A "${type}" node requires a parent of type "${requiredParentType}"`,
      );
    }

    const parent = await this.nodeRepo.findOne({ where: { id: parentId } });
    if (!parent) throw new NotFoundException('Parent node not found');

    if (parent.type !== requiredParentType) {
      throw new BadRequestException(
        `A "${type}" node requires a parent of type "${requiredParentType}", but got "${parent.type}"`,
      );
    }
  }

  private serializeIndicator(ind: Indicator): SerializedIndicator {
    return {
      id: ind.id,
      code: ind.code,
      name: ind.name,
      description: ind.description,
      level: ind.level,
      unit: ind.unit,
      baseline: Number(ind.baseline),
      target: Number(ind.target),
      current_value: Number(ind.current_value),
      status: ind.status,
      frequency: ind.frequency,
      logframe_level_id: ind.logframe_level_id,
      sdg_ids: ind.sdg_ids,
      responsible_party: ind.responsible_party,
      means_of_verification: ind.means_of_verification,
      createdAt: ind.created_at,
      updatedAt: ind.updated_at,
    };
  }
}
