import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface AppState {
  // progress[categoryId][subcategoryId][taskId] = boolean
  progress: Record<string, Record<string, Record<string, boolean>>>;
  
  // expandedGroups[categoryId] = string[] (array of groupNodeIds)
  expandedGroups: Record<string, string[]>;
  
  // notes[categoryId][subcategoryId] = string
  notes: Record<string, Record<string, string>>;
  
  // Last visited location
  lastVisited: {
    categoryId?: string;
    subcategoryId?: string;
  };
  
  // Actions
  toggleTask: (categoryId: string, subcategoryId: string, taskId: string) => void;
  setTaskComplete: (categoryId: string, subcategoryId: string, taskId: string, complete: boolean) => void;
  markAllTasksComplete: (categoryId: string, subcategoryId: string, taskIds: string[]) => void;
  toggleGroup: (categoryId: string, groupId: string) => void;
  setNote: (categoryId: string, subcategoryId: string, note: string) => void;
  setLastVisited: (categoryId?: string, subcategoryId?: string) => void;
  getTaskProgress: (categoryId: string, subcategoryId: string, taskIds?: string[]) => { completed: number; total: number };
  getSubcategoryProgress: (categoryId: string, subcategoryId: string, taskIds?: string[]) => number;
  getCategoryProgress: (
    categoryId: string,
    subcategories: Array<{ id: string; tasks: Array<{ id: string }> }>
  ) => number;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      progress: {},
      expandedGroups: {},
      notes: {},
      lastVisited: {},
      
      toggleTask: (categoryId, subcategoryId, taskId) => {
        set((state) => {
          const newProgress = { ...state.progress };
          if (!newProgress[categoryId]) newProgress[categoryId] = {};
          if (!newProgress[categoryId][subcategoryId]) newProgress[categoryId][subcategoryId] = {};
          
          const current = newProgress[categoryId][subcategoryId][taskId] || false;
          newProgress[categoryId][subcategoryId][taskId] = !current;
          
          return { progress: newProgress };
        });
      },
      
      setTaskComplete: (categoryId, subcategoryId, taskId, complete) => {
        set((state) => {
          const newProgress = { ...state.progress };
          if (!newProgress[categoryId]) newProgress[categoryId] = {};
          if (!newProgress[categoryId][subcategoryId]) newProgress[categoryId][subcategoryId] = {};
          
          newProgress[categoryId][subcategoryId][taskId] = complete;
          
          return { progress: newProgress };
        });
      },
      
      markAllTasksComplete: (categoryId, subcategoryId, taskIds) => {
        set((state) => {
          const newProgress = { ...state.progress };
          if (!newProgress[categoryId]) newProgress[categoryId] = {};
          if (!newProgress[categoryId][subcategoryId]) newProgress[categoryId][subcategoryId] = {};
          
          // Check if all tasks are already complete (treat undefined as false)
          const allComplete = taskIds.length > 0 && taskIds.every(
            (taskId) => newProgress[categoryId][subcategoryId][taskId] === true
          );
          
          // Toggle all tasks: if all complete, mark all incomplete; otherwise mark all complete
          taskIds.forEach((taskId) => {
            newProgress[categoryId][subcategoryId][taskId] = !allComplete;
          });
          
          return { progress: newProgress };
        });
      },
      
      toggleGroup: (categoryId, groupId) => {
        set((state) => {
          const newExpandedGroups = { ...state.expandedGroups };
          if (!newExpandedGroups[categoryId]) {
            newExpandedGroups[categoryId] = [];
          }
          
          const groupArray = [...newExpandedGroups[categoryId]];
          const index = groupArray.indexOf(groupId);
          
          if (index > -1) {
            // Group is currently open, close it
            groupArray.splice(index, 1);
          } else {
            // Group is closed, close all others and open only this one
            newExpandedGroups[categoryId] = [groupId];
            return { expandedGroups: newExpandedGroups };
          }
          
          newExpandedGroups[categoryId] = groupArray;
          
          return { expandedGroups: newExpandedGroups };
        });
      },
      
      setNote: (categoryId, subcategoryId, note) => {
        set((state) => {
          const newNotes = { ...state.notes };
          if (!newNotes[categoryId]) newNotes[categoryId] = {};
          newNotes[categoryId][subcategoryId] = note;
          
          return { notes: newNotes };
        });
      },
      
      setLastVisited: (categoryId, subcategoryId) => {
        set((state) => {
          if (
            state.lastVisited.categoryId === categoryId &&
            state.lastVisited.subcategoryId === subcategoryId
          ) {
            return state;
          }

          return { lastVisited: { categoryId, subcategoryId } };
        });
      },
      
      getTaskProgress: (categoryId, subcategoryId, taskIds) => {
        const state = get();
        const tasks = state.progress[categoryId]?.[subcategoryId] || {};
        if (taskIds) {
          const completed = taskIds.filter((taskId) => tasks[taskId] === true).length;
          return { completed, total: taskIds.length };
        }

        const completed = Object.values(tasks).filter(Boolean).length;
        const total = Object.keys(tasks).length;
        return { completed, total };
      },
      
      getSubcategoryProgress: (categoryId, subcategoryId, taskIds) => {
        const { completed, total } = get().getTaskProgress(categoryId, subcategoryId, taskIds);
        return total > 0 ? (completed / total) * 100 : 0;
      },
      
      getCategoryProgress: (categoryId, subcategories) => {
        const state = get();
        const categoryProgress = state.progress[categoryId] || {};
        let totalCompleted = 0;
        let totalTasks = 0;
        
        subcategories.forEach((subcategory) => {
          const subcategoryProgress = categoryProgress[subcategory.id] || {};
          totalTasks += subcategory.tasks.length;
          totalCompleted += subcategory.tasks.filter(
            (task) => subcategoryProgress[task.id] === true
          ).length;
        });
        
        return totalTasks > 0 ? (totalCompleted / totalTasks) * 100 : 0;
      },
    }),
    {
      name: 'usc-workflow-session',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
