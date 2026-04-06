"use client";

import { Block } from "@/components/ui/block";
import { IdeaCard } from "./IdeaCard";
import type { IdeaWithProject } from "@/types";

interface IdeaListProps {
  ideas: IdeaWithProject[];
  showProject?: boolean;
}

export function IdeaList({ ideas, showProject = true }: IdeaListProps) {
  return (
    <Block className="space-y-3">
      {ideas.map((idea) => (
        <IdeaCard key={idea.id} idea={idea} showProject={showProject} />
      ))}
    </Block>
  );
}
