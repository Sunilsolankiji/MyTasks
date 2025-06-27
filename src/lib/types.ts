export interface Task {
  id: string;
  title: string;
  date?: Date;
  completed: boolean;
  notes?: string;
  attachment?: string;
  attachmentName?: string;
}

export interface Shift {
  id: string;
  startTime: string;
  endTime: string;
}
