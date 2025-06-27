"use client"

import { useEffect, useRef } from "react";
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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription as Fd,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "../ui/separator";
import { Download, Upload } from "lucide-react";

const settingsSchema = z.object({
  projectName: z.string().min(1, "Project name is required."),
  location: z.string().optional(),
});

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  onUpdateProjectName: (name: string) => void;
  onExportClick: () => void;
  onImportFileSelect: (file: File) => void;
  location: string;
  onUpdateLocation: (location: string) => void;
}

export function SettingsDialog({ isOpen, onClose, projectName, onUpdateProjectName, onExportClick, onImportFileSelect, location, onUpdateLocation }: SettingsDialogProps) {
  const form = useForm<z.infer<typeof settingsSchema>>({
    resolver: zodResolver(settingsSchema),
    defaultValues: { projectName, location },
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      form.reset({ projectName, location });
    }
  }, [projectName, location, isOpen, form]);

  function onSubmit(values: z.infer<typeof settingsSchema>) {
    onUpdateProjectName(values.projectName);
    onUpdateLocation(values.location || "");
    onClose();
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImportFileSelect(file);
    }
    if (event.target) {
      event.target.value = '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Configure your project settings and manage data.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
             <FormField
                control={form.control}
                name="projectName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. San Francisco, CA" {...field} value={field.value ?? ''} />
                    </FormControl>
                     <Fd>Used for the live weather effect.</Fd>
                    <FormMessage />
                  </FormItem>
                )}
              />


              <Separator />

              <div className="space-y-2">
                <FormLabel>Data Management</FormLabel>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" className="w-full" onClick={onExportClick}>
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                  <Button type="button" variant="outline" className="w-full" onClick={handleImportClick}>
                    <Upload className="mr-2 h-4 w-4" />
                    Import
                  </Button>
                  <input 
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".json"
                    onChange={handleFileChange}
                  />
                </div>
                <p className="text-xs text-muted-foreground">Select tasks to import or export.</p>
              </div>

            <DialogFooter className="pt-4">
               <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
