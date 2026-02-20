"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { useRouter } from "next/navigation";
import { ExternalLink, Github, Globe, Edit, Trash2, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { api, ApiError, reactionApi } from "@/lib/api";
import { toast } from "sonner";

export interface ProjectDetailProps {
  id: string;
  title: string;
  trackNames?: string[];
  description?: string;
  thumbnailImageUrl: string;
  techStacks?: string[];
  userId?: number;
  isLiked?: boolean;
  likeCount?: number;
  links?: {
    website?: string;
    github?: string;
  };
  members?: Array<{
    id: string;
    name: string;
    role?: string;
    image?: string;
    trackName?: string;
  }>;
}

export function ProjectDetailView({
  id,
  title,
  trackNames = [],
  description = "",
  thumbnailImageUrl,
  techStacks = [],
  userId,
  isLiked = false,
  likeCount = 0,
  links,
  members,
}: ProjectDetailProps) {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [visualIsLiked, setVisualIsLiked] = useState(isLiked);
  const [visualLikeCount, setVisualLikeCount] = useState(likeCount);

  // 이미지 URL 정규화 (프로토콜이 없으면 추가)
  const normalizeImageUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `http://${url}`;
  };

  const imageUrl = normalizeImageUrl(thumbnailImageUrl);

  // 수정/삭제 권한 체크 (본인 또는 ADMIN)
  const canEdit = user && (user.id === userId || user.role === "ADMIN");

  // 좋아요 클릭 핸들러
  // 좋아요 Mutation with Optimistic Updates
  const likeMutation = useMutation({
    mutationFn: async (shouldLike: boolean) => {
      console.log(
        "[ProjectDetailView] mutationFn called with shouldLike:",
        shouldLike,
      );
      try {
        if (shouldLike) {
          console.log(
            "[ProjectDetailView] Calling addReaction with projectId:",
            parseInt(id),
          );
          await reactionApi.addReaction({
            targetType: "PROJECT",
            targetId: parseInt(id),
            reactionType: "LIKE",
          });
          console.log("[ProjectDetailView] addReaction success");
        } else {
          console.log(
            "[ProjectDetailView] Calling removeReaction with projectId:",
            parseInt(id),
          );
          await reactionApi.removeReaction({
            targetType: "PROJECT",
            targetId: parseInt(id),
            reactionType: "LIKE",
          });
          console.log("[ProjectDetailView] removeReaction success");
        }
      } catch (err) {
        console.error("[ProjectDetailView] Mutation error:", err);
        throw err;
      }
    },
    onSuccess: () => {
      // 캐시 무효화 + 자동 리페치
      queryClient.invalidateQueries({
        queryKey: ["project", id],
        refetchType: "all",
      });

      queryClient.invalidateQueries({
        queryKey: ["projects"],
        refetchType: "all",
      });
    },
    onError: () => {
      // 오류 시 상태 복원
      setVisualIsLiked(!visualIsLiked);
      setVisualLikeCount(
        visualIsLiked ? visualLikeCount + 1 : Math.max(0, visualLikeCount - 1),
      );
      toast.error("좋아요 처리 중 오류가 발생했습니다.");
    },
  });

  // 좋아요 클릭 핸들러
  const handleLikeClick = async () => {
    console.log("[ProjectDetailView] Like button clicked", {
      id,
      visualIsLiked,
    });
    if (!user) {
      console.log("[ProjectDetailView] User not logged in");
      toast.error("로그인이 필요합니다.");
      return;
    }

    const nextLiked = !visualIsLiked;
    console.log("[ProjectDetailView] Mutating with shouldLike:", nextLiked);

    // Optimistic Update - 즉시 UI 업데이트
    setVisualIsLiked(nextLiked);
    setVisualLikeCount(
      nextLiked ? visualLikeCount + 1 : Math.max(0, visualLikeCount - 1),
    );

    // 서버와 동기화
    likeMutation.mutate(nextLiked);
  };

  const handleDelete = async () => {
    if (!canEdit) return;

    setIsDeleting(true);
    try {
      await api.delete(`/projects/${id}`);
      toast.success("프로젝트가 삭제되었습니다.");
      router.push("/projects");
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message || "삭제 중 오류가 발생했습니다.");
      } else {
        toast.error("삭제 중 오류가 발생했습니다.");
      }
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <article className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative h-64 w-full overflow-hidden bg-muted md:h-[420px]">
        <Image
          src={imageUrl}
          alt={title}
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
              <div className="flex-1">
                <h1 className="mb-2 text-3xl font-bold md:text-4xl">{title}</h1>
                <p className="text-lg text-muted-foreground">{description}</p>
              </div>
              <div className="flex flex-col items-end gap-3">
                {trackNames && trackNames.length > 0 && (
                  <div className="flex flex-wrap justify-end gap-2 items-center">
                    {trackNames.map((track) => (
                      <Badge
                        key={track}
                        className="bg-orange-500 text-white hover:bg-orange-600"
                      >
                        {track}
                      </Badge>
                    ))}
                    {/* 좋아요 버튼 */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleLikeClick}
                      disabled={likeMutation.isPending}
                      className={`gap-1 ${visualIsLiked ? "text-orange-500" : "text-gray-600"}`}
                      title={visualIsLiked ? "좋아요 취소" : "좋아요"}
                    >
                      <Flame
                        className="h-4 w-4"
                        fill={visualIsLiked ? "currentColor" : "none"}
                      />
                      <span className="text-xs">{visualLikeCount}</span>
                    </Button>
                  </div>
                )}
                {(!trackNames || trackNames.length === 0) && (
                  <div className="flex gap-2 items-center">
                    {/* 트랙이 없을 때 좋아요만 표시 */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleLikeClick}
                      disabled={likeMutation.isPending}
                      className={`gap-1 ${visualIsLiked ? "text-orange-500" : "text-gray-600"}`}
                      title={visualIsLiked ? "좋아요 취소" : "좋아요"}
                    >
                      <Flame
                        className="h-4 w-4"
                        fill={visualIsLiked ? "currentColor" : "none"}
                      />
                      <span className="text-xs">{visualLikeCount}</span>
                    </Button>
                  </div>
                )}
                {canEdit && (
                  <div className="flex gap-1">
                    <Button
                      asChild
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                      title="프로젝트 수정"
                    >
                      <Link href={`/projects/${id}/edit`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-600 hover:text-red-600 hover:bg-red-50"
                      onClick={() => setIsDeleteDialogOpen(true)}
                      title="프로젝트 삭제"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Project Info Section */}
        <div className="mb-10 md:mb-12">
          <h2 className="mb-4 text-2xl font-bold">프로젝트 소개</h2>
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <p className="whitespace-pre-wrap text-base leading-relaxed text-muted-foreground">
              {description}
            </p>
          </div>
        </div>

        {/* Tech Stack Section */}
        <div className="mb-10 md:mb-12">
          <h2 className="mb-4 text-2xl font-bold">기술 스택</h2>
          <div className="flex flex-wrap gap-2">
            {techStacks.map((tech) => (
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
                  className="flex items-start gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-muted/50"
                >
                  <UserAvatar
                    src={member.image}
                    name={member.name}
                    className="h-12 w-12 flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="truncate text-sm font-medium">
                        {member.name}
                      </p>
                      {member.trackName && (
                        <Badge
                          variant="secondary"
                          className="text-xs py-0 px-1.5 flex-shrink-0"
                        >
                          {member.trackName}
                        </Badge>
                      )}
                    </div>
                    {member.role && (
                      <p className="truncate text-xs font-medium text-gray-700">
                        {member.role}
                      </p>
                    )}
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
            <Link href="/projects">← 모든 프로젝트로</Link>
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>프로젝트 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 이 프로젝트를 삭제하시겠습니까?
              <br />
              삭제된 프로젝트는 복구할 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "삭제 중..." : "삭제"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </article>
  );
}
