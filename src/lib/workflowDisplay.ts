import type { Category, Group } from '@/types';

export interface DisplayGroup extends Group {
  badgeLabel?: string;
  displayName?: string;
}

export function getDisplayGroups(category: Category): DisplayGroup[] {
  return [...category.groups]
    .sort((a, b) => a.subgroup.localeCompare(b.subgroup))
    .flatMap((group) => {
      if (category.id === 'design-and-permit' && group.subgroup === 'B') {
        return [
          { ...group, id: `${group.id}-dd`, badgeLabel: 'B', displayName: 'DD' },
          { ...group, id: `${group.id}-cd`, badgeLabel: 'C', displayName: 'CD' },
        ];
      }

      if (category.id === 'design-and-permit' && group.subgroup === 'C') {
        return [{ ...group, badgeLabel: 'D' }];
      }

      return [group];
    });
}

export function getGroupDisplayName(
  categoryId: string,
  group: Pick<DisplayGroup, 'subgroup' | 'displayName'>
) {
  if (group.displayName) {
    return group.displayName;
  }

  if (categoryId === 'project-initiation' && group.subgroup === 'A') {
    return 'Initial Scoping';
  }

  if (categoryId === 'construction') {
    if (group.subgroup === 'A') {
      return 'Premobilisation';
    }

    if (group.subgroup === 'B') {
      return 'Construction Mobilisation';
    }
  }

  if (categoryId === 'bid-and-award' && group.subgroup === 'A') {
    return 'Construction Procurement';
  }

  if (categoryId === 'design-and-permit') {
    if (group.subgroup === 'A') {
      return 'Schematic Design';
    }

    if (group.subgroup === 'C') {
      return 'Design Team Management';
    }
  }

  return `Group ${group.subgroup}`;
}

export function getGroupedSubcategoryDisplayName(
  categoryId: string,
  group: Pick<DisplayGroup, 'displayName'> | undefined,
  subcategory: { id: string; name: string }
) {
  if (
    categoryId === 'design-and-permit' &&
    group?.displayName === 'CD' &&
    subcategory.id === 'constructability-review-50-dd-set'
  ) {
    return 'Constructability Review 50% CD Set';
  }

  return subcategory.name;
}
