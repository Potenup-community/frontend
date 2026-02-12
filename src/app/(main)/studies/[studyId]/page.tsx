"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  Calendar,
  ExternalLink,
  MessageCircle,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Pencil,
  Trash2,
  Send,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/ui/UserAvatar";
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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { studyApi, StudyDetail } from "@/lib/api";
import { BUDGET_LABELS, STUDY_STATUS_LABELS } from "@/lib/constants";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";
import { ko } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default function StudyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const studyId = Number(params.studyId);

  const {
    data: study,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["study", studyId],
    queryFn: () => studyApi.getStudy(studyId),
    enabled: !!studyId,
    staleTime: 0,
  });

  useEffect(() => {
    if (!isLoading && (error || !study)) {
      router.replace("/studies");
    }
  }, [isLoading, error, study, router]);

  if (isLoading) {
    return <StudyDetailSkeleton />;
  }

  if (error || !study) {
    return null;
  }

  return <StudyDetailContent study={study} />;
}

function StudyDetailContent({ study }: { study: StudyDetail }) {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const isFull = study.currentMemberCount >= study.capacity;
  const canApply =
    !study.isLeader &&
    !study.isParticipant &&
    !study.isRecruitmentClosed &&
    !isFull &&
    study.status === "PENDING";

  // 스터디 참가
  const joinMutation = useMutation({
    mutationFn: () => studyApi.joinStudy(study.id),
    onSuccess: () => {
      toast.success("스터디에 참가되었습니다!");
      queryClient.invalidateQueries({ queryKey: ["study", study.id] });
      queryClient.invalidateQueries({ queryKey: ["my-recruitments"] });
    },
    onError: () => {
      toast.error("스터디 참가에 실패했습니다.");
    },
  });

  // 스터디 삭제
  const deleteMutation = useMutation({
    mutationFn: () => studyApi.deleteStudy(study.id),
    onSuccess: () => {
      toast.success("스터디가 삭제되었습니다.");
      router.push("/studies");
    },
    onError: () => {
      toast.error("스터디 삭제에 실패했습니다.");
    },
  });

  const getStatusBadge = () => {
    if (study.status === "REJECTED") {
      return <Badge variant="destructive">거절됨</Badge>;
    }
    if (study.status === "APPROVED") {
      return <Badge className="bg-blue-500 text-white">승인 완료</Badge>;
    }
    if (study.isRecruitmentClosed || isFull) {
      return <Badge variant="secondary">모집 마감</Badge>;
    }
    return <Badge className="bg-success text-success-foreground">모집중</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold">{study.name}</h1>
            {getStatusBadge()}
          </div>
          <p className="text-muted-foreground">
            {formatDistanceToNow(new Date(study.createdAt), {
              addSuffix: true,
              locale: ko,
            })}{" "}
            개설
          </p>
        </div>
        {study.isLeader && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/studies/${study.id}/edit`}>
                <Pencil className="h-4 w-4 mr-1" />
                수정
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => setIsDeleteOpen(true)}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              삭제
            </Button>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>스터디 소개</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{study.description}</p>
            </CardContent>
          </Card>

          {/* Tags */}
          {study.tags && study.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>기술 스택 / 태그</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {study.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Participants */}
          {study.participants && study.participants.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>참가자 ({study.participants.length}명)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {study.participants.map((participant) => (
                    <div
                      key={participant.id}
                      className="flex items-center gap-3"
                    >
                      <UserAvatar
                        src={participant.profileImageUrl}
                        name={participant.name}
                        className="h-9 w-9"
                      />
                      <div>
                        <p className="font-medium text-sm">
                          {participant.name}
                        </p>
                        {participant.trackName && (
                          <p className="text-xs text-muted-foreground">
                            {participant.trackName}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Leader Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">스터디장</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <UserAvatar
                  src={study.leader?.profileImageUrl}
                  name={study.leader?.name || ""}
                  className="h-12 w-12"
                />
                <div>
                  <p className="font-medium">{study.leader?.name}</p>
                  {study.leader?.trackName && (
                    <p className="text-sm text-muted-foreground">
                      {study.leader.trackName}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Study Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">스터디 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">모집 인원</span>
                <span className="font-medium">
                  {study.currentMemberCount} / {study.capacity}명
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">지원 항목</span>
                <Badge variant="outline">
                  {BUDGET_LABELS[study.budget as keyof typeof BUDGET_LABELS] ||
                    study.budget}
                </Badge>
              </div>
              {study.scheduleName && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">일정</span>
                  <span className="font-medium">{study.scheduleName}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Links */}
          {(study.chatUrl || study.refUrl) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">관련 링크</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {study.chatUrl && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    asChild
                  >
                    <a
                      href={study.chatUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      오픈 채팅방
                      <ExternalLink className="h-3 w-3 ml-auto" />
                    </a>
                  </Button>
                )}
                {study.refUrl && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    asChild
                  >
                    <a
                      href={study.refUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      참고 자료
                      <ExternalLink className="h-3 w-3 ml-auto" />
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Apply Button */}
          {canApply && (
            <Button
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold shadow-md"
              size="lg"
              onClick={() => joinMutation.mutate()}
              disabled={joinMutation.isPending}
            >
              {joinMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              참가하기
            </Button>
          )}

          {study.isLeader && (
            <div className="text-center text-sm text-muted-foreground py-2">
              당신은 이 스터디의 스터디장입니다
            </div>
          )}

          {study.isParticipant && !study.isLeader && (
            <div className="text-center text-sm text-muted-foreground py-2">
              이미 참가 중인 스터디입니다
            </div>
          )}

          {!canApply &&
            !study.isLeader &&
            !study.isParticipant &&
            study.status === "PENDING" && (
              <div className="text-center text-sm text-muted-foreground py-2">
                {isFull ? "모집이 마감되었습니다" : "현재 신청할 수 없습니다"}
              </div>
            )}
        </div>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>스터디 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              이 스터디를 삭제하시겠습니까?
              <span className="block mt-2 text-destructive">
                이 작업은 되돌릴 수 없습니다.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "삭제"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bottom padding for mobile nav */}
      <div className="h-20 lg:h-0" />
    </div>
  );
}

function StudyDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10" />
        <div className="flex-1">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-16" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div>
                  <Skeleton className="h-5 w-20 mb-1" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-20" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>

          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  );
}
