import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, FolderOpen, ListChecks, Search, Wrench, X } from 'lucide-react';
import type { Category, ReferenceDocument, Subcategory, Task, WorkflowData } from '@/types';
import { cn } from '@/lib/utils';
import {
  DisplayGroup,
  getDisplayGroups,
  getGroupDisplayName,
  getGroupedSubcategoryDisplayName,
} from '@/lib/workflowDisplay';

type SearchResultType =
  | 'Section'
  | 'Group'
  | 'Subsection'
  | 'Task'
  | 'Utility'
  | 'Utility Task'
  | 'Document';

interface SearchResult {
  id: string;
  type: SearchResultType;
  label: string;
  context: string;
  path: string;
  searchableText: string;
  rank: number;
  categoryId: string;
}

interface WorkflowSearchProps {
  workflowData: WorkflowData;
  budgetKey: string;
  currentCategoryId?: string;
  className?: string;
}

const typeStyles: Record<SearchResultType, string> = {
  Section: 'bg-primary/10 text-primary',
  Group: 'bg-primary/10 text-primary',
  Subsection: 'bg-slate-100 text-slate-700',
  Task: 'bg-slate-100 text-slate-700',
  Utility: 'bg-primary/5 text-primary/80',
  'Utility Task': 'bg-primary/5 text-primary/80',
  Document: 'bg-blue-50 text-blue-700',
};

const typeIcons: Record<SearchResultType, typeof FolderOpen> = {
  Section: FolderOpen,
  Group: FolderOpen,
  Subsection: ListChecks,
  Task: ListChecks,
  Utility: Wrench,
  'Utility Task': Wrench,
  Document: FileText,
};

function normalizeSearchText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function makeSearchableText(...parts: Array<string | undefined>) {
  return normalizeSearchText(parts.filter(Boolean).join(' '));
}

function groupContext(category: Category, group: DisplayGroup) {
  const badge = group.badgeLabel || group.subgroup;
  return `${category.name} > ${badge}. ${getGroupDisplayName(category.id, group)}`;
}

function buildSearchResults(workflowData: WorkflowData, budgetKey: string) {
  const results: SearchResult[] = [];

  workflowData.categories.forEach((category, categoryIndex) => {
    const sectionPrefix = `${categoryIndex + 1}. ${category.name}`;
    const categoryPath = `/budget/${budgetKey}/category/${category.id}`;

    results.push({
      id: `section-${category.id}`,
      type: 'Section',
      label: category.name,
      context: sectionPrefix,
      path: categoryPath,
      searchableText: makeSearchableText(category.name, sectionPrefix),
      rank: 10,
      categoryId: category.id,
    });

    category.documents?.forEach((document: ReferenceDocument) => {
      results.push({
        id: `category-document-${category.id}-${document.id}`,
        type: 'Document',
        label: document.name,
        context: `${sectionPrefix} > Reference Documents`,
        path: categoryPath,
        searchableText: makeSearchableText(
          document.name,
          document.description,
          category.name,
          'reference document'
        ),
        rank: 70,
        categoryId: category.id,
      });
    });

    const displayGroups = getDisplayGroups(category);
    const groupedIndices = new Set<number>();

    displayGroups.forEach((group) => {
      const groupName = getGroupDisplayName(category.id, group);
      const groupPath = `${categoryPath}?group=${encodeURIComponent(group.id)}`;
      const context = groupContext(category, group);

      results.push({
        id: `group-${category.id}-${group.id}`,
        type: 'Group',
        label: groupName,
        context,
        path: groupPath,
        searchableText: makeSearchableText(
          category.name,
          groupName,
          group.badgeLabel,
          group.subgroup
        ),
        rank: 20,
        categoryId: category.id,
      });

      group.subcategoryIndices.forEach((subcategoryIndex) => {
        groupedIndices.add(subcategoryIndex);
        const subcategory = category.subcategories[subcategoryIndex];
        if (!subcategory || subcategory.isUtility) return;

        const subcategoryName = getGroupedSubcategoryDisplayName(
          category.id,
          group,
          subcategory
        );
        const subcategoryPath = `/budget/${budgetKey}/category/${category.id}/subcategory/${subcategory.id}?group=${encodeURIComponent(group.id)}`;
        const subcategoryContext = `${context} > ${subcategoryName}`;

        addSubcategoryResults({
          results,
          category,
          subcategory,
          subcategoryName,
          context: subcategoryContext,
          path: subcategoryPath,
          categoryId: category.id,
        });
      });
    });

    category.subcategories.forEach((subcategory, subcategoryIndex) => {
      if (groupedIndices.has(subcategoryIndex)) return;

      if (subcategory.isUtility) {
        addUtilityResults({
          results,
          category,
          subcategory,
          sectionPrefix,
          path: categoryPath,
        });
        return;
      }

      addSubcategoryResults({
        results,
        category,
        subcategory,
        subcategoryName: subcategory.name,
        context: `${sectionPrefix} > ${subcategory.name}`,
        path: `/budget/${budgetKey}/category/${category.id}/subcategory/${subcategory.id}`,
        categoryId: category.id,
      });
    });
  });

  return results;
}

