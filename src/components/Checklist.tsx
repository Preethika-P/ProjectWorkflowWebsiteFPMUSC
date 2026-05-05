import { useMemo, useEffect } from 'react';
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
import { CheckCircle2 } from 'lucide-react';
import type { Subcategory } from '@/types';

interface ChecklistProps {
  categoryId: string;
  subcategory: Subcategory;
}

export function Checklist({ categoryId, subcategory }: ChecklistProps) {
  const { toggleTask, setTaskComplete, markAllTasksComplete, setNote, notes, progress } = useAppStore();
  
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
          <div className="flex items-center justify-between mb-4">
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
          </div>
          <Progress value={progressPercent} className="h-3 mb-2" />
          <div className="flex items-center justify-between mt-4">
            <Button onClick={handleMarkAll} variant="outline" size="sm">
              Mark All Done
            </Button>
            <Button onClick={handleReset} variant="outline" size="sm">
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
              <AccordionTrigger className="font-semibold text-lg text-slate-900 hover:no-underline py-4">
                Tasks ({completed}/{total})
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pt-2">
                  {subcategory.tasks.length > 0 ? (
                    subcategory.tasks.map((task) => {
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
                      No tasks listed
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
