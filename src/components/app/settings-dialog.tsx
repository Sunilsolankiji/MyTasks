"use client"

import { useEffect, useRef, useState, useCallback } from "react";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "../ui/separator";
import { Download, Upload, Loader2, MapPin, X } from "lucide-react";
import type { Location } from "@/lib/types";
import { searchLocations } from "@/services/weather";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "../ui/switch";
import { ScrollArea } from "../ui/scroll-area";

const settingsSchema = z.object({
  projectName: z.string().min(1, "Project name is required."),
  location: z.string().optional(),
  showWeatherWidget: z.boolean(),
});

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  onUpdateProjectName: (name: string) => void;
  onExportClick: () => void;
  onImportFileSelect: (file: File) => void;
  location: Location | null;
  onLocationChange: (location: Location | null) => void;
  showWeatherWidget: boolean;
  onToggleWeatherWidget: (show: boolean) => void;
}

export function SettingsDialog({ 
  isOpen, 
  onClose, 
  projectName, 
  onUpdateProjectName, 
  onExportClick, 
  onImportFileSelect,
  location,
  onLocationChange,
  showWeatherWidget,
  onToggleWeatherWidget
}: SettingsDialogProps) {
  const form = useForm<z.infer<typeof settingsSchema>>({
    resolver: zodResolver(settingsSchema),
    defaultValues: { projectName, location: "", showWeatherWidget },
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [suggestions, setSuggestions] = useState<Location[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { toast } = useToast();
  
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  const [internalLocation, setInternalLocation] = useState<Location | null>(location);
  
  const watchedShowWeather = form.watch("showWeatherWidget");

  useEffect(() => {
    if (isOpen) {
      form.reset({
        projectName,
        location: location?.name || "",
        showWeatherWidget: showWeatherWidget
      });
      setInternalLocation(location);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [projectName, isOpen, form, location, showWeatherWidget]);

  const handleLocationSearch = useCallback((query: string) => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    if (!query) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    
    debounceTimeout.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchLocations(query);
        setSuggestions(results);
        setShowSuggestions(true);
      } catch (error) {
        toast({
          title: "Error",
          description: "Could not fetch location suggestions.",
          variant: "destructive"
        })
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setIsSearching(false);
      }
    }, 500);
  }, [toast]);
  

  const onSubmit = (values: z.infer<typeof settingsSchema>) => {
    if (values.showWeatherWidget && !internalLocation) {
        toast({
            title: "Location Required",
            description: "Please set a location before enabling the weather widget.",
            variant: "destructive",
        });
        return;
    }

    onUpdateProjectName(values.projectName);
    onLocationChange(values.showWeatherWidget ? internalLocation : null);
    onToggleWeatherWidget(values.showWeatherWidget);
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

  const handleSuggestionClick = (selectedLocation: Location) => {
    setInternalLocation(selectedLocation);
    form.setValue('location', selectedLocation.name, { shouldValidate: true });
    setShowSuggestions(false);
  };

  const handleClearLocation = () => {
    setInternalLocation(null);
    form.setValue('location', '');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px] p-0 flex flex-col max-h-[90vh]">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
            <DialogHeader className="p-6 pb-4">
              <DialogTitle>Settings</DialogTitle>
              <DialogDescription>
                Configure your project settings and manage data.
              </DialogDescription>
            </DialogHeader>
            
            <ScrollArea className="flex-1 px-6">
              <div className="space-y-6 py-4">
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

                <Separator />
                
                <div className="space-y-4 rounded-lg border p-4">
                  <FormField
                    control={form.control}
                    name="showWeatherWidget"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between">
                        <div className="space-y-0.5">
                          <FormLabel>Show Weather Widget</FormLabel>
                          <p className="text-[0.8rem] text-muted-foreground">
                              Display current weather and effects.
                          </p>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            aria-label="Toggle weather widget"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  {watchedShowWeather && (
                    <div className="space-y-2 pt-4 border-t">
                      <FormLabel>Weather Location</FormLabel>
                      <div 
                        className="relative"
                        onBlur={(e) => {
                          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                            setShowSuggestions(false);
                          }
                        }}
                      >
                        <FormField
                          control={form.control}
                          name="location"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <div className="relative">
                                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                  <Input 
                                    {...field}
                                    placeholder="Search for a city..."
                                    className="pl-9"
                                    onChange={(e) => {
                                        field.onChange(e);
                                        handleLocationSearch(e.target.value);
                                    }}
                                    onFocus={() => {
                                        if (field.value) {
                                            handleLocationSearch(field.value)
                                        }
                                    }}
                                    autoComplete="off"
                                  />
                                  {isSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />}
                                  {internalLocation && !isSearching && (
                                      <Button
                                          type="button"
                                          variant="ghost"
                                          size="icon"
                                          className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                                          onClick={handleClearLocation}
                                      >
                                          <X className="h-4 w-4" />
                                          <span className="sr-only">Clear location</span>
                                      </Button>
                                  )}
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {showSuggestions && suggestions.length > 0 && (
                          <div className="absolute z-10 w-full bg-background border rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto">
                            {suggestions.map((suggestion) => (
                              <button
                                type="button"
                                key={suggestion.id}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-accent"
                                onClick={() => handleSuggestionClick(suggestion)}
                              >
                                {suggestion.name}, {suggestion.country}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>


                <Separator />

                <div className="space-y-2">
                  <FormLabel>Data Management</FormLabel>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" className="w-full" onClick={onExportClick}>
                      <Upload className="mr-2 h-4 w-4" />
                      Export
                    </Button>
                    <Button type="button" variant="outline" className="w-full" onClick={handleImportClick}>
                      <Download className="mr-2 h-4 w-4" />
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
              </div>
            </ScrollArea>

            <DialogFooter className="p-6 pt-4 border-t">
              <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
