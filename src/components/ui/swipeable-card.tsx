"use client";

import { useState, useRef } from "react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { Trash2 } from "lucide-react";

interface SwipeableCardProps {
  children: React.ReactNode;
  onDelete: () => Promise<void>;
  ideaTitle: string;
}

export function SwipeableCard({ children, onDelete, ideaTitle }: SwipeableCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const constraintsRef = useRef(null);
  
  const x = useMotionValue(0);
  const deleteOpacity = useTransform(x, [-100, -50, 0], [1, 0.5, 0]);
  const deleteScale = useTransform(x, [-100, -50, 0], [1, 0.8, 0.5]);
  
  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    // If swiped left more than 80px, show delete confirmation
    if (info.offset.x < -80) {
      setShowConfirm(true);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete();
    } catch {
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  const handleCancel = () => {
    setShowConfirm(false);
  };

  if (showConfirm) {
    return (
      <motion.div
        initial={{ opacity: 0, height: "auto" }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, height: 0 }}
        className="relative overflow-hidden rounded-lg border-2 border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950"
      >
        <div className="p-4">
          <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
            Delete this idea?
          </p>
          <p className="text-xs text-red-600 dark:text-red-400 mb-3 truncate">
            &quot;{ideaTitle}&quot;
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex-1 px-3 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md disabled:opacity-50 transition-colors"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
            <button
              onClick={handleCancel}
              disabled={isDeleting}
              className="flex-1 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-md disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div ref={constraintsRef} className="relative overflow-hidden rounded-lg">
      {/* Delete background */}
      <motion.div
        style={{ opacity: deleteOpacity, scale: deleteScale }}
        className="absolute right-0 top-0 bottom-0 w-20 flex items-center justify-center bg-red-500 rounded-r-lg"
      >
        <Trash2 className="w-5 h-5 text-white" />
      </motion.div>
      
      {/* Swipeable content */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -100, right: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        style={{ x }}
        whileTap={{ cursor: "grabbing" }}
        className="relative bg-white dark:bg-slate-950 rounded-lg"
      >
        {children}
      </motion.div>
    </div>
  );
}
