"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
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
import { Block } from "@/components/ui/block";
import { Mic, MicOff, Link as LinkIcon, Loader2, Zap } from "lucide-react";
import { useSpeechToText } from "@/hooks/useSpeechToText";
import { PRIORITIES } from "@/lib/constants";
import { toast } from "sonner";
import type { Project } from "@/lib/db/schema";

interface CaptureFormProps {
  projects: Project[];
}

export function CaptureForm({ projects }: CaptureFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [projectId, setProjectId] = useState<string | undefined>(undefined);
  const [priority, setPriority] = useState<string | undefined>(undefined);
  const [showLinkInput, setShowLinkInput] = useState(false);

  const { transcript, isListening, isSupported, start, stop, reset } = useSpeechToText();

  // Update description with transcript
  useEffect(() => {
    if (transcript) {
      setDescription(transcript);
    }
  }, [transcript]);

  const handleVoiceToggle = () => {
    if (isListening) {
      stop();
    } else {
      start();
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          linkUrl: linkUrl.trim() || null,
          projectId: projectId || null,
          priority: priority || null,
          captureMethod: transcript ? "voice" : linkUrl ? "link" : "text",
          voiceTranscript: transcript || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to capture idea");
      }

      toast.success("Idea captured!");
      
      // Reset form
      setTitle("");
      setDescription("");
      setLinkUrl("");
      setProjectId(undefined);
      setPriority(undefined);
      setShowLinkInput(false);
      reset();

      // Navigate to home
      router.push("/");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickCapture = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    await handleSubmit();
  };

  return (
    <>
      <PageHeader title="Capture" showBack />

      <form onSubmit={handleSubmit}>
        <Block className="space-y-4">
          {/* Title input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              What&apos;s your idea? *
            </label>
            <Input
              placeholder="Quick thought, task, or idea..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              className="text-lg"
            />
          </div>

          {/* Description with voice input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Details (optional)
              </label>
              {isSupported && (
                <Button
                  type="button"
                  size="sm"
                  variant={isListening ? "destructive" : "outline"}
                  onClick={handleVoiceToggle}
                  className="gap-2"
                >
                  {isListening ? (
                    <>
                      <MicOff className="w-4 h-4" />
                      Stop
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4" />
                      Voice
                    </>
                  )}
                </Button>
              )}
            </div>
            <Textarea
              placeholder={isListening ? "Listening..." : "Add more details..."}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className={isListening ? "border-red-500 animate-pulse" : ""}
            />
          </div>

          {/* Link input (toggle) */}
          {showLinkInput ? (
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Link
              </label>
              <Input
                type="url"
                placeholder="https://..."
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
              />
            </div>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowLinkInput(true)}
              className="gap-2"
            >
              <LinkIcon className="w-4 h-4" />
              Add link
            </Button>
          )}

          {/* Project selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Project (optional)
            </label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No project (Inbox)</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: project.color }}
                      />
                      {project.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Priority */}
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
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: p.color }}
                      />
                      {p.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Block>

        {/* Action buttons */}
        <Block className="!mt-6">
          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={handleQuickCapture}
              disabled={isLoading || !title.trim()}
              className="h-14"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Zap className="w-5 h-5 mr-2" />
                  Quick Save
                </>
              )}
            </Button>
            <Button
              type="submit"
              size="lg"
              disabled={isLoading || !title.trim()}
              className="h-14"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Idea"}
            </Button>
          </div>
        </Block>
      </form>
    </>
  );
}
