import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Checklist } from '@/components/Checklist';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ReferenceDocumentsPanel } from '@/components/ReferenceDocumentsPanel';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useToast } from '@/components/ui/use-toast';
import type { WorkflowData } from '@/types';
import { getBudgetConfig, getWorkflowDataForBudget, makeScopedCategoryId } from '@/lib/budgets';

interface SubcategoryPageProps {
  workflowData: WorkflowData;
}

export function SubcategoryPage({ workflowData }: SubcategoryPageProps) {
  const { budgetKey, categoryId, subcategoryId } = useParams<{
    budgetKey: string;
    categoryId: string;
    subcategoryId: string;
  }>();
  const navigate = useNavigate();
  const { setLastVisited, getSubcategoryProgress } = useAppStore();
  const { toast } = useToast();
  const budget = getBudgetConfig(budgetKey);
  const budgetWorkflowData = getWorkflowDataForBudget(workflowData, budget.key);

  const category = budgetWorkflowData.categories.find((c) => c.id === categoryId);
  const subcategory = category?.subcategories.find(
    (s) => s.id === subcategoryId
  );
  const scopedCategoryId = category ? makeScopedCategoryId(budget.key, category.id) : '';

  useEffect(() => {
    if (category && subcategoryId) {
      setLastVisited(scopedCategoryId, subcategoryId);
    }
  }, [category, scopedCategoryId, subcategoryId, setLastVisited]);

  useEffect(() => {
    if (scopedCategoryId && subcategoryId && subcategory) {
      const progress = getSubcategoryProgress(scopedCategoryId, subcategoryId);
      if (progress === 100) {
        toast({
          title: 'All tasks complete!',
          description: `You've completed all tasks in ${subcategory.name}`,
          variant: 'success',
        });
      }
    }
  }, [scopedCategoryId, subcategoryId, getSubcategoryProgress, toast, subcategory]);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10 shadow-sm print:hidden">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <div className="mb-4">
            <Breadcrumbs
              items={[
                { label: `Budget: ${budget.shortLabel}`, path: `/budget/${budget.key}/workflow` },
                { label: category.name, path: `/budget/${budget.key}/category/${category.id}` },
                { label: subcategory.name },
              ]}
            />
          </div>
          <div className="flex items-center justify-between">
            <h1 className="font-serif text-3xl font-bold text-primary">
              {subcategory.name}
            </h1>
            <Button
              variant="outline"
              onClick={() => navigate(`/budget/${budget.key}/category/${category.id}`)}
              className="flex items-center gap-2 border-primary text-primary hover:bg-primary/5"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-8 print:p-0">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <Checklist categoryId={scopedCategoryId} subcategory={subcategory} />
          {subcategory.documents && subcategory.documents.length > 0 ? (
            <aside className="print:hidden">
              <ReferenceDocumentsPanel documents={subcategory.documents} />
            </aside>
          ) : null}
        </div>
      </main>
    </div>
  );
}
