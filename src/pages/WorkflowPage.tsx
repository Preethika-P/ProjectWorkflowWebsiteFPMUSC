import { useState } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { DocumentIndexDialog, type DocumentIndexItem } from '@/components/DocumentIndexDialog';
import { FlowChart, FlowNode, FlowLine } from '@/components/FlowChart';
import { PdfExportDialog } from '@/components/PdfExportDialog';
import { WorkflowSearch } from '@/components/WorkflowSearch';
import { useAppStore } from '@/store/useAppStore';
import type { Category, ReferenceDocument, WorkflowData } from '@/types';
import { getBudgetConfig, getWorkflowDataForBudget, makeScopedCategoryId } from '@/lib/budgets';
import { saveWorkflowAsPdf } from '@/lib/exportWorkflow';
import {
  getDisplayGroups,
  getGroupDisplayName,
  getGroupedSubcategoryDisplayName,
  getProgressSubcategoryId,
} from '@/lib/workflowDisplay';
import { useClickOutside } from '@/lib/useClickOutside';
import { Check, ExternalLink, FileText, Filter, Home, X } from 'lucide-react';

interface WorkflowPageProps {
  workflowData: WorkflowData;
}

type RoadmapFilter =
  | 'all'
  | 'completed'
  | 'incomplete'
  | 'documents'
  | 'no-documents'
  | 'notes'
  | 'no-notes';
type OverallAction = 'markAll' | 'reset';

function getDocumentFileType(url: string) {
  const extension = url.split('.').pop()?.toUpperCase();
  return extension || 'DOC';
}

function addDocumentIndexItem(
  index: Map<string, DocumentIndexItem>,
  document: ReferenceDocument,
  location: string
) {
  const key = `${document.name}::${document.url}`;
  const existing = index.get(key);

  if (existing) {
    if (!existing.locations.includes(location)) {
      existing.locations.push(location);
    }
    return;
  }

  index.set(key, {
    id: key,
    name: document.name,
    url: document.url,
    description: document.description,
    fileType: getDocumentFileType(document.url),
    locations: [location],
  });
}

