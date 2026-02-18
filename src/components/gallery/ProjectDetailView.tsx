"use client";

import Image from "next/image";
import { ExternalLink, Github, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export interface ProjectDetailProps {
  id: string;
  projectName: string;
  tracks: string[];
  description: string;
  fullDescription: string;
  thumbnailUrl: string;
  techStack: string[];
  launchDate?: string;
  links?: {
    website?: string;
    github?: string;
    googlePlay?: string;
    appStore?: string;
  };
  members?: Array<{
    id: string;
    name: string;
    role: string;
    image?: string;
  }>;
}

export function ProjectDetailView({
  projectName,
  tracks,
  description,
  fullDescription,
  thumbnailUrl,
  techStack,
  launchDate,
  links,
  members,
}: ProjectDetailProps) {
  return (
    <article className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative h-64 w-full overflow-hidden bg-muted md:h-[420px]">
        <Image
          src={thumbnailUrl}
          alt={projectName}
          fill
          className="object-cover opacity-90"
          priority
          sizes="100vw"
          unoptimized
        />
        <div className="absolute inset-0 bg-black/15" />
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="relative -mt-16 mb-10 md:mb-12">
          <div className="rounded-lg border border-border bg-background p-6 shadow-lg md:p-8">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="mb-2 text-3xl font-bold md:text-4xl">
                  {projectName}
                </h1>
                <p className="text-lg text-muted-foreground">{description}</p>
              </div>
              <div className="flex gap-2">
                <Badge className="bg-orange-500 text-white hover:bg-orange-600">
                  {tracks.join(", ")}
                </Badge>
              </div>
            </div>

            {launchDate && (
              <p className="text-sm text-muted-foreground">
                런칭일: {launchDate}
              </p>
            )}
          </div>
        </div>

        {/* Project Info Section */}
        <div className="mb-10 md:mb-12">
          <h2 className="mb-4 text-2xl font-bold">프로젝트 소개</h2>
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <p className="whitespace-pre-wrap text-base leading-relaxed text-muted-foreground">
              {fullDescription}
            </p>
          </div>
        </div>

        {/* Tech Stack Section */}
        <div className="mb-10 md:mb-12">
          <h2 className="mb-4 text-2xl font-bold">기술 스택</h2>
          <div className="flex flex-wrap gap-2">
            {techStack.map((tech) => (
              <Badge
                key={tech}
                className="bg-gray-200 px-3 py-1 text-sm text-gray-700 hover:bg-gray-300"
              >
                {tech}
              </Badge>
            ))}
          </div>
        </div>

        {/* Links Section */}
        {links && Object.values(links).some((link) => link) && (
          <div className="mb-10 md:mb-12">
            <h2 className="mb-4 text-2xl font-bold">프로젝트 링크</h2>
            <div className="flex flex-wrap gap-3">
              {links.website && (
                <Button asChild variant="outline" className="gap-2">
                  <a
                    href={links.website}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Globe className="h-4 w-4" />
                    웹사이트
                    <ExternalLink className="ml-1 h-4 w-4" />
                  </a>
                </Button>
              )}
              {links.github && (
                <Button asChild variant="outline" className="gap-2">
                  <a
                    href={links.github}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Github className="h-4 w-4" />
                    GitHub
                    <ExternalLink className="ml-1 h-4 w-4" />
                  </a>
                </Button>
              )}
              {links.googlePlay && (
                <Button asChild variant="outline" className="gap-2">
                  <a
                    href={links.googlePlay}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Play Store
                    <ExternalLink className="ml-1 h-4 w-4" />
                  </a>
                </Button>
              )}
              {links.appStore && (
                <Button asChild variant="outline" className="gap-2">
                  <a
                    href={links.appStore}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    App Store
                    <ExternalLink className="ml-1 h-4 w-4" />
                  </a>
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Team Members Section */}
        {members && members.length > 0 && (
          <div className="mb-10 md:mb-12">
            <h2 className="mb-6 text-2xl font-bold">팀 멤버</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-muted/50"
                >
                  {member.image && (
                    <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full">
                      <Image
                        src={member.image}
                        alt={member.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  )}
                  {!member.image && (
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold text-gray-600">
                      {member.name[0]}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {member.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {member.role}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Separator className="my-10 md:my-12" />

        {/* Back Navigation */}
        <div className="pb-10 md:pb-12">
          <Button asChild variant="outline">
            <a href="/projects">← 모든 프로젝트로</a>
          </Button>
        </div>
      </div>
    </article>
  );
}
