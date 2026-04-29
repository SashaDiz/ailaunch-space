"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Trash2, Send, MessageSquare, Star, Pencil, Check, X } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { isEnabled } from "@/lib/features";

interface CommentUser {
  id: string;
  full_name: string;
  avatar_url: string | null;
  role?: string;
}

interface CommentData {
  id: string;
  user_id: string;
  app_id: string;
  content: string | null;
  rating: number | null;
  created_at: string;
  updated_at?: string | null;
  user: CommentUser;
}

interface CommentSectionProps {
  appId: string;
  projectOwnerId: string;
  /** True if the current user has already rated this project (one rating per user) */
  userHasRated?: boolean;
  /** Called after user submits a rating so the parent can refetch project (e.g. update header average) */
  onRatingUpdate?: () => void;
}

function formatRelativeTime(dateInput: string | Date): string {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (Number.isNaN(date.getTime())) return "—";
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (60 * 1000));
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "1 day ago";
  if (diffDays < 30) return `${diffDays} days ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

function UserAvatar({ user, size = 32 }: { user: CommentUser; size?: number }) {
  const initials = (user.full_name || "A").charAt(0).toUpperCase();
  if (user.avatar_url) {
    return (
      <Image
        src={user.avatar_url}
        alt={user.full_name}
        width={size}
        height={size}
        className="rounded-full object-cover"
      />
    );
  }
  return (
    <div
      className="flex items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground"
      style={{ width: size, height: size }}
    >
      {initials}
    </div>
  );
}

function StarsDisplay({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const starClass = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`Rating: ${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(starClass, star <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40")}
          aria-hidden
        />
      ))}
    </span>
  );
}

