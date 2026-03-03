"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Send, FileText } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import {
  ApiError,
  StudyReportStatus,
  StudyReportUpsertRequest,
  studyApi,
} from "@/lib/api";
import { toast } from "sonner";

const REPORT_VALIDATION = {
  WEEKLY_MIN: 2,
  WEEKLY_MAX: 500,
  RETROSPECTIVE_MIN: 2,
  RETROSPECTIVE_MAX: 1000,
} as const;

const INITIAL_REPORT_FORM: StudyReportUpsertRequest = {
  week1Activity: "",
  week2Activity: "",
  week3Activity: "",
  week4Activity: "",
  retrospectiveGood: "",
  retrospectiveImprove: "",
  retrospectiveNextAction: "",
};

const REPORT_STATUS_LABELS: Record<StudyReportStatus, string> = {
  SUBMITTED: "상신됨",
  RESUBMITTED: "재상신됨",
  APPROVED: "승인됨",
  REJECTED: "반려됨",
};

const REPORT_STATUS_BADGE_CLASS: Record<StudyReportStatus, string> = {
  SUBMITTED: "bg-blue-500 text-white",
  RESUBMITTED: "bg-sky-600 text-white",
  APPROVED: "bg-success text-success-foreground",
  REJECTED: "bg-destructive text-destructive-foreground",
};

type ReportFieldKey = keyof StudyReportUpsertRequest;

