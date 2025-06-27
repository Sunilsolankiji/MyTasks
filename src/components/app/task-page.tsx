"use client"

import { useState, useMemo, useEffect } from "react";
import type { Task } from "@/lib/types";
import { Header } from "./header";
import { TaskForm } from "./task-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { TaskList } from "./task-list";

export default function TaskPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedTasks = localStorage.getItem("tasks");
      if (storedTasks) {
        setTasks(JSON.parse(storedTasks).map((task: any) => ({
          ...task,
          date: task.date ? new Date(task.date) : undefined,
        })));
      }
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && !isLoading) {
      localStorage.setItem("tasks", JSON.stringify(tasks));
    }
  }, [tasks, isLoading]);

  const handleAddTask = async (newTaskData: Omit<Task, 'id' | 'completed'>) => {
    const newTask: Task = {
      ...newTaskData,
      id: Date.now().toString(),
      completed: false,
    };
    setTasks(prevTasks => [...prevTasks, newTask]);
  };

  const handleToggleComplete = (id: string, completed: boolean) => {
    setTasks(tasks.map(task => task.id === id ? { ...task, completed } : task));
  };

  const handleDeleteTask = (id: string) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const allTasks = useMemo(() => {
    if (isLoading) return [];
    return tasks
      .filter(task =>
        task.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        if (a.date && !b.date) return -1;
        if (!a.date && b.date) return 1;
        if (a.date && b.date) {
          return a.date.getTime() - b.date.getTime();
        }
        return 0;
      });
  }, [tasks, searchTerm, isLoading]);

  const todayTasks = useMemo(() => {
    if (isLoading) return [];
    const todayString = new Date().toDateString();
    return allTasks.filter(task =>
      task.date && new Date(task.date).toDateString() === todayString && !task.completed
    );
  }, [allTasks, isLoading]);

  const upcomingTasks = useMemo(() => {
    if (isLoading) return [];
    const todayString = new Date().toDateString();
    return allTasks.filter(task =>
      task.date && !task.completed && new Date(task.date).toDateString() !== todayString
    );
  }, [allTasks, isLoading]);

  const completedTasks = useMemo(() => {
    if (isLoading) return [];
    return allTasks.filter(task => task.completed);
  }, [allTasks, isLoading]);

  return (
    <div className="min-h-screen w-full bg-background flex flex-col">
      <Header onOpenTaskDialog={() => setIsTaskFormOpen(true)} />
      <main className="flex-1 w-full">
        <div className="container py-8 px-4 flex flex-col items-center">
          <div className="w-full max-w-4xl">
            <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
              <h1 className="text-3xl font-bold tracking-tight">Your Tasks</h1>
              <div className="flex gap-2 w-full sm:w-auto">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tasks..."
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
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
                <TaskList
                  tasks={todayTasks}
                  onToggleComplete={handleToggleComplete}
                  onDelete={handleDeleteTask}
                />
              </TabsContent>
              <TabsContent value="upcoming" className="pt-6">
                <TaskList
                  tasks={upcomingTasks}
                  onToggleComplete={handleToggleComplete}
                  onDelete={handleDeleteTask}
                />
              </TabsContent>
              <TabsContent value="completed" className="pt-6">
                <TaskList
                  tasks={completedTasks}
                  onToggleComplete={handleToggleComplete}
                  onDelete={handleDeleteTask}
                />
              </TabsContent>
              <TabsContent value="all" className="pt-6">
                {isLoading ? <div>Loading tasks...</div> : <TaskList
                  tasks={allTasks}
                  onToggleComplete={handleToggleComplete}
                  onDelete={handleDeleteTask}
                />}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
      <TaskForm
        isOpen={isTaskFormOpen}
        onClose={() => setIsTaskFormOpen(false)}
        onSubmit={handleAddTask}
      />
    </div>
  );
}
