import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ReferenceDocumentsPanel } from '@/components/ReferenceDocumentsPanel';
import { UtilitiesPanel } from '@/components/UtilitiesPanel';
import { FlowChart, FlowNode, FlowLine } from '@/components/FlowChart';
import { WorkflowSearch } from '@/components/WorkflowSearch';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Filter,
  X,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import type { WorkflowData } from '@/types';
import { shouldIgnoreArrowNavigation } from '@/lib/keyboard';
import { cn } from '@/lib/utils';
import { getBudgetConfig, getWorkflowDataForBudget, makeScopedCategoryId } from '@/lib/budgets';
import { saveCategoryAsPdf } from '@/lib/exportWorkflow';
import {
  DisplayGroup,
  getDisplayGroups,
  getGroupDisplayName,
  getGroupedSubcategoryDisplayName,
  getProgressSubcategoryId,
} from '@/lib/workflowDisplay';

interface CategoryPageProps {
  workflowData: WorkflowData;
}

type SectionFilter = 'all' | 'completed' | 'incomplete';

const sectionActionButtonClass =
  'h-8 rounded-full border-primary/30 bg-white px-3 text-[10px] font-semibold text-primary shadow-sm hover:border-primary/40 hover:bg-primary/5';

export function CategoryPage({ workflowData }: CategoryPageProps) {
  const { budgetKey, categoryId } = useParams<{ budgetKey: string; categoryId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [sectionFilter, setSectionFilter] = useState<SectionFilter>('all');
  const [isSectionFilterOpen, setIsSectionFilterOpen] = useState(false);
  const [pendingSectionAction, setPendingSectionAction] = useState<'markAll' | 'reset' | undefined>();
  const {
    expandedGroups,
    toggleGroup,
    getSubcategoryProgress,
    markAllTasksComplete,
    setTaskComplete,
    progress,
    notes,
  } = useAppStore();

  const budget = getBudgetConfig(budgetKey);
  const budgetWorkflowData = getWorkflowDataForBudget(workflowData, budget.key);
  const category = budgetWorkflowData.categories.find((c) => c.id === categoryId);
  const requestedGroupId = searchParams.get('group');

  useEffect(() => {
    if (!category || !requestedGroupId) return;

    const scopedId = makeScopedCategoryId(budget.key, category.id);
    const isGroupOpen = expandedGroups[scopedId]?.includes(requestedGroupId);

    if (!isGroupOpen) {
      toggleGroup(scopedId, requestedGroupId);
    }

    navigate(`/budget/${budget.key}/category/${category.id}`, { replace: true });
  }, [budget.key, category, expandedGroups, navigate, requestedGroupId, toggleGroup]);

  if (!category) {
    return <div>Category not found</div>;
  }

  const scopedCategoryId = makeScopedCategoryId(budget.key, category.id);
  const categoryNumber = budgetWorkflowData.categories.findIndex((c) => c.id === category.id) + 1;
  const previousCategory = categoryNumber > 1
    ? budgetWorkflowData.categories[categoryNumber - 2]
    : undefined;
  const previousCategoryNumber = previousCategory ? categoryNumber - 1 : undefined;
  const nextCategory = categoryNumber < budgetWorkflowData.categories.length
    ? budgetWorkflowData.categories[categoryNumber]
    : undefined;
  const nextCategoryNumber = nextCategory ? categoryNumber + 1 : undefined;
  const utilitySubcategories = category.subcategories.filter((s) => s.isUtility);
  const hasSidebar = utilitySubcategories.length > 0 || Boolean(category.documents?.length);

  const categoryExpandedGroups = new Set(expandedGroups[scopedCategoryId] || []);

  const groupsByOrder: DisplayGroup[] = getDisplayGroups(category);

  const regularSubcategories = category.subcategories.filter((sub, index) => {
    const inGroup = category.groups.some((g) => g.subcategoryIndices.includes(index));
    return !sub.isUtility && !inGroup;
  });

  const handleSubcategoryClick = (subcategoryId: string, groupId?: string) => {
    const groupSearch = groupId ? `?group=${encodeURIComponent(groupId)}` : '';
    navigate(`/budget/${budget.key}/category/${category.id}/subcategory/${subcategoryId}${groupSearch}`);
  };

  const handleGroupClick = (groupId: string) => {
    toggleGroup(scopedCategoryId, groupId);
  };

  const handleMarkAllToggle = (
    subcategory: typeof category.subcategories[0],
    group?: DisplayGroup
  ) => {
    const progressSubcategoryId = getProgressSubcategoryId(category.id, group, subcategory);
    const taskIds = subcategory.tasks.map((task) => task.id);
    taskIds.forEach((taskId: string) => {
      if (progress[scopedCategoryId]?.[progressSubcategoryId]?.[taskId] === undefined) {
        setTaskComplete(scopedCategoryId, progressSubcategoryId, taskId, false);
      }
    });
    markAllTasksComplete(scopedCategoryId, progressSubcategoryId, taskIds);
  };

  const getSubcategoryCompletedTasks = (
    subcategory: typeof category.subcategories[0],
    group?: DisplayGroup
  ) => {
    const progressSubcategoryId = getProgressSubcategoryId(category.id, group, subcategory);
    const subcategoryProgress = progress[scopedCategoryId]?.[progressSubcategoryId] || {};
    return subcategory.tasks.filter((task) => subcategoryProgress[task.id] === true).length;
  };

  const getFilterLabel = (filter: SectionFilter) => {
    if (filter === 'completed') return 'Completed only';
    if (filter === 'incomplete') return 'Incomplete only';
    return undefined;
  };

  const isSubcategoryComplete = (
    subcategory: typeof category.subcategories[0],
    group?: DisplayGroup
  ) => {
    return subcategory.tasks.length > 0 && getSubcategoryCompletedTasks(subcategory, group) === subcategory.tasks.length;
  };

  const matchesSectionFilter = (
    subcategory: typeof category.subcategories[0],
    group?: DisplayGroup
  ) => {
    if (sectionFilter === 'completed') return isSubcategoryComplete(subcategory, group);
    if (sectionFilter === 'incomplete') return !isSubcategoryComplete(subcategory, group);
    return true;
  };

  const setSectionTasksComplete = (complete: boolean) => {
    groupsByOrder.forEach((group) => {
      group.subcategoryIndices
        .map((index) => category.subcategories[index])
        .filter((subcategory) => subcategory && !subcategory.isUtility)
        .forEach((subcategory) => {
          const progressSubcategoryId = getProgressSubcategoryId(category.id, group, subcategory);
          subcategory.tasks.forEach((task) => {
            setTaskComplete(scopedCategoryId, progressSubcategoryId, task.id, complete);
          });
        });
    });

    regularSubcategories.forEach((subcategory) => {
      subcategory.tasks.forEach((task) => {
        setTaskComplete(scopedCategoryId, subcategory.id, task.id, complete);
      });
    });

    utilitySubcategories.forEach((subcategory) => {
      subcategory.tasks.forEach((task) => {
        setTaskComplete(scopedCategoryId, subcategory.id, task.id, complete);
      });
    });
  };

  const getSectionFilterItems = () => {
    const groupedItems = groupsByOrder.flatMap((group) =>
      group.subcategoryIndices
        .map((index) => category.subcategories[index])
        .filter((subcategory) => subcategory && !subcategory.isUtility)
        .map((subcategory) => ({ subcategory, group }))
    );

    const regularItems = regularSubcategories.map((subcategory) => ({
      subcategory,
      group: undefined,
    }));

    const utilityItems = utilitySubcategories.map((subcategory) => ({
      subcategory,
      group: undefined,
    }));

    return [...groupedItems, ...regularItems, ...utilityItems];
  };

  const sectionFilterLabel = getFilterLabel(sectionFilter);
  const sectionFilterItems = getSectionFilterItems();
  const filteredSectionItems = sectionFilterItems.filter(({ subcategory, group }) =>
    matchesSectionFilter(subcategory, group)
  ).length;
  const totalSectionItems = sectionFilterItems.length;
  const exportOptions = {
    workflowData: budgetWorkflowData,
    budgetKey: budget.key,
    budgetLabel: budget.label,
    category,
    categoryNumber,
    progress,
    notes,
  };

  const renderSectionFilterMenu = () => (
    <div className="absolute left-0 top-full z-40 mt-2 w-48 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
      {[
        { value: 'all' as const, label: 'All items' },
        { value: 'completed' as const, label: 'Completed only' },
        { value: 'incomplete' as const, label: 'Incomplete only' },
      ].map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => {
            setSectionFilter(option.value);
            setIsSectionFilterOpen(false);
          }}
          className={cn(
            'flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-primary/5',
            sectionFilter === option.value ? 'font-semibold text-primary' : 'text-slate-700'
          )}
        >
          <span>{option.label}</span>
          {sectionFilter === option.value ? <Check className="h-4 w-4" /> : null}
        </button>
      ))}
    </div>
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (shouldIgnoreArrowNavigation(event)) return;

      if (event.key === 'ArrowLeft' && previousCategory) {
        event.preventDefault();
        navigate(`/budget/${budget.key}/category/${previousCategory.id}`);
      }

      if (event.key === 'ArrowRight' && nextCategory) {
        event.preventDefault();
        navigate(`/budget/${budget.key}/category/${nextCategory.id}`);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [budget.key, navigate, nextCategory, previousCategory]);

  const flowItems: Array<{
    type: 'group' | 'subcategory';
    id: string;
    data: any;
  }> = [];

  groupsByOrder.forEach((group) => {
    const groupSubcategories = group.subcategoryIndices
      .map((index) => category.subcategories[index])
      .filter((subcategory) => subcategory && !subcategory.isUtility);

    if (groupSubcategories.some((subcategory) => matchesSectionFilter(subcategory, group))) {
      flowItems.push({ type: 'group', id: group.id, data: group });
    }
  });

  regularSubcategories.forEach((sub) => {
    if (matchesSectionFilter(sub)) {
      flowItems.push({ type: 'subcategory', id: sub.id, data: sub });
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 overflow-x-hidden">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
        <div className="bg-primary">
          <div className="mx-auto flex max-w-7xl items-center justify-end px-6 py-1">
            <img
              src="/USC Logo Cropped.png"
              alt="USC logo"
              className="h-8 w-auto opacity-95 sm:h-9"
            />
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-6 py-6">
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <Breadcrumbs
              items={[
                { label: `Budget: ${budget.shortLabel}`, path: `/budget/${budget.key}/workflow` },
                { label: category.name },
              ]}
            />
            <WorkflowSearch
              workflowData={budgetWorkflowData}
              budgetKey={budget.key}
              currentCategoryId={category.id}
              className="max-w-none lg:w-[28rem]"
            />
          </div>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex items-center gap-4">
                <div className="text-3xl font-semibold text-primary">
                  {categoryNumber}.
                </div>
                <h1 className="font-serif text-4xl font-bold text-primary">
                  {category.name}
                </h1>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-1.5 print:hidden">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPendingSectionAction('markAll')}
                  className={cn(sectionActionButtonClass, 'whitespace-nowrap')}
                >
                  Mark all done
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPendingSectionAction('reset')}
                  className={cn(sectionActionButtonClass, 'whitespace-nowrap')}
                >
                  Reset
                </Button>
                <div className="relative">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsSectionFilterOpen((open) => !open)}
                    className={cn(
                      sectionActionButtonClass,
                      'whitespace-nowrap',
                      sectionFilterLabel && 'ring-2 ring-primary/10'
                    )}
                    aria-label={`Filter ${category.name}`}
                    title={`Filter ${category.name}`}
                  >
                    <Filter className="mr-1 h-3 w-3" />
                    Filter
                  </Button>
                  {isSectionFilterOpen ? renderSectionFilterMenu() : null}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => saveCategoryAsPdf(exportOptions)}
                  className="h-8 whitespace-nowrap rounded-md border-2 border-primary bg-white px-2.5 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/10"
                  title={`Save ${category.name} as PDF`}
                >
                  <span>Save as PDF</span>
                  <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                </Button>
                {sectionFilterLabel ? (
                  <div className="inline-flex items-center gap-2 rounded-md border border-primary/30 bg-white px-3 py-1.5 text-xs font-semibold text-primary">
                    <span>Filter: {sectionFilterLabel}</span>
                    <span className="text-primary/80">
                      {filteredSectionItems}/{totalSectionItems}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSectionFilter('all')}
                      className="inline-flex h-5 w-5 items-center justify-center rounded-md transition-colors hover:bg-primary/5"
                      aria-label={`Clear ${category.name} filter`}
                      title={`Clear ${category.name} filter`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="flex flex-col gap-3 print:hidden lg:items-end">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Button
                  variant="outline"
                  disabled={!previousCategory}
                  onClick={() =>
                    previousCategory && navigate(`/budget/${budget.key}/category/${previousCategory.id}`)
                  }
                  className="flex h-auto min-w-[11rem] items-center gap-3 rounded-full border-primary/20 bg-primary/5 px-5 py-3 text-primary shadow-sm transition-colors hover:bg-primary/10 disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-400 disabled:shadow-none"
                  title={previousCategory && previousCategoryNumber ? `Previous section: ${previousCategoryNumber}. ${previousCategory.name}` : 'No previous section'}
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="text-left">
                    Previous Section
                    {previousCategory && previousCategoryNumber ? (
                      <span className="block max-w-44 truncate text-xs font-normal text-slate-500">
                        {previousCategoryNumber}. {previousCategory.name}
                      </span>
                    ) : null}
                  </span>
                </Button>
                <Button
                  variant="outline"
                  disabled={!nextCategory}
                  onClick={() =>
                    nextCategory && navigate(`/budget/${budget.key}/category/${nextCategory.id}`)
                  }
                  className="flex h-auto min-w-[11rem] items-center gap-3 rounded-full border-primary/20 bg-primary/5 px-5 py-3 text-primary shadow-sm transition-colors hover:bg-primary/10 disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-400 disabled:shadow-none"
                  title={nextCategory && nextCategoryNumber ? `Next section: ${nextCategoryNumber}. ${nextCategory.name}` : 'No next section'}
                >
                  <span className="text-left">
                    Next Section
                    {nextCategory && nextCategoryNumber ? (
                      <span className="block max-w-44 truncate text-xs font-normal text-slate-500">
                        {nextCategoryNumber}. {nextCategory.name}
                      </span>
                    ) : null}
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8 overflow-x-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div
            className={cn(
              'lg:col-span-3',
              !hasSidebar && 'lg:col-span-4'
            )}
          >
            <div className="bg-gradient-to-br from-slate-50 to-white rounded-xl border-2 border-slate-200 p-4 shadow-lg overflow-hidden">
              <div className="overflow-x-auto -mx-4 px-0 scroll-smooth">
                {flowItems.length > 0 ? (
                <FlowChart>
                  {flowItems.map((item, index) => {
                    if (item.type === 'group') {
                      const group = item.data;
                      const isExpanded = categoryExpandedGroups.has(group.id);
                      const groupSubcategories = group.subcategoryIndices
                        .map((idx: number) => category.subcategories[idx])
                        .filter((sub: typeof category.subcategories[0]) => !sub.isUtility);

                      return (
                        <div key={item.id} className="flex items-center">
                          <FlowNode>
                            <Card
                              className="w-56 border-2 border-primary transition-all duration-200 ease-out hover:-translate-y-0.5 hover:scale-[1.02] hover:border-primary-dark hover:bg-[linear-gradient(180deg,rgba(153,27,27,0.05),rgba(153,27,27,0.02))] hover:shadow-none active:translate-y-0 active:scale-100 cursor-pointer group relative"
                              onClick={() => handleGroupClick(group.id)}
                            >
                              <CardContent className="p-5 pb-6 pt-7">
                                <div className="absolute -top-2 -left-2 h-8 w-8 rounded-full bg-primary text-white font-bold flex items-center justify-center shadow-md border-2 border-white text-sm z-10">
                                  {group.badgeLabel || group.subgroup}
                                </div>

                                <div className="mt-2 text-center">
                                  <h3 className="font-semibold text-sm text-slate-900 mb-2 line-clamp-2 group-hover:text-primary">
                                    {getGroupDisplayName(category.id, group)}
                                  </h3>
                                  <p className="text-xs text-slate-500 mb-3">
                                    {groupSubcategories.length} items
                                  </p>
                                  <div className="flex items-center justify-center">
                                    {isExpanded ? (
                                      <ChevronDown className="h-4 w-4 text-primary" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4 text-primary" />
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </FlowNode>

                          {index < flowItems.length - 1 && <FlowLine />}
                        </div>
                      );
                    }

                    const subcategory = item.data;
                    const subcategoryProgress = getSubcategoryProgress(
                      scopedCategoryId,
                      subcategory.id,
                      subcategory.tasks.map((task: typeof subcategory.tasks[0]) => task.id)
                    );
                    const completedTasks = getSubcategoryCompletedTasks(subcategory);

                    return (
                      <div key={item.id} className="flex items-center">
                        <FlowNode onClick={() => handleSubcategoryClick(subcategory.id)}>
                          <Card
                            className={cn(
                              'w-56 border-2 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:scale-[1.02] hover:bg-[linear-gradient(180deg,rgba(153,27,27,0.05),rgba(153,27,27,0.02))] hover:shadow-none cursor-pointer group relative',
                              subcategoryProgress === 100
                                ? 'border-primary/50 bg-primary/5'
                                : 'border-primary hover:border-primary-dark'
                            )}
                          >
                            <CardContent className="p-5 pb-6 pt-7">
                              <div className="text-center">
                                <h3 className="font-semibold text-sm text-slate-900 mb-3 line-clamp-2 group-hover:text-primary min-h-[2.5rem] flex items-center justify-center">
                                  {subcategory.name}
                                </h3>
                                <div className="space-y-2">
                                  <div className="flex justify-between items-center text-xs text-slate-600">
                                    <span>
                                      {completedTasks}/{subcategory.tasks.length}
                                    </span>
                                    <span className="font-semibold text-primary">
                                      {Math.round(subcategoryProgress)}%
                                    </span>
                                  </div>
                                  <div className="h-1.5 w-full rounded-full bg-slate-200">
                                    <div
                                      className="h-full bg-gradient-to-r from-primary to-primary-dark transition-all duration-500"
                                      style={{ width: `${subcategoryProgress}%` }}
                                    />
                                  </div>
                                  <div className="flex items-center justify-center pt-2">
                                    <span className="group/markall inline-flex">
                                      <Checkbox
                                        id={`subcategory-mark-all-${category.id}-${subcategory.id}`}
                                        checked={subcategoryProgress === 100}
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          handleMarkAllToggle(subcategory);
                                        }}
                                        onCheckedChange={() => {
                                          handleMarkAllToggle(subcategory);
                                        }}
                                        className="cursor-pointer"
                                        aria-label={
                                          subcategoryProgress === 100
                                            ? 'Unmark all tasks'
                                            : 'Mark all tasks as done'
                                        }
                                      />
                                    </span>
                                    <label
                                      htmlFor={`subcategory-mark-all-${category.id}-${subcategory.id}`}
                                      className="ml-2 cursor-pointer text-xs text-slate-600 transition-colors hover:text-primary group-hover/markall:text-primary"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleMarkAllToggle(subcategory);
                                      }}
                                    >
                                      Mark all done
                                    </label>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </FlowNode>

                        {index < flowItems.length - 1 && <FlowLine />}
                      </div>
                    );
                  })}
                </FlowChart>
                ) : (
                  <div className="px-6 py-12 text-center text-sm text-slate-500">
                    No {sectionFilterLabel?.toLowerCase()} items match this filter.
                  </div>
                )}
              </div>

              {groupsByOrder.map((group) => {
                const isExpanded = categoryExpandedGroups.has(group.id);
                if (!isExpanded) return null;

                const groupSubcategories = group.subcategoryIndices
                  .map((idx: number) => category.subcategories[idx])
                  .filter((sub: typeof category.subcategories[0]) => !sub.isUtility)
                  .filter((sub: typeof category.subcategories[0]) => matchesSectionFilter(sub, group));

                if (groupSubcategories.length === 0) return null;

                return (
                  <div key={`expanded-${group.id}`} className="mt-4 pt-4 border-t-2 border-slate-200">
                    <div className="mb-3 flex items-center gap-3 px-4">
                      <div className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-primary px-2 text-sm font-bold text-white shadow-sm">
                        {group.badgeLabel || group.subgroup}
                      </div>
                      <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-semibold text-primary">
                        {getGroupDisplayName(category.id, group)}
                      </div>
                    </div>
                    <div className="overflow-x-auto -mx-4 px-0 scroll-smooth">
                      <FlowChart className="pt-8 pb-4">
                        {groupSubcategories.map(
                          (subcategory: typeof category.subcategories[0], subIndex: number) => {
                            const progressSubcategoryId = getProgressSubcategoryId(
                              category.id,
                              group,
                              subcategory
                            );
                            const subcategoryProgress = getSubcategoryProgress(
                              scopedCategoryId,
                              progressSubcategoryId,
                              subcategory.tasks.map((task) => task.id)
                            );
                            const completedTasks = getSubcategoryCompletedTasks(subcategory, group);

                            return (
                              <div key={subcategory.id} className="flex items-center">
                                <FlowNode>
                                  <Card
                                    className={cn(
                                      'w-48 border-2 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:scale-[1.02] hover:bg-[linear-gradient(180deg,rgba(153,27,27,0.05),rgba(153,27,27,0.02))] hover:shadow-none cursor-pointer group relative',
                                      subcategoryProgress === 100
                                        ? 'border-primary/50 bg-primary/5'
                                        : 'border-primary hover:border-primary-dark'
                                    )}
                                    onClick={(e) => {
                                      const target = e.target as HTMLElement;
                                      if (
                                        !target.closest('[role="checkbox"]') &&
                                        !target.closest('label') &&
                                        !target.closest('input')
                                      ) {
                                        handleSubcategoryClick(subcategory.id, group.id);
                                      }
                                    }}
                                  >
                                    <CardContent className="p-3 pb-4 pt-4">
                                      <div className="text-center">
                                        <h4 className="font-semibold text-xs text-slate-900 mb-2 line-clamp-2 group-hover:text-primary min-h-[2rem] flex items-center justify-center">
                                          {getGroupedSubcategoryDisplayName(category.id, group, subcategory)}
                                        </h4>
                                        <div className="space-y-1.5">
                                          <div className="flex justify-between items-center text-xs text-slate-600">
                                            <span>
                                              {completedTasks}/{subcategory.tasks.length}
                                            </span>
                                            <span className="font-semibold text-primary text-xs">
                                              {Math.round(subcategoryProgress)}%
                                            </span>
                                          </div>
                                          <div className="h-1.5 w-full rounded-full bg-slate-200">
                                            <div
                                              className="h-full bg-gradient-to-r from-primary to-primary-dark transition-all duration-500"
                                              style={{ width: `${subcategoryProgress}%` }}
                                            />
                                          </div>
                                          <div className="flex items-center justify-center pt-2">
                                            <span className="group/markall inline-flex">
                                              <Checkbox
                                                id={`expanded-subcategory-mark-all-${category.id}-${group.id}-${subcategory.id}`}
                                                checked={subcategoryProgress === 100}
                                                onClick={(e) => {
                                                  e.preventDefault();
                                                  e.stopPropagation();
                                                  handleMarkAllToggle(subcategory, group);
                                                }}
                                                onCheckedChange={() => {
                                                  handleMarkAllToggle(subcategory, group);
                                                }}
                                                className="cursor-pointer"
                                                aria-label={
                                                  subcategoryProgress === 100
                                                    ? 'Unmark all tasks'
                                                    : 'Mark all tasks as done'
                                                }
                                              />
                                            </span>
                                            <label
                                              htmlFor={`expanded-subcategory-mark-all-${category.id}-${group.id}-${subcategory.id}`}
                                              className="ml-2 cursor-pointer text-xs text-slate-600 transition-colors hover:text-primary group-hover/markall:text-primary"
                                              onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleMarkAllToggle(subcategory, group);
                                              }}
                                            >
                                              Mark all done
                                            </label>
                                          </div>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                </FlowNode>

                                {subIndex < groupSubcategories.length - 1 && <FlowLine />}
                              </div>
                            );
                          }
                        )}
                      </FlowChart>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {hasSidebar && (
            <div className="space-y-6 self-start lg:sticky lg:top-24 lg:col-span-1">
              {category.documents && category.documents.length > 0 ? (
                <ReferenceDocumentsPanel documents={category.documents} sticky={false} />
              ) : null}
              {utilitySubcategories.length > 0 ? (
                <UtilitiesPanel
                  category={category}
                  scopedCategoryId={scopedCategoryId}
                  sectionFilter={sectionFilter}
                  onClearSectionFilter={() => setSectionFilter('all')}
                  sticky={false}
                />
              ) : null}
            </div>
          )}
        </div>
      </main>
      {pendingSectionAction ? (
        <ConfirmDialog
          title={pendingSectionAction === 'markAll' ? 'Mark Entire Section Done?' : 'Reset Entire Section?'}
          message={
            pendingSectionAction === 'markAll'
              ? `Are you sure you want to mark all tasks in ${category.name} as done? This also includes utilities in this section.`
              : `Are you sure you want to reset all tasks in ${category.name}? This also includes utilities in this section.`
          }
          confirmLabel={pendingSectionAction === 'markAll' ? 'Mark all done' : 'Reset all'}
          onCancel={() => setPendingSectionAction(undefined)}
          onConfirm={() => {
            setSectionTasksComplete(pendingSectionAction === 'markAll');
            setPendingSectionAction(undefined);
          }}
        />
      ) : null}
    </div>
  );
}
