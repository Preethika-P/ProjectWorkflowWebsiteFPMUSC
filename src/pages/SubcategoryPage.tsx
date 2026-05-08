import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Checklist, type TaskFilter } from '@/components/Checklist';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { PdfExportDialog } from '@/components/PdfExportDialog';
import { ReferenceDocumentsPanel } from '@/components/ReferenceDocumentsPanel';
import { WorkflowSearch } from '@/components/WorkflowSearch';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Check, ExternalLink, Filter } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useToast } from '@/components/ui/use-toast';
import type { WorkflowData } from '@/types';
import { getBudgetConfig, getWorkflowDataForBudget, makeScopedCategoryId } from '@/lib/budgets';
import { saveSubcategoryAsPdf } from '@/lib/exportWorkflow';
import { shouldIgnoreArrowNavigation } from '@/lib/keyboard';
import { cn } from '@/lib/utils';
import { useClickOutside } from '@/lib/useClickOutside';
import {
  getDisplayGroups,
  getGroupDisplayName,
  getGroupedSubcategoryDisplayName,
  getProgressSubcategoryId,
} from '@/lib/workflowDisplay';

interface SubcategoryPageProps {
  workflowData: WorkflowData;
}

interface TaskPageNavItem {
  id: string;
  groupId?: string;
  groupName?: string;
  label: string;
  path: string;
}

