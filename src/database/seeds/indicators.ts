import { DataSource } from 'typeorm';
import {
  execAffected,
  logStats,
  makeStats,
  query,
  resolveNodeId,
  type Seeder,
} from './helpers.js';

/**
 * Phase 10 — indicator + year-target seed.
 *
 * Source documents:
 *   - Client-Update/Result-FrameWork.md (RF) — authoritative names, units,
 *     end-of-project targets, RMF/ADoA flags, MoV strings.
 *   - Client-Update/Monitoring-plans.md (MP) — methodology, responsibility,
 *     frequency, 2023 / 2026 / 2028 milestone breakdowns.
 *   - ADR 0001 — target reconciliation rules where RF and MP disagree.
 *   - ADR 0004 — frequency enum + per-indicator frequency mapping.
 *
 * Year-target rows are all seeded with is_original=true (PAR baseline);
 * subsequent revisions are entered through the admin UI (Phase 9.5).
 *
 * Idempotency: indicators identified by UNIQUE(code, kind). On a re-run,
 * core metadata fields are reconciled to canonical; admin-editable status
 * + current_value are left alone. Year-target rows are anchored by
 * UNIQUE(indicator_id, year, is_original=true).
 */

type IndicatorKind = 'alignment' | 'outcome' | 'output';
type TargetMode = 'cumulative' | 'incremental' | 'binary';
type Frequency =
  | 'monthly'
  | 'quarterly'
  | 'bi_annually'
  | 'annually'
  | 'mid_term'
  | 'one_off';
type DataSourceType =
  | 'form_submission'
  | 'tracer_study'
  | 'contractor_report'
  | 'financial_statement'
  | 'policy_document'
  | 'external_feed'
  | 'manual';

interface IndicatorSpec {
  code: string;
  name: string;
  description: string;
  kind: IndicatorKind;
  level: 'alignment' | 'outcome' | 'output';
  parentNodeCode: string;
  parentNodeType: string;
  unit: string;
  baseline: number;
  target: number;
  target_mode: TargetMode;
  frequency: Frequency;
  data_source_type: DataSourceType;
  rmf_adoa: boolean;
  methodology: string;
  responsible_party: string;
  means_of_verification: string;
  reporting_year_start: number;
  reporting_year_end: number;
  year_targets: { year: number; target_value: number }[];
}

const MOV_MIS = 'EKZ management information system data';
const MOV_TRACER = 'Tracer studies of graduates who benefited from training';
const MOV_SPV_FIN = 'SPV annual financial statements';
const MOV_FUND_PORTFOLIO = 'Fund Manager portfolio reports';
const MOV_CONTRACTOR =
  'Monthly reports by supervision contractor; EKDIPA project reports';
const MOV_ENG_SUPERVISION =
  'Third monitoring engineering firm supervision reports; contractor contracts';
const MOV_UNIVERSITY_QPR =
  'Quarterly reports by beneficiary universities; EKDIPA reports';
const MOV_TECH_PARTNER =
  'Technology Partner project report; EKDIPA quarterly monitoring reports';
const MOV_HUB_MGMT = 'Hub Management company annual report';
const MOV_POLICY_DOC =
  'Approved policy document; State Ministry of Industry, Trade and Investment reports';
const MOV_RAP = 'RAP implementation report; third-party monitoring report';
const MOV_NBS = 'Nigeria Bureau of Statistics reports';

const ALIGNMENT_INDICATORS: IndicatorSpec[] = [
  {
    code: 'AL-1',
    name: 'Youth unemployment rate',
    description:
      '% of youth labour force that is unemployed but actively seeking employment.',
    kind: 'alignment',
    level: 'alignment',
    parentNodeCode: 'AL',
    parentNodeType: 'alignment',
    unit: '%',
    baseline: 42.5,
    target: 30,
    target_mode: 'cumulative',
    frequency: 'annually',
    data_source_type: 'external_feed',
    rmf_adoa: false,
    methodology: 'NBS Labour Force Survey reports — annual extraction.',
    responsible_party: 'EKDIPA (consuming NBS feed)',
    means_of_verification: MOV_NBS,
    reporting_year_start: 2020,
    reporting_year_end: 2026,
    year_targets: [{ year: 2026, target_value: 30 }],
  },
  {
    code: 'AL-2',
    name: 'Population living below the poverty line',
    description: '% of Nigerian population living below US$ 1.9 per day.',
    kind: 'alignment',
    level: 'alignment',
    parentNodeCode: 'AL',
    parentNodeType: 'alignment',
    unit: '%',
    baseline: 40.1,
    target: 38,
    target_mode: 'cumulative',
    frequency: 'annually',
    data_source_type: 'external_feed',
    rmf_adoa: false,
    methodology: 'NBS poverty reports — annual extraction.',
    responsible_party: 'EKDIPA (consuming NBS feed)',
    means_of_verification: MOV_NBS,
    reporting_year_start: 2019,
    reporting_year_end: 2026,
    year_targets: [{ year: 2026, target_value: 38 }],
  },
];

