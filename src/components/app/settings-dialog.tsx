"use client"

import { useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Shift } from "@/lib/types";
import { Trash2, Clock, Pencil } from "lucide-react";

const shiftSchema = z.object({
  name: z.string().min(1, "Shift name is required."),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)."),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)."),
});

interface SettingsDialogProps {
  children: ReactNode;
  shifts: Shift[];
  onAddShift: (shift: Omit<Shift, 'id'>) => void;
  onEditShift: (shift: Shift) => void;
  onDeleteShift: (id: string) => void;
}

export function SettingsDialog({ children, shifts, onAddShift, onEditShift, onDeleteShift }: SettingsDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);

  const form = useForm<z.infer<typeof shiftSchema>>({
    resolver: zodResolver(shiftSchema),
    defaultValues: { name: "", startTime: "", endTime: "" },
  });

  const handleCancelEdit = () => {
    setEditingShift(null);
    form.reset({ name: "", startTime: "", endTime: "" });
  };

  function onSubmit(values: z.infer<typeof shiftSchema>) {
    if (editingShift) {
      onEditShift({ ...values, id: editingShift.id });
    } else {
      onAddShift(values);
    }
    handleCancelEdit();
  }

  const handleEditClick = (shift: Shift) => {
    setEditingShift(shift);
    form.reset(shift);
  };
  
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      handleCancelEdit();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Shift Configuration</DialogTitle>
          <DialogDescription>
            Manage your work shifts here. Add, edit, or remove existing ones.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <h3 className="text-sm font-medium">Existing Shifts</h3>
          <ScrollArea className="h-32 w-full rounded-md border p-2">
            {shifts.length > 0 ? (
              shifts.map((shift) => (
                <div key={shift.id} className="flex items-center justify-between p-2 hover:bg-accent rounded-md">
                  <div>
                    <p className="font-semibold">{shift.name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {shift.startTime} - {shift.endTime}
                    </p>
                  </div>
                  <div className="flex items-center">
                    <Button variant="ghost" size="icon" onClick={() => handleEditClick(shift)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onDeleteShift(shift.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center p-4">No shifts configured.</p>
            )}
          </ScrollArea>
          
          <h3 className="text-sm font-medium pt-4">{editingShift ? 'Edit Shift' : 'Add New Shift'}</h3>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Shift Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Morning Shift" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time</FormLabel>
                      <FormControl>
                        <Input placeholder="HH:MM" {...field} type="time" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Time</FormLabel>
                      <FormControl>
                        <Input placeholder="HH:MM" {...field} type="time" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter className="pt-4">
                {editingShift && (
                  <Button type="button" variant="ghost" onClick={handleCancelEdit}>Cancel</Button>
                )}
                <Button type="submit">{editingShift ? 'Update Shift' : 'Add Shift'}</Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
