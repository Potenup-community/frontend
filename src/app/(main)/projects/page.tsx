"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ProjectHeader } from "@/components/gallery/ProjectHeader";
import { ProjectGalleryGrid } from "@/components/gallery/ProjectGalleryGrid";
import { api, adminApi, TRACK_TYPE_FALLBACK_OPTIONS, TrackType } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ProjectsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTrackType, setSelectedTrackType] = useState<TrackType | "ALL">("ALL");
  const [selectedCardinal, setSelectedCardinal] = useState<number>(0);

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
    queryKey: ["projects", selectedTrackType, selectedCardinal],
    queryFn: () =>
      api.get<{
        content: BackendProjectSummary[];
        totalElements: number;
        totalPages: number;
      }>("/projects", {
        trackType: selectedTrackType !== "ALL" ? selectedTrackType : undefined,
        cardinal:
          selectedTrackType !== "ALL" && selectedCardinal > 0 ? selectedCardinal : undefined,
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

  const { data: tracks } = useQuery({
    queryKey: ["tracks"],
    queryFn: async () => {
      const res = await adminApi.getTracks();
      return res.content || [];
    },
  });

  const { data: trackTypes } = useQuery({
    queryKey: ["track-types"],
    queryFn: async () => {
      const res = await adminApi.getTrackTypes();
      return res.trackTypes ?? [];
    },
  });

  const { data: trackCardinals } = useQuery({
    queryKey: ["track-cardinals", selectedTrackType],
    queryFn: async () => {
      if (selectedTrackType === "ALL") return [];
      const res = await adminApi.getTrackCardinalsByType(selectedTrackType);
      return res.cardinals ?? [];
    },
    enabled: selectedTrackType !== "ALL",
  });

  const trackTypeLabelMap = useMemo(() => {
    const options = trackTypes?.length ? trackTypes : TRACK_TYPE_FALLBACK_OPTIONS;
    return new Map<TrackType, string>(
      options
        .filter((type) => type.trackType !== "ADMIN")
        .map((type) => [type.trackType, type.label]),
    );
  }, [trackTypes]);

  const trackTypeOptions = useMemo(() => {
    const typeSet = new Set<TrackType>();
    (tracks ?? []).forEach((track) => {
      if (track.trackType) {
        typeSet.add(track.trackType);
      }
    });
    return Array.from(typeSet);
  }, [tracks]);

  const cardinalOptions = useMemo(() => {
    if (selectedTrackType === "ALL") return [];
    return (trackCardinals ?? []).slice().sort((a, b) => a - b);
  }, [trackCardinals, selectedTrackType]);

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
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="flex flex-wrap items-center gap-1 flex-1">
            <button
              onClick={() => {
                setSelectedTrackType("ALL");
                setSelectedCardinal(0);
              }}
              className={cn(
                "px-4 py-2 rounded-lg text-sm transition-all duration-200",
                selectedTrackType === "ALL"
                  ? "text-primary font-bold bg-primary/10"
                  : "text-muted-foreground font-medium hover:text-primary hover:bg-primary/5",
              )}
            >
              전체 과정
            </button>
            {trackTypeOptions.map((trackType) => (
              <button
                key={trackType}
                onClick={() => {
                  setSelectedTrackType(trackType);
                  setSelectedCardinal(0);
                }}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm transition-all duration-200",
                  selectedTrackType === trackType
                    ? "text-primary font-bold bg-primary/10"
                    : "text-muted-foreground font-medium hover:text-primary hover:bg-primary/5",
                )}
              >
                {trackTypeLabelMap.get(trackType) ?? trackType}
              </button>
            ))}
          </div>

          <div className="ml-auto flex-shrink-0">
            <Select
              value={selectedCardinal === 0 ? "ALL" : String(selectedCardinal)}
              onValueChange={(value) => setSelectedCardinal(value === "ALL" ? 0 : Number(value))}
              disabled={selectedTrackType === "ALL"}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="기수" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">전체 기수</SelectItem>
                {cardinalOptions.map((cardinal) => (
                  <SelectItem key={cardinal} value={String(cardinal)}>
                    {cardinal}기
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      <ProjectGalleryGrid projects={filteredProjects} isLoading={isLoading} />
    </div>
  );
}