const OUTCOME_INDICATORS: IndicatorSpec[] = [
  {
    code: '1.1',
    name: 'Direct jobs created',
    description:
      'All jobs created under the project. Defined as work for pay; Full-Time Equivalent. Disaggregated by age and sex.',
    kind: 'outcome',
    level: 'outcome',
    parentNodeCode: 'OS-1',
    parentNodeType: 'outcome_statement',
    unit: 'Number',
    baseline: 0,
    target: 7007,
    target_mode: 'cumulative',
    frequency: 'annually',
    data_source_type: 'form_submission',
    rmf_adoa: true,
    methodology:
      'Direct jobs tracked through the M&E information system (questionnaire administered to beneficiaries). Detailed methodology developed within Year 1 of project launch.',
    responsible_party: 'EKDIPA through PCU',
    means_of_verification: MOV_MIS,
    reporting_year_start: 2022,
    reporting_year_end: 2028,
    year_targets: [
      { year: 2022, target_value: 0 },
      { year: 2026, target_value: 2102.1 },
      { year: 2028, target_value: 7007 },
    ],
  },
  {
    code: '1.2',
    name: 'Indirect jobs created',
    description:
      'Indirect and induced jobs created through spillover and value-chain effects in the economy.',
    kind: 'outcome',
    level: 'outcome',
    parentNodeCode: 'OS-1',
    parentNodeType: 'outcome_statement',
    unit: 'Number',
    baseline: 0,
    target: 18935,
    target_mode: 'cumulative',
    frequency: 'mid_term',
    data_source_type: 'tracer_study',
    rmf_adoa: true,
    methodology:
      'A study will be conducted at midpoint to derive context-specific multipliers and establish methodology for the calculation of indirect and induced jobs.',
    responsible_party: 'EKDIPA through PCU',
    means_of_verification: MOV_MIS,
    reporting_year_start: 2022,
    reporting_year_end: 2028,
    year_targets: [
      { year: 2022, target_value: 0 },
      { year: 2025, target_value: 5681 },
      { year: 2028, target_value: 18935 },
    ],
  },
  {
    code: '2.1',
    name: 'Youth trained in ICT skills linked to job opportunities',
    description:
      'Youth trained in innovation centres of excellence linked to employment opportunities or self-employment.',
    kind: 'outcome',
    level: 'outcome',
    parentNodeCode: 'OS-2',
    parentNodeType: 'outcome_statement',
    unit: 'Number',
    baseline: 0,
    target: 4800,
    target_mode: 'cumulative',
    frequency: 'mid_term',
    data_source_type: 'tracer_study',
    rmf_adoa: true,
    methodology: 'Tracer studies of graduates who benefited from training.',
    responsible_party: 'PCU',
    means_of_verification: MOV_TRACER,
    reporting_year_start: 2022,
    reporting_year_end: 2028,
    year_targets: [
      { year: 2022, target_value: 0 },
      { year: 2026, target_value: 1000 },
      { year: 2028, target_value: 4800 },
    ],
  },
  {
    code: '2.2',
    name: 'New technology / digital-enabled businesses created',
    description: 'Youth incubated in innovation centres who set up start-ups.',
    kind: 'outcome',
    level: 'outcome',
    parentNodeCode: 'OS-2',
    parentNodeType: 'outcome_statement',
    unit: 'Number',
    baseline: 0,
    target: 50,
    target_mode: 'incremental',
    frequency: 'annually',
    data_source_type: 'form_submission',
    rmf_adoa: false,
    methodology: 'Incubation centres monitoring reports.',
    responsible_party: 'EKDIPA',
    means_of_verification: 'Incubation centres monitoring reports',
    reporting_year_start: 2022,
    reporting_year_end: 2028,
    // RF blank — ADR 0001 sums MP increments (10 + 40 = 50). Flag for client.
    year_targets: [
      { year: 2026, target_value: 10 },
      { year: 2028, target_value: 40 },
    ],
  },
  {
    code: '3.1',
    name: 'Firms with signed contractual commitments to operate in EKZ',
    description:
      'Investor companies operating from the EKZ as anchor tenants / anchor investors.',
    kind: 'outcome',
    level: 'outcome',
    parentNodeCode: 'OS-3',
    parentNodeType: 'outcome_statement',
    unit: 'Number',
    baseline: 0,
    target: 15,
    target_mode: 'cumulative',
    frequency: 'annually',
    data_source_type: 'form_submission',
    rmf_adoa: false,
    methodology: 'SPV business registration data; EKDIPA annual reports.',
    responsible_party: 'EKDIPA',
    means_of_verification:
      'SPV business registration data; EKDIPA annual reports',
    reporting_year_start: 2022,
    reporting_year_end: 2028,
    year_targets: [
      { year: 2022, target_value: 0 },
      { year: 2026, target_value: 5 },
      { year: 2028, target_value: 15 },
    ],
  },
  {
    code: '3.2',
    name: 'Operating revenue generated by EKZ',
    description:
      'Revenue accruing to the EKZ arising from investments in the zone.',
    kind: 'outcome',
    level: 'outcome',
    parentNodeCode: 'OS-3',
    parentNodeType: 'outcome_statement',
    unit: 'US$',
    baseline: 0,
    target: 10_800_000,
    target_mode: 'cumulative',
    frequency: 'annually',
    data_source_type: 'financial_statement',
    rmf_adoa: false,
    methodology: 'SPV annual financial statements.',
    responsible_party: 'EKDIPA',
    means_of_verification: MOV_SPV_FIN,
    reporting_year_start: 2022,
    reporting_year_end: 2028,
    year_targets: [
      { year: 2022, target_value: 0 },
      { year: 2026, target_value: 2_000_000 },
      { year: 2028, target_value: 10_800_000 },
    ],
  },
  {
    code: '3.3',
    name: 'Additional financing made available to investee companies',
    description:
      'Additional financing mobilised by the Fund Manager through co-investments and capital calls, made available to early-growth high-impact tech / tech-enabled ventures.',
    kind: 'outcome',
    level: 'outcome',
    parentNodeCode: 'OS-3',
    parentNodeType: 'outcome_statement',
    unit: 'US$',
    baseline: 0,
    target: 5_000_000,
    target_mode: 'incremental',
    frequency: 'annually',
    data_source_type: 'financial_statement',
    rmf_adoa: true,
    methodology: 'Fund Manager (i) portfolio report.',
    responsible_party: 'Fund Manager',
    means_of_verification: MOV_FUND_PORTFOLIO,
    reporting_year_start: 2022,
    reporting_year_end: 2028,
    year_targets: [
      { year: 2026, target_value: 1_000_000 },
      { year: 2028, target_value: 4_000_000 },
    ],
  },
  {
    code: '4.1',
    name: 'Estimated GHG emission savings per annum',
    description:
      'Level of tCO2e emission savings per annum arising from EKZ infrastructure (renewable energy; energy-saving buildings; etc).',
    kind: 'outcome',
    level: 'outcome',
    parentNodeCode: 'OS-4',
    parentNodeType: 'outcome_statement',
    unit: 'tCO2e per annum',
    baseline: 0,
    target: 10.6,
    target_mode: 'cumulative',
    frequency: 'annually',
    data_source_type: 'form_submission',
    rmf_adoa: true,
    methodology: 'EKZ annual reports — GHG accounting.',
    responsible_party: 'EKDIPA',
    means_of_verification: 'EKZ annual reports',
    reporting_year_start: 2022,
    reporting_year_end: 2028,
    year_targets: [
      { year: 2022, target_value: 0 },
      { year: 2026, target_value: 0 },
      { year: 2028, target_value: 10.6 },
    ],
  },
  {
    code: '4.2',
    name: 'Climate resilience and green-growth measures implemented',
    description:
      'Measures identified by the project to promote climate resilience and green growth, implemented.',
    kind: 'outcome',
    level: 'outcome',
    parentNodeCode: 'OS-4',
    parentNodeType: 'outcome_statement',
    unit: 'Number',
    baseline: 0,
    target: 3,
    target_mode: 'incremental',
    frequency: 'annually',
    data_source_type: 'form_submission',
    rmf_adoa: true,
    methodology: 'EKDIPA annual reports.',
    responsible_party: 'EKDIPA',
    means_of_verification: 'EKDIPA annual reports',
    reporting_year_start: 2022,
    reporting_year_end: 2028,
    year_targets: [
      { year: 2026, target_value: 2 },
      { year: 2028, target_value: 1 },
    ],
  },
];

