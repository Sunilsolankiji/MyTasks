"use client"

import type { Task, Shift } from "@/lib/types";
import { TaskItem } from "./task-item";

interface TaskListProps {
  tasks: Task[];
  shifts: Shift[];
  onToggleComplete: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
}

export function TaskList({ tasks, shifts, onToggleComplete, onDelete }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20 p-12 text-center">
        <h3 className="text-xl font-medium">No Tasks Here!</h3>
        <p className="text-muted-foreground">You haven't added any tasks to this list yet.</p>
      </div>
    );
  }

  const shiftsMap = new Map(shifts.map(s => [s.id, s]));

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          shift={shiftsMap.get(task.shiftId)}
          onToggleComplete={onToggleComplete}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
