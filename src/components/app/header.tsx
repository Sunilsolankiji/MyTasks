"use client"

import { Plus, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";

interface HeaderProps {
  projectName: string;
  onOpenTaskDialog: () => void;
  onOpenSettingsDialog: () => void;
}

export function Header({ projectName, onOpenTaskDialog, onOpenSettingsDialog }: HeaderProps) {
  return (
    <header className="sticky flex items-center justify-center top-0 z-20 w-full border-b border-gray-200 backdrop-blur-md bg-white/30 h-20 px-4 dark:border-gray-700 dark:bg-gray-800/30">
      <div className="container flex gap-6 justify-between items-center">
        <a className="flex items-center space-x-2" href="/">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className="h-6 w-6"><rect width="256" height="256" fill="none"></rect><path d="M128,24a104,104,0,1,0,104,104A104.2,104.2,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm48-88a48,48,0,0,1-96,0Z" fill="currentColor"></path></svg>
          <span className="font-bold sm:inline-block">{projectName}</span>
        </a>
        <div className="flex items-center space-x-2">
          <Button onClick={onOpenTaskDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Add Task
          </Button>

          <Button variant="ghost" size="icon" onClick={onOpenSettingsDialog}>
            <Settings className="h-5 w-5" />
            <span className="sr-only">Settings</span>
          </Button>

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
