import { DataSource } from 'typeorm';
import {
  execAffected,
  logStats,
  makeStats,
  query,
  type Seeder,
} from './helpers.js';

/**
 * Phase 10 — logframe scaffold.
 *
 * Builds the parallel-branch tree from ADR 0002:
 *
 *   PDO (singleton)
 *   ├─ Alignment   (context-only, holds the two NBS-sourced indicators)
 *   ├─ Outcome Statements 1..4 (siblings of components)
 *   └─ Components 1..3 (carry budget_usd)
 *        └─ Output Statements 1..6
 *
 * Activity nodes are intentionally omitted — the Monitoring Plan does not
 * provide activity-level breakdowns; the admin UI can add them once the
 * AWP is signed off.
 *
 * Idempotency: each node is identified by (code, type). On a re-run the
 * title / description / parent / budget / order are reconciled to the
 * canonical values; legacy goal/outcome rows from earlier dev testing are
 * left untouched and will be removed by the deferred cleanup migration.
 */

const LOGFRAME_ID = 'lf_1';

interface NodeSpec {
  code: string;
  type:
    | 'pdo'
    | 'alignment'
    | 'outcome_statement'
    | 'component'
    | 'output_statement'
    | 'activity';
  title: string;
  description: string | null;
  parentCode: string | null;
  parentType: string | null;
  order: number;
  budget_usd: number | null;
}

const PDO: NodeSpec = {
  code: 'PDO',
  type: 'pdo',
  title: 'Ekiti Knowledge Zone Project — PDO',
  description:
    'To promote knowledge economy value chain through innovation and entrepreneurship in technology industry.',
  parentCode: null,
  parentType: null,
  order: 0,
  budget_usd: null,
};

const ALIGNMENT: NodeSpec = {
  code: 'AL',
  type: 'alignment',
  title: 'Alignment Indicators',
  description:
    'Country / sector indicators the project contributes to, sourced from Nigeria Bureau of Statistics. Context-only — does not roll up into project performance scoring (see ADR 0002).',
  parentCode: 'PDO',
  parentType: 'pdo',
  order: 0,
  budget_usd: null,
};

const OUTCOMES: NodeSpec[] = [
  {
    code: 'OS-1',
    type: 'outcome_statement',
    title: 'Jobs created',
    description: 'Direct and indirect jobs created through EKZ activities.',
    parentCode: 'PDO',
    parentType: 'pdo',
    order: 1,
    budget_usd: null,
  },
  {
    code: 'OS-2',
    type: 'outcome_statement',
    title: 'Digital talents and research base developed',
    description:
      'Youth trained in ICT skills linked to job opportunities and new technology / digital-enabled businesses created.',
    parentCode: 'PDO',
    parentType: 'pdo',
    order: 2,
    budget_usd: null,
  },
  {
    code: 'OS-3',
    type: 'outcome_statement',
    title: 'Investments in EKZ promoted',
    description:
      'Firms operating in EKZ, operating revenue generated, and additional financing mobilised to investee companies.',
    parentCode: 'PDO',
    parentType: 'pdo',
    order: 3,
    budget_usd: null,
  },
  {
    code: 'OS-4',
    type: 'outcome_statement',
    title: 'Climate change and green growth promoted',
    description:
      'Estimated GHG emission savings and number of climate-resilience / green-growth measures implemented.',
    parentCode: 'PDO',
    parentType: 'pdo',
    order: 4,
    budget_usd: null,
  },
];

const COMPONENTS: NodeSpec[] = [
  {
    code: 'C-1',
    type: 'component',
    title: 'Enabling Infrastructure Support Knowledge Economy',
    description:
      'Physical and digital infrastructure that anchors the Knowledge Zone — Smart Green City innovation park, utilities, fibre, energy, water, waste.',
    parentCode: 'PDO',
    parentType: 'pdo',
    order: 10,
    budget_usd: 65_000_000,
  },
  {
    code: 'C-2',
    type: 'component',
    title: 'Building Talents and Creating Innovation Demand',
    description:
      'Skills, innovation clusters, university alliances, hackathons, and pre-seed / seed financing for start-ups.',
    parentCode: 'PDO',
    parentType: 'pdo',
    order: 11,
    budget_usd: 10_400_000,
  },
  {
    code: 'C-3',
    type: 'component',
    title: 'Enabling Business Environment and Institutional Support',
    description:
      'SPV, innovation and climate policy, investor outreach, and resettlement compensation.',
    parentCode: 'PDO',
    parentType: 'pdo',
    order: 12,
    budget_usd: 4_400_000,
  },
];

