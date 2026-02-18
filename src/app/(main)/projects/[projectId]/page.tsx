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
  projectId: number;
  title: string;
  description: string;
  githubUrl: string;
  deployUrl?: string;
  thumbnailImageUrl: string;
  techStacks: string[];
  members: Array<{
    userId: number;
    name: string;
    profileImageUrl: string;
    trackName: string;
    position: string;
  }>;
  viewCount: number;
  author: {
    userId: number;
    name: string;
  };
  createdAt: string;
  modifiedAt: string;
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

  // API 응답을 컴포넌트 props로 매핑
  const normalizedProject = {
    id: project.projectId.toString(),
    title: project.title,
    trackNames: project.members
      .map((m) => m.trackName)
      .filter((v, i, a) => a.indexOf(v) === i), // 중복 제거
    description: project.description,
    thumbnailImageUrl: project.thumbnailImageUrl,
    techStacks: project.techStacks,
    userId: project.author.userId,
    links: {
      github: project.githubUrl,
      website: project.deployUrl,
    },
    members: project.members.map((m) => ({
      id: m.userId.toString(),
      name: m.name,
      role: m.position,
      image: m.profileImageUrl,
      trackName: m.trackName,
    })),
  };

  return <ProjectDetailView {...normalizedProject} />;
}
