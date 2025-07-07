
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
import { Download, Upload, MapPin, X, Loader2 } from "lucide-react";
import type { Location, WeatherEffectMode } from "@/lib/types";
import { searchLocations } from "@/services/weather";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "../ui/switch";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const settingsSchema = z.object({
  projectName: z.string().min(1, "Project name is required."),
  stickyHeader: z.boolean(),
  stickyFilterBar: z.boolean(),
  location: z.string().optional(),
  showWeatherWidget: z.boolean(),
  weatherEffectMode: z.enum(['dynamic', 'all', 'sunny', 'windy', 'cloudy', 'rain', 'snow', 'mist', 'none']),
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
  isHeaderSticky: boolean;
  onToggleHeaderSticky: (sticky: boolean) => void;
  isFilterBarSticky: boolean;
  onToggleFilterBarSticky: (sticky: boolean) => void;
  weatherEffectMode: WeatherEffectMode;
  onWeatherEffectModeChange: (mode: WeatherEffectMode) => void;
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
  onToggleWeatherWidget,
  isHeaderSticky,
  onToggleHeaderSticky,
  isFilterBarSticky,
  onToggleFilterBarSticky,
  weatherEffectMode,
  onWeatherEffectModeChange,
}: SettingsDialogProps) {
  const form = useForm<z.infer<typeof settingsSchema>>({
    resolver: zodResolver(settingsSchema),
    defaultValues: { projectName, location: "", showWeatherWidget, stickyHeader: isHeaderSticky, stickyFilterBar: isFilterBarSticky, weatherEffectMode },
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
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
        showWeatherWidget: showWeatherWidget,
        stickyHeader: isHeaderSticky,
        stickyFilterBar: isFilterBarSticky,
        weatherEffectMode: weatherEffectMode,
      });
      setInternalLocation(location);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [projectName, isOpen, form, location, showWeatherWidget, isHeaderSticky, isFilterBarSticky, weatherEffectMode]);

  const handleLocationSearch = useCallback((query: string) => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    if (!query) {
      setSuggestions([]);
      setShowSuggestions(false);
      setIsSearching(false);
      return;
    }
    
    setIsSearching(true);
    setShowSuggestions(true);

    debounceTimeout.current = setTimeout(async () => {
      try {
        const results = await searchLocations(query);
        setSuggestions(results);
      } catch (error) {
        toast({
          title: "Location Search Failed",
          description: error instanceof Error ? error.message : "An unknown error occurred.",
          variant: "destructive"
        })
        setSuggestions([]);
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
    onToggleHeaderSticky(values.stickyHeader);
    onToggleFilterBarSticky(values.stickyFilterBar);
    onLocationChange(values.showWeatherWidget ? internalLocation : null);
    onToggleWeatherWidget(values.showWeatherWidget);
    onWeatherEffectModeChange(values.weatherEffectMode);
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
      <DialogContent className="sm:max-w-[425px] p-0">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col max-h-[90vh]">
            <DialogHeader className="p-6 pb-4">
              <DialogTitle>Settings</DialogTitle>
              <DialogDescription>
                Configure your project settings and manage data.
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto px-6">
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
                
                <div className="space-y-2">
                  <FormLabel>Appearance</FormLabel>
                  <div className="space-y-4 rounded-lg border p-4">
                    <FormField
                      control={form.control}
                      name="stickyHeader"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between">
                          <div className="space-y-0.5">
                            <FormLabel>Sticky Header</FormLabel>
                            <p className="text-[0.8rem] text-muted-foreground">
                                Keep the header visible when scrolling.
                            </p>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              aria-label="Toggle sticky header"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <Separator />
                    
                    <FormField
                      control={form.control}
                      name="stickyFilterBar"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between">
                          <div className="space-y-0.5">
                            <FormLabel>Sticky Filter & Tabs</FormLabel>
                            <p className="text-[0.8rem] text-muted-foreground">
                                Keep filters and tabs visible when scrolling.
                            </p>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              aria-label="Toggle sticky filter bar"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <Separator />

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
                      <div className="space-y-4 pt-4 border-t">
                        <div className="space-y-2">
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
                                            } else if (suggestions.length > 0) {
                                                setShowSuggestions(true);
                                            }
                                        }}
                                        autoComplete="off"
                                      />
                                      {isSearching && (
                                        <div className="absolute right-9 top-1/2 -translate-y-1/2">
                                          <Loader2 className="h-4 w-4 animate-spin" />
                                        </div>
                                      )}
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
                              <div ref={suggestionsRef} className="absolute z-10 w-full bg-background border rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto">
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

                        <Separator />

                        <FormField
                          control={form.control}
                          name="weatherEffectMode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Weather Effects</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select an effect" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="dynamic">Dynamic</SelectItem>
                                  <SelectItem value="none">None</SelectItem>
                                  <SelectItem value="sunny">Sunny</SelectItem>
                                  <SelectItem value="cloudy">Cloudy</SelectItem>
                                  <SelectItem value="windy">Windy</SelectItem>
                                  <SelectItem value="rain">Rain</SelectItem>
                                  <SelectItem value="snow">Snow</SelectItem>
                                  <SelectItem value="mist">Mist</SelectItem>
                                  <SelectItem value="all">All</SelectItem>
                                </SelectContent>
                              </Select>
                              <p className="text-[0.8rem] text-muted-foreground">
                                Choose which weather effect to display.
                              </p>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  </div>
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
            </div>

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
