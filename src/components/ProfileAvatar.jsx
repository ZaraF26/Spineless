import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import Avatar from "@/components/Avatar";

export default function ProfileAvatar({ size = 34 }) {
  const { user } = useAuth();
  return (
    <Link
      to="/profile"
      aria-label="Profile"
      className="rounded-full ring-2 ring-border hover:ring-primary/50 transition-all overflow-hidden shrink-0 flex"
    >
      <Avatar user={user} size={size} />
    </Link>
  );
}