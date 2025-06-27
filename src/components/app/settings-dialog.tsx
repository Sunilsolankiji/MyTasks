"use client"

import { useEffect, useRef, useState } from "react";
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
import { Download, Upload, Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverAnchor } from "@/components/ui/popover";
import { searchLocations, type SearchLocationsOutput } from "@/ai/flows/search-locations-flow";

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
  const [suggestions, setSuggestions] = useState<SearchLocationsOutput>([]);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [hasSelectedSuggestion, setHasSelectedSuggestion] = useState(true);

  const locationValue = form.watch('location');

  useEffect(() => {
    if (isOpen) {
      form.reset({ projectName, location });
      setHasSelectedSuggestion(true); // Prevent search on modal open
    }
  }, [projectName, location, isOpen, form]);

  useEffect(() => {
    if (hasSelectedSuggestion || !locationValue || locationValue.length < 2) {
      setSuggestions([]);
      setIsSuggestionsOpen(false);
      return;
    }

    const handler = setTimeout(async () => {
      setIsLoadingSuggestions(true);
      const results = await searchLocations({ query: locationValue });
      setSuggestions(results);
      setIsSuggestionsOpen(results.length > 0);
      setIsLoadingSuggestions(false);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [locationValue, hasSelectedSuggestion]);


  function onSubmit(values: z.infer<typeof settingsSchema>) {
    onUpdateProjectName(values.projectName);
    onUpdateLocation(values.location || "");
    window.dispatchEvent(new Event('location-updated'));
    onClose();
  }

  const handleSuggestionClick = (suggestion: SearchLocationsOutput[number]) => {
    const displayValue = [suggestion.name, suggestion.region, suggestion.country].filter(Boolean).join(', ');
    setHasSelectedSuggestion(true);
    form.setValue('location', displayValue, { shouldValidate: true });
    setIsSuggestionsOpen(false);
  };

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
                    <Popover open={isSuggestionsOpen} onOpenChange={setIsSuggestionsOpen}>
                      <PopoverAnchor>
                         <div className="relative">
                            <FormControl>
                              <Input
                                placeholder="Start typing a city name..."
                                {...field}
                                value={field.value ?? ''}
                                onChange={(e) => {
                                  field.onChange(e);
                                  setHasSelectedSuggestion(false);
                                }}
                                autoComplete="off"
                              />
                            </FormControl>
                            {isLoadingSuggestions && (
                              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                            )}
                          </div>
                      </PopoverAnchor>
                      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-1" onOpenAutoFocus={(e) => e.preventDefault()}>
                        <div className="max-h-60 overflow-y-auto">
                          {suggestions.length > 0 ? (
                            suggestions.map((suggestion) => (
                              <button
                                type="button"
                                key={suggestion.id}
                                className="w-full text-left cursor-pointer p-2 text-sm hover:bg-accent focus:bg-accent focus:outline-none rounded-md"
                                onClick={() => handleSuggestionClick(suggestion)}
                              >
                                {[suggestion.name, suggestion.region, suggestion.country].filter(Boolean).join(', ')}
                              </button>
                            ))
                          ) : (
                            !isLoadingSuggestions && <p className="p-2 text-sm text-muted-foreground">No results found.</p>
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
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