const OUTPUT_INDICATORS: IndicatorSpec[] = [
  {
    code: '1.1',
    name: 'Data centre and business continuity / disaster recovery site constructed and equipped',
    description:
      'Data centres and business-continuity centres installed with requisite processing (cores: 1,264) and storage (RAM: 11 TB) capacity, operationalised through PPP arrangements.',
    kind: 'output',
    level: 'output',
    parentNodeCode: 'OUT-1',
    parentNodeType: 'output_statement',
    unit: 'Number',
    baseline: 0,
    target: 2,
    target_mode: 'incremental',
    frequency: 'annually',
    data_source_type: 'contractor_report',
    rmf_adoa: false,
    methodology: 'EKDIPA project monitoring reports.',
    responsible_party: 'EKDIPA',
    means_of_verification: MOV_CONTRACTOR,
    reporting_year_start: 2022,
    reporting_year_end: 2028,
    year_targets: [
      { year: 2026, target_value: 0 },
      { year: 2028, target_value: 2 },
    ],
  },
  {
    code: '1.2',
    name: 'Green / sustainable and gender-responsive buildings constructed and equipped',
    description:
      'Climate-smart block buildings with ecosystem facilities — business centres, incubation centres, training centres, co-working spaces, quasi-accommodation, and common facilities (with landscaping).',
    kind: 'output',
    level: 'output',
    parentNodeCode: 'OUT-1',
    parentNodeType: 'output_statement',
    unit: 'Number',
    baseline: 0,
    target: 12,
    target_mode: 'incremental',
    frequency: 'annually',
    data_source_type: 'contractor_report',
    rmf_adoa: false,
    methodology: 'Contractor contract and supervision monitoring report.',
    responsible_party: 'EKDIPA',
    means_of_verification: MOV_CONTRACTOR,
    reporting_year_start: 2022,
    reporting_year_end: 2028,
    // ADR 0001: RF=12 vs MP=10 — RF wins, 2028 increment widened to 4. Flag.
    year_targets: [
      { year: 2026, target_value: 8 },
      { year: 2028, target_value: 4 },
    ],
  },
  {
    code: '1.3',
    name: 'Fibre optic cable laid on whole EKZ site',
    description:
      'Fibre-optic cable laid (FTTX, 1 Gbps speeds, multimode 50/125 µm) on the EKZ site with base trans-receiver station.',
    kind: 'output',
    level: 'output',
    parentNodeCode: 'OUT-1',
    parentNodeType: 'output_statement',
    unit: 'Km',
    baseline: 0,
    target: 9.5,
    target_mode: 'cumulative',
    frequency: 'annually',
    data_source_type: 'contractor_report',
    rmf_adoa: true,
    methodology: 'Contractor contract and supervision monitoring report.',
    responsible_party: 'EKDIPA',
    means_of_verification: MOV_CONTRACTOR,
    reporting_year_start: 2022,
    reporting_year_end: 2028,
    year_targets: [
      { year: 2022, target_value: 0 },
      { year: 2026, target_value: 9.5 },
      { year: 2028, target_value: 9.5 },
    ],
  },
  {
    code: '2.1',
    name: 'Roads constructed',
    description:
      'Km of road constructed on EKZ site per standard specification.',
    kind: 'output',
    level: 'output',
    parentNodeCode: 'OUT-2',
    parentNodeType: 'output_statement',
    unit: 'Km',
    baseline: 0,
    target: 1.86,
    target_mode: 'cumulative',
    frequency: 'annually',
    data_source_type: 'contractor_report',
    rmf_adoa: true,
    methodology: 'Third monitoring engineering firm supervision reports.',
    responsible_party: 'EKDIPA',
    means_of_verification: MOV_ENG_SUPERVISION,
    reporting_year_start: 2022,
    reporting_year_end: 2028,
    year_targets: [
      { year: 2022, target_value: 0 },
      { year: 2026, target_value: 1.86 },
      { year: 2028, target_value: 1.86 },
    ],
  },
  {
    code: '2.2',
    name: 'Total installed electricity capacity',
    description:
      'Electricity capacity installed on EKZ to standard specification.',
    kind: 'output',
    level: 'output',
    parentNodeCode: 'OUT-2',
    parentNodeType: 'output_statement',
    unit: 'MW',
    baseline: 0,
    target: 5,
    target_mode: 'cumulative',
    frequency: 'annually',
    data_source_type: 'contractor_report',
    rmf_adoa: true,
    methodology: 'Third monitoring engineering firm supervision reports.',
    responsible_party: 'EKDIPA',
    means_of_verification: MOV_ENG_SUPERVISION,
    reporting_year_start: 2022,
    reporting_year_end: 2028,
    year_targets: [
      { year: 2022, target_value: 0 },
      { year: 2026, target_value: 5 },
      { year: 2028, target_value: 5 },
    ],
  },
  {
    code: '2.3',
    name: 'Total installed renewable capacity',
    description: 'Solar energy installed on EKZ to standard specification.',
    kind: 'output',
    level: 'output',
    parentNodeCode: 'OUT-2',
    parentNodeType: 'output_statement',
    unit: 'MW',
    baseline: 0,
    target: 3,
    target_mode: 'cumulative',
    frequency: 'annually',
    data_source_type: 'contractor_report',
    rmf_adoa: true,
    methodology: 'Third monitoring engineering firm supervision reports.',
    responsible_party: 'EKDIPA',
    means_of_verification: MOV_ENG_SUPERVISION,
    reporting_year_start: 2022,
    reporting_year_end: 2028,
    year_targets: [
      { year: 2022, target_value: 0 },
      { year: 2026, target_value: 3 },
      { year: 2028, target_value: 3 },
    ],
  },
  {
    code: '2.4',
    name: 'Integrated waste management plan developed and implemented',
    description:
      'Waste-management plan covering reduction, segregation, collection, and disposal practices to international best practice — developed and implemented.',
    kind: 'output',
    level: 'output',
    parentNodeCode: 'OUT-2',
    parentNodeType: 'output_statement',
    unit: 'Number',
    baseline: 0,
    target: 1,
    target_mode: 'binary',
    frequency: 'one_off',
    data_source_type: 'policy_document',
    rmf_adoa: true,
    methodology: 'Approved waste-management plan document.',
    responsible_party: 'EKDIPA',
    means_of_verification: 'Approved waste-management plan',
    reporting_year_start: 2022,
    reporting_year_end: 2028,
    year_targets: [
      { year: 2026, target_value: 1 },
      { year: 2028, target_value: 1 },
    ],
  },
  {
    code: '2.5',
    name: 'Potable water network',
    description:
      'Water facilities and respective distribution / collection networks installed on the EKZ site to standard specification.',
    kind: 'output',
    level: 'output',
    parentNodeCode: 'OUT-2',
    parentNodeType: 'output_statement',
    unit: 'Km',
    baseline: 0,
    target: 2.38,
    target_mode: 'cumulative',
    frequency: 'annually',
    data_source_type: 'contractor_report',
    rmf_adoa: true,
    methodology: 'Third monitoring engineering firm supervision reports.',
    responsible_party: 'EKDIPA',
    means_of_verification: MOV_ENG_SUPERVISION,
    reporting_year_start: 2022,
    reporting_year_end: 2028,
    year_targets: [
      { year: 2022, target_value: 0 },
      { year: 2026, target_value: 2.38 },
      { year: 2028, target_value: 2.38 },
    ],
  },
  {
    code: '2.6',
    name: 'Foul sewer network developed',
    description: 'Sewer network laid and functional on EKZ site.',
    kind: 'output',
    level: 'output',
    parentNodeCode: 'OUT-2',
    parentNodeType: 'output_statement',
    unit: 'Km',
    baseline: 0,
    target: 1.03,
    target_mode: 'cumulative',
    frequency: 'annually',
    data_source_type: 'contractor_report',
    rmf_adoa: false,
    methodology: 'Third monitoring engineering firm supervision reports.',
    responsible_party: 'EKDIPA',
    means_of_verification: MOV_ENG_SUPERVISION,
    reporting_year_start: 2022,
    reporting_year_end: 2028,
    year_targets: [
      { year: 2022, target_value: 0 },
      { year: 2026, target_value: 1.03 },
      { year: 2028, target_value: 1.03 },
    ],
  },
  {
    code: '3.1',
    name: 'Digital and innovation centres of excellence developed and operationalised',
    description:
      'Innovation incubation centres with requisite equipment set up in universities / polytechnics through PPPs.',
    kind: 'output',
    level: 'output',
    parentNodeCode: 'OUT-3',
    parentNodeType: 'output_statement',
    unit: 'Number',
    baseline: 0,
    target: 10,
    target_mode: 'incremental',
    frequency: 'annually',
    data_source_type: 'form_submission',
    rmf_adoa: false,
    methodology: 'EKDIPA project monitoring reports.',
    responsible_party: 'EKDIPA',
    means_of_verification: MOV_UNIVERSITY_QPR,
    reporting_year_start: 2022,
    reporting_year_end: 2028,
    year_targets: [
      { year: 2026, target_value: 8 },
      { year: 2028, target_value: 2 },
    ],
  },
  {
    code: '3.2',
    name: 'Alliances established with global and local universities',
    description:
      'MOUs signed with international and local universities (60% global, 40% local) with strong research and technology focus, to attract stronger talent and demand base.',
    kind: 'output',
    level: 'output',
    parentNodeCode: 'OUT-3',
    parentNodeType: 'output_statement',
    unit: 'Number',
    baseline: 0,
    target: 4,
    target_mode: 'cumulative',
    frequency: 'annually',
    data_source_type: 'form_submission',
    rmf_adoa: false,
    methodology: 'EKDIPA project monitoring reports.',
    responsible_party: 'EKDIPA',
    means_of_verification: MOV_UNIVERSITY_QPR,
    reporting_year_start: 2022,
    reporting_year_end: 2028,
    year_targets: [
      { year: 2022, target_value: 0 },
      { year: 2026, target_value: 4 },
      { year: 2028, target_value: 4 },
    ],
  },
  {
    code: '3.3',
    name: 'Devices provided for trained, underprivileged young women and youth graduates',
    description:
      'High-potential young women and men selected from the poorest and most vulnerable households in the State social registry to enhance their participation in the digital economy.',
    kind: 'output',
    level: 'output',
    parentNodeCode: 'OUT-3',
    parentNodeType: 'output_statement',
    unit: 'Number',
    baseline: 0,
    target: 200,
    target_mode: 'incremental',
    frequency: 'annually',
    data_source_type: 'form_submission',
    rmf_adoa: false,
    methodology: 'EKDIPA project monitoring reports.',
    responsible_party: 'EKDIPA',
    means_of_verification: 'EKDIPA project monitoring reports',
    reporting_year_start: 2022,
    reporting_year_end: 2028,
    year_targets: [
      { year: 2026, target_value: 100 },
      { year: 2028, target_value: 100 },
    ],
  },
  {
    code: '3.4',
    name: 'Laboratories / innovation labs established and equipped',
    description:
      'Laboratories or innovation labs established and equipped to produce research innovations / prototypes.',
    kind: 'output',
    level: 'output',
    parentNodeCode: 'OUT-3',
    parentNodeType: 'output_statement',
    unit: 'Number',
    baseline: 0,
    target: 4,
    target_mode: 'cumulative',
    frequency: 'annually',
    data_source_type: 'form_submission',
    rmf_adoa: false,
    methodology: 'EKDIPA project monitoring reports.',
    responsible_party: 'EKDIPA',
    means_of_verification: 'EKDIPA project monitoring reports',
    reporting_year_start: 2022,
    reporting_year_end: 2028,
    year_targets: [
      { year: 2022, target_value: 0 },
      { year: 2026, target_value: 4 },
      { year: 2028, target_value: 4 },
    ],
  },
  {
    code: '4.1',
    name: 'Youth trained and certified to match ICT skill needs of private sector',
    description:
      'Youth trained to meet the skills required by anchor investors in EKZ for direct employment and for BPO (including certified basic, intermediate, and advanced ICT skills). 40% female; at least 500 from households with affected livelihoods; at least 10% trained in advanced skills.',
    kind: 'output',
    level: 'output',
    parentNodeCode: 'OUT-4',
    parentNodeType: 'output_statement',
    unit: 'Number',
    baseline: 0,
    target: 8000,
    target_mode: 'incremental',
    frequency: 'annually',
    data_source_type: 'form_submission',
    rmf_adoa: true,
    methodology: 'EKDIPA project monitoring reports.',
    responsible_party: 'EKDIPA',
    means_of_verification: MOV_TECH_PARTNER,
    reporting_year_start: 2022,
    reporting_year_end: 2028,
    year_targets: [
      { year: 2026, target_value: 4000 },
      { year: 2028, target_value: 4000 },
    ],
  },
  {
    code: '4.2',
    name: 'Competitive innovation challenges (hackathons) organised',
    description:
      'Thematic hackathons (circular economy; agri-innovation; edutech; healthtech; etc.) organised to foster collaboration between private-sector players and entrepreneurs.',
    kind: 'output',
    level: 'output',
    parentNodeCode: 'OUT-4',
    parentNodeType: 'output_statement',
    unit: 'Number',
    baseline: 0,
    target: 4,
    target_mode: 'incremental',
    frequency: 'annually',
    data_source_type: 'form_submission',
    rmf_adoa: false,
    methodology: 'Consultant ESO competition report.',
    responsible_party: 'EKDIPA',
    means_of_verification: MOV_TECH_PARTNER,
    reporting_year_start: 2022,
    reporting_year_end: 2028,
    year_targets: [
      { year: 2026, target_value: 2 },
      { year: 2028, target_value: 2 },
    ],
  },
  {
    code: '5.1',
    name: 'Ekiti Innovation Fund (EIF) set up and operationalised',
    description:
      'Independently managed EIF by competitively recruited Fund Manager, set up to invest in pre-seed and seed start-ups and growth enterprises.',
    kind: 'output',
    level: 'output',
    parentNodeCode: 'OUT-5',
    parentNodeType: 'output_statement',
    unit: 'US$',
    baseline: 0,
    target: 5_000_000,
    target_mode: 'binary',
    frequency: 'one_off',
    data_source_type: 'financial_statement',
    rmf_adoa: false,
    methodology: 'Fund Manager balance sheet.',
    responsible_party: 'EKDIPA',
    means_of_verification: MOV_FUND_PORTFOLIO,
    reporting_year_start: 2022,
    reporting_year_end: 2028,
    year_targets: [
      { year: 2026, target_value: 5_000_000 },
      { year: 2028, target_value: 5_000_000 },
    ],
  },
  {
    code: '5.2',
    name: 'Capacity-building facility created to support start-ups',
    description:
      'Training facility targeted at seed and pre-seed start-ups, with emphasis on supporting female-led ventures.',
    kind: 'output',
    level: 'output',
    parentNodeCode: 'OUT-5',
    parentNodeType: 'output_statement',
    unit: 'US$',
    baseline: 0,
    target: 1_000_000,
    target_mode: 'incremental',
    frequency: 'annually',
    data_source_type: 'financial_statement',
    rmf_adoa: true,
    methodology: 'Fund Manager balance sheet.',
    responsible_party: 'EKDIPA',
    means_of_verification: MOV_FUND_PORTFOLIO,
    reporting_year_start: 2022,
    reporting_year_end: 2028,
    year_targets: [
      { year: 2026, target_value: 500_000 },
      { year: 2028, target_value: 500_000 },
    ],
  },
  {
    code: '5.3',
    name: 'Pre-seed and seed start-ups who benefit from the EIF',
    description: 'Start-ups who can access funding from EIF.',
    kind: 'output',
    level: 'output',
    parentNodeCode: 'OUT-5',
    parentNodeType: 'output_statement',
    unit: 'Number',
    baseline: 0,
    target: 50,
    target_mode: 'cumulative',
    frequency: 'annually',
    data_source_type: 'financial_statement',
    rmf_adoa: true,
    methodology: 'Fund Manager portfolio reports.',
    responsible_party: 'Fund Manager',
    means_of_verification: MOV_FUND_PORTFOLIO,
    reporting_year_start: 2022,
    reporting_year_end: 2028,
    year_targets: [
      { year: 2022, target_value: 0 },
      { year: 2026, target_value: 0 },
      { year: 2028, target_value: 50 },
    ],
  },
  {
    code: '6.1',
    name: 'EKZ Special Purpose Vehicle (SPV) operationalised',
    description:
      'Hub Management Company set up and operationalised to manage investments and operationalisation of EKZ. Private-sector companies must provide capital and demonstrate technical capacity.',
    kind: 'output',
    level: 'output',
    parentNodeCode: 'OUT-6',
    parentNodeType: 'output_statement',
    unit: 'Number',
    baseline: 0,
    target: 1,
    target_mode: 'binary',
    frequency: 'one_off',
    data_source_type: 'form_submission',
    rmf_adoa: false,
    methodology: 'EKDIPA project monitoring reports.',
    responsible_party: 'EKDIPA',
    means_of_verification: MOV_HUB_MGMT,
    reporting_year_start: 2022,
    reporting_year_end: 2028,
    year_targets: [
      { year: 2026, target_value: 1 },
      { year: 2028, target_value: 1 },
    ],
  },
  {
    code: '6.2',
    name: 'Innovation policy and strategic plan developed and operationalised',
    description:
      'Enabling policies implemented and incentives provided to encourage investor participation in EKZ.',
    kind: 'output',
    level: 'output',
    parentNodeCode: 'OUT-6',
    parentNodeType: 'output_statement',
    unit: 'Yes/No',
    baseline: 0,
    target: 1,
    target_mode: 'binary',
    frequency: 'one_off',
    data_source_type: 'policy_document',
    rmf_adoa: false,
    methodology: 'Innovation strategic plan document.',
    responsible_party: 'EKDIPA',
    means_of_verification: MOV_POLICY_DOC,
    reporting_year_start: 2022,
    reporting_year_end: 2028,
    year_targets: [
      { year: 2026, target_value: 0 },
      { year: 2028, target_value: 1 },
    ],
  },
  {
    code: '6.3',
    name: 'Climate change and green-growth policy developed and operationalised',
    description: 'Ekiti State climate strategy and action plan.',
    kind: 'output',
    level: 'output',
    parentNodeCode: 'OUT-6',
    parentNodeType: 'output_statement',
    unit: 'Yes/No',
    baseline: 0,
    target: 1,
    target_mode: 'binary',
    frequency: 'one_off',
    data_source_type: 'policy_document',
    rmf_adoa: false,
    methodology: 'Approved policy document.',
    responsible_party: 'EKDIPA',
    means_of_verification: MOV_POLICY_DOC,
    reporting_year_start: 2022,
    reporting_year_end: 2028,
    year_targets: [
      { year: 2026, target_value: 1 },
      { year: 2028, target_value: 1 },
    ],
  },
  {
    code: '6.4',
    name: 'EKZ road shows organised',
    description: 'Investor-attraction road shows.',
    kind: 'output',
    level: 'output',
    parentNodeCode: 'OUT-6',
    parentNodeType: 'output_statement',
    unit: 'Number',
    baseline: 0,
    target: 5,
    target_mode: 'incremental',
    frequency: 'annually',
    data_source_type: 'form_submission',
    rmf_adoa: false,
    methodology: 'Roadshow report.',
    responsible_party: 'EKDIPA',
    means_of_verification: 'EKDIPA portal',
    reporting_year_start: 2024,
    reporting_year_end: 2028,
    // ADR 0001: RF=5 vs MP=1 — RF wins. Proposed allocation 1/year 2024–2028.
    year_targets: [
      { year: 2024, target_value: 1 },
      { year: 2025, target_value: 1 },
      { year: 2026, target_value: 1 },
      { year: 2027, target_value: 1 },
      { year: 2028, target_value: 1 },
    ],
  },
  {
    code: '6.5',
    name: 'Resettlement compensation to support affected population for alternative economic activities',
    description:
      'Compensation for the population whose livelihoods are displaced because of construction works on the EKZ site (Ago Araromi and Ijan-Ekiti communities).',
    kind: 'output',
    level: 'output',
    parentNodeCode: 'OUT-6',
    parentNodeType: 'output_statement',
    unit: 'US$',
    baseline: 0,
    target: 2_500_000,
    target_mode: 'binary',
    frequency: 'one_off',
    data_source_type: 'contractor_report',
    rmf_adoa: false,
    methodology: 'EKDIPA project monitoring reports.',
    responsible_party: 'EKDIPA',
    means_of_verification: MOV_RAP,
    reporting_year_start: 2022,
    reporting_year_end: 2028,
    year_targets: [
      { year: 2026, target_value: 0 },
      { year: 2028, target_value: 2_500_000 },
    ],
  },
];

