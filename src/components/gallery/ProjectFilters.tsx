"use client";

import { cn } from "@/lib/utils";
import { AdminTrack } from "@/lib/api";

interface ProjectFiltersProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  tracks: AdminTrack[];
}

export function ProjectFilters({
  activeFilter,
  onFilterChange,
  tracks,
}: ProjectFiltersProps) {
  return (
    <div className="mb-6 flex flex-wrap items-center gap-3">
      {/* 전체 필터 */}
      <button
        onClick={() => onFilterChange("all")}
        className={cn(
          "rounded-md px-4 py-2 text-sm font-medium transition-colors",
          activeFilter === "all"
            ? "bg-gray-900 text-white"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200",
        )}
      >
        전체
      </button>

      {/* 트랙 필터들 */}
      {tracks.map((track) => (
        <button
          key={track.trackId}
          onClick={() => onFilterChange(track.trackId.toString())}
          className={cn(
            "rounded-md px-4 py-2 text-sm font-medium transition-colors",
            activeFilter === track.trackId.toString()
              ? "bg-gray-900 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200",
          )}
        >
          {track.trackName}
        </button>
      ))}

      {activeFilter !== "all" && (
        <button
          onClick={() => onFilterChange("all")}
          className="text-sm text-gray-500 hover:text-gray-700 underline"
        >
          초기화
        </button>
      )}
    </div>
  );
}