export default function StudyReportPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const studyId = Number(params.studyId);
  const { isLoading: authLoading } = useAuth();

  const [formData, setFormData] = useState<StudyReportUpsertRequest>(
    INITIAL_REPORT_FORM,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isFormInitialized, setIsFormInitialized] = useState(false);

  const {
    data: study,
    isLoading: studyLoading,
    error: studyError,
  } = useQuery({
    queryKey: ["study", studyId],
    queryFn: () => studyApi.getStudy(studyId),
    enabled: !!studyId,
  });

  const {
    data: submissionStatus,
    isLoading: statusLoading,
    error: statusError,
    refetch: refetchStatus,
  } = useQuery({
    queryKey: ["study-report-submission-status", studyId],
    queryFn: () => studyApi.getMyReportSubmissionStatus(studyId),
    enabled: !!studyId && !!study?.isLeader,
    retry: false,
  });

  const {
    data: reportDetail,
    isLoading: reportLoading,
    error: reportError,
    refetch: refetchReport,
  } = useQuery({
    queryKey: ["study-report-detail", studyId],
    queryFn: () => studyApi.getStudyReport(studyId),
    enabled: !!studyId && !!study?.isLeader && !!submissionStatus?.hasReport,
    retry: false,
  });

  useEffect(() => {
    if (!study?.isLeader || !submissionStatus || isFormInitialized) {
      return;
    }

    if (submissionStatus.hasReport && !reportDetail && !reportError) {
      return;
    }

    if (submissionStatus.hasReport && reportDetail) {
      setFormData({
        week1Activity: reportDetail.week1Activity,
        week2Activity: reportDetail.week2Activity,
        week3Activity: reportDetail.week3Activity,
        week4Activity: reportDetail.week4Activity,
        retrospectiveGood: reportDetail.retrospectiveGood,
        retrospectiveImprove: reportDetail.retrospectiveImprove,
        retrospectiveNextAction: reportDetail.retrospectiveNextAction,
      });
    } else {
      setFormData(INITIAL_REPORT_FORM);
    }

    setIsFormInitialized(true);
  }, [isFormInitialized, reportDetail, reportError, study?.isLeader, submissionStatus]);

  const reportStatus = submissionStatus?.status ?? reportDetail?.status;
  const hasExistingReport = !!submissionStatus?.hasReport;
  const isApprovedReport = reportStatus === "APPROVED";

  const submittedAt = submissionStatus?.submittedAt ?? reportDetail?.submittedAt;
  const lastModifiedAt =
    submissionStatus?.lastModifiedAt ?? reportDetail?.lastModifiedAt;

  const isBootstrapLoading =
    authLoading ||
    studyLoading ||
    (!!study?.isLeader && statusLoading) ||
    (!!study?.isLeader && hasExistingReport && reportLoading && !reportError) ||
    (!!study?.isLeader && !isFormInitialized);

  const submitMutation = useMutation({
    mutationFn: (data: StudyReportUpsertRequest) =>
      studyApi.submitStudyReport(studyId, data),
    onSuccess: () => {
      toast.success(
        hasExistingReport
          ? "결과 보고가 재상신되었습니다."
          : "결과 보고가 상신되었습니다.",
      );

      queryClient.invalidateQueries({
        queryKey: ["study-report-submission-status", studyId],
      });
      queryClient.invalidateQueries({
        queryKey: ["study-report-detail", studyId],
      });
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        if (
          error.code === "STUDY_REPORT_UPDATE_NOT_ALLOWED_FOR_STUDY_STATUS"
        ) {
          toast.error("현재 스터디 상태에서는 결과 보고를 상신할 수 없습니다.");
          return;
        }

        if (error.code === "STUDY_REPORT_CANNOT_UPDATE_AFTER_APPROVED") {
          toast.error("승인된 결과 보고는 수정할 수 없습니다.");
          return;
        }

        if (error.status === 403) {
          toast.error("스터디장만 결과 보고를 상신할 수 있습니다.");
          return;
        }

        if (error.status === 404) {
          toast.error("스터디를 찾을 수 없습니다.");
          return;
        }

        if (error.status === 400 && error.errors?.length) {
          const serverFieldErrors: Record<string, string> = {};

          for (const fieldError of error.errors) {
            if (fieldError.field && fieldError.reason) {
              serverFieldErrors[fieldError.field] = fieldError.reason;
            }
          }

          if (Object.keys(serverFieldErrors).length > 0) {
            setErrors((prev) => ({ ...prev, ...serverFieldErrors }));
          }
        }

        toast.error(error.message || "결과 보고 상신에 실패했습니다.");
        return;
      }

      toast.error("결과 보고 상신에 실패했습니다.");
    },
  });

  const validateTextField = (
    value: string,
    key: ReportFieldKey,
    label: string,
    minLength: number,
    maxLength: number,
    targetErrors: Record<string, string>,
  ) => {
    const trimmed = value.trim();

    if (!trimmed) {
      targetErrors[key] = `${label}을(를) 입력해주세요.`;
      return;
    }

    if (trimmed.length < minLength) {
      targetErrors[key] = `${label}은(는) 최소 ${minLength}자 이상이어야 합니다.`;
      return;
    }

    if (trimmed.length > maxLength) {
      targetErrors[key] = `${label}은(는) 최대 ${maxLength}자까지 입력할 수 있습니다.`;
    }
  };

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};

    validateTextField(
      formData.week1Activity,
      "week1Activity",
      "1주차 활동",
      REPORT_VALIDATION.WEEKLY_MIN,
      REPORT_VALIDATION.WEEKLY_MAX,
      nextErrors,
    );
    validateTextField(
      formData.week2Activity,
      "week2Activity",
      "2주차 활동",
      REPORT_VALIDATION.WEEKLY_MIN,
      REPORT_VALIDATION.WEEKLY_MAX,
      nextErrors,
    );
    validateTextField(
      formData.week3Activity,
      "week3Activity",
      "3주차 활동",
      REPORT_VALIDATION.WEEKLY_MIN,
      REPORT_VALIDATION.WEEKLY_MAX,
      nextErrors,
    );
    validateTextField(
      formData.week4Activity,
      "week4Activity",
      "4주차 활동",
      REPORT_VALIDATION.WEEKLY_MIN,
      REPORT_VALIDATION.WEEKLY_MAX,
      nextErrors,
    );
    validateTextField(
      formData.retrospectiveGood,
      "retrospectiveGood",
      "잘한 점",
      REPORT_VALIDATION.RETROSPECTIVE_MIN,
      REPORT_VALIDATION.RETROSPECTIVE_MAX,
      nextErrors,
    );
    validateTextField(
      formData.retrospectiveImprove,
      "retrospectiveImprove",
      "아쉬운 점",
      REPORT_VALIDATION.RETROSPECTIVE_MIN,
      REPORT_VALIDATION.RETROSPECTIVE_MAX,
      nextErrors,
    );
    validateTextField(
      formData.retrospectiveNextAction,
      "retrospectiveNextAction",
      "다음 액션",
      REPORT_VALIDATION.RETROSPECTIVE_MIN,
      REPORT_VALIDATION.RETROSPECTIVE_MAX,
      nextErrors,
    );

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleFieldChange = (key: ReportFieldKey, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));

    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const normalizedPayload = useMemo<StudyReportUpsertRequest>(
    () => ({
      week1Activity: formData.week1Activity.trim(),
      week2Activity: formData.week2Activity.trim(),
      week3Activity: formData.week3Activity.trim(),
      week4Activity: formData.week4Activity.trim(),
      retrospectiveGood: formData.retrospectiveGood.trim(),
      retrospectiveImprove: formData.retrospectiveImprove.trim(),
      retrospectiveNextAction: formData.retrospectiveNextAction.trim(),
    }),
    [formData],
  );

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isApprovedReport) {
      toast.error("승인된 결과 보고는 수정할 수 없습니다.");
      return;
    }

    if (!validateForm()) {
      return;
    }

    submitMutation.mutate(normalizedPayload);
  };

  if (isBootstrapLoading) {
    return <StudyReportPageSkeleton />;
  }

  if (studyError || !study) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-3">
        <FileText className="h-14 w-14 text-muted-foreground" />
        <h2 className="text-xl font-semibold">스터디를 찾을 수 없습니다</h2>
        <p className="text-sm text-muted-foreground">
          요청하신 스터디가 존재하지 않거나 접근할 수 없습니다.
        </p>
        <Button onClick={() => router.push("/studies")}>스터디 목록으로</Button>
      </div>
    );
  }

  if (!study.isLeader) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-3">
        <FileText className="h-14 w-14 text-muted-foreground" />
        <h2 className="text-xl font-semibold">권한이 없습니다</h2>
        <p className="text-sm text-muted-foreground">
          스터디장만 결과 보고를 작성할 수 있습니다.
        </p>
        <Button onClick={() => router.push(`/studies/${study.id}`)}>
          스터디로 돌아가기
        </Button>
      </div>
    );
  }

  if (statusError) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          뒤로가기
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>결과 보고 정보를 불러오지 못했습니다</CardTitle>
            <CardDescription>
              잠시 후 다시 시도해주세요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => refetchStatus()}>다시 시도</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (hasExistingReport && reportError) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          뒤로가기
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>기존 결과 보고를 불러오지 못했습니다</CardTitle>
            <CardDescription>
              네트워크 상태를 확인한 후 다시 시도해주세요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => refetchReport()}>다시 시도</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">스터디 결과 보고</h1>
          <p className="text-muted-foreground">
            {study.name} 스터디의 4주 활동과 회고를 작성해 상신합니다.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">상신 상태</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge
              variant={reportStatus ? "default" : "outline"}
              className={
                reportStatus ? REPORT_STATUS_BADGE_CLASS[reportStatus] : undefined
              }
            >
              {reportStatus ? REPORT_STATUS_LABELS[reportStatus] : "미상신"}
            </Badge>
            {isApprovedReport && (
              <p className="text-sm text-muted-foreground">
                승인된 결과 보고는 수정할 수 없습니다.
              </p>
            )}
          </div>
          {submittedAt && (
            <p className="text-sm text-muted-foreground">
              상신일: {format(new Date(submittedAt), "yyyy.MM.dd HH:mm", { locale: ko })}
            </p>
          )}
          {lastModifiedAt && (
            <p className="text-sm text-muted-foreground">
              최종 수정일: {format(new Date(lastModifiedAt), "yyyy.MM.dd HH:mm", { locale: ko })}
            </p>
          )}
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>주차별 활동</CardTitle>
            <CardDescription>
              각 주차에서 진행한 핵심 활동을 작성해주세요. (2~500자)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {[
              { key: "week1Activity", label: "1주차 활동" },
              { key: "week2Activity", label: "2주차 활동" },
              { key: "week3Activity", label: "3주차 활동" },
              { key: "week4Activity", label: "4주차 활동" },
            ].map((field) => {
              const formKey = field.key as ReportFieldKey;
              const value = formData[formKey] as string;

              return (
                <div key={field.key} className="space-y-2">
                  <Label htmlFor={field.key}>
                    {field.label} <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id={field.key}
                    value={value}
                    onChange={(event) => handleFieldChange(formKey, event.target.value)}
                    placeholder={`${field.label} 내용을 입력해주세요`}
                    maxLength={REPORT_VALIDATION.WEEKLY_MAX}
                    rows={4}
                    disabled={isApprovedReport || submitMutation.isPending}
                  />
                  {errors[field.key] && (
                    <p className="text-sm text-destructive">{errors[field.key]}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {value.length}/{REPORT_VALIDATION.WEEKLY_MAX}
                  </p>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>팀 회고</CardTitle>
            <CardDescription>
              팀의 회고를 작성해주세요. (2~1000자)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {[
              { key: "retrospectiveGood", label: "잘한 점" },
              { key: "retrospectiveImprove", label: "아쉬운 점" },
              { key: "retrospectiveNextAction", label: "다음 액션" },
            ].map((field) => {
              const formKey = field.key as ReportFieldKey;
              const value = formData[formKey] as string;

              return (
                <div key={field.key} className="space-y-2">
                  <Label htmlFor={field.key}>
                    {field.label} <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id={field.key}
                    value={value}
                    onChange={(event) => handleFieldChange(formKey, event.target.value)}
                    placeholder={`${field.label}을(를) 입력해주세요`}
                    maxLength={REPORT_VALIDATION.RETROSPECTIVE_MAX}
                    rows={5}
                    disabled={isApprovedReport || submitMutation.isPending}
                  />
                  {errors[field.key] && (
                    <p className="text-sm text-destructive">{errors[field.key]}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {value.length}/{REPORT_VALIDATION.RETROSPECTIVE_MAX}
                  </p>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/studies/${study.id}`)}
            disabled={submitMutation.isPending}
          >
            돌아가기
          </Button>
          {!isApprovedReport && (
            <Button type="submit" disabled={submitMutation.isPending}>
              {submitMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              {hasExistingReport ? "결과 보고 재상신" : "결과 보고 상신"}
            </Button>
          )}
        </div>
      </form>

      <div className="h-20 lg:h-0" />
    </div>
  );
}

function StudyReportPageSkeleton() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10" />
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-20" />
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-56" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-28 mb-1" />
          <Skeleton className="h-4 w-80" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