export const ALL_INDICATORS: IndicatorSpec[] = [
  ...ALIGNMENT_INDICATORS,
  ...OUTCOME_INDICATORS,
  ...OUTPUT_INDICATORS,
];

// Re-exported for the seed spec — keeps the spec contract close to the data.
export type { IndicatorSpec };

async function upsertIndicator(
  ds: DataSource,
  spec: IndicatorSpec,
): Promise<{ id: string; created: boolean }> {
  const logframeLevelId = await resolveNodeId(
    ds,
    spec.parentNodeCode,
    spec.parentNodeType,
  );

  const existing = await query<{ id: string }>(
    ds,
    `SELECT id FROM indicators WHERE code = $1 AND kind = $2`,
    [spec.code, spec.kind],
  );

  if (existing.length === 0) {
    const inserted = await query<{ id: string }>(
      ds,
      `INSERT INTO indicators (
         code, name, description, level, kind, unit,
         baseline, target, current_value, status, frequency,
         methodology, rmf_adoa, target_mode, data_source_type,
         reporting_year_start, reporting_year_end,
         logframe_level_id, responsible_party, means_of_verification
       ) VALUES (
         $1, $2, $3, $4, $5, $6,
         $7, $8, 0, 'on_track', $9,
         $10, $11, $12, $13,
         $14, $15,
         $16, $17, $18
       )
       RETURNING id`,
      [
        spec.code,
        spec.name,
        spec.description,
        spec.level,
        spec.kind,
        spec.unit,
        spec.baseline,
        spec.target,
        spec.frequency,
        spec.methodology,
        spec.rmf_adoa,
        spec.target_mode,
        spec.data_source_type,
        spec.reporting_year_start,
        spec.reporting_year_end,
        logframeLevelId,
        spec.responsible_party,
        spec.means_of_verification,
      ],
    );
    return { id: inserted[0].id, created: true };
  }

  // Reconcile canonical metadata fields. Leave admin-mutable fields
  // (current_value, status) untouched.
  await execAffected(
    ds,
    `UPDATE indicators SET
        name                 = $1,
        description          = $2,
        level                = $3,
        unit                 = $4,
        baseline             = $5,
        target               = $6,
        frequency            = $7,
        methodology          = $8,
        rmf_adoa             = $9,
        target_mode          = $10,
        data_source_type     = $11,
        reporting_year_start = $12,
        reporting_year_end   = $13,
        logframe_level_id    = $14,
        responsible_party    = $15,
        means_of_verification = $16
       WHERE id = $17`,
    [
      spec.name,
      spec.description,
      spec.level,
      spec.unit,
      spec.baseline,
      spec.target,
      spec.frequency,
      spec.methodology,
      spec.rmf_adoa,
      spec.target_mode,
      spec.data_source_type,
      spec.reporting_year_start,
      spec.reporting_year_end,
      logframeLevelId,
      spec.responsible_party,
      spec.means_of_verification,
      existing[0].id,
    ],
  );
  return { id: existing[0].id, created: false };
}

