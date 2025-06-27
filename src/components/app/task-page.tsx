
"use client"

import { useState, useMemo, useEffect } from "react";
import type { Task, Priority, Location } from "@/lib/types";
import { Header } from "./header";
import { TaskForm } from "./task-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Search, ArrowUp, ArrowDown, ListFilter } from "lucide-react";
import { TaskList } from "./task-list";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { TaskListSkeleton } from "./task-list-skeleton";
import { SettingsDialog } from "./settings-dialog";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { ExportDialog } from "./export-dialog";
import { ImportPreviewDialog } from "./import-preview-dialog";
import { WeatherEffect } from "./weather-effect";
import { WeatherWidget } from "./weather-widget";
import { cn } from "@/lib/utils";

const priorityOrder: Record<Priority, number> = { high: 3, medium: 2, low: 1 };

const taskImportSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Title cannot be empty"),
  date: z.string().datetime({ offset: true }).optional().nullable().transform((val) => val ? new Date(val) : undefined),
  completed: z.boolean(),
  notes: z.string().optional().nullable(),
  attachment: z.string().optional().nullable(),
  attachmentName: z.string().optional().nullable(),
  creationDate: z.string().datetime({ offset: true }).transform((val) => new Date(val)),
  completionDate: z.string().datetime({ offset: true }).optional().nullable().transform((val) => val ? new Date(val) : undefined),
  priority: z.enum(['low', 'medium', 'high']),
  referenceLinks: z.array(z.string()).optional().nullable(),
});

const tasksImportSchema = z.array(taskImportSchema);


