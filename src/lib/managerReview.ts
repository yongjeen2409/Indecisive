import { Blueprint, EscalationRecord, ManagerReviewBatch } from '../types';

export function orderManagerBatchBlueprints(batch: ManagerReviewBatch): Blueprint[] {
  const source = batch.rescoredBlueprints ?? batch.blueprints;
  const byId = new Map(source.map(blueprint => [blueprint.id, blueprint]));

  return batch.rankingOrder
    .map(id => byId.get(id))
    .filter((blueprint): blueprint is Blueprint => Boolean(blueprint));
}

export function getManagerBatchBlueprintRank(batch: ManagerReviewBatch, blueprintId: string): number | null {
  const index = batch.rankingOrder.findIndex(id => id === blueprintId);
  return index >= 0 ? index + 1 : null;
}

export function getManagerBatchPrimaryBlueprint(batch: ManagerReviewBatch): Blueprint | null {
  const orderedBlueprints = orderManagerBatchBlueprints(batch);

  if (batch.selectedBlueprintId) {
    return orderedBlueprints.find(blueprint => blueprint.id === batch.selectedBlueprintId) ?? orderedBlueprints[0] ?? null;
  }

  return orderedBlueprints[0] ?? null;
}

export function buildManagerBatchSyntheticRecord(batch: ManagerReviewBatch, blueprint: Blueprint): EscalationRecord {
  return {
    id: `synthetic-${batch.id}-${blueprint.id}`,
    submission: batch.submission,
    blueprint,
    submittedBy: batch.submittedBy,
    escalatedAt: batch.escalatedAt,
    note: batch.managerNote ?? batch.note,
    status: batch.status === 'forwarded_to_director' ? 'forwarded' : 'pending',
    level: 'staff_to_head',
    ticket: null,
    reviews: [],
  };
}
