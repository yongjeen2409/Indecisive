import { Blueprint, FinanceModel, ReviewAssumption, Scores } from '../types';

const MIN_REASONABLE_ROI = 25;
const MAX_REASONABLE_ROI = 95;

function formatCurrency(value: number) {
  return `$${Math.round(value / 1000).toLocaleString()}k`;
}

function formatMonthlyCurrency(value: number) {
  return `${formatCurrency(value)}/mo`;
}

function formatPayback(months: number) {
  return `${months} months`;
}

function buildFinanceModel(capexValue: number, opexMonthlyValue: number, roiValue: number, paybackMonths: number): FinanceModel {
  const totalCostYearOneValue = capexValue + opexMonthlyValue * 12;
  const normalizedRoiValue = clamp(Math.round(roiValue), MIN_REASONABLE_ROI, MAX_REASONABLE_ROI);
  return {
    capex: formatCurrency(capexValue),
    opex: formatMonthlyCurrency(opexMonthlyValue),
    roi: `${normalizedRoiValue}%`,
    paybackPeriod: formatPayback(paybackMonths),
    totalCost: formatCurrency(totalCostYearOneValue),
    capexValue,
    opexMonthlyValue,
    roiValue: normalizedRoiValue,
    paybackMonths,
    totalCostYearOneValue,
  };
}

