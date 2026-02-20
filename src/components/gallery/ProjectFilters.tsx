"use client";

import { cn } from "@/lib/utils";
import { ProjectTrackFilter } from "@/app/(main)/projects/page";

interface ProjectFiltersProps {
  activeFilter: number | "all";
  onFilterChange: (filter: number | "all") => void;
  tracks: ProjectTrackFilter[];
}

export function ProjectFilters({
  activeFilter,
  onFilterChange,
  tracks,
}: ProjectFiltersProps) {
  return (
    <div className="mb-6 flex flex-wrap items-center gap-1">
      {/* 전체 필터 */}
      <button
        onClick={() => onFilterChange("all")}
        className={cn(
          "rounded-lg px-4 py-2 text-sm transition-all duration-200",
          activeFilter === "all"
            ? "bg-primary/10 text-primary font-bold"
            : "text-muted-foreground font-medium hover:bg-primary/5 hover:text-primary",
        )}
      >
        전체
      </button>

      {/* 트랙 필터들 */}
      {tracks.map((track) => (
        <button
          key={track.trackId}
          onClick={() => onFilterChange(track.trackId as number)}
          className={cn(
            "rounded-lg px-4 py-2 text-sm transition-all duration-200",
            activeFilter === track.trackId
              ? "bg-primary/10 text-primary font-bold"
              : "text-muted-foreground font-medium hover:bg-primary/5 hover:text-primary",
          )}
        >
          {track.trackName}
        </button>
      ))}

      {activeFilter !== "all" && (
        <button
          onClick={() => onFilterChange("all")}
          className="px-3 py-2 text-sm font-medium text-muted-foreground underline-offset-2 transition-colors hover:text-primary hover:underline"
        >
          초기화
        </button>
      )}
    </div>
  );
}
