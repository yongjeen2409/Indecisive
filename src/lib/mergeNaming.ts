const ACTION_WORDS = new Set([
  'combine',
  'consolidate',
  'connect',
  'fold',
  'fuse',
  'integrate',
  'merge',
  'migrate',
  'modernize',
  'rebuild',
  'replace',
  'streamline',
  'unify',
]);

const GENERIC_WORDS = new Set([
  'application',
  'blueprint',
  'core',
  'engine',
  'existing',
  'initiative',
  'layer',
  'legacy',
  'module',
  'platform',
  'portal',
  'service',
  'solution',
  'stack',
  'suite',
  'system',
  'workflow',
]);

const STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'for',
  'from',
  'into',
  'of',
  'the',
  'to',
  'with',
]);

function toTitleCase(value: string) {
  if (!value) return value;
  if (value === value.toUpperCase() && value.length <= 5) return value;
  return value[0].toUpperCase() + value.slice(1).toLowerCase();
}

export function isActionStyleMergeName(value: string | null | undefined) {
  const normalized = value?.trim().replace(/^['"`]+|['"`]+$/g, '') ?? '';
  if (!normalized) return true;

  const lower = normalized.toLowerCase();
  return ACTION_WORDS.has(lower.split(/\s+/)[0] ?? '') || /\b(?:into|with)\b/.test(lower);
}

export function buildMergedSystemName({
  proposedName,
  department,
  blueprintTitles = [],
  systemNames = [],
}: {
  proposedName?: string | null;
  department?: string | null;
  blueprintTitles?: string[];
  systemNames?: string[];
}) {
  const cleanedProposal = proposedName?.trim().replace(/^['"`]+|['"`]+$/g, '') ?? '';
  if (cleanedProposal && !isActionStyleMergeName(cleanedProposal)) {
    return cleanedProposal;
  }

  const focusWords: string[] = [];
  const registerWord = (value: string) => {
    const normalized = value.trim();
    const lower = normalized.toLowerCase();

    if (!normalized || lower.length < 4) return;
    if (ACTION_WORDS.has(lower) || GENERIC_WORDS.has(lower) || STOP_WORDS.has(lower)) return;

    const titled = toTitleCase(normalized);
    if (!focusWords.includes(titled)) focusWords.push(titled);
  };

  for (const label of [...blueprintTitles, ...systemNames]) {
    for (const token of label.split(/[^A-Za-z0-9]+/)) {
      registerWord(token);
    }
  }

  if (focusWords.length === 0 && department) {
    for (const token of department.split(/[^A-Za-z0-9]+/)) {
      registerWord(token);
    }
  }

  const nameParts = focusWords.slice(0, 2);
  if (nameParts.length === 0) {
    nameParts.push('Enterprise');
  }

  const suffix = systemNames.length > 0 ? 'Hub' : 'Platform';
  return `${nameParts.join(' ')} ${suffix}`;
}
