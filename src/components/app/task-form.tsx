"use client"

import { useMemo, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Paperclip, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import type { Task } from "@/lib/types";

interface TaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (task: Omit<Task, 'id' | 'completed'>) => void;
  task?: Task | null;
}

export function TaskForm({ isOpen, onClose, onSubmit, task }: TaskFormProps) {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [attachmentRemoved, setAttachmentRemoved] = useState(false);
  const isEditMode = !!task;

  const taskSchema = useMemo(() => {
    return z.object({
      title: z.string().min(1, "Title is required"),
      date: z.date().optional(),
      notes: z.string().optional(),
      attachment: z.any().optional(),
    });
  }, []);

  type TaskFormValues = z.infer<typeof taskSchema>;

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
  });

  useEffect(() => {
    if (isOpen) {
      setAttachmentRemoved(false);
      if (task) {
        form.reset({
          title: task.title,
          date: task.date,
          notes: task.notes || "",
          attachment: undefined,
        });
      } else {
        form.reset({
          title: "",
          date: new Date(),
          notes: "",
          attachment: undefined,
        });
      }
    }
  }, [isOpen, task, form]);

  const handleFormSubmit = async (data: TaskFormValues) => {
    let attachmentDataUrl: string | undefined = task?.attachment;
    let attachmentName: string | undefined = task?.attachmentName;

    if (attachmentRemoved) {
      attachmentDataUrl = undefined;
      attachmentName = undefined;
    }

    if (data.attachment && data.attachment.length > 0) {
      const file = data.attachment[0];
      attachmentName = file.name;
      try {
        attachmentDataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            if (event.target?.result) {
              resolve(event.target.result as string);
            } else {
              reject(new Error("Failed to read file."));
            }
          };
          reader.onerror = (error) => {
            reject(error);
          };
          reader.readAsDataURL(file);
        });
      } catch (error) {
        console.error("Error reading file:", error);
        return;
      }
    }
    
    onSubmit({
      title: data.title,
      date: data.date,
      notes: data.notes,
      attachment: attachmentDataUrl,
      attachmentName: attachmentName,
    });
    onClose();
  };
  
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Task' : 'Add New Task'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? "Update the details of your task." : "Fill in the details below to add a new task to your schedule."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Task Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Complete project report" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date</FormLabel>
                  <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => {
                          field.onChange(date);
                          setIsDatePickerOpen(false);
                        }}
                        disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Add any relevant notes..." className="resize-none" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="attachment"
              render={({ field: { onChange, value, ...rest } }) => (
                <FormItem>
                  <FormLabel>Attachment</FormLabel>
                   <FormControl>
                    <div className="relative">
                      <Button asChild variant="outline" className="w-full justify-start font-normal text-muted-foreground pr-10">
                        <div>
                          <Paperclip className="mr-2 h-4 w-4"/>
                          {value?.[0]?.name || (!attachmentRemoved && task?.attachmentName) || "Attach a file"}
                        </div>
                      </Button>
                      <Input 
                        className="absolute top-0 left-0 h-full w-full opacity-0 cursor-pointer" 
                        type="file" 
                        onChange={(e) => {
                          onChange(e.target.files)
                          setAttachmentRemoved(false);
                        }} 
                        {...rest} 
                      />
                      {(value?.[0] || (!attachmentRemoved && task?.attachmentName)) && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                            onClick={() => {
                                onChange(null);
                                setAttachmentRemoved(true);
                            }}
                        >
                            <X className="h-4 w-4" />
                            <span className="sr-only">Remove attachment</span>
                        </Button>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
              <Button type="submit">{isEditMode ? 'Save Changes' : 'Add Task'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
