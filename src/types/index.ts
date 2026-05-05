export interface Task {
  id: string;
  name: string;
}

export interface ReferenceDocument {
  id: string;
  name: string;
  url: string;
  description?: string;
}

export interface Subcategory {
  id: string;
  name: string;
  tasks: Task[];
  documents?: ReferenceDocument[];
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
  documents?: ReferenceDocument[];
  subcategories: Subcategory[];
  groups: Group[];
}

export interface WorkflowData {
  budgetRange: string;
  categories: Category[];
}
