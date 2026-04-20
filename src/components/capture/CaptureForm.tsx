"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ColorPicker } from "@/components/projects/ColorPicker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Block } from "@/components/ui/block";
import {
  Mic,
  MicOff,
  Link as LinkIcon,
  Loader2,
  Zap,
  Plus,
  Target,
  FolderPlus,
} from "lucide-react";
import { useSpeechToText } from "@/hooks/useSpeechToText";
import { PRIORITIES, PROJECT_COLORS } from "@/lib/constants";
import { toast } from "sonner";
import type { Project } from "@/lib/db/schema";

interface CaptureFormProps {
  projects: Project[];
}

export function CaptureForm({ projects: initialProjects }: CaptureFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [projectId, setProjectId] = useState<string | undefined>(undefined);
  const [priority, setPriority] = useState<string | undefined>(undefined);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [scheduleForFocus, setScheduleForFocus] = useState(false);

  // Inline project creation state
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectColor, setNewProjectColor] = useState<string>(PROJECT_COLORS[0].value);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [projects, setProjects] = useState(initialProjects);

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

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      toast.error("Project name is required");
      return;
    }

    setIsCreatingProject(true);
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newProjectName.trim(),
          color: newProjectColor,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create project");
      }

      const { data: newProject } = await response.json();

      // Add to local list and select it
      setProjects([...projects, newProject]);
      setProjectId(newProject.id);

      // Reset form
      setShowNewProject(false);
      setNewProjectName("");
      setNewProjectColor(PROJECT_COLORS[0].value);

      toast.success("Project created!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create project");
    } finally {
      setIsCreatingProject(false);
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
          projectId: projectId === "none" ? null : projectId || null,
          priority: priority || null,
          captureMethod: transcript ? "voice" : linkUrl ? "link" : "text",
          voiceTranscript: transcript || null,
          scheduledForToday: scheduleForFocus ? new Date().toISOString() : null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to capture task");
      }

      toast.success(scheduleForFocus ? "Task captured and added to Focus!" : "Task captured!");

      // Reset form
      setTitle("");
      setDescription("");
      setLinkUrl("");
      setProjectId(undefined);
      setPriority(undefined);
      setShowLinkInput(false);
      setScheduleForFocus(false);
      reset();

      // Navigate based on choice
      if (scheduleForFocus) {
        router.push("/focus");
      } else {
        router.push("/");
      }
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
          {/* Title input - prominent and bold */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              What&apos;s your task? *
            </label>
            <Input
              placeholder="Quick thought or task..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              className="text-lg font-bold"
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
              rows={3}
              className={isListening ? "border-red-500 animate-pulse" : ""}
            />
          </div>

          {/* Link input (toggle) */}
          {showLinkInput ? (
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Link</label>
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

          {/* Project selector with inline create */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Project (optional)
              </label>
              {!showNewProject && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowNewProject(true)}
                  className="gap-1 h-7 text-xs"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  New
                </Button>
              )}
            </div>

            {showNewProject ? (
              <div className="p-3 border rounded-lg bg-slate-50 dark:bg-slate-900 space-y-3">
                <Input
                  placeholder="Project name"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  autoFocus
                  className="font-medium"
                />
                <ColorPicker value={newProjectColor} onChange={setNewProjectColor} />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleCreateProject}
                    disabled={isCreatingProject || !newProjectName.trim()}
                    className="flex-1"
                  >
                    {isCreatingProject ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-1" />
                        Create
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setShowNewProject(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
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
            )}
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
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                      {p.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Schedule for Focus toggle */}
          <div
            className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
              scheduleForFocus
                ? "border-orange-500 bg-orange-50 dark:bg-orange-950"
                : "border-slate-200 dark:border-slate-700 hover:border-orange-300"
            }`}
            onClick={() => setScheduleForFocus(!scheduleForFocus)}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${
                  scheduleForFocus
                    ? "bg-orange-500 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                }`}
              >
                <Target className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p
                  className={`font-semibold ${scheduleForFocus ? "text-orange-700 dark:text-orange-300" : "text-slate-700 dark:text-slate-300"}`}
                >
                  Add to Focus
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Start working on this immediately
                </p>
              </div>
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  scheduleForFocus
                    ? "border-orange-500 bg-orange-500"
                    : "border-slate-300 dark:border-slate-600"
                }`}
              >
                {scheduleForFocus && (
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
            </div>
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
              className={`h-14 ${scheduleForFocus ? "bg-orange-500 hover:bg-orange-600" : ""}`}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : scheduleForFocus ? (
                <>
                  <Target className="w-5 h-5 mr-2" />
                  Save & Focus
                </>
              ) : (
                "Save Idea"
              )}
            </Button>
          </div>
        </Block>
      </form>
    </>
  );
}
