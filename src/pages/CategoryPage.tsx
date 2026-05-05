import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ReferenceDocumentsPanel } from '@/components/ReferenceDocumentsPanel';
import { UtilitiesPanel } from '@/components/UtilitiesPanel';
import { FlowChart, FlowNode, FlowLine } from '@/components/FlowChart';
import { ArrowLeft, ArrowRight, ChevronDown, ChevronRight } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import type { WorkflowData } from '@/types';
import { cn } from '@/lib/utils';
import { getBudgetConfig, getWorkflowDataForBudget, makeScopedCategoryId } from '@/lib/budgets';
import {
  DisplayGroup,
  getDisplayGroups,
  getGroupDisplayName,
  getGroupedSubcategoryDisplayName,
} from '@/lib/workflowDisplay';

interface CategoryPageProps {
  workflowData: WorkflowData;
}

export function CategoryPage({ workflowData }: CategoryPageProps) {
  const { budgetKey, categoryId } = useParams<{ budgetKey: string; categoryId: string }>();
  const navigate = useNavigate();
  const {
    expandedGroups,
    toggleGroup,
    getSubcategoryProgress,
    markAllTasksComplete,
    setTaskComplete,
    progress,
  } = useAppStore();

  const budget = getBudgetConfig(budgetKey);
  const budgetWorkflowData = getWorkflowDataForBudget(workflowData, budget.key);
  const category = budgetWorkflowData.categories.find((c) => c.id === categoryId);

  if (!category) {
    return <div>Category not found</div>;
  }

  const scopedCategoryId = makeScopedCategoryId(budget.key, category.id);
  const categoryNumber = budgetWorkflowData.categories.findIndex((c) => c.id === category.id) + 1;
  const previousCategory = categoryNumber > 1
    ? budgetWorkflowData.categories[categoryNumber - 2]
    : undefined;
  const nextCategory = categoryNumber < budgetWorkflowData.categories.length
    ? budgetWorkflowData.categories[categoryNumber]
    : undefined;
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

  const handleMarkAllToggle = (subcategory: typeof category.subcategories[0]) => {
    const taskIds = subcategory.tasks.map((task) => task.id);
    taskIds.forEach((taskId: string) => {
      if (progress[scopedCategoryId]?.[subcategory.id]?.[taskId] === undefined) {
        setTaskComplete(scopedCategoryId, subcategory.id, taskId, false);
      }
    });
    markAllTasksComplete(scopedCategoryId, subcategory.id, taskIds);
  };

  const getSubcategoryCompletedTasks = (subcategory: typeof category.subcategories[0]) => {
    const subcategoryProgress = progress[scopedCategoryId]?.[subcategory.id] || {};
    return subcategory.tasks.filter((task) => subcategoryProgress[task.id] === true).length;
  };

  const flowItems: Array<{
    type: 'group' | 'subcategory';
    id: string;
    data: any;
  }> = [];

  groupsByOrder.forEach((group) => {
    flowItems.push({ type: 'group', id: group.id, data: group });
  });

  regularSubcategories.forEach((sub) => {
    flowItems.push({ type: 'subcategory', id: sub.id, data: sub });
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
          <div className="mb-4">
            <Breadcrumbs
              items={[
                { label: `Budget: ${budget.shortLabel}`, path: `/budget/${budget.key}/workflow` },
                { label: category.name },
              ]}
            />
          </div>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="text-3xl font-semibold text-primary">
                {categoryNumber}.
              </div>
              <h1 className="font-serif text-4xl font-bold text-primary">
                {category.name}
              </h1>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Button
                variant="outline"
                disabled={!previousCategory}
                onClick={() =>
                  previousCategory && navigate(`/budget/${budget.key}/category/${previousCategory.id}`)
                }
                className="flex min-w-[9.5rem] items-center gap-2 border-primary text-primary hover:bg-primary/5 disabled:border-slate-200 disabled:text-slate-400"
                title={previousCategory ? `Previous section: ${previousCategory.name}` : 'No previous section'}
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="text-left">
                  Previous Section
                  {previousCategory ? (
                    <span className="block max-w-44 truncate text-xs font-normal text-slate-500">
                      {previousCategory.name}
                    </span>
                  ) : null}
                </span>
              </Button>
              <Button
                disabled={!nextCategory}
                onClick={() =>
                  nextCategory && navigate(`/budget/${budget.key}/category/${nextCategory.id}`)
                }
                className="flex min-w-[9.5rem] items-center gap-2 disabled:bg-slate-200 disabled:text-slate-500"
                title={nextCategory ? `Next section: ${nextCategory.name}` : 'No next section'}
              >
                <span className="text-left">
                  Next Section
                  {nextCategory ? (
                    <span className="block max-w-44 truncate text-xs font-normal opacity-85">
                      {nextCategory.name}
                    </span>
                  ) : null}
                </span>
                <ArrowRight className="h-4 w-4" />
              </Button>
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
                                            : 'Mark all tasks as complete'
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
                                      Mark all complete
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
              </div>

              {groupsByOrder.map((group) => {
                const isExpanded = categoryExpandedGroups.has(group.id);
                if (!isExpanded) return null;

                const groupSubcategories = group.subcategoryIndices
                  .map((idx: number) => category.subcategories[idx])
                  .filter((sub: typeof category.subcategories[0]) => !sub.isUtility);

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
                            const subcategoryProgress = getSubcategoryProgress(
                              scopedCategoryId,
                              subcategory.id,
                              subcategory.tasks.map((task) => task.id)
                            );
                            const completedTasks = getSubcategoryCompletedTasks(subcategory);

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
                                                  handleMarkAllToggle(subcategory);
                                                }}
                                                onCheckedChange={() => {
                                                  handleMarkAllToggle(subcategory);
                                                }}
                                                className="cursor-pointer"
                                                aria-label={
                                                  subcategoryProgress === 100
                                                    ? 'Unmark all tasks'
                                                    : 'Mark all tasks as complete'
                                                }
                                              />
                                            </span>
                                            <label
                                              htmlFor={`expanded-subcategory-mark-all-${category.id}-${group.id}-${subcategory.id}`}
                                              className="ml-2 cursor-pointer text-xs text-slate-600 transition-colors hover:text-primary group-hover/markall:text-primary"
                                              onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleMarkAllToggle(subcategory);
                                              }}
                                            >
                                              Mark all complete
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
                <UtilitiesPanel category={category} scopedCategoryId={scopedCategoryId} sticky={false} />
              ) : null}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
