"use client"

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface AuthDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const authSchema = z.object({
  email: z.string().email("Invalid email address."),
  password: z.string().min(6, "Password must be at least 6 characters long."),
});

type AuthFormValues = z.infer<typeof authSchema>;

export function AuthDialog({ isOpen, onClose }: AuthDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("signin");
  const { toast } = useToast();

  const form = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleAuth = async (data: AuthFormValues) => {
    setIsLoading(true);
    try {
      if (activeTab === "signin") {
        await signInWithEmailAndPassword(auth, data.email, data.password);
        toast({ title: "Success", description: "You've successfully signed in." });
      } else {
        await createUserWithEmailAndPassword(auth, data.email, data.password);
        toast({ title: "Success", description: "Your account has been created." });
      }
      onClose();
    } catch (error: any) {
      console.error(error);
      let description = "An unexpected error occurred.";
      if (error.code === 'auth/operation-not-allowed') {
        description = "Email/Password sign-in is not enabled. Please go to your Firebase project console and enable it in Authentication > Sign-in method.";
      } else {
        const errorMessage = error.code?.replace('auth/', '').replace(/-/g, ' ') || "An unexpected error occurred.";
        description = `Error: ${errorMessage.charAt(0).toUpperCase() + errorMessage.slice(1)}.`;
      }
      toast({
        title: "Authentication Failed",
        description: description,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      form.reset();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sync Your Tasks</DialogTitle>
          <DialogDescription>
            Sign in or create an account to save your tasks to the cloud.
          </DialogDescription>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Create Account</TabsTrigger>
          </TabsList>
          <TabsContent value="signin">
            <AuthForm form={form} onSubmit={handleAuth} isLoading={isLoading} buttonText="Sign In" />
          </TabsContent>
          <TabsContent value="signup">
            <AuthForm form={form} onSubmit={handleAuth} isLoading={isLoading} buttonText="Create Account" />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

interface AuthFormProps {
  form: any;
  onSubmit: (data: AuthFormValues) => void;
  isLoading: boolean;
  buttonText: string;
}

function AuthForm({ form, onSubmit, isLoading, buttonText }: AuthFormProps) {
    return (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="name@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {buttonText}
            </Button>
          </form>
        </Form>
    )
}
