import { useMemo, useEffect, useState, type ReactNode } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import { useClickOutside } from '@/lib/useClickOutside';
import { CheckCircle2, Check, Filter, X } from 'lucide-react';
import type { Subcategory } from '@/types';

export type TaskFilter = 'all' | 'completed' | 'incomplete';

interface ChecklistProps {
  categoryId: string;
  subcategory: Subcategory;
  taskFilter?: TaskFilter;
  onTaskFilterChange?: (filter: TaskFilter) => void;
  onAllTasksComplete?: (options?: { force?: boolean }) => void;
  progressAction?: ReactNode;
}

const taskActionButtonClass =
  'rounded-md border-primary/30 bg-white px-4 text-xs font-semibold text-primary shadow-sm hover:border-primary/40 hover:bg-primary/5';

export function Checklist({
  categoryId,
  subcategory,
  taskFilter: controlledTaskFilter,
  onTaskFilterChange,
  onAllTasksComplete,
  progressAction,
}: ChecklistProps) {
  const { toggleTask, setTaskComplete, markAllTasksComplete, setNote, notes, progress } = useAppStore();
  const [internalTaskFilter, setInternalTaskFilter] = useState<TaskFilter>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useClickOutside<HTMLDivElement>(() => setIsFilterOpen(false), isFilterOpen);
  const taskFilter = controlledTaskFilter ?? internalTaskFilter;
  const setTaskFilter = onTaskFilterChange ?? setInternalTaskFilter;
  
  // Initialize tasks in store if not present
  useEffect(() => {
    if (subcategory && subcategory.tasks && subcategory.tasks.length > 0) {
      subcategory.tasks.forEach((task) => {
        if (progress[categoryId]?.[subcategory.id]?.[task.id] === undefined) {
          setTaskComplete(categoryId, subcategory.id, task.id, false);
        }
      });
    }
  }, [categoryId, subcategory?.id, subcategory?.tasks, progress, setTaskComplete]);

  if (!subcategory || !subcategory.tasks) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-600">No tasks available for this subcategory.</p>
      </div>
    );
  }

  // Calculate progress based on actual tasks, not just initialized ones
  const taskProgress = useMemo(() => {
    const storeProgress = progress[categoryId]?.[subcategory.id] || {};
    const completed = subcategory.tasks.filter(
      (task) => storeProgress[task.id] === true
    ).length;
    const total = subcategory.tasks.length;
    return { completed, total };
  }, [categoryId, subcategory.id, subcategory.tasks, progress]);

  const { completed, total } = taskProgress;
  
  const progressPercent = total > 0 ? (completed / total) * 100 : 0;
  const note = notes[categoryId]?.[subcategory.id] || '';
  const filteredTasks = useMemo(() => {
    const storeProgress = progress[categoryId]?.[subcategory.id] || {};

    if (taskFilter === 'completed') {
      return subcategory.tasks.filter((task) => storeProgress[task.id] === true);
    }

    if (taskFilter === 'incomplete') {
      return subcategory.tasks.filter((task) => storeProgress[task.id] !== true);
    }

    return subcategory.tasks;
  }, [categoryId, progress, subcategory.id, subcategory.tasks, taskFilter]);
  const filterLabel = taskFilter === 'completed'
    ? 'Completed Only'
    : taskFilter === 'incomplete'
      ? 'Incomplete Only'
      : undefined;

  const handleMarkAll = () => {
    const taskIds = subcategory.tasks.map(task => task.id);
    // Check if all are already complete
    const allComplete = subcategory.tasks.every(
      (task) => progress[categoryId]?.[subcategory.id]?.[task.id] === true
    );
    if (!allComplete) {
      // Mark all as complete
      taskIds.forEach((taskId) => {
        setTaskComplete(categoryId, subcategory.id, taskId, true);
      });
    }

    onAllTasksComplete?.({ force: true });
  };

  const handleReset = () => {
    const taskIds = subcategory.tasks.map(task => task.id);
    taskIds.forEach((taskId) => {
      setTaskComplete(categoryId, subcategory.id, taskId, false);
    });
  };

  return (
    <div className="space-y-6">
      {/* Progress Card */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-white to-primary/5 shadow-lg">
        <CardContent className="p-6">
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-3">
              {progressPercent === 100 ? (
                <CheckCircle2 className="h-8 w-8 text-primary" />
              ) : (
                <div className="h-8 w-8 rounded-full border-2 border-primary/30 flex items-center justify-center">
                  <span className="text-xs font-bold text-primary">{Math.round(progressPercent)}%</span>
                </div>
              )}
              <div>
                <h2 className="font-serif text-2xl font-bold text-slate-900">
                  {subcategory.name}
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  {completed} of {total} tasks completed
                </p>
              </div>
            </div>
            {progressAction ? (
              <div className="flex justify-end print:hidden">{progressAction}</div>
            ) : null}
          </div>
          <Progress value={progressPercent} className="h-3 mb-2" />
          <div className="flex items-center justify-between mt-4">
            <Button
              onClick={handleMarkAll}
              variant="outline"
              size="sm"
              className={taskActionButtonClass}
            >
              Mark all done
            </Button>
            <Button
              onClick={handleReset}
              variant="outline"
              size="sm"
              className={taskActionButtonClass}
            >
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tasks Card */}
      <Card className="border shadow-md bg-white">
        <CardContent className="p-6">
          <Accordion type="single" collapsible className="w-full" defaultValue="tasks">
            <AccordionItem value="tasks" className="border-none">
              <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                <AccordionTrigger className="flex-1 py-0 text-left text-lg font-semibold text-slate-900 hover:no-underline">
                  Tasks ({completed}/{total})
                </AccordionTrigger>
                <div ref={filterRef} className="relative flex flex-wrap items-center gap-2">
                  {filterLabel ? (
                    <div className="inline-flex items-center gap-2 rounded-md border border-primary/30 bg-white px-3 py-1.5 text-xs font-semibold text-primary">
                      <span>Filter: {filterLabel}</span>
                      <span className="text-primary/80">
                        {filteredTasks.length}/{total}
                      </span>
                      <button
                        type="button"
                        onClick={() => setTaskFilter('all')}
                        className="inline-flex h-5 w-5 items-center justify-center rounded-md transition-colors hover:bg-primary/5"
                        aria-label="Clear task filter"
                        title="Clear task filter"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : null}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsFilterOpen((open) => !open)}
                    className={cn(
                      taskActionButtonClass,
                      filterLabel && 'ring-2 ring-primary/10'
                    )}
                    aria-label="Filter tasks"
                    title="Filter tasks"
                  >
                    <Filter className="mr-1.5 h-3.5 w-3.5" />
                    Filter
                  </Button>
                  {isFilterOpen ? (
                    <div className="absolute right-0 top-full z-40 mt-2 w-48 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
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
                            setIsFilterOpen(false);
                          }}
                          className={cn(
                            'flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-primary/5',
                            taskFilter === option.value
                              ? 'font-semibold text-primary'
                              : 'text-slate-700'
                          )}
                        >
                          <span>{option.label}</span>
                          {taskFilter === option.value ? <Check className="h-4 w-4" /> : null}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
              <AccordionContent>
                <div className="space-y-3 pt-2">
                  {filteredTasks.length > 0 ? (
                    filteredTasks.map((task) => {
                      const isChecked = progress[categoryId]?.[subcategory.id]?.[task.id] || false;
                      return (
                        <div
                          key={task.id}
                          className={cn(
                            "flex items-start gap-3 rounded-full px-4 py-3 transition-all relative",
                            "hover:bg-slate-50 hover:shadow-sm",
                            isChecked 
                              ? "bg-white border-2 border-primary shadow-sm" 
                              : "border border-slate-200"
                          )}
                          role="checkbox"
                          aria-checked={isChecked}
                          tabIndex={0}
                          onKeyDown={(e: React.KeyboardEvent) => {
                            if (e.key === ' ' || e.key === 'Enter') {
                              e.preventDefault();
                              toggleTask(categoryId, subcategory.id, task.id);
                            }
                          }}
                        >
                          {/* Inner border for checked state - double border effect */}
                          {isChecked && (
                            <div className="absolute inset-[2px] rounded-full border border-slate-200 pointer-events-none z-0" />
                          )}
                          <Checkbox
                            id={task.id}
                            checked={isChecked}
                            onCheckedChange={() => toggleTask(categoryId, subcategory.id, task.id)}
                            className={cn(
                              "mt-0.5 flex-shrink-0 relative z-10",
                              isChecked && "border-primary"
                            )}
                            aria-label={`Mark ${task.name} as complete`}
                          />
                          <label
                            htmlFor={task.id}
                            className={cn(
                              'flex-1 cursor-pointer text-sm leading-relaxed relative z-10',
                              isChecked && 'text-slate-500 line-through'
                            )}
                          >
                            {task.name}
                          </label>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-sm text-slate-500 italic py-8 text-center">
                      {filterLabel
                        ? `No ${filterLabel.toLowerCase()} tasks match this filter.`
                        : 'No tasks listed'}
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Notes Card */}
      <Card className="border shadow-md bg-white">
        <CardContent className="p-6">
          <div className="space-y-3">
            <label htmlFor="notes" className="text-sm font-semibold text-slate-900">
              Notes
            </label>
            <Textarea
              id="notes"
              placeholder="Add notes for this subcategory..."
              value={note}
              onChange={(e) => setNote(categoryId, subcategory.id, e.target.value)}
              className="min-h-[120px] resize-none"
            />
            <div className="flex justify-end">
              <Button
                onClick={() => setNote(categoryId, subcategory.id, '')}
                variant="outline"
                size="sm"
              >
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
