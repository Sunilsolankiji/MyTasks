export interface Task {
  id: string;
  title: string;
  date: Date;
  time: string;
  shiftId: string;
  notes?: string;
  attachment?: string;
  completed: boolean;
}

export interface Shift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
}
