import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { BudgetSelectionPage } from './pages/BudgetSelectionPage';
import { WorkflowPage } from './pages/WorkflowPage';
import { CategoryPage } from './pages/CategoryPage';
import { SubcategoryPage } from './pages/SubcategoryPage';
import { Toaster } from './components/ui/toaster';
import { ToastProvider } from './components/ui/use-toast';
import type { WorkflowData } from './types';

function InitialHomeRedirect() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.pathname !== '/') {
      navigate('/', { replace: true });
    }
  }, []);

  return null;
}

function AppContent() {
  const [workflowData, setWorkflowData] = useState<WorkflowData | null>(null);
  const [loading, setLoading] = useState(true);

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
      <InitialHomeRedirect />
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
