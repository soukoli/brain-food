"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Loader2 } from "lucide-react";
import { PRIORITIES } from "@/lib/constants";
import { toast } from "sonner";
import type { Idea } from "@/lib/db/schema";

interface IdeaSheetProps {
  idea?: Idea;
  projectId?: string;
  trigger: React.ReactNode;
  onSuccess?: () => void;
}

export function IdeaSheet({ idea, projectId, trigger, onSuccess }: IdeaSheetProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [title, setTitle] = useState(idea?.title ?? "");
  const [description, setDescription] = useState(idea?.description ?? "");
  const [linkUrl, setLinkUrl] = useState(idea?.linkUrl ?? "");
  const [priority, setPriority] = useState<string | undefined>(idea?.priority ?? undefined);

  const isEdit = !!idea;
  const isScheduledForToday = !!idea?.scheduledForToday;

  const handleScheduleForToday = async () => {
    if (!idea) return;

    setIsScheduling(true);
    try {
      const response = await fetch(`/api/ideas/${idea.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduledForToday: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to schedule idea");
      }

      toast.success("Scheduled for today!");
      setOpen(false);
      router.refresh();
      onSuccess?.();
    } catch {
      toast.error("Failed to schedule idea");
    } finally {
      setIsScheduling(false);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    setIsLoading(true);

    try {
      const url = isEdit ? `/api/ideas/${idea.id}` : "/api/ideas";
      const method = isEdit ? "PATCH" : "POST";

      const body: Record<string, unknown> = {
        title: title.trim(),
        description: description.trim() || null,
        linkUrl: linkUrl.trim() || null,
        priority: priority || null,
      };

      if (!isEdit && projectId) {
        body.projectId = projectId;
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save idea");
      }

      toast.success(isEdit ? "Idea updated" : "Idea created");
      setOpen(false);
      router.refresh();
      onSuccess?.();

      // Reset form for new ideas
      if (!isEdit) {
        setTitle("");
        setDescription("");
        setLinkUrl("");
        setPriority(undefined);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{isEdit ? "Edit Idea" : "New Idea"}</DrawerTitle>
          <DrawerDescription>
            {isEdit ? "Update your idea" : "Capture a new idea"}
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Title *
            </label>
            <Input
              placeholder="What's your idea?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Description (optional)
            </label>
            <Textarea
              placeholder="Add more details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Link (optional)
            </label>
            <Input
              type="url"
              placeholder="https://..."
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Priority (optional)
            </label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                      {p.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DrawerFooter>
          {isEdit && !isScheduledForToday && (
            <Button
              onClick={handleScheduleForToday}
              disabled={isScheduling}
              variant="secondary"
              className="gap-2"
            >
              {isScheduling ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Calendar className="w-4 h-4" />
              )}
              {isScheduling ? "Scheduling..." : "Schedule for Today"}
            </Button>
          )}
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Saving..." : isEdit ? "Save Changes" : "Create Idea"}
          </Button>
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