function buildDocumentIndex(workflowData: WorkflowData): DocumentIndexItem[] {
  const index = new Map<string, DocumentIndexItem>();

  workflowData.categories.forEach((category: Category, categoryIndex) => {
    const sectionLabel = `${categoryIndex + 1}. ${category.name}`;

    category.documents?.forEach((document) => {
      addDocumentIndexItem(index, document, sectionLabel);
    });

    const groupedIndices = new Set<number>();
    getDisplayGroups(category).forEach((group) => {
      const groupLabel = `${group.badgeLabel || group.subgroup}. ${getGroupDisplayName(category.id, group)}`;
      group.subcategoryIndices.forEach((subcategoryIndex) => {
        groupedIndices.add(subcategoryIndex);
        const subcategory = category.subcategories[subcategoryIndex];
        if (!subcategory || subcategory.isUtility) return;

        const subcategoryLabel = getGroupedSubcategoryDisplayName(category.id, group, subcategory);
        subcategory.documents?.forEach((document) => {
          addDocumentIndexItem(index, document, `${sectionLabel} > ${groupLabel} > ${subcategoryLabel}`);
        });
      });
    });

    category.subcategories.forEach((subcategory, subcategoryIndex) => {
      if (groupedIndices.has(subcategoryIndex) || subcategory.isUtility) return;

      subcategory.documents?.forEach((document) => {
        addDocumentIndexItem(index, document, `${sectionLabel} > ${subcategory.name}`);
      });
    });
  });

  return Array.from(index.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export function WorkflowPage({ workflowData }: WorkflowPageProps) {
  const navigate = useNavigate();
  const { budgetKey } = useParams<{ budgetKey: string }>();
  const [roadmapFilter, setRoadmapFilter] = useState<RoadmapFilter>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [pendingOverallAction, setPendingOverallAction] = useState<OverallAction | undefined>();
  const [isDocumentIndexOpen, setIsDocumentIndexOpen] = useState(false);
  const [isPdfDialogOpen, setIsPdfDialogOpen] = useState(false);
  const roadmapFilterRef = useClickOutside<HTMLDivElement>(
    () => setIsFilterOpen(false),
    isFilterOpen
  );
  const { progress: storedProgress, notes, setTaskComplete } = useAppStore();
  const budget = getBudgetConfig(budgetKey);
  const budgetWorkflowData = getWorkflowDataForBudget(workflowData, budget.key);
  const documentIndex = buildDocumentIndex(budgetWorkflowData);
  const exportOptions = {
    workflowData: budgetWorkflowData,
    budgetKey: budget.key,
    budgetLabel: budget.label,
    progress: storedProgress,
    notes,
  };

  const getCategoryTaskCounts = (scopedCategoryId: string, category: WorkflowData['categories'][0]) => {
    const categoryProgress = storedProgress[scopedCategoryId] || {};
    let completedTasks = 0;
    let totalTasks = 0;

    const groupedIndices = new Set<number>();

    getDisplayGroups(category).forEach((group) => {
      group.subcategoryIndices.forEach((index) => {
        const subcategory = category.subcategories[index];
        if (!subcategory || subcategory.isUtility) return;

        groupedIndices.add(index);
        const progressSubcategoryId = getProgressSubcategoryId(category.id, group, subcategory);
        const subcategoryProgress = categoryProgress[progressSubcategoryId] || {};
        totalTasks += subcategory.tasks.length;
        completedTasks += subcategory.tasks.filter(
          (task) => subcategoryProgress[task.id] === true
        ).length;
      });
    });

    category.subcategories.forEach((subcategory, index) => {
      if (groupedIndices.has(index)) return;

      const subcategoryProgress = categoryProgress[subcategory.id] || {};
      totalTasks += subcategory.tasks.length;
      completedTasks += subcategory.tasks.filter(
        (task) => subcategoryProgress[task.id] === true
      ).length;
    });

    return { completedTasks, totalTasks };
  };

  const overallTaskCounts = budgetWorkflowData.categories.reduce(
    (counts, category) => {
      const scopedCategoryId = makeScopedCategoryId(budget.key, category.id);
      const categoryCounts = getCategoryTaskCounts(scopedCategoryId, category);

      return {
        completedTasks: counts.completedTasks + categoryCounts.completedTasks,
        totalTasks: counts.totalTasks + categoryCounts.totalTasks,
      };
    },
    { completedTasks: 0, totalTasks: 0 }
  );
  const overallProgress = overallTaskCounts.totalTasks > 0
    ? (overallTaskCounts.completedTasks / overallTaskCounts.totalTasks) * 100
    : 0;
  const categorySummaries = budgetWorkflowData.categories.map((category, index) => {
    const scopedCategoryId = makeScopedCategoryId(budget.key, category.id);
    const { completedTasks, totalTasks } = getCategoryTaskCounts(scopedCategoryId, category);
    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    const isComplete = totalTasks > 0 && completedTasks === totalTasks;
    const hasReferenceDocuments = Boolean(category.documents?.length) ||
      category.subcategories.some((subcategory) => Boolean(subcategory.documents?.length));
    const hasNotes = category.subcategories.some((subcategory, subcategoryIndex) => {
      const parentGroup = getDisplayGroups(category).find((group) =>
        group.subcategoryIndices.includes(subcategoryIndex)
      );
      const progressSubcategoryId =
        parentGroup && !subcategory.isUtility
          ? getProgressSubcategoryId(category.id, parentGroup, subcategory)
          : subcategory.id;

      return Boolean(notes[scopedCategoryId]?.[progressSubcategoryId]?.trim());
    });

    return {
      category,
      index,
      completedTasks,
      totalTasks,
      progress,
      isComplete,
      hasReferenceDocuments,
      hasNotes,
    };
  });
  const filteredCategorySummaries = categorySummaries.filter(({
    isComplete,
    hasReferenceDocuments,
    hasNotes,
  }) => {
    if (roadmapFilter === 'completed') return isComplete;
    if (roadmapFilter === 'incomplete') return !isComplete;
    if (roadmapFilter === 'documents') return hasReferenceDocuments;
    if (roadmapFilter === 'no-documents') return !hasReferenceDocuments;
    if (roadmapFilter === 'notes') return hasNotes;
    if (roadmapFilter === 'no-notes') return !hasNotes;
    return true;
  });
  const roadmapFilterLabel = roadmapFilter === 'completed'
    ? 'Completed Only'
    : roadmapFilter === 'incomplete'
      ? 'Incomplete Only'
      : roadmapFilter === 'documents'
        ? 'With Reference Documents'
        : roadmapFilter === 'no-documents'
          ? 'Without Reference Documents'
          : roadmapFilter === 'notes'
            ? 'With Notes'
            : roadmapFilter === 'no-notes'
              ? 'Without Notes'
              : undefined;
  const noRoadmapMatchesText = roadmapFilterLabel
    ? `No phases match the ${roadmapFilterLabel.toLowerCase()} filter.`
    : 'No phases match this filter.';

  const setAllWorkflowTasksComplete = (complete: boolean) => {
    budgetWorkflowData.categories.forEach((category) => {
      const scopedCategoryId = makeScopedCategoryId(budget.key, category.id);
      const groupedIndices = new Set<number>();

      getDisplayGroups(category).forEach((group) => {
        group.subcategoryIndices.forEach((index) => {
          const subcategory = category.subcategories[index];
          if (!subcategory || subcategory.isUtility) return;

          groupedIndices.add(index);
          const progressSubcategoryId = getProgressSubcategoryId(category.id, group, subcategory);
          subcategory.tasks.forEach((task) => {
            setTaskComplete(scopedCategoryId, progressSubcategoryId, task.id, complete);
          });
        });
      });

      category.subcategories.forEach((subcategory, index) => {
        if (groupedIndices.has(index)) return;

        subcategory.tasks.forEach((task) => {
          setTaskComplete(scopedCategoryId, subcategory.id, task.id, complete);
        });
      });
    });
  };

  const handleCategoryClick = (categoryId: string) => {
    const category = budgetWorkflowData.categories.find((c) => c.id === categoryId);
    if (!category) return;

    const visibleSubcategories = category.subcategories.filter((sub) => !sub.isUtility);
    const utilitySubcategories = category.subcategories.filter((sub) => sub.isUtility);
    const hasGroups = category.groups.length > 0;

    if (!hasGroups && visibleSubcategories.length === 1 && utilitySubcategories.length === 0) {
      navigate(
        `/budget/${budget.key}/category/${category.id}/subcategory/${visibleSubcategories[0].id}`
      );
      return;
    }

    navigate(`/budget/${budget.key}/category/${category.id}`);
  };

  const renderRoadmapFilterMenu = () => (
    <div className="absolute right-0 top-full z-50 mt-2 w-64 -translate-x-4 rounded-xl border border-slate-200 bg-white p-2 shadow-xl sm:-translate-x-2">
      {[
        { value: 'all' as const, label: 'All Phases' },
        { value: 'completed' as const, label: 'Completed Only' },
        { value: 'incomplete' as const, label: 'Incomplete Only' },
        { value: 'documents' as const, label: 'With Reference Documents' },
        { value: 'no-documents' as const, label: 'Without Reference Documents' },
        { value: 'notes' as const, label: 'With Notes' },
        { value: 'no-notes' as const, label: 'Without Notes' },
      ].map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => {
            setRoadmapFilter(option.value);
            setIsFilterOpen(false);
          }}
          className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-primary/5 ${
            roadmapFilter === option.value ? 'font-semibold text-primary' : 'text-slate-700'
          }`}
        >
          <span>{option.label}</span>
          {roadmapFilter === option.value ? <Check className="h-4 w-4" /> : null}
        </button>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 overflow-x-hidden">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="bg-primary">
          <div className="mx-auto flex max-w-7xl items-center justify-end px-6 py-1">
            <img
              src="/USC Logo Cropped.png"
              alt="USC logo"
              className="h-8 sm:h-9 w-auto opacity-95"
            />
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-6 py-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
                <Link
                  to="/"
                  className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/5 text-primary shadow-sm transition-colors hover:bg-primary/10"
                  aria-label="Home"
                  title="Home"
                >
                  <Home className="h-4 w-4" />
                </Link>
                <h1 className="font-serif text-4xl font-bold text-primary">
                  Project Roadmap
                </h1>

                <div className="inline-flex items-center gap-2 rounded-full border-2 border-primary bg-primary/8 px-4 py-2 shadow-[0_0_0_1px_rgba(153,27,27,0.06),0_10px_24px_-14px_rgba(153,27,27,0.4)]">
                  <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary/70">
                    Budget:
                  </span>
                  <span className="text-base font-bold text-primary">{budget.label}</span>
                </div>
              </div>

              <p className="mt-3 text-base text-slate-500">
                {budget.description}
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center lg:w-auto lg:min-w-[34rem] lg:justify-end">
              <WorkflowSearch
                workflowData={budgetWorkflowData}
                budgetKey={budget.key}
                className="lg:max-w-md"
              />
              <div ref={roadmapFilterRef} className="relative">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsFilterOpen((open) => !open)}
                  className={`inline-flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/5 p-0 text-primary shadow-sm transition-colors hover:bg-primary/10 ${
                    roadmapFilterLabel ? 'ring-2 ring-primary/10' : ''
                  }`}
                  aria-label="Filter project phases"
                  title="Filter project phases"
                >
                  <Filter className="h-4 w-4" />
                </Button>
                {isFilterOpen ? renderRoadmapFilterMenu() : null}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-10 overflow-x-hidden">
        <div className="mb-6 text-center">
          <h2 className="font-serif text-3xl font-bold text-slate-900 mb-2">
            Project Phases
          </h2>
          <p className="mx-auto max-w-2xl text-slate-600">
            Select a phase to review its subcategories, track progress and manage tasks.
          </p>
        </div>

        <div className="mb-4 flex justify-end print:hidden">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsDocumentIndexOpen(true)}
            className="h-9 rounded-md border-2 border-primary bg-white px-3 py-1.5 text-sm font-semibold text-primary shadow-sm transition-colors hover:bg-primary/10"
            title="Show all reference documents"
          >
            <FileText className="mr-2 h-4 w-4" />
            Reference Documents List
          </Button>
        </div>

        <div className="mb-4 rounded-lg border border-primary/20 bg-gradient-to-br from-white to-primary/5 px-4 py-3 shadow-sm">
          <div className="mb-1.5 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-bold text-primary">
                Overall Progress
              </h3>
              <p className="text-xs text-slate-600">
                {overallTaskCounts.completedTasks} of {overallTaskCounts.totalTasks} tasks completed
              </p>
            </div>
            <div className="text-xl font-bold text-primary">
              {Math.round(overallProgress)}%
            </div>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full bg-gradient-to-r from-primary to-primary-dark transition-all duration-500"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
          <div className="mt-2 flex flex-col gap-2 print:hidden sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPendingOverallAction('markAll')}
                className="h-8 rounded-full border-primary/30 bg-white px-3 text-[10px] font-semibold text-primary shadow-sm hover:border-primary/40 hover:bg-primary/5"
                title="Mark all phases done"
              >
                Mark all done
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPendingOverallAction('reset')}
                className="h-8 rounded-full border-primary/30 bg-white px-3 text-[10px] font-semibold text-primary shadow-sm hover:border-primary/40 hover:bg-primary/5"
                title="Reset all phases"
              >
                Reset all
              </Button>
            </div>
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPdfDialogOpen(true)}
                className="h-8 rounded-md border-2 border-primary bg-white px-2.5 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/10"
                title="Save full project roadmap as PDF"
              >
                <span>Save as PDF</span>
                <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {roadmapFilterLabel ? (
          <div className="mb-4 flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-md border border-primary/30 bg-white px-3 py-1.5 text-xs font-semibold text-primary shadow-sm">
              <span>Filter: {roadmapFilterLabel}</span>
              <span className="text-primary/80">
                {filteredCategorySummaries.length}/{categorySummaries.length}
              </span>
              <button
                type="button"
                onClick={() => setRoadmapFilter('all')}
                className="inline-flex h-5 w-5 items-center justify-center rounded-md transition-colors hover:bg-primary/5"
                aria-label="Clear roadmap filter"
                title="Clear roadmap filter"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ) : null}

        {/* Horizontal Flowchart */}
        <div className="bg-gradient-to-br from-slate-50 to-white rounded-xl border-2 border-slate-200 p-4 shadow-lg overflow-hidden">
          <div className="overflow-x-auto -mx-4 px-0 scroll-smooth">
            {filteredCategorySummaries.length > 0 ? (
            <FlowChart>
            {filteredCategorySummaries.map(({ category, index, completedTasks, totalTasks, progress }, filteredIndex) => {
              return (
                <div key={category.id} className="flex items-center">
                  <FlowNode onClick={() => handleCategoryClick(category.id)}>
                    <Card className="w-64 border-2 border-primary transition-all duration-200 ease-out hover:-translate-y-0.5 hover:scale-[1.02] hover:border-primary-dark hover:bg-[linear-gradient(180deg,rgba(153,27,27,0.05),rgba(153,27,27,0.02))] hover:shadow-none hover:ring-0 active:translate-y-0 active:scale-100 cursor-pointer group relative">
                      <CardContent className="p-6 pb-7 pt-8">
                        {/* Node Number */}
                        <div className="absolute -top-2 -left-2 h-10 w-10 rounded-full bg-primary text-white font-bold flex items-center justify-center shadow-lg border-4 border-white z-10">
                          {index + 1}
                        </div>

                        {/* Category Info */}
                        <div className="mt-4 text-center">
                          <h3 className="font-serif text-lg font-bold text-primary mb-2 group-hover:text-primary-dark">
                            {category.name}
                          </h3>
                          <p className="text-xs text-slate-500 mb-4">
                            {category.subcategories.length}{' '}
                            {category.subcategories.length === 1 ? 'subcategory' : 'subcategories'}
                          </p>

                          {/* Progress */}
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs text-slate-600">
                              <span>Progress</span>
                              <span className="font-semibold text-primary">{Math.round(progress)}%</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-primary to-primary-dark transition-all duration-500"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <div className="text-xs text-slate-500">
                              {completedTasks} / {totalTasks} tasks
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </FlowNode>

                  {filteredIndex < filteredCategorySummaries.length - 1 && (
                    <FlowLine />
                  )}
                </div>
              );
            })}
            </FlowChart>
            ) : (
              <div className="px-6 py-12 text-center text-sm text-slate-500">
                {noRoadmapMatchesText}
              </div>
            )}
          </div>
        </div>
      </main>
      {pendingOverallAction ? (
        <ConfirmDialog
          title={pendingOverallAction === 'markAll' ? 'Mark All Phases Done?' : 'Reset All Phases?'}
          message={
            pendingOverallAction === 'markAll'
              ? 'Are you sure you want to mark all phases done?'
              : 'Are you sure you want to reset all phases?'
          }
          confirmLabel={pendingOverallAction === 'markAll' ? 'Mark all done' : 'Reset all'}
          onCancel={() => setPendingOverallAction(undefined)}
          onConfirm={() => {
            setAllWorkflowTasksComplete(pendingOverallAction === 'markAll');
            setPendingOverallAction(undefined);
          }}
        />
      ) : null}
      {isDocumentIndexOpen ? (
        <DocumentIndexDialog
          documents={documentIndex}
          onClose={() => setIsDocumentIndexOpen(false)}
        />
      ) : null}
      {isPdfDialogOpen ? (
        <PdfExportDialog
          onCancel={() => setIsPdfDialogOpen(false)}
          onSubmit={(details) => {
            saveWorkflowAsPdf(exportOptions, details);
            setIsPdfDialogOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}