async function upsertYearTargets(
  ds: DataSource,
  indicatorId: string,
  rows: { year: number; target_value: number }[],
): Promise<{ inserted: number; skipped: number }> {
  let inserted = 0;
  let skipped = 0;
  for (const row of rows) {
    // is_original=true PAR rows are anchored by UNIQUE(indicator_id, year, is_original).
    const existing = await query<{ id: string }>(
      ds,
      `SELECT id FROM indicator_year_targets
        WHERE indicator_id = $1 AND year = $2 AND is_original = TRUE`,
      [indicatorId, row.year],
    );
    if (existing.length > 0) {
      skipped += 1;
      continue;
    }
    await ds.query(
      `INSERT INTO indicator_year_targets
         (indicator_id, year, target_value, is_original, revision_year)
       VALUES ($1, $2, $3, TRUE, NULL)`,
      [indicatorId, row.year, row.target_value],
    );
    inserted += 1;
  }
  return { inserted, skipped };
}

export const seedIndicators: Seeder = async (ds: DataSource) => {
  const indStats = makeStats();
  const ytStats = makeStats();

  for (const spec of ALL_INDICATORS) {
    const { id, created } = await upsertIndicator(ds, spec);
    if (created) indStats.inserted += 1;
    else indStats.skipped += 1;

    const yt = await upsertYearTargets(ds, id, spec.year_targets);
    ytStats.inserted += yt.inserted;
    ytStats.skipped += yt.skipped;
  }

  logStats('indicators', indStats);
  logStats('indicator_year_targets', ytStats);
};
