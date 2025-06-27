export type Priority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  date?: Date;
  completed: boolean;
  notes?: string;
  attachment?: string;
  attachmentName?: string;
  creationDate: Date;
  completionDate?: Date;
  priority: Priority;
}
