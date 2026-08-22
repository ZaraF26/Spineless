import React from "react";
import { Link } from "react-router-dom";
import BookCover from "@/components/BookCover";
import Avatar from "@/components/Avatar";
import StarRating from "@/components/StarRating";
import { timeAgo } from "@/lib/readi";

export default function ReviewCard({ review }) {
  return (
    <div className="rounded-2xl bg-card border border-border p-4 shadow-sm">
      <div className="flex gap-3">
        <BookCover book={review} className="w-14 h-20 rounded-md shrink-0" />
        <div className="flex-1 min-w-0">
          <h3 className="font-heading text-sm font-semibold leading-tight line-clamp-2">{review.book_title}</h3>
          <p className="text-xs text-muted-foreground line-clamp-1">{review.book_author}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <StarRating value={review.rating || 0} readOnly size={13} />
            <span className="text-xs text-muted-foreground">{timeAgo(review.created_date)}</span>
          </div>
        </div>
      </div>
      {review.text && (
        <p className="text-sm text-foreground/80 mt-3 line-clamp-3 leading-relaxed">{review.text}</p>
      )}
      {review.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {review.tags.map((t) => (
            <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">{t}</span>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
        <Avatar user={{ profile_picture: review.reviewer_avatar, display_name: review.reviewer_name, username: review.reviewer_username }} size={20} />
        <span className="text-xs text-muted-foreground">{review.reviewer_name}</span>
      </div>
    </div>
  );
}