function addSubcategoryResults({
  results,
  category,
  subcategory,
  subcategoryName,
  context,
  path,
  categoryId,
}: {
  results: SearchResult[];
  category: Category;
  subcategory: Subcategory;
  subcategoryName: string;
  context: string;
  path: string;
  categoryId: string;
}) {
  results.push({
    id: `subcategory-${category.id}-${path}`,
    type: 'Subsection',
    label: subcategoryName,
    context,
    path,
    searchableText: makeSearchableText(category.name, subcategory.name, subcategoryName),
    rank: 30,
    categoryId,
  });

  subcategory.tasks.forEach((task: Task) => {
    results.push({
      id: `task-${category.id}-${subcategory.id}-${task.id}-${path}`,
      type: 'Task',
      label: task.name,
      context,
      path,
      searchableText: makeSearchableText(category.name, subcategoryName, task.name),
      rank: 40,
      categoryId,
    });
  });

  subcategory.documents?.forEach((document: ReferenceDocument) => {
    results.push({
      id: `document-${category.id}-${subcategory.id}-${document.id}-${path}`,
      type: 'Document',
      label: document.name,
      context: `${context} > Reference Documents`,
      path,
      searchableText: makeSearchableText(
        category.name,
        subcategoryName,
        document.name,
        document.description,
        'reference document'
      ),
      rank: 70,
      categoryId,
    });
  });
}

function addUtilityResults({
  results,
  category,
  subcategory,
  sectionPrefix,
  path,
}: {
  results: SearchResult[];
  category: Category;
  subcategory: Subcategory;
  sectionPrefix: string;
  path: string;
}) {
  const context = `${sectionPrefix} > Utilities > ${subcategory.name}`;

  results.push({
    id: `utility-${category.id}-${subcategory.id}`,
    type: 'Utility',
    label: subcategory.name,
    context,
    path,
    searchableText: makeSearchableText(category.name, subcategory.name, 'utility utilities'),
    rank: 50,
    categoryId: category.id,
  });

  subcategory.tasks.forEach((task) => {
    results.push({
      id: `utility-task-${category.id}-${subcategory.id}-${task.id}`,
      type: 'Utility Task',
      label: task.name,
      context,
      path,
      searchableText: makeSearchableText(category.name, subcategory.name, task.name, 'utility'),
      rank: 60,
      categoryId: category.id,
    });
  });
}

export function WorkflowSearch({
  workflowData,
  budgetKey,
  currentCategoryId,
  className,
}: WorkflowSearchProps) {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const searchResults = useMemo(
    () => buildSearchResults(workflowData, budgetKey),
    [workflowData, budgetKey]
  );

  const normalizedQuery = normalizeSearchText(query);
  const queryParts = normalizedQuery.split(' ').filter(Boolean);
  const visibleResults = useMemo(() => {
    if (queryParts.length === 0) return [];

    return searchResults
      .filter((result) => queryParts.every((part) => result.searchableText.includes(part)))
      .sort((a, b) => {
        const aExact = normalizeSearchText(a.label) === normalizedQuery ? -20 : 0;
        const bExact = normalizeSearchText(b.label) === normalizedQuery ? -20 : 0;
        const aCurrent = currentCategoryId && a.categoryId === currentCategoryId ? -5 : 0;
        const bCurrent = currentCategoryId && b.categoryId === currentCategoryId ? -5 : 0;
        return a.rank + aExact + aCurrent - (b.rank + bExact + bCurrent);
      })
      .slice(0, 12);
  }, [currentCategoryId, normalizedQuery, queryParts, searchResults]);

  const shouldShowResults = isFocused && query.trim().length > 0;

  const handleResultClick = (path: string) => {
    navigate(path);
    setQuery('');
    setIsFocused(false);
  };

  return (
    <div
      ref={containerRef}
      className={cn('relative w-full max-w-xl print:hidden', className)}
      onBlur={(event) => {
        if (!containerRef.current?.contains(event.relatedTarget as Node | null)) {
          setIsFocused(false);
        }
      }}
    >
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setIsFocused(true)}
          placeholder="Search sections, tasks, utilities or documents"
          className="h-11 w-full rounded-xl border-2 border-primary/30 bg-white py-2 pl-11 pr-11 text-sm font-medium text-slate-900 shadow-sm outline-none transition-all placeholder:text-slate-500 hover:border-primary/40 hover:bg-primary/5 focus:border-primary/50 focus:bg-white focus:ring-2 focus:ring-primary/10"
          type="search"
          aria-label="Search workflow"
        />
        {query ? (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-primary/60 transition-colors hover:bg-primary/5 hover:text-primary"
            aria-label="Clear search"
            title="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {shouldShowResults ? (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[28rem] overflow-y-auto rounded-xl border border-primary/15 bg-white p-2 shadow-xl">
          {visibleResults.length > 0 ? (
            <div className="space-y-1">
              {visibleResults.map((result) => {
                const Icon = typeIcons[result.type];

                return (
                  <button
                    key={result.id}
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => handleResultClick(result.path)}
                    className="flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-primary/5 focus:bg-primary/5 focus:outline-none"
                  >
                    <span className="mt-0.5 inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/5 text-primary">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold text-slate-900">
                          {result.label}
                        </span>
                        <span
                          className={cn(
                            'flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                            typeStyles[result.type]
                          )}
                        >
                          {result.type}
                        </span>
                      </span>
                      <span className="mt-1 block truncate text-xs text-slate-500">
                        {result.context}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="px-4 py-6 text-center text-sm text-slate-500">
              No matches found.
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
