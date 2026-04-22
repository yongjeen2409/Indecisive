import { TechStackCategory } from '../types';

function normalizeLabel(value: string) {
  return value.trim();
}

export function normalizeTechStack(
  value: unknown,
  fallbackCategory = 'Core stack',
): TechStackCategory[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const structured = value
    .map(item => {
      if (typeof item !== 'object' || item === null || Array.isArray(item)) return null;

      const category = typeof item.category === 'string' ? normalizeLabel(item.category) : '';
      const rawTools: unknown[] = Array.isArray(item.tools) ? item.tools : [];
      const tools = Array.from(
        new Set(rawTools.filter((tool): tool is string => typeof tool === 'string').map(normalizeLabel).filter(Boolean)),
      );

      if (!category || tools.length === 0) return null;
      return { category, tools };
    })
    .filter((item): item is TechStackCategory => Boolean(item));

  if (structured.length > 0) {
    return structured;
  }

  const flatTools = Array.from(
    new Set(value.filter((item): item is string => typeof item === 'string').map(normalizeLabel).filter(Boolean)),
  );

  return flatTools.length > 0
    ? [{ category: fallbackCategory, tools: flatTools }]
    : [];
}

export function flattenTechStack(techStack: TechStackCategory[]): string[] {
  return techStack.flatMap(category => category.tools);
}

export function mergeTechStackCategories(
  stacks: TechStackCategory[][],
  maxCategories = 6,
  maxToolsPerCategory = 5,
): TechStackCategory[] {
  const merged = new Map<string, TechStackCategory>();

  for (const stack of stacks) {
    for (const category of stack) {
      const key = category.category.trim().toLowerCase();
      if (!key) continue;

      const existing = merged.get(key);
      if (!existing) {
        merged.set(key, {
          category: category.category.trim(),
          tools: Array.from(new Set(category.tools)).slice(0, maxToolsPerCategory),
        });
        continue;
      }

      existing.tools = Array.from(new Set([...existing.tools, ...category.tools])).slice(0, maxToolsPerCategory);
    }
  }

  return Array.from(merged.values()).slice(0, maxCategories);
}
