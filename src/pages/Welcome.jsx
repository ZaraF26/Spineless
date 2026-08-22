import React from "react";
import { Link, Navigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import { useAuth } from "@/lib/AuthContext";

export default function Welcome() {
  const { isAuthenticated, user } = useAuth();
  if (isAuthenticated && user) {
    return <Navigate to={user.onboarded === false ? "/onboarding" : "/home"} replace />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero */}
      <div className="relative flex-1 flex flex-col items-center justify-center px-6 text-center overflow-hidden">
        <div className="absolute inset-0 opacity-60 pointer-events-none"
          style={{ background: "radial-gradient(circle at 50% 30%, hsl(35 50% 88%), transparent 70%)" }} />
        <div className="relative z-10">
          <Logo size="lg" className="mx-auto mb-6" />
          <p className="text-muted-foreground text-lg max-w-xs mx-auto leading-relaxed">
            A cosy corner to read together. Find a book, invite a friend, and talk chapter by chapter.
          </p>
          <div className="flex items-center justify-center gap-1.5 mt-5 text-accent-foreground/70 text-sm">
            <Sparkles className="w-4 h-4" />
            <span>Read along · Discuss · Belong</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-6 pb-12 space-y-3 max-w-sm w-full mx-auto">
        <Link to="/register" className="block">
          <Button className="w-full h-13 py-3.5 text-base font-medium" size="lg">
            Sign up
          </Button>
        </Link>
        <Link to="/login" className="block">
          <Button variant="outline" className="w-full h-13 py-3.5 text-base font-medium" size="lg">
            Log in
          </Button>
        </Link>
        <p className="text-center text-xs text-muted-foreground pt-2">
          By continuing you agree to keep Spineless cosy and kind.
        </p>
      </div>
    </div>
  );
}