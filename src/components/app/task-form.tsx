"use client"

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import type { Task, Shift } from "@/lib/types";

interface TaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (task: Omit<Task, 'id' | 'completed' | 'shiftId'>) => void;
  shift: Shift;
}

export function TaskForm({ isOpen, onClose, onSubmit, shift }: TaskFormProps) {
  const taskSchema = useMemo(() => {
    return z.object({
      title: z.string().min(1, "Title is required"),
      date: z.date({ required_error: "A date is required." }),
      time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "A valid time is required."),
      notes: z.string().optional(),
      attachment: z.any().optional(),
    }).superRefine((data, ctx) => {
      if (!shift || !data.time) {
        return;
      }
      const selectedShift = shift;
      
      const { startTime, endTime } = selectedShift;
      const taskTime = data.time;

      const isOvernight = endTime < startTime;

      if (isOvernight) {
        if (taskTime < startTime && taskTime > endTime) {
           ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Time must be within shift hours (${startTime} - ${endTime}).`,
            path: ["time"],
          });
        }
      } else { // Same day shift
        if (taskTime < startTime || taskTime > endTime) {
           ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Time must be within shift hours (${startTime} - ${endTime}).`,
            path: ["time"],
          });
        }
      }
    });
  }, [shift]);

  type TaskFormValues = z.infer<typeof taskSchema>;

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      time: "",
      notes: "",
    },
  });

  const handleFormSubmit = (data: TaskFormValues) => {
    const attachmentFilename = data.attachment?.[0]?.name;
    onSubmit({ ...data, attachment: attachmentFilename });
    form.reset();
    onClose();
  };
  
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      form.reset();
    }
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Task</DialogTitle>
          <DialogDescription>Fill in the details below to add a new task to your schedule.</DialogDescription>
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
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date</FormLabel>
                    <Popover>
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
                          onSelect={field.onChange}
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
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
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
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Attachment</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Button asChild variant="outline" className="w-full justify-start font-normal text-muted-foreground">
                        <div>
                          <Paperclip className="mr-2 h-4 w-4"/>
                          {field.value?.[0]?.name || "Attach a file"}
                        </div>
                      </Button>
                      <Input className="absolute top-0 left-0 h-full w-full opacity-0 cursor-pointer" type="file" onChange={(e) => field.onChange(e.target.files)} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
              <Button type="submit">Add Task</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
