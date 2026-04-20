"use client";

import { useState, useRef } from "react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { Trash2, CheckCircle2, Target } from "lucide-react";
import { cn } from "@/lib/utils";

interface SwipeableCardProps {
  children: React.ReactNode;
  onDelete?: () => Promise<void>;
  onComplete?: () => Promise<void>;
  onAddToFocus?: () => Promise<void>;
  ideaTitle: string;
  isCompleted?: boolean;
  isInFocus?: boolean;
}

export function SwipeableCard({
  children,
  onDelete,
  onComplete,
  onAddToFocus,
  ideaTitle,
  isCompleted = false,
  isInFocus = false,
}: SwipeableCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const constraintsRef = useRef(null);

  const x = useMotionValue(0);

  // Left swipe (delete) transforms
  const deleteOpacity = useTransform(x, [-100, -50, 0], [1, 0.5, 0]);
  const deleteScale = useTransform(x, [-100, -50, 0], [1, 0.8, 0.5]);

  // Right swipe (complete/focus) transforms
  const completeOpacity = useTransform(x, [0, 50, 100], [0, 0.5, 1]);
  const completeScale = useTransform(x, [0, 50, 100], [0.5, 0.8, 1]);

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    // Swipe left → delete
    if (info.offset.x < -80 && onDelete) {
      setShowDeleteConfirm(true);
    }
    // Swipe right → complete or add to focus
    if (info.offset.x > 80) {
      if (!isCompleted && onComplete) {
        setShowCompleteConfirm(true);
      } else if (!isInFocus && onAddToFocus) {
        handleAddToFocus();
      }
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete();
    } catch {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleComplete = async () => {
    if (!onComplete) return;
    setIsCompleting(true);
    try {
      await onComplete();
    } catch {
      setIsCompleting(false);
      setShowCompleteConfirm(false);
    }
  };

  const handleAddToFocus = async () => {
    if (!onAddToFocus) return;
    setIsCompleting(true);
    try {
      await onAddToFocus();
    } catch {
      setIsCompleting(false);
    }
  };

  // Delete confirmation
  if (showDeleteConfirm) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, height: 0 }}
        className="relative overflow-hidden rounded-lg border-2 border-error/30 bg-error-light"
      >
        <div className="p-4">
          <p className="text-sm font-medium text-error mb-1">Delete this task?</p>
          <p className="text-xs text-error/70 mb-3 truncate">&quot;{ideaTitle}&quot;</p>
          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex-1 px-3 py-2 text-sm font-medium text-white bg-error hover:bg-error/90 rounded-md disabled:opacity-50 transition-colors"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isDeleting}
              className="flex-1 px-3 py-2 text-sm font-medium text-text-primary bg-background-secondary hover:bg-border rounded-md disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // Complete confirmation
  if (showCompleteConfirm) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, height: 0 }}
        className="relative overflow-hidden rounded-lg border-2 border-success/30 bg-success-light"
      >
        <div className="p-4">
          <p className="text-sm font-medium text-success mb-1">Mark as complete?</p>
          <p className="text-xs text-success/70 mb-3 truncate">&quot;{ideaTitle}&quot;</p>
          <div className="flex gap-2">
            <button
              onClick={handleComplete}
              disabled={isCompleting}
              className="flex-1 px-3 py-2 text-sm font-medium text-white bg-success hover:bg-success/90 rounded-md disabled:opacity-50 transition-colors"
            >
              {isCompleting ? "Completing..." : "Complete"}
            </button>
            <button
              onClick={() => setShowCompleteConfirm(false)}
              disabled={isCompleting}
              className="flex-1 px-3 py-2 text-sm font-medium text-text-primary bg-background-secondary hover:bg-border rounded-md disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // Determine what action is available on right swipe
  const hasRightAction = (!isCompleted && onComplete) || (!isInFocus && onAddToFocus);
  const rightActionColor = !isCompleted && onComplete ? "bg-success" : "bg-warning";
  const RightIcon = !isCompleted && onComplete ? CheckCircle2 : Target;

  return (
    <div ref={constraintsRef} className="relative overflow-hidden rounded-lg">
      {/* Delete background (left side, revealed on swipe left) */}
      {onDelete && (
        <motion.div
          style={{ opacity: deleteOpacity, scale: deleteScale }}
          className="absolute right-0 top-0 bottom-0 w-20 flex items-center justify-center bg-error rounded-r-lg"
        >
          <Trash2 className="w-5 h-5 text-white" />
        </motion.div>
      )}

      {/* Complete/Focus background (right side, revealed on swipe right) */}
      {hasRightAction && (
        <motion.div
          style={{ opacity: completeOpacity, scale: completeScale }}
          className={cn(
            "absolute left-0 top-0 bottom-0 w-20 flex items-center justify-center rounded-l-lg",
            rightActionColor
          )}
        >
          <RightIcon className="w-5 h-5 text-white" />
        </motion.div>
      )}

      {/* Swipeable content */}
      <motion.div
        drag="x"
        dragConstraints={{
          left: onDelete ? -100 : 0,
          right: hasRightAction ? 100 : 0,
        }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        style={{ x }}
        whileTap={{ cursor: "grabbing" }}
        className="relative bg-surface rounded-lg"
      >
        {children}
      </motion.div>
    </div>
  );
}
