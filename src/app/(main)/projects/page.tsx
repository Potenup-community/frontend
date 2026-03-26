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

const normalizeTrackFilters = (raw: unknown): ProjectTrackFilter[] => {
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as { tracks?: unknown[] })?.tracks)
      ? (raw as { tracks: unknown[] }).tracks
      : Array.isArray((raw as { content?: unknown[] })?.content)
        ? (raw as { content: unknown[] }).content
        : [];

  return list
    .map((item) => {
      const track = item as {
        trackId?: number;
        id?: number;
        trackName?: string;
        name?: string;
      };

      const trackId = track.trackId ?? track.id;
      const trackName = track.trackName ?? track.name;

      if (typeof trackId !== "number" || !trackName) {
        return null;
      }

      return { trackId, trackName };
    })
    .filter((track): track is ProjectTrackFilter => track !== null);
};

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
    queryKey: ["projects", activeFilter],
    queryFn: () =>
      api.get<{
        content: BackendProjectSummary[];
        totalElements: number;
        totalPages: number;
      }>("/projects", {
        trackId: activeFilter !== "all" ? activeFilter : undefined,
        page: 0,
        size: 50,
        sort: "createdAt,desc",
      }),
    staleTime: 0,
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

  const {
    data: tracks,
    isError: isTracksError,
    error: tracksError,
  } = useQuery({
    queryKey: ["project-track-filters"],
    queryFn: async () => {
      const response = await api.get<unknown>("/projects/tracks");
      return normalizeTrackFilters(response);
    },
    staleTime: 60 * 1000,
  });

  if (isTracksError) {
    throw tracksError ?? new Error("트랙 목록 조회에 실패했습니다.");
  }

  const filteredProjects = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) {
      return projects;
    }

    return projects.filter((project) => {
      const inTitle = project.title.toLowerCase().includes(normalizedQuery);
      const inTracks = (project.trackNames ?? []).some((track) =>
        track.toLowerCase().includes(normalizedQuery),
      );
      const inTechStacks = (project.techStacks ?? []).some((tech) =>
        tech.toLowerCase().includes(normalizedQuery),
      );

      return inTitle || inTracks || inTechStacks;
    });
  }, [projects, searchQuery]);

  return (
    <div className="mx-auto max-w-7xl px-2 py-6 pb-24 sm:px-6 sm:py-12 sm:pb-12 lg:px-8">
      <ProjectHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      <ProjectFilters
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        tracks={tracks ?? []}
      />
      <ProjectGalleryGrid projects={filteredProjects} isLoading={isLoading} />
    </div>
  );
}