const OUTPUT_STATEMENTS: NodeSpec[] = [
  {
    code: 'OUT-1',
    type: 'output_statement',
    title: 'Innovation Park Developed (Smart Green City)',
    description:
      'Data centre, green buildings, fibre optic spine for the EKZ site.',
    parentCode: 'C-1',
    parentType: 'component',
    order: 1,
    budget_usd: null,
  },
  {
    code: 'OUT-2',
    type: 'output_statement',
    title: 'Utility and Service Infrastructure provided',
    description:
      'Roads, electricity, renewable capacity, waste management, water, and sewer networks on the EKZ site.',
    parentCode: 'C-1',
    parentType: 'component',
    order: 2,
    budget_usd: null,
  },
  {
    code: 'OUT-3',
    type: 'output_statement',
    title:
      'Innovation clusters / hubs developed to create talent & research base',
    description:
      'Innovation centres of excellence, university alliances, devices for underprivileged trainees, innovation labs.',
    parentCode: 'C-2',
    parentType: 'component',
    order: 3,
    budget_usd: null,
  },
  {
    code: 'OUT-4',
    type: 'output_statement',
    title:
      'Targeted skills and innovations developed to meet needs of private investors in EKZ',
    description:
      'Youth trained and certified to match private-sector ICT demand and competitive hackathons.',
    parentCode: 'C-2',
    parentType: 'component',
    order: 4,
    budget_usd: null,
  },
  {
    code: 'OUT-5',
    type: 'output_statement',
    title: 'Access to finance promoted for pre-seed and seed Start-ups',
    description:
      'Ekiti Innovation Fund (EIF) set-up, capacity-building facility, and pre-seed / seed start-ups funded.',
    parentCode: 'C-2',
    parentType: 'component',
    order: 5,
    budget_usd: null,
  },
  {
    code: 'OUT-6',
    type: 'output_statement',
    title:
      'Enabling business environment enhanced to incentivise investments in EKZ',
    description:
      'SPV operationalised, innovation and climate policy in place, roadshows, resettlement compensation paid.',
    parentCode: 'C-3',
    parentType: 'component',
    order: 6,
    budget_usd: null,
  },
];

const NODES: NodeSpec[] = [
  PDO,
  ALIGNMENT,
  ...OUTCOMES,
  ...COMPONENTS,
  ...OUTPUT_STATEMENTS,
];

async function findNodeId(
  ds: DataSource,
  code: string,
  type: string,
): Promise<string | null> {
  const rows = await query<{ id: string }>(
    ds,
    `SELECT id FROM logframe_nodes WHERE code = $1 AND type = $2 LIMIT 1`,
    [code, type],
  );
  return rows.length > 0 ? rows[0].id : null;
}

async function upsertNode(
  ds: DataSource,
  spec: NodeSpec,
): Promise<{ id: string; created: boolean }> {
  const existingId = await findNodeId(ds, spec.code, spec.type);

  let parentId: string | null = null;
  if (spec.parentCode && spec.parentType) {
    parentId = await findNodeId(ds, spec.parentCode, spec.parentType);
    if (!parentId) {
      throw new Error(
        `Phase 10 logframe: parent ${spec.parentType}:${spec.parentCode} not found ` +
          `when inserting ${spec.type}:${spec.code}. Slice ordering bug.`,
      );
    }
  }

  if (!existingId) {
    const inserted = await query<{ id: string }>(
      ds,
      `INSERT INTO logframe_nodes (
         logframe_id, type, code, title, description,
         parent_id, "order", budget_usd
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        LOGFRAME_ID,
        spec.type,
        spec.code,
        spec.title,
        spec.description,
        parentId,
        spec.order,
        spec.budget_usd,
      ],
    );
    return { id: inserted[0].id, created: true };
  }

  await execAffected(
    ds,
    `UPDATE logframe_nodes
       SET logframe_id = $1,
           title       = $2,
           description = $3,
           parent_id   = $4,
           "order"     = $5,
           budget_usd  = $6
       WHERE id = $7`,
    [
      LOGFRAME_ID,
      spec.title,
      spec.description,
      parentId,
      spec.order,
      spec.budget_usd,
      existingId,
    ],
  );
  return { id: existingId, created: false };
}

export const seedLogframe: Seeder = async (ds: DataSource) => {
  const stats = makeStats();
  let pdoId: string | null = null;
  for (const spec of NODES) {
    const { id, created } = await upsertNode(ds, spec);
    if (spec.type === 'pdo') pdoId = id;
    if (created) {
      stats.inserted += 1;
    } else {
      stats.skipped += 1;
    }
  }
  logStats('logframe_nodes', stats);

  // Anchor the project_meta.pdo_node_id soft-FK to the canonical PDO.
  if (pdoId) {
    await execAffected(
      ds,
      `UPDATE project_meta
         SET pdo_node_id = $1
         WHERE pdo_node_id IS DISTINCT FROM $1`,
      [pdoId],
    );
  }
};