function buildScores(feasibility: number, businessImpact: number, effort: number, riskConflict: number): Scores {
  return {
    feasibility,
    businessImpact,
    effort,
    riskConflict,
    total: Math.round(feasibility * 0.28 + businessImpact * 0.34 + effort * 0.18 + riskConflict * 0.2),
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function parseFirstNumber(value: string) {
  const match = value.match(/-?\d+(?:\.\d+)?/);
  return match ? Number.parseFloat(match[0]) : null;
}

function parseCurrencyValue(value: string) {
  const match = value.replace(/,/g, '').match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;
  const parsed = Number.parseFloat(match[0]);
  if (/\bm\b/i.test(value)) return parsed * 1_000_000;
  if (/\bk\b/i.test(value)) return parsed * 1_000;
  return parsed;
}

function parseHeadcountValue(value: string) {
  const fteMatch = value.match(/(\d+(?:\.\d+)?)\s*FTE/i);
  const monthMatch = value.match(/(\d+(?:\.\d+)?)\s*month/i);
  return {
    fte: fteMatch ? Number.parseFloat(fteMatch[1]) : null,
    months: monthMatch ? Number.parseFloat(monthMatch[1]) : null,
  };
}

function scoreOrder(blueprints: Blueprint[]) {
  return [...blueprints].sort((left, right) => right.scores.total - left.scores.total);
}

function average(values: number[]) {
  return values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

export function getDefaultRankingOrder(blueprints: Blueprint[]) {
  return scoreOrder(blueprints).map(blueprint => blueprint.id);
}

export function cloneReviewAssumptions(assumptions: ReviewAssumption[]) {
  return assumptions.map(assumption => ({ ...assumption }));
}

export function buildSharedReviewAssumptions(blueprints: Blueprint[]): ReviewAssumption[] {
  const ordered = scoreOrder(blueprints);
  const leadBlueprint = ordered[0] ?? blueprints[0];
  const averageCapex = Math.round(average(blueprints.map(blueprint => blueprint.financeModel.capexValue)));
  const averageRoi = Math.round(average(blueprints.map(blueprint => blueprint.financeModel.roiValue)));
  const averagePayback = Math.max(1, Math.round(average(blueprints.map(blueprint => blueprint.financeModel.paybackMonths))));
  const averageOpex = Math.round(average(blueprints.map(blueprint => blueprint.financeModel.opexMonthlyValue)));
  const sharedHeadcount = 4 + blueprints.length;
  const sharedHeadcountMonths = Math.max(3, Math.round(averagePayback / 3));

  return [
    {
      id: 'budget',
      label: 'Implementation Budget',
      value: formatCurrency(averageCapex),
      source: `${leadBlueprint?.department ?? 'Finance'} model / current planning envelope`,
      staleness: null,
      confidence: 'HIGH',
      impact: `Average year-one cost is ${formatCurrency(averageCapex + averageOpex * 12)} across the ranked set.`,
      editable: true,
    },
    {
      id: 'roi',
      label: 'Planned Annual ROI',
      value: `${averageRoi}%`,
      source: 'Z.AI decision model / latest blueprint scoring pass',
      staleness: 'May shift after assumption changes',
      confidence: 'MEDIUM',
      impact: 'Lower ROI will reduce business impact and could extend payback beyond the preferred approval window.',
      editable: true,
    },
    {
      id: 'headcount',
      label: 'Team Capacity Required',
      value: `${sharedHeadcount} FTEs / ${sharedHeadcountMonths} months`,
      source: 'Cross-functional staffing estimate',
      staleness: null,
      confidence: 'HIGH',
      impact: 'Less capacity increases effort risk across all three blueprints during manager review.',
      editable: true,
    },
    {
      id: 'payback',
      label: 'Payback Period',
      value: formatPayback(averagePayback),
      source: 'Finance model / blended payback forecast',
      staleness: null,
      confidence: 'MEDIUM',
      impact: 'Longer payback windows reduce confidence for director escalation and portfolio prioritization.',
      editable: true,
    },
  ];
}

export function reevaluateBlueprintSet(
  blueprints: Blueprint[],
  assumptions: ReviewAssumption[],
  baselineAssumptions?: ReviewAssumption[],
) {
  const baseline =
    baselineAssumptions && baselineAssumptions.length > 0
      ? cloneReviewAssumptions(baselineAssumptions)
      : buildSharedReviewAssumptions(blueprints);
  const baselineMap = new Map(baseline.map(assumption => [assumption.id, assumption]));
  const currentMap = new Map(assumptions.map(assumption => [assumption.id, assumption]));

  const baselineBudget = parseCurrencyValue(baselineMap.get('budget')?.value ?? '') ?? average(blueprints.map(blueprint => blueprint.financeModel.capexValue));
  const currentBudget = parseCurrencyValue(currentMap.get('budget')?.value ?? '') ?? baselineBudget;

  const baselineRoi = parseFirstNumber(baselineMap.get('roi')?.value ?? '') ?? average(blueprints.map(blueprint => blueprint.financeModel.roiValue));
  const currentRoi = parseFirstNumber(currentMap.get('roi')?.value ?? '') ?? baselineRoi;

  const baselinePayback = parseFirstNumber(baselineMap.get('payback')?.value ?? '') ?? average(blueprints.map(blueprint => blueprint.financeModel.paybackMonths));
  const currentPayback = parseFirstNumber(currentMap.get('payback')?.value ?? '') ?? baselinePayback;

  const baselineHeadcount = parseHeadcountValue(baselineMap.get('headcount')?.value ?? '');
  const currentHeadcount = parseHeadcountValue(currentMap.get('headcount')?.value ?? '');

  const budgetRatio = baselineBudget > 0 ? currentBudget / baselineBudget : 1;
  const roiRatio = baselineRoi > 0 ? currentRoi / baselineRoi : 1;
  const paybackDelta = currentPayback - baselinePayback;
  const fteDelta = (currentHeadcount.fte ?? baselineHeadcount.fte ?? 0) - (baselineHeadcount.fte ?? 0);
  const monthsDelta = (currentHeadcount.months ?? baselineHeadcount.months ?? 0) - (baselineHeadcount.months ?? 0);

  return blueprints.map((blueprint, index) => {
    const capexValue = Math.max(25_000, Math.round(blueprint.financeModel.capexValue * budgetRatio));
    const opexValue = Math.max(4_000, Math.round(blueprint.financeModel.opexMonthlyValue * (0.96 + (budgetRatio - 1) * 0.3)));
    const roiValue = Math.max(30, Math.round(blueprint.financeModel.roiValue * roiRatio - paybackDelta * 2));
    const paybackMonths = Math.max(3, Math.round(blueprint.financeModel.paybackMonths + paybackDelta));

    const feasibility = clamp(Math.round(blueprint.scores.feasibility + fteDelta * 2 - monthsDelta * 2 + (budgetRatio - 1) * 10), 35, 98);
    const businessImpact = clamp(Math.round(blueprint.scores.businessImpact + (roiRatio - 1) * 25 - paybackDelta * 1.5), 35, 98);
    const effort = clamp(Math.round(blueprint.scores.effort + fteDelta * 3 - monthsDelta * 4 + index), 35, 98);
    const riskConflict = clamp(
      Math.round(blueprint.scores.riskConflict - paybackDelta * 3 - (1 - budgetRatio) * 15 + fteDelta * 2),
      35,
      98,
    );

    return {
      ...blueprint,
      financeModel: buildFinanceModel(capexValue, opexValue, roiValue, paybackMonths),
      scores: buildScores(feasibility, businessImpact, effort, riskConflict),
    };
  });
}
