"use client";

import { ProjectCard, ProjectCardProps } from "./ProjectCard";
import { ProjectCardSkeleton } from "./ProjectCardSkeleton";

interface ProjectGalleryGridProps {
  projects: ProjectCardProps[];
  isLoading?: boolean;
}

export function ProjectGalleryGrid({
  projects,
  isLoading = false,
}: ProjectGalleryGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProjectCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-900">
            프로젝트가 없습니다
          </p>
          <p className="mt-2 text-sm text-gray-600">
            첫 번째 프로젝트를 만들어보세요!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {projects.map((project) => (
        <ProjectCard key={project.id} {...project} />
      ))}
    </div>
  );
}
