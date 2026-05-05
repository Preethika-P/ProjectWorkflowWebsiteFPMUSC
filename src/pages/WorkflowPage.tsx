import { useNavigate, Link, useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { FlowChart, FlowNode, FlowLine } from '@/components/FlowChart';
import { useAppStore } from '@/store/useAppStore';
import type { WorkflowData } from '@/types';
import { getBudgetConfig, getWorkflowDataForBudget, makeScopedCategoryId } from '@/lib/budgets';

interface WorkflowPageProps {
  workflowData: WorkflowData;
}

export function WorkflowPage({ workflowData }: WorkflowPageProps) {
  const navigate = useNavigate();
  const { budgetKey } = useParams<{ budgetKey: string }>();
  const { getCategoryProgress, progress: storedProgress } = useAppStore();
  const budget = getBudgetConfig(budgetKey);
  const budgetWorkflowData = getWorkflowDataForBudget(workflowData, budget.key);

  const getCategoryTaskCounts = (scopedCategoryId: string, category: WorkflowData['categories'][0]) => {
    const categoryProgress = storedProgress[scopedCategoryId] || {};
    let completedTasks = 0;
    let totalTasks = 0;

    category.subcategories.forEach((subcategory) => {
      const subcategoryProgress = categoryProgress[subcategory.id] || {};
      totalTasks += subcategory.tasks.length;
      completedTasks += subcategory.tasks.filter(
        (task) => subcategoryProgress[task.id] === true
      ).length;
    });

    return { completedTasks, totalTasks };
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 overflow-x-hidden">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
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
          <div className="flex items-start justify-between gap-6">
            <div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
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

            <Link
              to="/"
              className="mt-1 inline-flex flex-shrink-0 items-center rounded-md border border-primary px-3 py-1.5 text-base text-primary transition-colors hover:bg-primary/5"
            >
              ← Back
            </Link>
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
            Select a phase to review its subcategories, track progress, and manage tasks.
          </p>
        </div>

        {/* Horizontal Flowchart */}
        <div className="bg-gradient-to-br from-slate-50 to-white rounded-xl border-2 border-slate-200 p-4 shadow-lg overflow-hidden">
          <div className="overflow-x-auto -mx-4 px-0 scroll-smooth">
            <FlowChart>
            {budgetWorkflowData.categories.map((category, index) => {
              const scopedCategoryId = makeScopedCategoryId(budget.key, category.id);
              const { completedTasks, totalTasks } = getCategoryTaskCounts(scopedCategoryId, category);
              const progress = getCategoryProgress(
                scopedCategoryId,
                category.subcategories
              );

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

                  {index < budgetWorkflowData.categories.length - 1 && (
                    <FlowLine />
                  )}
                </div>
              );
            })}
            </FlowChart>
          </div>
        </div>
      </main>
    </div>
  );
}
