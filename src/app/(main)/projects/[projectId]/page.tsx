"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ProjectDetailView } from "@/components/gallery/ProjectDetailView";
import { ProjectDetailSkeleton } from "@/components/gallery/ProjectDetailSkeleton";
import { api } from "@/lib/api";

interface ProjectDetailProps {
  params: Promise<{ projectId: string }>;
}

interface ProjectDetail {
  id: string;
  projectName: string;
  tracks: string[];
  description: string;
  fullDescription?: string;
  thumbnailUrl: string;
  techStack: string[];
  launchDate?: string;
  links?: {
    website?: string;
    github?: string;
  };
  members: Array<{
    id: string;
    name: string;
    role: string;
  }>;
}

export default function ProjectDetailPage({ params }: ProjectDetailProps) {
  const { projectId } = use(params);

  const {
    data: project,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => api.get<ProjectDetail>(`/projects/${projectId}`),
  });

  if (isLoading) {
    return <ProjectDetailSkeleton />;
  }

  if (error || !project) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold">프로젝트를 찾을 수 없습니다</h1>
          <Link href="/projects" className="mt-4 inline-block">
            <Button>갤러리로 돌아가기</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <ProjectDetailView
      {...project}
      fullDescription={project.fullDescription || project.description}
    />
  );
}