export function CommentSection({ appId, projectOwnerId, userHasRated = false, onRatingUpdate }: CommentSectionProps) {
  const { user } = useUser();
  const [comments, setComments] = useState<CommentData[]>([]);
  const [total, setTotal] = useState(0);
  const [newComment, setNewComment] = useState("");
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [page, setPage] = useState(1);
  const ratingsEnabled = isEnabled("ratings");

  const fetchComments = async (p: number = 1) => {
    try {
      const url = ratingsEnabled
        ? `/api/comments?app_id=${appId}&page=${p}&limit=20&include_ratings=1`
        : `/api/comments?app_id=${appId}&page=${p}&limit=20`;
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      if (p === 1) {
        setComments(data.data.comments);
      } else {
        setComments((prev) => [...prev, ...data.data.comments]);
      }
      setTotal(data.data.total);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments(1);
  }, [appId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Sign in to leave a rating or comment");
      return;
    }
    const hasComment = newComment.trim().length > 0;
    const canSubmitRating = ratingsEnabled && !userHasRated && selectedRating != null && selectedRating >= 1 && selectedRating <= 5;

    if (!userHasRated && ratingsEnabled && (selectedRating == null || selectedRating < 1 || selectedRating > 5)) {
      toast.error("Please select a rating (1–5 stars)");
      return;
    }
    if (userHasRated && !hasComment) {
      toast.error("Add a comment");
      return;
    }
    if (!canSubmitRating && !hasComment) return;

    setSubmitting(true);
    try {
      if (canSubmitRating) {
        const ratingRes = await fetch("/api/ratings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ app_id: appId, rating: selectedRating }),
        });
        if (!ratingRes.ok) {
          const data = await ratingRes.json();
          throw new Error(data.error || "Failed to submit rating");
        }
        onRatingUpdate?.();
      }

      if (hasComment) {
        const commentRes = await fetch("/api/comments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ app_id: appId, content: newComment.trim() }),
        });
        if (!commentRes.ok) {
          const data = await commentRes.json();
          throw new Error(data.error || "Failed to post comment");
        }
      }

      await fetchComments(1);
      setNewComment("");
      setSelectedRating(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      const res = await fetch(`/api/comments?id=${commentId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete");
      }
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setTotal((prev) => prev - 1);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete comment");
    }
  };

  const canDelete = (comment: CommentData) => {
    if (!user) return false;
    if (String(comment.id).startsWith("rating-")) return false;
    if (comment.user_id === user.id) return true;
    if (projectOwnerId === user.id) return true;
    return false;
  };

  const canEdit = (comment: CommentData) => {
    if (!user) return false;
    if (String(comment.id).startsWith("rating-")) return false;
    if (!comment.content) return false;
    if (comment.user_id !== user.id) return false;
    const ageMs = Date.now() - new Date(comment.created_at).getTime();
    return ageMs <= 24 * 60 * 60 * 1000;
  };

  const handleStartEdit = (comment: CommentData) => {
    setEditingId(comment.id);
    setEditContent(comment.content || "");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditContent("");
  };

  const handleSaveEdit = async (commentId: string) => {
    if (!editContent.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }
    try {
      const res = await fetch(`/api/comments?id=${commentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update");
      }
      const data = await res.json();
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? { ...c, content: data.data.content, updated_at: data.data.updated_at }
            : c
        )
      );
      setEditingId(null);
      setEditContent("");
    } catch (err: any) {
      toast.error(err.message || "Failed to update comment");
    }
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchComments(nextPage);
  };

  return (
    <div className="space-y-4">
      <h3 className="flex items-center gap-2 text-lg font-semibold">
        <MessageSquare className="h-5 w-5" />
        Comments {total > 0 && <span className="text-sm font-normal text-muted-foreground">({total})</span>}
      </h3>

      {/* Rating + comment form */}
      {user ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          {ratingsEnabled && !userHasRated && (
            <div>
              <span className="text-sm font-medium text-foreground">Your rating</span>
              <div className="flex items-center gap-0.5 mt-1" onMouseLeave={() => setHoverRating(null)}>
                {[1, 2, 3, 4, 5].map((star) => {
                  const filled = star <= (hoverRating ?? selectedRating ?? 0);
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setSelectedRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      className="rounded p-0.5 transition-colors hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      aria-label={`${star} star${star === 1 ? "" : "s"}`}
                    >
                      <Star
                        className={cn("h-8 w-8", filled ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40")}
                        aria-hidden
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {userHasRated && (
            <p className="text-sm text-muted-foreground">You have already rated this project. You can add more comments below.</p>
          )}
          <div>
            <label htmlFor="comment-text" className="sr-only">
              {userHasRated ? "Add a comment" : "Comment (optional)"}
            </label>
            <textarea
              id="comment-text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={userHasRated ? "Add a comment..." : (ratingsEnabled ? "Leave a comment (optional)..." : "Leave a comment...")}
              maxLength={2000}
              rows={3}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {newComment.length}/2000
            </span>
            <button
              type="submit"
              disabled={
                submitting ||
                (userHasRated ? !newComment.trim() : ratingsEnabled ? selectedRating == null : !newComment.trim())
              }
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <Send className="h-3.5 w-3.5" />
              {submitting ? "Posting..." : "Post"}
            </button>
          </div>
        </form>
      ) : (
        <p className="rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
          <Link href="/auth/signin" className="font-medium text-primary hover:underline">Sign in</Link> to leave a rating or comment.
        </p>
      )}

      {/* Comments / reviews list */}
      {loading ? (
        <div className="text-sm text-muted-foreground">Loading...</div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">
          {ratingsEnabled ? "Be the first to rate or comment." : "Be the first to comment."}
        </p>
      ) : (
        <ul className="space-y-4 list-none p-0 m-0">
          {comments.map((comment) => (
            <li key={comment.id} className="flex gap-3">
              <div className="flex-shrink-0 pt-0.5">
                <UserAvatar user={comment.user} size={32} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link
                    href={`/user/${comment.user.id}`}
                    className="text-sm font-medium hover:underline truncate"
                  >
                    {comment.user.full_name}
                  </Link>
                  {comment.rating != null && (
                    <StarsDisplay rating={comment.rating} size="sm" />
                  )}
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {formatRelativeTime(comment.created_at)}
                  </span>
                  {comment.updated_at && comment.updated_at !== comment.created_at && (
                    <span className="text-xs text-muted-foreground/60 italic">(edited)</span>
                  )}
                  <div className="ml-auto flex items-center gap-0.5 flex-shrink-0">
                    {canEdit(comment) && editingId !== comment.id && (
                      <button
                        type="button"
                        onClick={() => handleStartEdit(comment)}
                        className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        title="Edit comment"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {canDelete(comment) && (
                      <button
                        type="button"
                        onClick={() => handleDelete(comment.id)}
                        className="rounded p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        title="Delete comment"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                {editingId === comment.id ? (
                  <div className="mt-1 space-y-2">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      maxLength={2000}
                      rows={3}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(comment.id)}
                        className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                      >
                        <Check className="h-3 w-3" />
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
                      >
                        <X className="h-3 w-3" />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : comment.content != null && comment.content !== "" ? (
                  <p className="mt-0.5 text-sm text-foreground/90 whitespace-pre-wrap break-words">
                    {comment.content}
                  </p>
                ) : null}
              </div>
            </li>
          ))}
          {comments.length < total && (
            <li className="list-none">
              <button
                type="button"
                onClick={loadMore}
                className="text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                Load more
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
