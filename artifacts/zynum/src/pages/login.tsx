import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { useLoginUser, getGetCurrentUserQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const loginMutation = useLoginUser({
    mutation: {
      onSuccess: (data) => {
        localStorage.setItem("zynum_token", data.token);
        queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
        toast({
          title: "Welcome back!",
          description: "You have successfully logged in.",
        });
        setLocation("/");
      },
      onError: (error: any) => {
        toast({
          variant: "destructive",
          title: "Login failed",
          description: error?.response?.data?.message || "Invalid credentials or server error.",
        });
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    loginMutation.mutate({
      data: { email, password }
    });
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 min-h-[calc(100vh-80px)] relative">
      {/* Decorative background elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 blur-[100px] rounded-full pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-card/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl relative z-10"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl mx-auto flex items-center justify-center mb-4 border border-white/10 shadow-inner">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-display font-bold text-white">Welcome Back</h1>
          <p className="text-muted-foreground mt-2">Log in to manage your virtual numbers</p>
        </div>

        {loginMutation.isError && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <p className="text-sm text-destructive-foreground">
              {loginMutation.error?.response?.data?.message || "Invalid email or password."}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-white">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input 
                id="email" 
                type="email" 
                placeholder="you@example.com" 
                className="pl-10 bg-black/20 border-white/10 focus-visible:ring-primary/50 h-12 rounded-xl text-white"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-white">Password</Label>
              <a href="#" className="text-xs text-primary hover:text-primary/80 transition-colors font-medium">Forgot password?</a>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••" 
                className="pl-10 bg-black/20 border-white/10 focus-visible:ring-primary/50 h-12 rounded-xl text-white"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full h-12 rounded-xl text-base font-semibold bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25 mt-4"
            disabled={loginMutation.isPending || !email || !password}
          >
            {loginMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Sign In
                <ArrowRight className="ml-2 w-5 h-5" />
              </>
            )}
          </Button>
        </form>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link href="/register" className="text-white font-semibold hover:text-primary transition-colors underline decoration-white/30 underline-offset-4">
            Create one now
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
