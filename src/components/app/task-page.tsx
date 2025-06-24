"use client"

import { useState, useMemo } from "react";
import type { Task, Shift } from "@/lib/types";
import { Header } from "./header";
import { TaskList } from "./task-list";
import { TaskForm } from "./task-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

const initialShift: Shift = { id: '1', startTime: '09:00', endTime: '17:00' };

const initialTasks: Task[] = [
  { id: '1', title: 'Morning briefing', date: new Date(), time: '09:30', shiftId: '1', completed: false, notes: 'Discuss Q3 goals.' },
  { id: '2', title: 'Deploy feature branch', date: new Date(), time: '14:00', shiftId: '1', completed: false, attachment: 'deploy-notes.pdf' },
  { id: '3', title: 'System maintenance check', date: new Date(), time: '16:00', shiftId: '1', completed: false },
  { id: '4', title: 'Review weekly report', date: new Date(new Date().setDate(new Date().getDate() - 1)), time: '11:00', shiftId: '1', completed: true },
];

export default function TaskPage() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [shift, setShift] = useState<Shift>(initialShift);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const handleAddTask = (newTaskData: Omit<Task, 'id' | 'completed' | 'shiftId'>) => {
    const newTask: Task = {
      ...newTaskData,
      id: Date.now().toString(),
      completed: false,
      shiftId: shift.id,
    };
    setTasks(prevTasks => [...prevTasks, newTask].sort((a, b) => a.date.getTime() - b.date.getTime()));
  };

  const handleToggleComplete = (id: string, completed: boolean) => {
    setTasks(tasks.map(task => task.id === id ? { ...task, completed } : task));
  };

  const handleDeleteTask = (id: string) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const handleUpdateShift = (updatedShiftData: Omit<Shift, 'id'>) => {
    setShift(prev => ({...prev, ...updatedShiftData}));
  };

  const filteredTasks = useMemo(() => {
    return tasks
      .filter(task => {
        return task.title.toLowerCase().includes(searchTerm.toLowerCase());
      })
      .sort((a, b) => {
        const dateComparison = a.date.getTime() - b.date.getTime();
        if (dateComparison !== 0) return dateComparison;
        return a.time.localeCompare(b.time);
      });
  }, [tasks, searchTerm]);
  
  const todayTasks = useMemo(() => {
    const todayString = new Date().toDateString();
    return filteredTasks.filter(task => new Date(task.date).toDateString() === todayString);
  }, [filteredTasks]);

  const upcomingTasks = filteredTasks.filter(task => !task.completed);
  const completedTasks = filteredTasks.filter(task => task.completed);

  return (
    <div className="min-h-screen w-full bg-background">
      <Header 
        onOpenTaskDialog={() => setIsTaskFormOpen(true)}
        shift={shift}
        onUpdateShift={handleUpdateShift}
      />
      <main className="container py-8">
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

        <Tabs defaultValue="today">
          <TabsList>
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
          <TabsContent value="today" className="pt-6">
            <TaskList 
              tasks={todayTasks} 
              shifts={[shift]}
              onToggleComplete={handleToggleComplete} 
              onDelete={handleDeleteTask} 
            />
          </TabsContent>
          <TabsContent value="upcoming" className="pt-6">
            <TaskList 
              tasks={upcomingTasks} 
              shifts={[shift]}
              onToggleComplete={handleToggleComplete} 
              onDelete={handleDeleteTask} 
            />
          </TabsContent>
          <TabsContent value="completed" className="pt-6">
            <TaskList 
              tasks={completedTasks} 
              shifts={[shift]}
              onToggleComplete={handleToggleComplete} 
              onDelete={handleDeleteTask} 
            />
          </TabsContent>
        </Tabs>
      </main>
      <TaskForm 
        isOpen={isTaskFormOpen} 
        onClose={() => setIsTaskFormOpen(false)} 
        onSubmit={handleAddTask}
        shift={shift}
      />
    </div>
  );
}
