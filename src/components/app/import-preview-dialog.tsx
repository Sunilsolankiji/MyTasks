"use client"

import { useState, useEffect } from "react";
import type { Task } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface ImportPreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  tasksToImport: Task[];
  onConfirmImport: (tasks: Task[]) => void;
}

export function ImportPreviewDialog({ isOpen, onClose, tasksToImport, onConfirmImport }: ImportPreviewDialogProps) {
  const [selectedTasks, setSelectedTasks] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (isOpen) {
      // Default to all tasks selected
      const initialSelection = tasksToImport.reduce((acc, task) => {
        acc[task.id] = true;
        return acc;
      }, {} as Record<string, boolean>);
      setSelectedTasks(initialSelection);
    }
  }, [isOpen, tasksToImport]);

  const handleToggleSelectAll = (checked: boolean) => {
    const newSelection = tasksToImport.reduce((acc, task) => {
      acc[task.id] = checked;
      return acc;
    }, {} as Record<string, boolean>);
    setSelectedTasks(newSelection);
  };

  const handleToggleTask = (taskId: string, checked: boolean) => {
    setSelectedTasks(prev => ({ ...prev, [taskId]: checked }));
  };

  const handleImportClick = () => {
    const tasksToActuallyImport = tasksToImport.filter(task => selectedTasks[task.id]);
    onConfirmImport(tasksToActuallyImport);
    onClose();
  };
  
  const selectedCount = Object.values(selectedTasks).filter(Boolean).length;
  const allSelected = selectedCount === tasksToImport.length && tasksToImport.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md flex flex-col max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Import Preview</DialogTitle>
          <DialogDescription>Select the tasks you want to import.</DialogDescription>
        </DialogHeader>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Heads up!</AlertTitle>
          <AlertDescription>
            Imported tasks will be added to your current list.
          </AlertDescription>
        </Alert>
        
        <div className="flex items-center space-x-2 border-y py-2 px-1">
          <Checkbox 
            id="select-all-import"
            checked={allSelected} 
            onCheckedChange={(checked) => handleToggleSelectAll(!!checked)}
            aria-label="Select all tasks for import"
          />
          <Label htmlFor="select-all-import" className="text-sm font-medium">
            Select All
          </Label>
        </div>

        <ScrollArea className="flex-1">
          <div className="space-y-2 pr-4">
            {tasksToImport.map(task => (
              <div key={task.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted">
                <Checkbox
                  id={`import-${task.id}`}
                  checked={!!selectedTasks[task.id]}
                  onCheckedChange={(checked) => handleToggleTask(task.id, !!checked)}
                  aria-labelledby={`import-label-${task.id}`}
                />
                <Label htmlFor={`import-${task.id}`} id={`import-label-${task.id}`} className="flex-1 font-normal cursor-pointer">
                  {task.title}
                </Label>
              </div>
            ))}
          </div>
        </ScrollArea>
        
        <DialogFooter className="pt-4 border-t">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="button" onClick={handleImportClick} disabled={selectedCount === 0}>
            Import ({selectedCount})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
