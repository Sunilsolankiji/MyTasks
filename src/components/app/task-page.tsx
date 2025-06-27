"use client"

import { useState, useMemo, useEffect } from "react";
import type { Task, Priority } from "@/lib/types";
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

const priorityOrder: Record<Priority, number> = { high: 3, medium: 2, low: 1 };

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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedTasks = localStorage.getItem("tasks");
      if (storedTasks) {
        setTasks(JSON.parse(storedTasks).map((task: any) => ({
          ...task,
          priority: task.priority || 'medium',
          date: task.date ? new Date(task.date) : undefined,
          creationDate: task.creationDate ? new Date(task.creationDate) : new Date(),
          completionDate: task.completionDate ? new Date(task.completionDate) : undefined,
        })));
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
        setProjectName(JSON.parse(storedProjectName));
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

  const handleSaveTask = (taskData: Omit<Task, 'id' | 'completed' | 'creationDate' | 'completionDate'>) => {
    if (editingTask) {
      setTasks(tasks.map(t => t.id === editingTask.id ? { ...t, ...taskData } : t));
    } else {
      const newTask: Task = {
        ...taskData,
        id: Date.now().toString(),
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
            return (priorityOrder[b.priority] - priorityOrder[a.priority]) * dir;
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

  return (
    <div className="min-h-screen w-full bg-background flex flex-col">
      <Header 
        projectName={projectName}
        onOpenTaskDialog={() => setIsTaskFormOpen(true)}
        onOpenSettingsDialog={() => setIsSettingsOpen(true)}
      />
      <main className="flex-1 w-full">
        <div className="container mx-auto py-8 px-4 flex flex-col items-center">
          <div className="w-full max-w-4xl">
            <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
              <h1 className="text-3xl font-bold tracking-tight">Your Tasks</h1>
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

            <Tabs defaultValue="all">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="today">Today</TabsTrigger>
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
              </TabsList>
              <TabsContent value="today" className="pt-6">
                {isLoading ? <TaskListSkeleton /> : <TaskList
                  tasks={todayTasks}
                  onToggleComplete={handleToggleComplete}
                  onDelete={handleDeleteTask}
                  onEdit={handleOpenEditDialog}
                />}
              </TabsContent>
              <TabsContent value="upcoming" className="pt-6">
                {isLoading ? <TaskListSkeleton /> : <TaskList
                  tasks={upcomingTasks}
                  onToggleComplete={handleToggleComplete}
                  onDelete={handleDeleteTask}
                  onEdit={handleOpenEditDialog}
                />}
              </TabsContent>
              <TabsContent value="completed" className="pt-6">
                {isLoading ? <TaskListSkeleton /> : <TaskList
                  tasks={completedTasks}
                  onToggleComplete={handleToggleComplete}
                  onDelete={handleDeleteTask}
                  onEdit={handleOpenEditDialog}
                />}
              </TabsContent>
              <TabsContent value="all" className="pt-6">
                {isLoading ? <TaskListSkeleton /> : <TaskList
                  tasks={allTasks}
                  onToggleComplete={handleToggleComplete}
                  onDelete={handleDeleteTask}
                  onEdit={handleOpenEditDialog}
                />}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
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
      />
    </div>
  );
}
