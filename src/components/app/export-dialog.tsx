"use client"

import { useState, useEffect } from "react";
import type { Task } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  onExport: (tasks: Task[]) => void;
}

export function ExportDialog({ isOpen, onClose, tasks, onExport }: ExportDialogProps) {
  const [selectedTasks, setSelectedTasks] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (isOpen) {
      // Default to all tasks selected
      const initialSelection = tasks.reduce((acc, task) => {
        acc[task.id] = true;
        return acc;
      }, {} as Record<string, boolean>);
      setSelectedTasks(initialSelection);
    }
  }, [isOpen, tasks]);

  const handleToggleSelectAll = (checked: boolean) => {
    const newSelection = tasks.reduce((acc, task) => {
      acc[task.id] = checked;
      return acc;
    }, {} as Record<string, boolean>);
    setSelectedTasks(newSelection);
  };

  const handleToggleTask = (taskId: string, checked: boolean) => {
    setSelectedTasks(prev => ({ ...prev, [taskId]: checked }));
  };

  const handleExportClick = () => {
    const tasksToExport = tasks.filter(task => selectedTasks[task.id]);
    onExport(tasksToExport);
    onClose();
  };
  
  const selectedCount = Object.values(selectedTasks).filter(Boolean).length;
  const allSelected = selectedCount === tasks.length && tasks.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md flex flex-col max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Export Tasks</DialogTitle>
          <DialogDescription>Select the tasks you want to export.</DialogDescription>
        </DialogHeader>
        
        <div className="flex items-center space-x-2 border-y py-2 px-1">
          <Checkbox 
            id="select-all-export"
            checked={allSelected} 
            onCheckedChange={(checked) => handleToggleSelectAll(!!checked)}
            aria-label="Select all tasks for export"
          />
          <Label htmlFor="select-all-export" className="text-sm font-medium">
            Select All
          </Label>
        </div>

        <ScrollArea className="flex-1">
          <div className="space-y-2 pr-4">
            {tasks.map(task => (
              <div key={task.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted">
                <Checkbox
                  id={`export-${task.id}`}
                  checked={!!selectedTasks[task.id]}
                  onCheckedChange={(checked) => handleToggleTask(task.id, !!checked)}
                  aria-labelledby={`export-label-${task.id}`}
                />
                <Label htmlFor={`export-${task.id}`} id={`export-label-${task.id}`} className="flex-1 font-normal cursor-pointer">
                  {task.title}
                </Label>
              </div>
            ))}
          </div>
        </ScrollArea>
        
        <DialogFooter className="pt-4 border-t">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="button" onClick={handleExportClick} disabled={selectedCount === 0}>
            Export ({selectedCount})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
