import React from "react";

export default function EmptyState({ icon: Icon, title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      {Icon && (
        <div className="w-16 h-16 rounded-full bg-secondary/60 flex items-center justify-center mb-4">
          <Icon className="w-7 h-7 text-muted-foreground" />
        </div>
      )}
      <h3 className="font-heading text-lg text-foreground mb-1">{title}</h3>
      {message && <p className="text-sm text-muted-foreground max-w-xs mb-5">{message}</p>}
      {action}
    </div>
  );
}