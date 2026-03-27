import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { BudgetSelectionPage } from './pages/BudgetSelectionPage';
import { WorkflowPage } from './pages/WorkflowPage';
import { CategoryPage } from './pages/CategoryPage';
import { SubcategoryPage } from './pages/SubcategoryPage';
import { Toaster } from './components/ui/toaster';
import { ToastProvider, useToast } from './components/ui/use-toast';
import { useAppStore } from './store/useAppStore';
import type { WorkflowData } from './types';
import { parseScopedCategoryId } from './lib/budgets';

function AppContent() {
  const [workflowData, setWorkflowData] = useState<WorkflowData | null>(null);
  const [loading, setLoading] = useState(true);
  const { lastVisited } = useAppStore();
  const { toast } = useToast();

  useEffect(() => {
    fetch('/workflow.json')
      .then((res) => res.json())
      .then((data) => {
        setWorkflowData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load workflow data:', err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (workflowData && lastVisited.categoryId && !sessionStorage.getItem('resume-shown')) {
      const { budgetKey, categoryId } = parseScopedCategoryId(lastVisited.categoryId);
      const category = workflowData.categories.find((c) => c.id === categoryId);
      if (category) {
        const subcategory = lastVisited.subcategoryId
          ? category.subcategories.find((s) => s.id === lastVisited.subcategoryId)
          : null;
        
        if (subcategory) {
          const resumeUrl = `/budget/${budgetKey}/category/${category.id}/subcategory/${subcategory.id}`;
          toast({
            title: 'Resume where you left off?',
            description: `Continue with ${category.name} - ${subcategory.name}`,
          });
          // Auto-navigate after a short delay
          setTimeout(() => {
            window.location.href = resumeUrl;
            sessionStorage.setItem('resume-shown', 'true');
          }, 2000);
          sessionStorage.setItem('resume-shown', 'true');
        }
      }
    }
  }, [workflowData, lastVisited, toast]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="font-serif text-2xl font-bold text-primary">
            Loading...
          </div>
        </div>
      </div>
    );
  }

  if (!workflowData) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="font-serif text-2xl font-bold text-primary">
            Failed to load workflow data
          </div>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<BudgetSelectionPage workflowData={workflowData} />} />
        <Route path="/workflow" element={<Navigate to="/budget/under-5m/workflow" replace />} />
        <Route path="/budget/:budgetKey/workflow" element={<WorkflowPage workflowData={workflowData} />} />
        <Route
          path="/category/:categoryId"
          element={<Navigate to="/budget/under-5m/workflow" replace />}
        />
        <Route
          path="/budget/:budgetKey/category/:categoryId"
          element={<CategoryPage workflowData={workflowData} />}
        />
        <Route
          path="/category/:categoryId/subcategory/:subcategoryId"
          element={<Navigate to="/budget/under-5m/workflow" replace />}
        />
        <Route
          path="/budget/:budgetKey/category/:categoryId/subcategory/:subcategoryId"
          element={<SubcategoryPage workflowData={workflowData} />}
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}

function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}

export default App;
