export interface Shift {
  id: string;
  employeeName: string;
  role: string;
  timeRange: string;
  startTime: string;
  endTime: string;
  status: 'Confirmed' | 'Pending' | 'Canceled';
  date: string;
  color: string;
}

export interface ShiftTemplate {
  id: string;
  name: string;
  description?: string;
  employeeName?: string;
  role: string;
  startTime: string;
  endTime: string;
  status: 'Confirmed' | 'Pending' | 'Canceled';
  color: string;
  icon?: string;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  color: string;
}

export interface NavItem {
  name: string;
  path: string;
  icon: string;
}

export interface SavedView {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  createdAt: string;
  updatedAt: string;
  filters: {
    search?: string;
    date?: string;
    employees?: string[];
    roles?: string[];
    status?: string[];
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
  };
  viewType: 'daily' | 'weekly' | 'staff' | 'list';
} 