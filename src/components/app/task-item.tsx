"use client"

import { format } from "date-fns";
import { Calendar, MoreVertical, Paperclip, Trash2, Pencil, Clock, CheckCircle, ChevronsUp, ChevronsDown, Equal, Link } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { Task } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Badge } from "../ui/badge";

interface TaskItemProps {
  task: Task;
  onToggleComplete: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
}

export function TaskItem({ task, onToggleComplete, onDelete, onEdit }: TaskItemProps) {
  const priorityIcons = {
    high: <ChevronsUp className="h-3 w-3" />,
    medium: <Equal className="h-3 w-3" />,
    low: <ChevronsDown className="h-3 w-3" />,
  };

  return (
    <Card className={cn("transition-all relative z-10", task.completed && "bg-muted/50")}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-3">
          <Checkbox
            id={`task-${task.id}`}
            checked={task.completed}
            onCheckedChange={(checked) => onToggleComplete(task?.id, !!checked)}
            aria-label={`Mark task ${task.title} as ${task.completed ? 'incomplete' : 'complete'}`}
          />
          <CardTitle className={cn("text-lg font-medium", task.completed && "line-through text-muted-foreground")}>
            {task.title}
          </CardTitle>
          <Badge 
            variant={
              task.priority === 'high' ? 'destructive' : 
              task.priority === 'medium' ? 'secondary' : 'outline'
            }
            className="capitalize"
          >
            <div className="flex items-center gap-1">
              {priorityIcons[task.priority]}
              <span>{task.priority}</span>
            </div>
          </Badge>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(task)}>
              <Pencil className="mr-2 h-4 w-4" />
              <span>Edit</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(task.id)} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              <span>Delete</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <div className="pl-9">
            <div className="space-y-2 text-sm text-muted-foreground">
                {task.date && (
                    <div className="flex items-center pt-1">
                        <Calendar className="mr-2 h-4 w-4" />
                        <span>Due: {format(new Date(task.date), "PPP")}</span>
                    </div>
                )}
                {task.notes && <p className="pt-2">{task.notes}</p>}
                {task.attachment && task.attachmentName && (
                    <div className="flex items-center pt-2 text-primary">
                    <Paperclip className="mr-2 h-4 w-4" />
                    <a
                        href={task.attachment}
                        download={task.attachmentName}
                        className="hover:underline"
                    >
                        {task.attachmentName}
                    </a>
                    </div>
                )}
                {task.referenceLinks && task.referenceLinks.length > 0 && (
                  <div className="pt-2 space-y-1">
                    {task.referenceLinks.map((link, index) => (
                      <div key={index} className="flex items-center text-primary">
                        <Link className="mr-2 h-4 w-4 flex-shrink-0" />
                        <a
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline truncate"
                          title={link}
                        >
                          {link}
                        </a>
                      </div>
                    ))}
                  </div>
                )}
            </div>

            <div className="flex justify-between items-center pt-4 text-xs text-muted-foreground">
                {task.completed && task.completionDate ? (
                    <div className="flex items-center text-primary">
                        <CheckCircle className="mr-1.5 h-3 w-3" />
                        <span>Completed: {format(new Date(task.completionDate), "PPp")}</span>
                    </div>
                ) : <div />}
                {task.creationDate && (
                    <div className="flex items-center">
                        <Clock className="mr-1.5 h-3 w-3" />
                        <span>Created: {format(new Date(task.creationDate), "PPp")}</span>
                    </div>
                )}
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
