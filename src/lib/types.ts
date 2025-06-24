export interface Task {
  title: string;
  date: Date;
  completed: boolean;
  notes?: string;
  attachment?: string;
}

export interface Shift {
  id: string;
  startTime: string;
  endTime: string;
}
