"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { ProjectTrackFilter } from "@/app/(main)/projects/page";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Filter } from "lucide-react";

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
  const [isOpen, setIsOpen] = useState(false);

  const activeFilterName = useMemo(() => {
    if (activeFilter === "all") {
      return "전체";
    }

    return (
      tracks.find((track) => track.trackId === activeFilter)?.trackName ??
      "전체"
    );
  }, [activeFilter, tracks]);

  const handleFilterChange = (filter: number | "all") => {
    onFilterChange(filter);
    setIsOpen(false);
  };

  return (
    <>
      <div className="mb-6 flex items-center justify-between md:hidden">
        <div className="text-sm text-gray-600">
          현재 필터:{" "}
          <span className="font-semibold text-gray-900">
            {activeFilterName}
          </span>
        </div>

        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-primary/30 text-primary hover:bg-primary/5"
            >
              <Filter className="h-4 w-4" />
              필터 열기
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-2xl px-4 pb-8 pt-6">
            <SheetHeader className="mb-4 text-left">
              <SheetTitle>트랙 필터</SheetTitle>
              <SheetDescription>
                원하는 트랙을 선택해서 프로젝트를 확인하세요.
              </SheetDescription>
            </SheetHeader>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleFilterChange("all")}
                className={cn(
                  "rounded-md px-4 py-2.5 text-sm font-medium transition-colors",
                  activeFilter === "all"
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground hover:bg-primary/5 hover:text-primary",
                )}
              >
                전체
              </button>

              {tracks.map((track) => (
                <button
                  key={track.trackId}
                  onClick={() => handleFilterChange(track.trackId as number)}
                  className={cn(
                    "rounded-md px-4 py-2.5 text-sm font-medium transition-colors",
                    activeFilter === track.trackId
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground hover:bg-primary/5 hover:text-primary",
                  )}
                >
                  {track.trackName}
                </button>
              ))}
            </div>
            {tracks.length === 0 && (
              <p className="mt-3 text-xs text-muted-foreground">
                트랙 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
              </p>
            )}
          </SheetContent>
        </Sheet>
      </div>

      <div className="mb-6 hidden flex-wrap items-center gap-3 md:flex">
        <button
          onClick={() => onFilterChange("all")}
          className={cn(
            "rounded-md px-4 py-2 text-sm font-medium transition-colors",
            activeFilter === "all"
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground hover:bg-primary/5 hover:text-primary",
          )}
        >
          전체
        </button>

        {tracks.map((track) => (
          <button
            key={track.trackId}
            onClick={() => onFilterChange(track.trackId as number)}
            className={cn(
              "rounded-md px-4 py-2 text-sm font-medium transition-colors",
              activeFilter === track.trackId
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground hover:bg-primary/5 hover:text-primary",
            )}
          >
            {track.trackName}
          </button>
        ))}

        {activeFilter !== "all" && (
          <button
            onClick={() => onFilterChange("all")}
            className="text-sm text-muted-foreground underline hover:text-primary"
          >
            초기화
          </button>
        )}

        {tracks.length === 0 && (
          <span className="text-sm text-muted-foreground">
            트랙 목록을 불러오지 못했습니다.
          </span>
        )}
      </div>
    </>
  );
}
