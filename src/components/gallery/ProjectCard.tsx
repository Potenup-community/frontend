"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Users, Flame } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { reactionApi } from "@/lib/api";
import { toast } from "sonner";

export interface ProjectCardProps {
  projectId: number;
  title: string;
  description?: string;
  thumbnailImageUrl: string;
  trackNames?: string[];
  techStacks?: string[];
  memberCount?: number;
  likeCount?: number;
  likedByMe?: boolean;
}

export function ProjectCard({
  projectId,
  title,
  description = "",
  thumbnailImageUrl,
  trackNames = [],
  techStacks = [],
  memberCount,
  likeCount = 0,
  likedByMe = false,
}: ProjectCardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [liked, setLiked] = useState(likedByMe);
  const [count, setCount] = useState(likeCount);

  // 이미지 URL에 프로토콜 추가
  const imageUrl = thumbnailImageUrl?.startsWith("http")
    ? thumbnailImageUrl
    : `http://${thumbnailImageUrl}`;

  // 좋아요 Mutation
  const likeMutation = useMutation({
    mutationFn: async (shouldLike: boolean) => {
      if (shouldLike) {
        await reactionApi.addReaction({
          targetType: "PROJECT",
          targetId: projectId,
          reactionType: "LIKE",
        });
      } else {
        await reactionApi.removeReaction({
          targetType: "PROJECT",
          targetId: projectId,
          reactionType: "LIKE",
        });
      }
    },
    onSuccess: () => {
      // 캐시 무효화 + 자동 리페치
      queryClient.invalidateQueries({
        queryKey: ["project", String(projectId)],
        refetchType: "all",
      });

      queryClient.invalidateQueries({
        queryKey: ["projects"],
        refetchType: "all",
      });
    },
    onError: () => {
      // 오류 시 상태 복원
      setLiked(!liked);
      setCount((prev) => (liked ? prev + 1 : Math.max(0, prev - 1)));
      toast.error("좋아요 처리 중 오류가 발생했습니다.");
    },
  });

  const handleCardClick = () => {
    router.push(`/projects/${projectId}`);
  };

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // 카드 클릭 이벤트 전파 방지

    if (!user) {
      toast.error("로그인이 필요합니다.");
      return;
    }

    // Optimistic Update
    const nextLiked = !liked;
    setLiked(nextLiked);
    setCount((prev) => (nextLiked ? prev + 1 : Math.max(0, prev - 1)));

    // API 요청
    likeMutation.mutate(nextLiked);
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
            disabled={likeMutation.isPending}
            className="flex items-center gap-1 transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
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
              {count}
            </span>
          </button>
          <span className="text-orange-500">→</span>
        </div>
      </CardFooter>
    </Card>
  );
}
