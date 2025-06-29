"use client"

import type { Task } from "@/lib/types";
import { TaskItem } from "./task-item";

interface TaskListProps {
  tasks: Task[];
  onToggleComplete: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
}

export function TaskList({ tasks, onToggleComplete, onDelete, onEdit }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="relative z-10 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20 p-12 text-center">
        <h3 className="text-xl font-medium">No Tasks Here!</h3>
        <p className="text-muted-foreground">You haven't added any tasks to this list yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onToggleComplete={onToggleComplete}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
}
