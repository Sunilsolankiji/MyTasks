"use client"

import { Plus, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import { SettingsDialog } from "./settings-dialog";
import type { Shift } from "@/lib/types";

interface HeaderProps {
  onOpenTaskDialog: () => void;
  shift: Shift;
  onUpdateShift: (shift: Omit<Shift, 'id'>) => void;
}

export function Header({ onOpenTaskDialog, shift, onUpdateShift }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <a className="mr-6 flex items-center space-x-2" href="/">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className="h-6 w-6"><rect width="256" height="256" fill="none"></rect><path d="M128,24a104,104,0,1,0,104,104A104.2,104.2,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm48-88a48,48,0,0,1-96,0Z" fill="currentColor"></path></svg>
            <span className="hidden font-bold sm:inline-block">MyTasks</span>
          </a>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <Button onClick={onOpenTaskDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Add Task
          </Button>
          <SettingsDialog 
            shift={shift} 
            onUpdateShift={onUpdateShift}
          >
            <Button variant="ghost" size="icon" aria-label="Settings">
              <Settings className="h-5 w-5" />
            </Button>
          </SettingsDialog>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
