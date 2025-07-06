
"use client"

import { useState, useMemo, useEffect, useCallback } from "react";
import type { Task, Priority, Location, WeatherData, WeatherEffectMode } from "@/lib/types";
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
import { getWeatherData } from "@/services/weather";
import { auth, db } from "@/lib/firebase";
import type { User } from "firebase/auth";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, doc, getDocs, writeBatch, Timestamp } from "firebase/firestore";
import { AuthDialog } from "./auth-dialog";

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
  const [projectName, setProjectName] = useState('MyTasks');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { toast } = useToast();
  
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isImportPreviewDialogOpen, setIsImportPreviewDialogOpen] = useState(false);
  const [tasksToImport, setTasksToImport] = useState<Task[]>([]);
  const [location, setLocation] = useState<Location | null>(null);
  const [showWeatherWidget, setShowWeatherWidget] = useState(true);
  const [isHeaderSticky, setIsHeaderSticky] = useState(false);
  const [isFilterBarSticky, setIsFilterBarSticky] = useState(false);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);
  const [weatherEffectMode, setWeatherEffectMode] = useState<WeatherEffectMode>('dynamic');
  
  const [user, setUser] = useState<User | null>(null);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      setUser(authUser);
      setAuthChecked(true);
      if (authUser) {
        setIsAuthDialogOpen(false);
      }
    });
    return () => unsubscribe();
  }, []);
  
  // Data loading and syncing effect
  useEffect(() => {
    const loadAndSyncData = async () => {
      setIsLoading(true);
      let localTasks: Task[] = [];
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
          }));
          const validation = tasksImportSchema.safeParse(parsedTasks.map((t: Task) => ({...t, date: t.date?.toISOString(), creationDate: t.creationDate.toISOString(), completionDate: t.completionDate?.toISOString()})));
          if (validation.success) {
            localTasks = validation.data as Task[];
          } else {
             console.error("Local storage validation error", validation.error.format());
             localStorage.removeItem("tasks");
          }
        }
      } catch (error) {
        console.error("Failed to parse tasks from local storage", error);
      }

      if (user) {
        setIsSyncing(true);
        const cloudTasksRef = collection(db, 'users', user.uid, 'tasks');
        const cloudSnapshot = await getDocs(cloudTasksRef);
        const cloudTasks = cloudSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            ...data,
            id: doc.id,
            date: data.date ? (data.date as Timestamp).toDate() : undefined,
            creationDate: (data.creationDate as Timestamp).toDate(),
            completionDate: data.completionDate ? (data.completionDate as Timestamp).toDate() : undefined,
          } as Task;
        });

        const localTasksMap = new Map(localTasks.map(t => [t.id, t]));
        const cloudTasksMap = new Map(cloudTasks.map(t => [t.id, t]));
        const mergedTasks = new Map([...localTasksMap, ...cloudTasksMap]);
        
        const finalTasks = Array.from(mergedTasks.values());
        setTasks(finalTasks);

        try {
          const batch = writeBatch(db);
          finalTasks.forEach(task => {
            const docRef = doc(db, 'users', user.uid, 'tasks', task.id);
            batch.set(docRef, {
              ...task,
              date: task.date ? Timestamp.fromDate(task.date) : null,
              creationDate: Timestamp.fromDate(task.creationDate),
              completionDate: task.completionDate ? Timestamp.fromDate(task.completionDate) : null,
              notes: task.notes ?? null,
              attachment: task.attachment ?? null,
              attachmentName: task.attachmentName ?? null,
              referenceLinks: task.referenceLinks ?? [],
            });
          });
          await batch.commit();
          localStorage.removeItem('tasks'); // Clear local after successful sync
          toast({ title: "Tasks Synced", description: "Your tasks are now synced with the cloud." });
        } catch (error: any) {
           let description = "Could not sync tasks with the cloud.";
           if (error.code === 'permission-denied') {
             description = "Sync failed. Please check your Firestore security rules to allow read/write access for your data.";
           } else {
             description = `Sync failed: ${error.message}`;
           }
           toast({ title: "Sync Error", description, variant: "destructive" });
           console.error("Firestore sync error:", error);
        } finally {
          setIsSyncing(false);
        }
      } else {
        setTasks(localTasks);
      }
      setIsLoading(false);
    };
    
    if (authChecked) {
       loadAndSyncData();
    }
  }, [user, authChecked, toast]);

  useEffect(() => {
    if (typeof window !== 'undefined' && !isLoading && !user) {
      localStorage.setItem("tasks", JSON.stringify(tasks));
    }
  }, [tasks, isLoading, user]);


  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedSortKey = localStorage.getItem("sortKey");
        if (storedSortKey) setSortKey(storedSortKey as any);
        const storedSortDirection = localStorage.getItem("sortDirection");
        if (storedSortDirection) setSortDirection(storedSortDirection as 'asc' | 'desc');
        const storedProjectName = localStorage.getItem("projectName");
        if (storedProjectName) setProjectName(JSON.parse(storedProjectName));
        const storedLocation = localStorage.getItem("location");
        if (storedLocation) setLocation(JSON.parse(storedLocation));
        const storedShowWeather = localStorage.getItem("showWeatherWidget");
        if (storedShowWeather) setShowWeatherWidget(JSON.parse(storedShowWeather));
        const storedIsHeaderSticky = localStorage.getItem("isHeaderSticky");
        if (storedIsHeaderSticky) setIsHeaderSticky(JSON.parse(storedIsHeaderSticky));
        const storedIsFilterBarSticky = localStorage.getItem("isFilterBarSticky");
        if (storedIsFilterBarSticky) setIsFilterBarSticky(JSON.parse(storedIsFilterBarSticky));
        const storedWeatherEffectMode = localStorage.getItem("weatherEffectMode");
        if (storedWeatherEffectMode) setWeatherEffectMode(JSON.parse(storedWeatherEffectMode));
      } catch (e) {
        console.error("Failed to load settings from local storage", e);
      }
    }
  }, []);
  
  const fetchWeather = useCallback(async () => {
    if (!location || !showWeatherWidget) {
      setWeather(null);
      return;
    }

    setIsWeatherLoading(true);
    try {
      const data = await getWeatherData(`${location.lat},${location.lon}`);
      setWeather(data);
    } catch (err) {
      toast({
        title: "Weather Error",
        description: err instanceof Error ? err.message : "Failed to fetch weather data.",
        variant: "destructive"
      });
      setWeather(null);
    } finally {
      setIsWeatherLoading(false);
    }
  }, [location, showWeatherWidget, toast]);

  useEffect(() => {
    if (location && showWeatherWidget) {
      fetchWeather();
      const interval = setInterval(() => fetchWeather(), 15 * 60 * 1000); // every 15 mins
      return () => clearInterval(interval);
    } else {
      setWeather(null);
    }
  }, [location, showWeatherWidget, fetchWeather]);

  useEffect(() => {
    if (typeof window !== 'undefined' && isLoading) return;
      localStorage.setItem("sortKey", sortKey);
      localStorage.setItem("sortDirection", sortDirection);
      localStorage.setItem("projectName", JSON.stringify(projectName));
      if (location) localStorage.setItem("location", JSON.stringify(location)); else localStorage.removeItem("location");
      localStorage.setItem("showWeatherWidget", JSON.stringify(showWeatherWidget));
      localStorage.setItem("isHeaderSticky", JSON.stringify(isHeaderSticky));
      localStorage.setItem("isFilterBarSticky", JSON.stringify(isFilterBarSticky));
      localStorage.setItem("weatherEffectMode", JSON.stringify(weatherEffectMode));
  }, [sortKey, sortDirection, projectName, location, showWeatherWidget, isHeaderSticky, isFilterBarSticky, weatherEffectMode, isLoading]);

  const writeTask = async (task: Task) => {
    if (user) {
      const taskDocRef = doc(db, 'users', user.uid, 'tasks', task.id);
      await writeBatch(db).set(taskDocRef, {
        ...task,
        date: task.date ? Timestamp.fromDate(task.date) : null,
        creationDate: Timestamp.fromDate(task.creationDate),
        completionDate: task.completionDate ? Timestamp.fromDate(task.completionDate) : null,
        notes: task.notes ?? null,
        attachment: task.attachment ?? null,
        attachmentName: task.attachmentName ?? null,
        referenceLinks: task.referenceLinks ?? [],
      }).commit();
    }
  };

  const deleteTaskFromDb = async (taskId: string) => {
    if (user) {
      const taskDocRef = doc(db, 'users', user.uid, 'tasks', taskId);
      await writeBatch(db).delete(taskDocRef).commit();
    }
  };


  const handleSaveTask = (taskData: Omit<Task, 'id' | 'completed' | 'creationDate' | 'completionDate'>) => {
    let updatedTask: Task;
    if (editingTask) {
      updatedTask = { ...editingTask, ...taskData };
      setTasks(tasks.map(t => t.id === editingTask.id ? updatedTask : t));
    } else {
      updatedTask = {
        ...taskData,
        id: crypto.randomUUID(),
        completed: false,
        creationDate: new Date(),
      };
      setTasks(prevTasks => [...prevTasks, updatedTask]);
    }
    writeTask(updatedTask);
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
    let updatedTask: Task | undefined;
    setTasks(tasks.map(task => {
      if (task.id === id) {
        updatedTask = { ...task, completed, completionDate: completed ? new Date() : undefined };
        return updatedTask;
      }
      return task;
    }));
    if (updatedTask) writeTask(updatedTask);
  };

  const handleDeleteTask = (id: string) => {
    setTasks(tasks.filter(task => task.id !== id));
    deleteTaskFromDb(id);
  };

  const handleUpdateProjectName = (name: string) => {
    setProjectName(name);
  };
  
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setTasks([]); // Clear tasks on sign out
      toast({ title: "Signed Out", description: "You have been successfully signed out." });
    } catch (error) {
      toast({ title: "Sign Out Error", description: "Failed to sign out.", variant: "destructive" });
    }
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
    <div className="relative flex flex-col min-h-screen w-full bg-background">
      {showWeatherWidget && <WeatherEffect weather={weather} mode={weatherEffectMode} />}
      <Header 
        projectName={projectName}
        onOpenTaskDialog={() => setIsTaskFormOpen(true)}
        onOpenSettingsDialog={() => setIsSettingsOpen(true)}
        isSticky={isHeaderSticky}
        onSync={() => setIsAuthDialogOpen(true)}
        isSyncing={isSyncing}
        user={user}
        onSignOut={handleSignOut}
      />
      <Tabs defaultValue="today" className="flex flex-col flex-1">
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
              {showWeatherWidget && <WeatherWidget location={location} weather={weather} isLoading={isWeatherLoading} />}
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
        weatherEffectMode={weatherEffectMode}
        onWeatherEffectModeChange={setWeatherEffectMode}
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
       <AuthDialog
        isOpen={isAuthDialogOpen}
        onClose={() => setIsAuthDialogOpen(false)}
       />
    </div>
  );
}
