
"use client"

import { useMemo, useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Paperclip, X, Plus, Link as LinkIcon, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import type { Task } from "@/lib/types";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useOnDeviceAI } from "@/hooks/use-on-device-ai";
import { useToast } from "@/hooks/use-toast";

interface TaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (task: Omit<Task, 'id' | 'completed' | 'creationDate' | 'completionDate'>) => void;
  task?: Task | null;
}

export function TaskForm({ isOpen, onClose, onSubmit, task }: TaskFormProps) {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [attachmentRemoved, setAttachmentRemoved] = useState(false);
  const isEditMode = !!task;

  const { toast } = useToast();
  const { rewriterState } = useOnDeviceAI();
  const [isRewritingTitle, setIsRewritingTitle] = useState(false);
  const [isRewritingNotes, setIsRewritingNotes] = useState(false);

  const taskSchema = useMemo(() => {
    return z.object({
      title: z.string().min(1, "Title is required"),
      priority: z.enum(['low', 'medium', 'high']),
      date: z.date().optional(),
      notes: z.string().optional(),
      attachment: z.any().optional(),
      referenceLinks: z.array(z.string().url({ message: "Please enter a valid URL."}).or(z.literal(""))).optional(),
    });
  }, []);

  type TaskFormValues = z.infer<typeof taskSchema>;

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "referenceLinks" as any,
  });

  useEffect(() => {
    if (isOpen) {
      setAttachmentRemoved(false);
      setIsRewritingTitle(false);
      setIsRewritingNotes(false);
      if (task) {
        form.reset({
          title: task.title,
          priority: task.priority || 'medium',
          date: task.date,
          notes: task.notes || "",
          attachment: undefined,
          referenceLinks: task.referenceLinks || [],
        });
      } else {
        form.reset({
          title: "",
          priority: 'medium',
          date: new Date(),
          notes: "",
          attachment: undefined,
          referenceLinks: [],
        });
      }
    }
  }, [isOpen, task, form]);

  const handleRewriteTitle = async () => {
    if (rewriterState !== 'ready' || isRewritingTitle || !window.ai) return;

    const currentTitle = form.getValues('title');
    if (!currentTitle.trim()) {
      return;
    }

    setIsRewritingTitle(true);
    try {
      const rewriter = await window.ai.createTextRewriter();
      const result = await rewriter.rewrite(currentTitle);

      form.setValue('title', result.trim(), { shouldValidate: true });
      rewriter.close();
    } catch (e) {
      console.error("Failed to rewrite title:", e);
      toast({
        title: "AI Rewrite Failed",
        description: "Could not generate a new title. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsRewritingTitle(false);
    }
  };
  
  const handleRewriteNotes = async () => {
    if (rewriterState !== 'ready' || isRewritingNotes || !window.ai) return;

    const currentNotes = form.getValues('notes');
    if (!currentNotes || !currentNotes.trim()) {
      return;
    }

    setIsRewritingNotes(true);
    try {
      const rewriter = await window.ai.createTextRewriter();
      const result = await rewriter.rewrite(currentNotes);
      form.setValue('notes', result.trim(), { shouldValidate: true });
      rewriter.close();
    } catch (e) {
      console.error("Failed to rewrite notes:", e);
      toast({
          title: "AI Rewrite Failed",
          description: "Could not rewrite the notes. Please try again.",
          variant: "destructive"
      })
    } finally {
      setIsRewritingNotes(false);
    }
  };

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
      priority: data.priority,
      date: data.date,
      notes: data.notes,
      attachment: attachmentDataUrl,
      attachmentName: attachmentName,
      referenceLinks: data.referenceLinks?.filter(link => link && link.trim() !== '') || [],
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
      <DialogContent className="sm:max-w-md p-0">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="flex flex-col max-h-[90vh]">
            <DialogHeader className="p-6 pb-4">
              <DialogTitle>{isEditMode ? 'Edit Task' : 'Add New Task'}</DialogTitle>
              <DialogDescription>
                {isEditMode ? "Update the details of your task." : "Fill in the details below to add a new task to your schedule."}
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto px-6">
              <div className="space-y-4 py-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Task Title</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input placeholder="e.g., Complete project report" {...field} />
                          {rewriterState === 'ready' && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                                onClick={handleRewriteTitle}
                                disabled={isRewritingTitle || !field.value}
                                title="Rewrite with AI"
                            >
                                {isRewritingTitle ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Sparkles className="h-4 w-4" />
                                )}
                                <span className="sr-only">Rewrite with AI</span>
                            </Button>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>Priority</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex space-x-4"
                        >
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="low" />
                            </FormControl>
                            <FormLabel className="font-normal">Low</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="medium" />
                            </FormControl>
                            <FormLabel className="font-normal">Medium</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="high" />
                            </FormControl>
                            <FormLabel className="font-normal">High</FormLabel>
                          </FormItem>
                        </RadioGroup>
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
                        <div className="relative">
                          <Textarea 
                            placeholder="Add any relevant notes..." 
                            className="resize-none pr-10" 
                            {...field} 
                          />
                          {rewriterState === 'ready' && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-1 top-1.5 h-8 w-8"
                                onClick={handleRewriteNotes}
                                disabled={isRewritingNotes || !field.value}
                                title="Rewrite with AI"
                            >
                                {isRewritingNotes ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Sparkles className="h-4 w-4" />
                                )}
                                <span className="sr-only">Rewrite with AI</span>
                            </Button>
                          )}
                        </div>
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
                <FormItem>
                  <FormLabel>Reference Links</FormLabel>
                  <div className="space-y-2">
                    {fields.map((field, index) => (
                      <div key={field.id} className="flex items-center gap-2">
                        <LinkIcon className="h-4 w-4 text-muted-foreground" />
                        <FormField
                          control={form.control}
                          name={`referenceLinks.${index}`}
                          render={({ field }) => (
                            <FormItem className="flex-grow">
                              <FormControl>
                                <Input placeholder="https://example.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                          <X className="h-4 w-4" />
                          <span className="sr-only">Remove link</span>
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => append("")}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Link
                  </Button>
                </FormItem>
              </div>
            </div>
            <DialogFooter className="p-6 pt-4 border-t">
              <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
              <Button type="submit">{isEditMode ? 'Save Changes' : 'Add Task'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
