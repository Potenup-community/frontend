"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Users, Flame } from "lucide-react";

export interface ProjectCardProps {
  projectId: number;
  title: string;
  description?: string;
  thumbnailImageUrl: string;
  trackNames?: string[];
  techStacks?: string[];
  memberCount?: number;
  initialLikes?: number; // 초기 좋아요 수
}

export function ProjectCard({
  projectId,
  title,
  description = "",
  thumbnailImageUrl,
  trackNames = [],
  techStacks = [],
  memberCount,
  initialLikes = 0,
}: ProjectCardProps) {
  const router = useRouter();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(initialLikes);

  // 이미지 URL에 프로토콜 추가
  const imageUrl = thumbnailImageUrl?.startsWith("http")
    ? thumbnailImageUrl
    : `http://${thumbnailImageUrl}`;

  const handleCardClick = () => {
    router.push(`/projects/${projectId}`);
  };

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // 카드 클릭 이벤트 전파 방지

    setLiked(!liked);
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1));
  };

  return (
    <Card
      onClick={handleCardClick}
      className="group flex h-full flex-col overflow-hidden transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:cursor-pointer"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          handleCardClick();
        }
      }}
    >
      {/* 썸네일 이미지 영역 */}
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        {/* 트랙 배지 - 왼쪽 상단 */}
        {trackNames && trackNames.length > 0 && (
          <Badge className="absolute left-3 top-3 z-10 bg-gray-500/90 text-white hover:bg-gray-600/90">
            {trackNames[0]}
          </Badge>
        )}

        <Image
          src={imageUrl}
          alt={title}
          fill
          className="object-cover opacity-90 transition-all duration-150 group-hover:opacity-100 group-hover:brightness-90"
          unoptimized
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all duration-150 group-hover:bg-black/50 group-hover:opacity-100">
          <span className="text-sm font-semibold text-white">
            프로젝트 보기
          </span>
        </div>
      </div>

      <CardContent className="flex-1 p-4">
        {/* 프로젝트명 + 인원 */}
        <div className="mb-2 flex items-start justify-between">
          <h3 className="text-base font-semibold leading-tight text-gray-900">
            {title}
          </h3>
          {memberCount && (
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Users className="h-4 w-4" />
              <span>{memberCount}</span>
            </div>
          )}
        </div>

        {/* 짧은 설명 (2줄) */}
        <p className="mb-3 line-clamp-2 text-sm text-gray-600">{description}</p>

        {/* 기술 스택 태그들 */}
        <div className="flex flex-wrap gap-1.5">
          {techStacks &&
            techStacks.map((tech) => (
              <Badge
                key={tech}
                className="bg-gray-200 text-gray-700 hover:bg-gray-300 text-xs"
              >
                {tech}
              </Badge>
            ))}
        </div>
      </CardContent>

      {/* 좋아요 수 + 화살표 */}
      <CardFooter className="p-4 pt-0">
        <div className="flex w-full items-center justify-between text-sm">
          <button
            onClick={handleLikeClick}
            className="flex items-center gap-1 transition-all hover:scale-110"
          >
            <Flame
              className={`h-4 w-4 transition-all ${
                liked
                  ? "fill-orange-500 text-orange-500 scale-110"
                  : "fill-gray-300 text-gray-400 hover:fill-orange-400 hover:text-orange-400"
              }`}
            />
            <span
              className={
                liked ? "text-orange-500 font-semibold" : "text-gray-500"
              }
            >
              {likeCount}
            </span>
          </button>
          <span className="text-orange-500">→</span>
        </div>
      </CardFooter>
    </Card>
  );
}
