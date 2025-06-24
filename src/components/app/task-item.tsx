"use client"

import { format } from "date-fns";
import { Calendar, Clock, MoreVertical, Paperclip, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { Task, Shift } from "@/lib/types";
import { cn } from "@/lib/utils";

interface TaskItemProps {
  task: Task;
  shift?: Shift;
  onToggleComplete: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
}

export function TaskItem({ task, shift, onToggleComplete, onDelete }: TaskItemProps) {
  return (
    <Card className={cn("transition-all", task.completed && "bg-muted/50")}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-3">
          <Checkbox
            id={`task-${task.id}`}
            checked={task.completed}
            onCheckedChange={(checked) => onToggleComplete(task.id, !!checked)}
            aria-label={`Mark task ${task.title} as ${task.completed ? 'incomplete' : 'complete'}`}
          />
          <CardTitle className={cn("text-lg font-medium", task.completed && "line-through text-muted-foreground")}>
            {task.title}
          </CardTitle>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onDelete(task.id)} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              <span>Delete</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 pl-9 text-sm text-muted-foreground">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center">
              <Calendar className="mr-2 h-4 w-4" />
              <span>{format(task.date, "MMM d, yyyy")}</span>
            </div>
            <div className="flex items-center">
              <Clock className="mr-2 h-4 w-4" />
              <span>{task.time}</span>
            </div>
          </div>
          {task.notes && <p className="pt-2">{task.notes}</p>}
          {task.attachment && (
            <div className="flex items-center pt-2 text-primary">
              <Paperclip className="mr-2 h-4 w-4" />
              <span>{task.attachment}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
