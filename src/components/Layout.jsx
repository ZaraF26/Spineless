import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, Compass, BookOpen, User, Plus, Bell, Library as LibraryIcon } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);

  const nav = [
    { to: "/home", icon: Home, label: "Home" },
    { to: "/discover", icon: Compass, label: "Discover" },
    { to: "/library", icon: LibraryIcon, label: "Library" },
    { to: "/create-session", icon: Plus, label: "Start", center: true },
    { to: "/my-reads", icon: BookOpen, label: "My Reads" },
    { to: "/profile", icon: User, label: "Profile" },
  ];

  const isActive = (to) => location.pathname === to || (to !== "/home" && location.pathname.startsWith(to));

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto relative">
      <main className="pb-24 min-h-screen">{children}</main>

      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-card/90 backdrop-blur-md border-t border-border safe-bottom z-40">
        <div className="flex items-end justify-around px-2 h-16">
          {nav.map((item) => {
            const Icon = item.icon;
            if (item.center) {
              return (
                <Link key={item.to} to={item.to} className="flex flex-col items-center -mt-6">
                  <span className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/30 ring-4 ring-card">
                    <Icon className="w-6 h-6" />
                  </span>
                  <span className="text-[10px] mt-0.5 text-primary font-medium">{item.label}</span>
                </Link>
              );
            }
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 transition-colors ${
                  isActive(item.to) ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px]">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}