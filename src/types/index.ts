export interface Task {
  id: string;
  name: string;
}

export interface Subcategory {
  id: string;
  name: string;
  tasks: Task[];
  subgroup?: string | null;
  isUtility: boolean;
}

export interface Group {
  id: string;
  subgroup: string;
  subcategoryIndices: number[];
}

export interface Category {
  id: string;
  name: string;
  subcategories: Subcategory[];
  groups: Group[];
}

export interface WorkflowData {
  budgetRange: string;
  categories: Category[];
}