export function SubcategoryPage({ workflowData }: SubcategoryPageProps) {
  const { budgetKey, categoryId, subcategoryId } = useParams<{
    budgetKey: string;
    categoryId: string;
    subcategoryId: string;
  }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [taskFilter, setTaskFilter] = useState<TaskFilter>('all');
  const [isTaskFilterOpen, setIsTaskFilterOpen] = useState(false);
  const [isPdfDialogOpen, setIsPdfDialogOpen] = useState(false);
  const taskFilterRef = useClickOutside<HTMLDivElement>(
    () => setIsTaskFilterOpen(false),
    isTaskFilterOpen
  );
  const { setLastVisited, getSubcategoryProgress, progress, notes } = useAppStore();
  const { toast } = useToast();
  const completionToastShownRef = useRef<Record<string, boolean>>({});
  const budget = getBudgetConfig(budgetKey);
  const budgetWorkflowData = getWorkflowDataForBudget(workflowData, budget.key);

  const category = budgetWorkflowData.categories.find((c) => c.id === categoryId);
  const subcategory = category?.subcategories.find(
    (s) => s.id === subcategoryId
  );
  const scopedCategoryId = category ? makeScopedCategoryId(budget.key, category.id) : '';
  const subcategoryIndex = category && subcategory
    ? category.subcategories.findIndex((sub) => sub.id === subcategory.id)
    : -1;
  const requestedGroupId = searchParams.get('group');
  const parentGroup = category && subcategoryIndex >= 0
    ? getDisplayGroups(category).find(
        (group) =>
          group.subcategoryIndices.includes(subcategoryIndex) &&
          (!requestedGroupId || group.id === requestedGroupId)
      ) ||
      getDisplayGroups(category).find((group) =>
        group.subcategoryIndices.includes(subcategoryIndex)
      )
    : undefined;
  const subcategoryDisplayName = category && subcategory
    ? getGroupedSubcategoryDisplayName(category.id, parentGroup, subcategory)
    : subcategory?.name || '';
  const progressSubcategoryId = category && subcategory
    ? getProgressSubcategoryId(category.id, parentGroup, subcategory)
    : subcategoryId || '';
  const taskPageNavItems: TaskPageNavItem[] = category
    ? [
        ...getDisplayGroups(category).flatMap((group) =>
          group.subcategoryIndices
            .map((index) => category.subcategories[index])
            .filter((sub) => sub && !sub.isUtility)
            .map((sub) => ({
              id: sub.id,
              groupId: group.id,
              groupName: getGroupDisplayName(category.id, group),
              label: getGroupedSubcategoryDisplayName(category.id, group, sub),
              path: `/budget/${budget.key}/category/${category.id}/subcategory/${sub.id}?group=${encodeURIComponent(group.id)}`,
            }))
        ),
        ...category.subcategories
          .filter((sub, index) => {
            const isGrouped = category.groups.some((group) =>
              group.subcategoryIndices.includes(index)
            );
            return !sub.isUtility && !isGrouped;
          })
          .map((sub) => ({
            id: sub.id,
            label: sub.name,
            path: `/budget/${budget.key}/category/${category.id}/subcategory/${sub.id}`,
          })),
      ]
    : [];
  const currentNavIndex = taskPageNavItems.findIndex(
    (item) =>
      item.id === subcategoryId &&
      (requestedGroupId ? item.groupId === requestedGroupId : item.groupId === parentGroup?.id)
  );
  const previousTaskPage = currentNavIndex > 0 ? taskPageNavItems[currentNavIndex - 1] : undefined;
  const nextTaskPage =
    currentNavIndex >= 0 && currentNavIndex < taskPageNavItems.length - 1
      ? taskPageNavItems[currentNavIndex + 1]
      : undefined;
  const taskFilterLabel = taskFilter === 'completed'
    ? 'Completed Only'
    : taskFilter === 'incomplete'
      ? 'Incomplete Only'
      : undefined;
  const categoryNumber = category
    ? budgetWorkflowData.categories.findIndex((item) => item.id === category.id) + 1
    : 0;
  const completionToastKey = `${scopedCategoryId}::${progressSubcategoryId}`;
  const showCompletionToastOnce = (options?: { force?: boolean }) => {
    if (!options?.force && completionToastShownRef.current[completionToastKey] === true) return;

    completionToastShownRef.current[completionToastKey] = true;
    toast({
      title: 'All tasks complete!',
      description: `You've completed all tasks in ${subcategoryDisplayName}`,
      variant: 'success',
    });
  };

  useEffect(() => {
    if (category && subcategoryId) {
      setLastVisited(scopedCategoryId, progressSubcategoryId);
    }
  }, [category, progressSubcategoryId, scopedCategoryId, subcategoryId, setLastVisited]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (shouldIgnoreArrowNavigation(event)) return;

      if (event.key === 'ArrowLeft' && previousTaskPage) {
        event.preventDefault();
        navigate(previousTaskPage.path);
      }

      if (event.key === 'ArrowRight' && nextTaskPage) {
        event.preventDefault();
        navigate(nextTaskPage.path);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, nextTaskPage, previousTaskPage]);

  useEffect(() => {
    if (scopedCategoryId && subcategoryId && subcategory) {
      const progress = getSubcategoryProgress(
        scopedCategoryId,
        progressSubcategoryId,
        subcategory.tasks.map((task) => task.id)
      );
      if (progress === 100) {
        showCompletionToastOnce();
      }

      if (progress < 100) {
        completionToastShownRef.current[completionToastKey] = false;
      }
    }
  }, [scopedCategoryId, progressSubcategoryId, subcategoryId, getSubcategoryProgress, subcategory, completionToastKey, showCompletionToastOnce]);

  if (!category) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <div className="text-center">
          <h1 className="font-serif text-2xl font-bold text-primary mb-2">
            Category not found
          </h1>
          <p className="text-slate-600 mb-4">Category ID: {categoryId}</p>
          <Button onClick={() => navigate('/')} variant="outline">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  if (!subcategory) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <div className="text-center">
          <h1 className="font-serif text-2xl font-bold text-primary mb-2">
            Subcategory not found
          </h1>
          <p className="text-slate-600 mb-2">Category: {category.name}</p>
          <p className="text-slate-600 mb-4">Subcategory ID: {subcategoryId}</p>
          <p className="text-xs text-slate-500 mb-4">
            Available subcategories: {category.subcategories.map(s => s.id).join(', ')}
          </p>
          <Button
            onClick={() => navigate(`/budget/${budget.key}/category/${category.id}`)}
            variant="outline"
            className="border-primary text-primary hover:bg-primary/5"
          >
            Back to Category
          </Button>
        </div>
      </div>
    );
  }

  const renderTaskFilterMenu = () => (
    <div className="absolute right-0 top-full z-50 mt-2 w-48 -translate-x-4 rounded-xl border border-slate-200 bg-white p-2 shadow-xl sm:-translate-x-2">
      {[
        { value: 'all' as const, label: 'All Tasks' },
        { value: 'completed' as const, label: 'Completed Only' },
        { value: 'incomplete' as const, label: 'Incomplete Only' },
      ].map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => {
            setTaskFilter(option.value);
            setIsTaskFilterOpen(false);
          }}
          className={cn(
            'flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-primary/5',
            taskFilter === option.value ? 'font-semibold text-primary' : 'text-slate-700'
          )}
        >
          <span>{option.label}</span>
          {taskFilter === option.value ? <Check className="h-4 w-4" /> : null}
        </button>
      ))}
    </div>
  );

  const exportOptions = {
    workflowData: budgetWorkflowData,
    budgetKey: budget.key,
    budgetLabel: budget.label,
    category,
    categoryNumber,
    subcategory,
    itemName: subcategoryDisplayName,
    progressSubcategoryId,
    groupName: parentGroup ? getGroupDisplayName(category.id, parentGroup) : undefined,
    progress,
    notes,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50 shadow-sm print:hidden">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <Breadcrumbs
              items={[
                { label: `Budget: ${budget.shortLabel}`, path: `/budget/${budget.key}/workflow` },
                { label: category.name, path: `/budget/${budget.key}/category/${category.id}` },
                ...(parentGroup
                  ? [
                      {
                        label: getGroupDisplayName(category.id, parentGroup),
                        path: `/budget/${budget.key}/category/${category.id}`,
                      },
                    ]
                  : []),
                { label: subcategoryDisplayName },
              ]}
            />
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center lg:w-auto lg:min-w-[34rem] lg:justify-end">
              <WorkflowSearch
                workflowData={budgetWorkflowData}
                budgetKey={budget.key}
                currentCategoryId={category.id}
                className="max-w-none lg:max-w-md"
              />
              <div ref={taskFilterRef} className="relative">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsTaskFilterOpen((open) => !open)}
                  className={cn(
                    'inline-flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/5 p-0 text-primary shadow-sm transition-colors hover:bg-primary/10',
                    taskFilterLabel && 'ring-2 ring-primary/10'
                  )}
                  aria-label="Filter tasks"
                  title="Filter tasks"
                >
                  <Filter className="h-4 w-4" />
                </Button>
                {isTaskFilterOpen ? renderTaskFilterMenu() : null}
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="font-serif text-3xl font-bold text-primary">
                {subcategoryDisplayName}
              </h1>
              {parentGroup ? (
                <p className="mt-1 text-sm font-medium text-slate-500">
                  {getGroupDisplayName(category.id, parentGroup)}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-3 print:hidden lg:items-end">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Button
                  variant="outline"
                  disabled={!previousTaskPage}
                  onClick={() => previousTaskPage && navigate(previousTaskPage.path)}
                  className="flex h-auto min-w-[10rem] items-center gap-3 rounded-full border-primary/20 bg-primary/5 px-5 py-3 text-primary shadow-sm transition-colors hover:bg-primary/10 disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-400 disabled:shadow-none"
                  title={previousTaskPage ? `Previous: ${previousTaskPage.label}` : 'No previous task page'}
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="text-left">
                    Previous
                    {previousTaskPage ? (
                      <span className="block max-w-44 truncate text-xs font-normal text-slate-500">
                        {previousTaskPage.label}
                      </span>
                    ) : null}
                  </span>
                </Button>
                <Button
                  variant="outline"
                  disabled={!nextTaskPage}
                  onClick={() => nextTaskPage && navigate(nextTaskPage.path)}
                  className="flex h-auto min-w-[10rem] items-center gap-3 rounded-full border-primary/20 bg-primary/5 px-5 py-3 text-primary shadow-sm transition-colors hover:bg-primary/10 disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-400 disabled:shadow-none"
                  title={nextTaskPage ? `Next: ${nextTaskPage.label}` : 'No next task page'}
                >
                  <span className="text-left">
                    Next
                    {nextTaskPage ? (
                      <span className="block max-w-44 truncate text-xs font-normal text-slate-500">
                        {nextTaskPage.label}
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

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-8 print:p-0">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <Checklist
            categoryId={scopedCategoryId}
            subcategory={{ ...subcategory, id: progressSubcategoryId, name: subcategoryDisplayName }}
            taskFilter={taskFilter}
            onTaskFilterChange={setTaskFilter}
            onAllTasksComplete={showCompletionToastOnce}
            progressAction={
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPdfDialogOpen(true)}
                className="h-9 whitespace-nowrap rounded-md border-2 border-primary bg-white px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/10"
                title={`Save ${subcategoryDisplayName} as PDF`}
              >
                <span>Save as PDF</span>
                <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            }
          />
          {subcategory.documents && subcategory.documents.length > 0 ? (
            <aside className="print:hidden">
              <ReferenceDocumentsPanel documents={subcategory.documents} />
            </aside>
          ) : null}
        </div>
      </main>
      {isPdfDialogOpen ? (
        <PdfExportDialog
          onCancel={() => setIsPdfDialogOpen(false)}
          onSubmit={(details) => {
            saveSubcategoryAsPdf(exportOptions, details);
            setIsPdfDialogOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}
