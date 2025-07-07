"use client"

import Link from "next/link";
import { Plus, Settings, RefreshCw, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import { cn } from "@/lib/utils";
import type { User } from "firebase/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface HeaderProps {
  projectName: string;
  onOpenTaskDialog: () => void;
  onOpenSettingsDialog: () => void;
  onSync: () => void;
  isSyncing: boolean;
  isSticky?: boolean;
  user: User | null;
  onSignOut: () => void;
}

export function Header({ projectName, onOpenTaskDialog, onOpenSettingsDialog, onSync, isSyncing, isSticky, user, onSignOut }: HeaderProps) {
  return (
    <header className={cn(
      "flex items-center justify-center w-full bg-background h-20 px-4 border-b",
      isSticky && "sticky top-0 z-20 bg-background/95 backdrop-blur-md"
    )}>
      <div className="container flex gap-6 justify-between items-center">
        <Link className="flex items-center space-x-2" href="/">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className="h-6 w-6"><rect width="256" height="256" fill="none"></rect><path d="M128,24a104,104,0,1,0,104,104A104.2,104.2,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm48-88a48,48,0,0,1-96,0Z" fill="currentColor"></path></svg>
          <span className="font-bold sm:inline-block">{projectName}</span>
        </Link>
        <div className="flex items-center space-x-2">
          <Button onClick={onOpenTaskDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Add Task
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email || 'User'} />
                    <AvatarFallback>{user.displayName?.[0].toUpperCase() || user.email?.[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.displayName}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="ghost" size="icon" onClick={onSync} disabled={isSyncing} title="Sync Tasks">
              <RefreshCw className={cn("h-5 w-5", isSyncing && "animate-spin")} />
              <span className="sr-only">Sync Tasks</span>
            </Button>
          )}

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
