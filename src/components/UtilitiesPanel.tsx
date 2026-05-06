import { useState } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import { Check, Filter, Wrench, X } from 'lucide-react';
import type { Category } from '@/types';

type TaskFilter = 'all' | 'completed' | 'incomplete';

const utilityButtonClass =
  'h-8 rounded-full border-primary/30 bg-white px-2 text-[10px] font-semibold text-primary shadow-sm hover:border-primary/40 hover:bg-primary/5';

interface UtilitiesPanelProps {
  category: Category;
  scopedCategoryId: string;
  sectionFilter?: TaskFilter;
  onClearSectionFilter?: () => void;
  sticky?: boolean;
}

export function UtilitiesPanel({
  category,
  scopedCategoryId,
  sectionFilter = 'all',
  onClearSectionFilter,
  sticky = true,
}: UtilitiesPanelProps) {
  const { toggleTask, progress, setTaskComplete } = useAppStore();
  const [overallFilter, setOverallFilter] = useState<TaskFilter>('all');
  const [isOverallFilterOpen, setIsOverallFilterOpen] = useState(false);
  const [utilityFilters, setUtilityFilters] = useState<Record<string, TaskFilter>>({});
  const [openUtilityFilterId, setOpenUtilityFilterId] = useState<string | undefined>();
  const [pendingOverallAction, setPendingOverallAction] = useState<'markAll' | 'reset' | undefined>();
  
  const utilitySubcategories = category.subcategories.filter((sub) => sub.isUtility);

  const setUtilityTasksComplete = (
    subcategory: Category['subcategories'][0],
    complete: boolean
  ) => {
    subcategory.tasks.forEach((task) => {
      setTaskComplete(scopedCategoryId, subcategory.id, task.id, complete);
    });
  };

  const setAllUtilityTasksComplete = (complete: boolean) => {
    utilitySubcategories.forEach((subcategory) => {
      setUtilityTasksComplete(subcategory, complete);
    });
  };

  const getFilterLabel = (filter: TaskFilter) => {
    if (filter === 'completed') return 'Completed only';
    if (filter === 'incomplete') return 'Incomplete only';
    return undefined;
  };

  const getFilteredTasks = (
    subcategory: Category['subcategories'][0],
    filter: TaskFilter
  ) => {
    const subcategoryProgress = progress[scopedCategoryId]?.[subcategory.id] || {};

    if (filter === 'completed') {
      return subcategory.tasks.filter((task) => subcategoryProgress[task.id] === true);
    }

    if (filter === 'incomplete') {
      return subcategory.tasks.filter((task) => subcategoryProgress[task.id] !== true);
    }

    return subcategory.tasks;
  };

  const overallFilteredCount = utilitySubcategories.reduce((count, subcategory) => {
    return count + getFilteredTasks(subcategory, overallFilter).length;
  }, 0);

  const totalUtilityTasks = utilitySubcategories.reduce(
    (count, subcategory) => count + subcategory.tasks.length,
    0
  );
  const overallFilterLabel = getFilterLabel(overallFilter);

  if (utilitySubcategories.length === 0) {
    return null;
  }

  const renderFilterMenu = (
    activeFilter: TaskFilter,
    onSelect: (filter: TaskFilter) => void,
    alignClass = 'right-0'
  ) => (
    <div className={cn('absolute top-full z-40 mt-2 w-48 rounded-xl border border-slate-200 bg-white p-2 shadow-xl', alignClass)}>
      {[
        { value: 'all' as const, label: 'All tasks' },
        { value: 'completed' as const, label: 'Completed only' },
        { value: 'incomplete' as const, label: 'Incomplete only' },
      ].map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onSelect(option.value)}
          className={cn(
            'flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-primary/5',
            activeFilter === option.value
              ? 'font-semibold text-primary'
              : 'text-slate-700'
          )}
        >
          <span>{option.label}</span>
          {activeFilter === option.value ? <Check className="h-4 w-4" /> : null}
        </button>
      ))}
    </div>
  );

  return (
    <Card className={sticky ? 'sticky top-24 border-2 border-accent/30 bg-gradient-to-br from-accent/5 to-white shadow-lg' : 'border-2 border-accent/30 bg-gradient-to-br from-accent/5 to-white shadow-lg'}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-serif text-xl font-bold text-slate-900">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 text-primary">
            <Wrench className="h-4 w-4" />
          </span>
          <span>Utilities</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPendingOverallAction('markAll')}
            className={cn(utilityButtonClass, 'flex-1 whitespace-nowrap px-3')}
          >
            Mark all done
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPendingOverallAction('reset')}
            className={cn(utilityButtonClass, 'w-auto whitespace-nowrap px-3')}
          >
            Reset
          </Button>
          <div className="relative min-w-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsOverallFilterOpen((open) => !open)}
              className={cn(
                utilityButtonClass,
                'w-auto whitespace-nowrap px-3',
                overallFilterLabel && 'ring-2 ring-primary/15'
              )}
              aria-label="Filter all utility tasks"
              title="Filter all utility tasks"
            >
              <Filter className="mr-1 h-3 w-3" />
              Filter
            </Button>
            {isOverallFilterOpen
              ? renderFilterMenu(overallFilter, (filter) => {
                  setOverallFilter(filter);
                  setIsOverallFilterOpen(false);
                })
              : null}
          </div>
        </div>
        {overallFilterLabel ? (
          <div className="mb-4 inline-flex items-center gap-2 rounded-md border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary">
            <span>All utilities filter: {overallFilterLabel}</span>
            <span className="text-primary/80">
              {overallFilteredCount}/{totalUtilityTasks}
            </span>
            <button
              type="button"
              onClick={() => setOverallFilter('all')}
              className="inline-flex h-5 w-5 items-center justify-center rounded-md transition-colors hover:bg-primary/10"
              aria-label="Clear all utilities filter"
              title="Clear all utilities filter"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : null}
        <Accordion type="multiple" className="w-full">
          {utilitySubcategories.map((subcategory) => {
            const subcategoryProgress = progress[scopedCategoryId]?.[subcategory.id] || {};
            const completed = subcategory.tasks.filter(
              (task) => subcategoryProgress[task.id] === true
            ).length;
            const total = subcategory.tasks.length;
            const activeFilter = utilityFilters[subcategory.id] || (overallFilter !== 'all' ? overallFilter : sectionFilter);
            const activeFilterLabel = getFilterLabel(activeFilter);
            const filteredTasks = getFilteredTasks(subcategory, activeFilter);
            const hasUtilityOverride = Boolean(utilityFilters[subcategory.id]);
            const isUsingSectionFilter = !hasUtilityOverride && overallFilter === 'all' && sectionFilter !== 'all';

            return (
              <AccordionItem key={subcategory.id} value={subcategory.id} className="border-none">
                <AccordionTrigger className="py-3 hover:no-underline">
                  <div className="flex w-full items-center justify-between gap-3 pr-4">
                    <span className="min-w-0 flex-1 text-left">
                      <span className="block max-w-[220px] font-semibold text-sm leading-snug text-slate-900">
                        {subcategory.name}
                      </span>
                    </span>
                    <span className="flex-shrink-0 text-xs text-slate-500">
                      {completed}/{total}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 pt-2">
                    <div className="mb-2 flex items-center gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setUtilityTasksComplete(subcategory, true)}
                        className={cn(utilityButtonClass, 'flex-1 whitespace-nowrap px-3')}
                      >
                        Mark all done
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setUtilityTasksComplete(subcategory, false)}
                        className={cn(utilityButtonClass, 'w-auto whitespace-nowrap px-3')}
                      >
                        Reset
                      </Button>
                      <div className="relative min-w-0">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setOpenUtilityFilterId((openId) =>
                              openId === subcategory.id ? undefined : subcategory.id
                            )
                          }
                          className={cn(
                            utilityButtonClass,
                            'w-auto whitespace-nowrap px-3',
                            activeFilterLabel && 'ring-2 ring-primary/15'
                          )}
                          aria-label={`Filter ${subcategory.name} tasks`}
                          title={`Filter ${subcategory.name} tasks`}
                        >
                          <Filter className="mr-1 h-3 w-3" />
                          Filter
                        </Button>
                        {openUtilityFilterId === subcategory.id
                          ? renderFilterMenu(
                              activeFilter,
                              (filter) => {
                                setUtilityFilters((filters) => {
                                  const nextFilters = { ...filters };
                                  if (filter === 'all') {
                                    delete nextFilters[subcategory.id];
                                  } else {
                                    nextFilters[subcategory.id] = filter;
                                  }
                                  return nextFilters;
                                });
                                setOpenUtilityFilterId(undefined);
                              },
                              'right-0'
                            )
                          : null}
                      </div>
                    </div>
                    {activeFilterLabel ? (
                      <div className="mb-2 inline-flex items-center gap-2 rounded-md border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary">
                        <span>
                          {hasUtilityOverride
                            ? 'Utility filter'
                            : isUsingSectionFilter
                              ? 'Using section filter'
                              : 'Using all utilities filter'}: {activeFilterLabel}
                        </span>
                        <span className="text-primary/80">
                          {filteredTasks.length}/{total}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            if (hasUtilityOverride) {
                              setUtilityFilters((filters) => {
                                const nextFilters = { ...filters };
                                delete nextFilters[subcategory.id];
                                return nextFilters;
                              });
                            } else if (isUsingSectionFilter) {
                              onClearSectionFilter?.();
                            } else {
                              setOverallFilter('all');
                            }
                          }}
                          className="inline-flex h-5 w-5 items-center justify-center rounded-md transition-colors hover:bg-primary/10"
                          aria-label={`Clear ${subcategory.name} task filter`}
                          title={`Clear ${subcategory.name} task filter`}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : null}
                    {filteredTasks.length > 0 ? filteredTasks.map((task) => {
                      const isChecked = subcategoryProgress[task.id] || false;
                      return (
                        <div
                          key={task.id}
                          className={cn(
                            'flex items-start gap-2 rounded-md px-3 py-2 transition-colors',
                            'hover:bg-slate-50',
                            isChecked && 'bg-primary/5'
                          )}
                        >
                          <Checkbox
                            id={`utility-${task.id}`}
                            checked={isChecked}
                            onCheckedChange={() => {
                              if (subcategoryProgress[task.id] === undefined) {
                                setTaskComplete(scopedCategoryId, subcategory.id, task.id, false);
                              }
                              toggleTask(scopedCategoryId, subcategory.id, task.id);
                            }}
                            className="mt-0.5 flex-shrink-0"
                          />
                          <label
                            htmlFor={`utility-${task.id}`}
                            className={cn(
                              'flex-1 cursor-pointer text-xs leading-relaxed',
                              isChecked && 'text-slate-500 line-through'
                            )}
                          >
                            {task.name}
                          </label>
                        </div>
                      );
                    }) : (
                      <div className="py-5 text-center text-xs italic text-slate-500">
                        {activeFilterLabel
                          ? `No ${activeFilterLabel.toLowerCase()} utility tasks match this filter.`
                          : 'No utility tasks listed'}
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </CardContent>
      {pendingOverallAction ? (
        <ConfirmDialog
          title={
            pendingOverallAction === 'markAll'
              ? 'Mark All Utilities Done in this Section?'
              : 'Reset All Utilities in this Section?'
          }
          message={
            pendingOverallAction === 'markAll'
              ? 'Are you sure you want to mark all utility tasks in this section as done?'
              : 'Are you sure you want to reset all utility tasks in this section?'
          }
          confirmLabel={pendingOverallAction === 'markAll' ? 'Mark all done' : 'Reset all'}
          onCancel={() => setPendingOverallAction(undefined)}
          onConfirm={() => {
            setAllUtilityTasksComplete(pendingOverallAction === 'markAll');
            setPendingOverallAction(undefined);
          }}
        />
      ) : null}
    </Card>
  );
}