export default function TaskPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [sortKey, setSortKey] = useState<'creationDate' | 'date' | 'title' | 'completionDate' | 'priority'>('creationDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [projectName, setProjectName] = useState('My Tasks');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { toast } = useToast();
  
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isImportPreviewDialogOpen, setIsImportPreviewDialogOpen] = useState(false);
  const [tasksToImport, setTasksToImport] = useState<Task[]>([]);
  const [location, setLocation] = useState<Location | null>(null);
  const [showWeatherWidget, setShowWeatherWidget] = useState(true);
  const [isHeaderSticky, setIsHeaderSticky] = useState(false);
  const [isFilterBarSticky, setIsFilterBarSticky] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedTasks = localStorage.getItem("tasks");
        if (storedTasks) {
          const parsedTasks = JSON.parse(storedTasks).map((task: any) => ({
            ...task,
            priority: task.priority || 'medium',
            date: task.date ? new Date(task.date) : undefined,
            creationDate: task.creationDate ? new Date(task.creationDate) : new Date(),
            completionDate: task.completionDate ? new Date(task.completionDate) : undefined,
            referenceLinks: task.referenceLinks || [],
          }))
          const validation = tasksImportSchema.safeParse(parsedTasks.map((t:Task) => ({...t, date: t.date?.toISOString(), creationDate: t.creationDate.toISOString(), completionDate: t.completionDate?.toISOString()})));
          if (validation.success) {
            setTasks(validation.data as Task[]);
          } else {
             console.error("Local storage validation error", validation.error.format());
             localStorage.removeItem("tasks");
          }
        }
      } catch (error) {
        console.error("Failed to parse tasks from local storage", error);
        localStorage.removeItem("tasks");
      }
      
      const storedSortKey = localStorage.getItem("sortKey");
      if (storedSortKey) {
        setSortKey(storedSortKey as any);
      }
      
      const storedSortDirection = localStorage.getItem("sortDirection");
      if (storedSortDirection) {
        setSortDirection(storedSortDirection as 'asc' | 'desc');
      }

      const storedProjectName = localStorage.getItem("projectName");
      if (storedProjectName) {
        try {
          const parsedName = JSON.parse(storedProjectName);
          if (typeof parsedName === 'string') {
            setProjectName(parsedName);
          }
        } catch {
          setProjectName('My Tasks');
        }
      }

      try {
        const storedLocation = localStorage.getItem("location");
        if (storedLocation) {
          setLocation(JSON.parse(storedLocation));
        }
      } catch (error) {
        console.error("Failed to parse location from local storage", error);
        localStorage.removeItem("location");
      }
      
      try {
        const storedShowWeather = localStorage.getItem("showWeatherWidget");
        if (storedShowWeather) {
          setShowWeatherWidget(JSON.parse(storedShowWeather));
        }
      } catch (error) {
        console.error("Failed to parse showWeatherWidget from local storage", error);
        localStorage.removeItem("showWeatherWidget");
      }

      try {
        const storedIsHeaderSticky = localStorage.getItem("isHeaderSticky");
        if (storedIsHeaderSticky) {
          setIsHeaderSticky(JSON.parse(storedIsHeaderSticky));
        }
      } catch (error) {
        console.error("Failed to parse isHeaderSticky from local storage", error);
        localStorage.removeItem("isHeaderSticky");
      }
      
      try {
        const storedIsFilterBarSticky = localStorage.getItem("isFilterBarSticky");
        if (storedIsFilterBarSticky) {
          setIsFilterBarSticky(JSON.parse(storedIsFilterBarSticky));
        }
      } catch (error) {
        console.error("Failed to parse isFilterBarSticky from local storage", error);
        localStorage.removeItem("isFilterBarSticky");
      }


      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && !isLoading) {
      localStorage.setItem("tasks", JSON.stringify(tasks));
    }
  }, [tasks, isLoading]);

  useEffect(() => {
    if (typeof window !== 'undefined' && !isLoading) {
      localStorage.setItem("sortKey", sortKey);
      localStorage.setItem("sortDirection", sortDirection);
    }
  }, [sortKey, sortDirection, isLoading]);

  useEffect(() => {
    if (typeof window !== 'undefined' && !isLoading) {
      localStorage.setItem("projectName", JSON.stringify(projectName));
    }
  }, [projectName, isLoading]);

  useEffect(() => {
    if (typeof window !== 'undefined' && !isLoading) {
      if (location) {
        localStorage.setItem("location", JSON.stringify(location));
      } else {
        localStorage.removeItem("location");
      }
    }
  }, [location, isLoading]);

  useEffect(() => {
    if (typeof window !== 'undefined' && !isLoading) {
      localStorage.setItem("showWeatherWidget", JSON.stringify(showWeatherWidget));
    }
  }, [showWeatherWidget, isLoading]);

  useEffect(() => {
    if (typeof window !== 'undefined' && !isLoading) {
      localStorage.setItem("isHeaderSticky", JSON.stringify(isHeaderSticky));
    }
  }, [isHeaderSticky, isLoading]);
  
  useEffect(() => {
    if (typeof window !== 'undefined' && !isLoading) {
      localStorage.setItem("isFilterBarSticky", JSON.stringify(isFilterBarSticky));
    }
  }, [isFilterBarSticky, isLoading]);

  const handleSaveTask = (taskData: Omit<Task, 'id' | 'completed' | 'creationDate' | 'completionDate'>) => {
    if (editingTask) {
      setTasks(tasks.map(t => t.id === editingTask.id ? { ...t, ...taskData } : t));
    } else {
      const newTask: Task = {
        ...taskData,
        id: crypto.randomUUID(),
        completed: false,
        creationDate: new Date(),
      };
      setTasks(prevTasks => [...prevTasks, newTask]);
    }
    setEditingTask(null);
  };

  const handleOpenEditDialog = (task: Task) => {
    setEditingTask(task);
    setIsTaskFormOpen(true);
  };
  
  const handleCloseTaskForm = () => {
    setIsTaskFormOpen(false);
    setEditingTask(null);
  };

  const handleToggleComplete = (id: string, completed: boolean) => {
    setTasks(tasks.map(task => task.id === id ? { ...task, completed, completionDate: completed ? new Date() : undefined } : task));
  };

  const handleDeleteTask = (id: string) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const handleUpdateProjectName = (name: string) => {
    setProjectName(name);
  };

  const handleExportTasks = (tasksToExport: Task[]) => {
    if (tasksToExport.length === 0) {
      toast({
        title: "No Tasks Selected",
        description: "Please select at least one task to export.",
        variant: "destructive"
      });
      return;
    }
    const jsonString = JSON.stringify(tasksToExport, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `my-tasks-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({
      title: "Export successful",
      description: `${tasksToExport.length} tasks have been downloaded.`,
    });
  };

  const handleImportFileSelect = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result;
        if (typeof content !== 'string') {
          throw new Error("Could not read file content.");
        }
        const data = JSON.parse(content);
        const validationResult = tasksImportSchema.safeParse(data);

        if (!validationResult.success) {
          console.error("Import validation error:", validationResult.error.format());
          throw new Error("The selected file has an invalid format or content.");
        }
        
        setTasksToImport(validationResult.data as Task[]);
        setIsImportPreviewDialogOpen(true);

      } catch (error) {
        toast({
          title: "Import Failed",
          description: error instanceof Error ? error.message : "An unknown error occurred.",
          variant: "destructive",
        });
      }
    };
    reader.onerror = () => {
      toast({
        title: "Import Failed",
        description: "Could not read the selected file.",
        variant: "destructive",
      });
    }
    reader.readAsText(file);
  };

  const handleConfirmImport = (selectedTasks: Task[]) => {
    const existingIds = new Set(tasks.map(t => t.id));
    const newTasks = selectedTasks.map(task => ({
      ...task,
      id: existingIds.has(task.id) ? crypto.randomUUID() : task.id,
    }));

    setTasks(prev => [...prev, ...newTasks]);
    toast({
        title: "Import Successful",
        description: `Successfully imported ${newTasks.length} tasks.`,
    });
  }

  const allTasks = useMemo(() => {
    return [...tasks]
      .filter(task =>
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (task.notes && task.notes.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      .sort((a, b) => {
        const dir = sortDirection === 'asc' ? 1 : -1;

        switch (sortKey) {
          case 'title':
            return a.title.localeCompare(b.title) * dir;
          case 'date':
            if (a.date && !b.date) return -1 * dir;
            if (!a.date && b.date) return 1 * dir;
            if (!a.date && !b.date) return 0;
            return (a.date!.getTime() - b.date!.getTime()) * dir;
          case 'completionDate':
            if (a.completionDate && !b.completionDate) return -1 * dir;
            if (!a.completionDate && b.completionDate) return 1 * dir;
            if (!a.completionDate && !b.completionDate) return 0;
            return (a.completionDate!.getTime() - b.completionDate!.getTime()) * dir;
          case 'priority':
            return (priorityOrder[a.priority] - priorityOrder[b.priority]) * dir * -1;
          case 'creationDate':
          default:
            return (a.creationDate.getTime() - b.creationDate.getTime()) * dir;
        }
      });
  }, [tasks, searchTerm, sortKey, sortDirection]);

  const todayTasks = useMemo(() => {
    const todayString = new Date().toDateString();
    return allTasks.filter(task =>
      task.date && new Date(task.date).toDateString() === todayString && !task.completed
    );
  }, [allTasks]);

  const upcomingTasks = useMemo(() => {
    const todayString = new Date().toDateString();
    return allTasks.filter(task =>
      task.date && !task.completed && new Date(task.date).toDateString() !== todayString
    );
  }, [allTasks]);

  const completedTasks = useMemo(() => {
    return allTasks.filter(task => task.completed);
  }, [allTasks]);
  
  const handleOpenExportDialog = () => {
    if (tasks.length === 0) {
      toast({
        title: "No Tasks",
        description: "There are no tasks to export.",
        variant: "destructive"
      });
      return;
    }
    setIsExportDialogOpen(true);
  }

  return (
    <div className="flex flex-col min-h-screen w-full bg-background">
      <Header 
        projectName={projectName}
        onOpenTaskDialog={() => setIsTaskFormOpen(true)}
        onOpenSettingsDialog={() => setIsSettingsOpen(true)}
        isSticky={isHeaderSticky}
      />
      <Tabs defaultValue="all" className="flex flex-col flex-1">
        <div className={cn(
          "z-10 border-b bg-background/80 backdrop-blur-md",
          isFilterBarSticky && "sticky",
          isFilterBarSticky && (isHeaderSticky ? "top-20" : "top-0")
        )}>
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
              <div className="flex-1">
                <h1 className="text-3xl font-bold tracking-tight">Your Tasks</h1>
              </div>
              {showWeatherWidget && <WeatherWidget location={location} />}
              <div className="flex gap-4 w-full sm:w-auto flex-wrap justify-end items-center">
                <div className="relative w-full sm:w-auto sm:flex-grow">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tasks..."
                    className="pl-9 w-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                    <Select value={sortKey} onValueChange={(value: 'creationDate' | 'date' | 'title' | 'completionDate' | 'priority') => setSortKey(value)}>
                      <SelectTrigger className="w-full sm:w-auto">
                        <div className="flex items-center gap-1.5">
                            <ListFilter className="h-3.5 w-3.5" />
                            <SelectValue placeholder="Sort by" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="creationDate">Creation Date</SelectItem>
                          <SelectItem value="date">Due Date</SelectItem>
                          <SelectItem value="title">Title</SelectItem>
                          <SelectItem value="completionDate">Completion Date</SelectItem>
                          <SelectItem value="priority">Priority</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon" onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}>
                        {sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                        <span className="sr-only">Toggle sort direction</span>
                    </Button>
                </div>
              </div>
            </div>
            <TabsList className="grid w-full grid-cols-4 mt-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="today">Today</TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
          </div>
        </div>

        <main className="flex-1 w-full">
          <div className="container mx-auto py-8 px-4 flex flex-col items-center">
            <div className="w-full max-w-4xl">
              <div className="rounded-lg border bg-background/80 backdrop-blur-sm shadow-sm relative overflow-hidden">
                {showWeatherWidget && <WeatherEffect location={location} />}
                <div className="p-6">
                    <TabsContent value="today" className="mt-0">
                      {isLoading ? <TaskListSkeleton /> : <TaskList
                        tasks={todayTasks}
                        onToggleComplete={handleToggleComplete}
                        onDelete={handleDeleteTask}
                        onEdit={handleOpenEditDialog}
                      />}
                    </TabsContent>
                    <TabsContent value="upcoming" className="mt-0">
                      {isLoading ? <TaskListSkeleton /> : <TaskList
                        tasks={upcomingTasks}
                        onToggleComplete={handleToggleComplete}
                        onDelete={handleDeleteTask}
                        onEdit={handleOpenEditDialog}
                      />}
                    </TabsContent>
                    <TabsContent value="completed" className="mt-0">
                      {isLoading ? <TaskListSkeleton /> : <TaskList
                        tasks={completedTasks}
                        onToggleComplete={handleToggleComplete}
                        onDelete={handleDeleteTask}
                        onEdit={handleOpenEditDialog}
                      />}
                    </TabsContent>
                    <TabsContent value="all" className="mt-0">
                      {isLoading ? <TaskListSkeleton /> : <TaskList
                        tasks={allTasks}
                        onToggleComplete={handleToggleComplete}
                        onDelete={handleDeleteTask}
                        onEdit={handleOpenEditDialog}
                      />}
                    </TabsContent>
                </div>
              </div>
            </div>
          </div>
        </main>
      </Tabs>
      <TaskForm
        isOpen={isTaskFormOpen}
        onClose={handleCloseTaskForm}
        onSubmit={handleSaveTask}
        task={editingTask}
      />
      <SettingsDialog
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        projectName={projectName}
        onUpdateProjectName={handleUpdateProjectName}
        onExportClick={handleOpenExportDialog}
        onImportFileSelect={handleImportFileSelect}
        location={location}
        onLocationChange={setLocation}
        showWeatherWidget={showWeatherWidget}
        onToggleWeatherWidget={setShowWeatherWidget}
        isHeaderSticky={isHeaderSticky}
        onToggleHeaderSticky={setIsHeaderSticky}
        isFilterBarSticky={isFilterBarSticky}
        onToggleFilterBarSticky={setIsFilterBarSticky}
      />
      <ExportDialog
        isOpen={isExportDialogOpen}
        onClose={() => setIsExportDialogOpen(false)}
        tasks={tasks}
        onExport={handleExportTasks}
      />
      <ImportPreviewDialog
        isOpen={isImportPreviewDialogOpen}
        onClose={() => setIsImportPreviewDialogOpen(false)}
        tasksToImport={tasksToImport}
        onConfirmImport={handleConfirmImport}
      />
    </div>
  );
}
