"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ProjectHeader } from "@/components/gallery/ProjectHeader";
import { ProjectFilters } from "@/components/gallery/ProjectFilters";
import { ProjectGalleryGrid } from "@/components/gallery/ProjectGalleryGrid";
import { ProjectCardProps } from "@/components/gallery/ProjectCard";
import { api } from "@/lib/api";

export interface ProjectTrackFilter {
  trackId: number;
  trackName: string;
}

export default function ProjectsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<number | "all">("all");

  interface BackendProjectSummary {
    projectId: number;
    title: string;
    thumbnailImageUrl: string;
    trackNames: string[];
    techStacks: string[];
    memberCount: number;
    viewCount: number;
    reactionCount: number;
    reactedByMe: boolean;
    createdAt: string;
  }

  const { data: projectsResponse, isLoading } = useQuery({
    queryKey: ["projects", activeFilter, searchQuery],
    queryFn: () =>
      api.get<{
        content: BackendProjectSummary[];
        totalElements: number;
        totalPages: number;
      }>("/projects", {
        trackId: activeFilter !== "all" ? activeFilter : undefined,
        keyword: searchQuery || undefined,
        page: 0,
        size: 50,
        sort: "createdAt,desc",
      }),
  });

  const projects = (projectsResponse?.content ?? []).map((p) => ({
    projectId: p.projectId,
    title: p.title,
    thumbnailImageUrl: p.thumbnailImageUrl,
    trackNames: p.trackNames,
    techStacks: p.techStacks,
    memberCount: p.memberCount,
    likeCount: p.reactionCount,
    likedByMe: p.reactedByMe,
  }));

  const { data: tracksResponse } = useQuery({
    queryKey: ["project-track-filters"],
    queryFn: () =>
      api.get<{ tracks: ProjectTrackFilter[] }>("/projects/tracks"),
  });

  const tracks = tracksResponse?.tracks ?? [];

  const filteredProjects = useMemo(() => {
    return projects;
  }, [projects]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <ProjectHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      <ProjectFilters
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        tracks={tracks}
      />
      <ProjectGalleryGrid projects={filteredProjects} isLoading={isLoading} />
    </div>
  );
}
