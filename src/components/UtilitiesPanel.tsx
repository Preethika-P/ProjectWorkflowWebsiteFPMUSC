import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import type { Category } from '@/types';

interface UtilitiesPanelProps {
  category: Category;
  scopedCategoryId: string;
}

export function UtilitiesPanel({ category, scopedCategoryId }: UtilitiesPanelProps) {
  const { toggleTask, progress, setTaskComplete } = useAppStore();
  
  const utilitySubcategories = category.subcategories.filter((sub) => sub.isUtility);

  if (utilitySubcategories.length === 0) {
    return null;
  }

  return (
    <Card className="sticky top-24 border-2 border-accent/30 bg-gradient-to-br from-accent/5 to-white shadow-lg">
      <CardHeader>
        <CardTitle className="font-serif text-xl font-bold text-slate-900">
          Utilities
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" className="w-full">
          {utilitySubcategories.map((subcategory) => {
            const subcategoryProgress = progress[scopedCategoryId]?.[subcategory.id] || {};
            const completed = Object.values(subcategoryProgress).filter(Boolean).length;
            const total = subcategory.tasks.length;
            const progressPercent = total > 0 ? (completed / total) * 100 : 0;

            return (
              <AccordionItem key={subcategory.id} value={subcategory.id} className="border-none">
                <AccordionTrigger className="py-3 hover:no-underline">
                  <div className="flex items-center justify-between w-full pr-4">
                    <span className="max-w-[220px] text-left font-semibold text-sm leading-snug text-slate-900">
                      {subcategory.name}
                    </span>
                    <span className="text-xs text-slate-500">
                      {completed}/{total}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 pt-2">
                    {subcategory.tasks.map((task) => {
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
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </CardContent>
    </Card>
  );
}
