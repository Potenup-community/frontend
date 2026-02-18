"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ProjectHeader } from "@/components/gallery/ProjectHeader";
import { ProjectFilters } from "@/components/gallery/ProjectFilters";
import { ProjectGalleryGrid } from "@/components/gallery/ProjectGalleryGrid";
import { ProjectCardProps } from "@/components/gallery/ProjectCard";
import { api, AdminTrack } from "@/lib/api";

export default function ProjectsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  // Fetch projects from API
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: () => api.get<ProjectCardProps[]>("/projects"),
  });

  // Fetch tracks from API
  const { data: tracksData } = useQuery({
    queryKey: ["tracks"],
    queryFn: () =>
      api
        .get<{ content: AdminTrack[] }>("/admin/tracks")
        .then((res) => res.content),
  });

  const tracks = tracksData ?? [];

  // 검색 및 필터링
  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      // 검색 필터
      const matchesSearch = project.projectName
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      // 트랙 필터 (trackName 기반)
      const matchesTrack =
        activeFilter === "all" ||
        tracks.find((t) => t.trackId.toString() === activeFilter)?.trackName ===
          project.category;

      return matchesSearch && matchesTrack;
    });
  }, [projects, searchQuery, activeFilter, tracks]);

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
