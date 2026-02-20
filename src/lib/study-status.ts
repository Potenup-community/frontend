import { StudyStatus } from "@/lib/api";
import { STUDY_STATUS_LABELS } from "@/lib/constants";

type StudyStatusBadgeVariant = "default" | "secondary" | "outline";

interface StudyStatusContext {
  status: StudyStatus;
  isRecruitmentClosed: boolean;
  currentMemberCount: number;
  capacity: number;
}

interface StudyStatusBadgeProps {
  label: string;
  variant: StudyStatusBadgeVariant;
  className?: string;
  effectiveStatus: StudyStatus;
}

export function getEffectiveStudyStatus({
  status,
  isRecruitmentClosed,
  currentMemberCount,
  capacity,
}: StudyStatusContext): StudyStatus {
  if (status === "RECRUITING" && (isRecruitmentClosed || currentMemberCount >= capacity)) {
    return "RECRUITING_CLOSED";
  }

  return status;
}

export function getStudyStatusBadgeProps(context: StudyStatusContext): StudyStatusBadgeProps {
  const effectiveStatus = getEffectiveStudyStatus(context);

  if (effectiveStatus === "RECRUITING") {
    return {
      label: STUDY_STATUS_LABELS.RECRUITING,
      variant: "default",
      className: "bg-success text-success-foreground",
      effectiveStatus,
    };
  }

  if (effectiveStatus === "IN_PROGRESS") {
    return {
      label: STUDY_STATUS_LABELS.IN_PROGRESS,
      variant: "default",
      className: "bg-blue-500 text-white",
      effectiveStatus,
    };
  }

  if (effectiveStatus === "RECRUITING_CLOSED") {
    return {
      label: STUDY_STATUS_LABELS.RECRUITING_CLOSED,
      variant: "secondary",
      effectiveStatus,
    };
  }

  return {
    label: STUDY_STATUS_LABELS.COMPLETED,
    variant: "outline",
    effectiveStatus,
  };
}
