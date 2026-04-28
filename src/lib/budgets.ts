import type { WorkflowData } from '@/types';

export type BudgetKey = 'under-5m' | 'over-5m';

interface BudgetConfig {
  key: BudgetKey;
  label: string;
  shortLabel: string;
  description: string;
}

const BUDGET_CONFIGS: Record<BudgetKey, BudgetConfig> = {
  'under-5m': {
    key: 'under-5m',
    label: 'Upto $5 Million',
    shortLabel: 'Upto $5M',
    description: 'This roadmap applies to projects with budgets up to $5 million.',
  },
  'over-5m': {
    key: 'over-5m',
    label: '$5M and Above',
    shortLabel: '$5M and Above',
    description: 'This roadmap applies to projects with budgets of $5 million and above.',
  },
};

export function getBudgetConfig(budgetKey?: string): BudgetConfig {
  if (budgetKey === 'over-5m') {
    return BUDGET_CONFIGS['over-5m'];
  }

  return BUDGET_CONFIGS['under-5m'];
}

export function makeScopedCategoryId(budgetKey: string, categoryId: string): string {
  return `${budgetKey}::${categoryId}`;
}

export function parseScopedCategoryId(scopedCategoryId?: string): {
  budgetKey: BudgetKey;
  categoryId?: string;
} {
  if (!scopedCategoryId || !scopedCategoryId.includes('::')) {
    return { budgetKey: 'under-5m', categoryId: scopedCategoryId };
  }

  const [budgetKey, categoryId] = scopedCategoryId.split('::');

  return {
    budgetKey: budgetKey === 'over-5m' ? 'over-5m' : 'under-5m',
    categoryId,
  };
}

export function getWorkflowDataForBudget(
  workflowData: WorkflowData,
  budgetKey?: string
): WorkflowData {
  const budget = getBudgetConfig(budgetKey);

  if (budget.key === 'over-5m') {
    return workflowData;
  }

  return {
    ...workflowData,
    categories: workflowData.categories.map((category) => {
      if (category.id !== 'design-and-permit') {
        return category;
      }

      const removedId = 'design-peer-review-fms-andor-outside';
      const filteredSubcategories = category.subcategories.filter(
        (subcategory) => subcategory.id !== removedId
      );

      const indexMap = new Map(
        filteredSubcategories.map((subcategory, index) => [subcategory.id, index])
      );

      const filteredGroups = category.groups
        .map((group) => {
          const subcategoryIndices = group.subcategoryIndices
            .map((oldIndex) => category.subcategories[oldIndex])
            .filter(Boolean)
            .filter((subcategory) => subcategory.id !== removedId)
            .map((subcategory) => indexMap.get(subcategory.id))
            .filter((index): index is number => index !== undefined);

          return {
            ...group,
            subcategoryIndices,
          };
        })
        .filter((group) => group.subcategoryIndices.length > 0);

      return {
        ...category,
        subcategories: filteredSubcategories,
        groups: filteredGroups,
      };
    }),
  };
}
