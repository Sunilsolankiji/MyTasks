"use client"

import { useState, useMemo } from "react";
import type { Task, Shift } from "@/lib/types";
import { Header } from "./header";
import { TaskList } from "./task-list";
import { TaskForm } from "./task-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

const initialShifts: Shift[] = [
  { id: '1', name: 'Day Shift', startTime: '09:00', endTime: '17:00' },
  { id: '2', name: 'Night Shift', startTime: '22:00', endTime: '06:00' },
];

const initialTasks: Task[] = [
  { id: '1', title: 'Morning briefing', date: new Date(), time: '09:30', shiftId: '1', completed: false, notes: 'Discuss Q3 goals.' },
  { id: '2', title: 'Deploy feature branch', date: new Date(), time: '14:00', shiftId: '1', completed: false, attachment: 'deploy-notes.pdf' },
  { id: '3', title: 'System maintenance check', date: new Date(), time: '23:00', shiftId: '2', completed: false },
  { id: '4', title: 'Review weekly report', date: new Date(new Date().setDate(new Date().getDate() - 1)), time: '11:00', shiftId: '1', completed: true },
];

export default function TaskPage() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [shifts, setShifts] = useState<Shift[]>(initialShifts);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [shiftFilter, setShiftFilter] = useState("all");

  const handleAddTask = (newTaskData: Omit<Task, 'id' | 'completed'>) => {
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

  const handleAddShift = (newShiftData: Omit<Shift, 'id'>) => {
    const newShift: Shift = { ...newShiftData, id: Date.now().toString() };
    setShifts(prev => [...prev, newShift]);
  }

  const handleEditShift = (updatedShift: Shift) => {
    setShifts(prev => prev.map(s => s.id === updatedShift.id ? updatedShift : s));
  };

  const handleDeleteShift = (id: string) => {
    setShifts(prev => prev.filter(s => s.id !== id));
    // Also remove shift from tasks that use it
    setTasks(t => t.map(task => task.shiftId === id ? {...task, shiftId: ''} : task))
  }

  const filteredTasks = useMemo(() => {
    return tasks
      .filter(task => {
        const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesShift = shiftFilter === 'all' || task.shiftId === shiftFilter;
        return matchesSearch && matchesShift;
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [tasks, searchTerm, shiftFilter]);

  const upcomingTasks = filteredTasks.filter(task => !task.completed);
  const completedTasks = filteredTasks.filter(task => task.completed);

  return (
    <div className="min-h-screen w-full bg-background">
      <Header 
        onOpenTaskDialog={() => setIsTaskFormOpen(true)}
        shifts={shifts}
        onAddShift={handleAddShift}
        onEditShift={handleEditShift}
        onDeleteShift={handleDeleteShift}
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
                <Select value={shiftFilter} onValueChange={setShiftFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by shift" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Shifts</SelectItem>
                        {shifts.map(shift => (
                            <SelectItem key={shift.id} value={shift.id}>{shift.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>

        <Tabs defaultValue="upcoming">
          <TabsList>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
          <TabsContent value="upcoming" className="pt-6">
            <TaskList 
              tasks={upcomingTasks} 
              shifts={shifts}
              onToggleComplete={handleToggleComplete} 
              onDelete={handleDeleteTask} 
            />
          </TabsContent>
          <TabsContent value="completed" className="pt-6">
            <TaskList 
              tasks={completedTasks} 
              shifts={shifts}
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
        shifts={shifts}
      />
    </div>
  );
}
