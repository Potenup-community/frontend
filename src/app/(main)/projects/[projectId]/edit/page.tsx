"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { api, ApiError, AdminTrack, userApi, UserSummary } from "@/lib/api";
import { Loader2, FolderEdit } from "lucide-react";

interface MemberDraft {
  id: string;
  userId: number | null;
  name: string;
  trackId: number | null;
  position: string;
}

const POSITION_OPTIONS = [
  { value: "BACKEND", label: "백엔드" },
  { value: "FRONTEND", label: "프론트엔드" },
  { value: "AI", label: "AI" },
  { value: "DESIGN", label: "디자인" },
  { value: "PM", label: "기획" },
  { value: "OTHER", label: "기타" },
];

const createMemberId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `member-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export default function ProjectEditPage() {
  const params = useParams();
  const projectId = params?.projectId as string;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isLoading: authLoading } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [githubPath, setGithubPath] = useState("");
  const [deployUrl, setDeployUrl] = useState("");
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [existingThumbnailUrl, setExistingThumbnailUrl] = useState<string>("");
  const [techInput, setTechInput] = useState("");
  const [techStacks, setTechStacks] = useState<string[]>([]);
  const [members, setMembers] = useState<MemberDraft[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>(
    {},
  );
  const [dirtyFields, setDirtyFields] = useState<Record<string, boolean>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [activeMemberIndex, setActiveMemberIndex] = useState<number | null>(
    null,
  );

  // Fetch existing project data
  interface ProjectDetailResponse {
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
    author: {
      userId: number;
      name: string;
    };
  }

  const { data: project, isLoading: isLoadingProject } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => api.get<ProjectDetailResponse>(`/projects/${projectId}`),
  });

  // Fetch available tracks
  const { data: tracksData } = useQuery({
    queryKey: ["tracks"],
    queryFn: () =>
      api
        .get<{ content: AdminTrack[] }>("/admin/tracks")
        .then((res) => res.content),
  });

  const { data: mentionUsers } = useQuery({
    queryKey: ["mention-users"],
    queryFn: () => userApi.getMentionUsers({ size: 200 }),
    staleTime: 60 * 1000,
  });

  const tracks = tracksData ?? [];
  const resolveTrackId = (trackName?: string) => {
    if (!trackName) return null;
    const match = tracks.find((track) => track.trackName === trackName);
    return match ? match.trackId : null;
  };

  // localStorage 키
  const DRAFT_KEY = `project-edit-draft-${projectId}`;

  // localStorage에 폼 데이터 저장
  const saveDraft = () => {
    const draft = {
      title,
      description,
      githubPath,
      deployUrl,
      techStacks,
      members,
      timestamp: Date.now(),
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  };

  // localStorage에서 폼 데이터 복원
  const loadDraft = () => {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (!saved) return null;
    try {
      const draft = JSON.parse(saved);
      // 24시간 이내 데이터만 복원
      if (Date.now() - draft.timestamp < 24 * 60 * 60 * 1000) {
        return draft;
      }
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      localStorage.removeItem(DRAFT_KEY);
    }
    return null;
  };

  // localStorage 클리어
  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
  };

  // 권한 체크
  useEffect(() => {
    if (project && user) {
      const canEdit =
        user.id === project.author.userId || user.role === "ADMIN";
      if (!canEdit) {
        router.push(`/projects/${projectId}`);
      }
    }
  }, [project, user, projectId, router]);

  // Load existing project data into form
  useEffect(() => {
    if (project && !isDataLoaded && tracks.length > 0) {
      // 먼저 localStorage에서 임시 저장된 내용 확인
      const draft = loadDraft();

      if (draft) {
        // 임시 저장 내용이 있으면 복원
        setTitle(draft.title || "");
        setDescription(draft.description || "");
        setGithubPath(draft.githubPath || "");
        setDeployUrl(draft.deployUrl || "");
        setTechStacks(draft.techStacks || []);
        setMembers(draft.members || []);
      } else {
        // 임시 저장 내용이 없으면 서버 데이터 사용
        setTitle(project.title || "");
        setDescription(project.description || "");

        // GitHub URL에서 경로만 추출
        if (project.githubUrl) {
          const path = project.githubUrl.replace(
            /^https?:\/\/github\.com\//i,
            "",
          );
          setGithubPath(path);
        }

        setDeployUrl(project.deployUrl || "");
        setTechStacks(project.techStacks || []);

        // 멤버 데이터 로드
        if (project.members && Array.isArray(project.members)) {
          const loadedMembers = project.members.map((member) => {
            const resolvedTrackId =
              tracks.find((track) => track.trackName === member.trackName)
                ?.trackId ?? null;

            return {
              id: createMemberId(),
              userId: member.userId,
              name: member.name || "",
              trackId: resolvedTrackId,
              position: member.position || "",
            };
          });
          setMembers(loadedMembers);
        }
      }

      setExistingThumbnailUrl(project.thumbnailImageUrl || "");
      setIsDataLoaded(true);
    }
  }, [project, isDataLoaded, tracks]);

  // 폼 데이터 변경 시 localStorage에 자동 저장
  useEffect(() => {
    if (isDataLoaded && Object.keys(dirtyFields).length > 0) {
      saveDraft();
    }
  }, [
    title,
    description,
    githubPath,
    deployUrl,
    techStacks,
    members,
    isDataLoaded,
    dirtyFields,
  ]);

  // 새로고침 방지 - 변경사항이 있을 때
  useEffect(() => {
    const hasChanges = Object.keys(dirtyFields).length > 0;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges && !isSubmitting) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [dirtyFields, isSubmitting]);

  useEffect(() => {
    if (!thumbnail) {
      setThumbnailPreview(null);
      return;
    }

    const previewUrl = URL.createObjectURL(thumbnail);
    setThumbnailPreview(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [thumbnail]);

  const setFieldError = (field: string, message: string | null) => {
    setFieldErrors((prev) => {
      if (!message) {
        if (!prev[field]) return prev;
        const next = { ...prev };
        delete next[field];
        return next;
      }
      return { ...prev, [field]: message };
    });
  };

  const validateField = (field: string) => {
    switch (field) {
      case "title":
        setFieldError(
          "title",
          title.trim() ? null : "프로젝트 제목은 필수입니다.",
        );
        break;
      case "description":
        setFieldError(
          "description",
          description.trim() ? null : "프로젝트 설명은 필수입니다.",
        );
        break;
      case "githubUrl":
        if (!githubPath.trim()) {
          setFieldError("githubUrl", "GitHub URL은 필수입니다.");
        } else if (/\s/.test(githubPath)) {
          setFieldError(
            "githubUrl",
            "GitHub 경로에 공백이 포함될 수 없습니다.",
          );
        } else {
          setFieldError("githubUrl", null);
        }
        break;
      case "deployUrl":
        if (!deployUrl.trim()) {
          setFieldError("deployUrl", null);
        } else {
          try {
            new URL(deployUrl);
            setFieldError("deployUrl", null);
          } catch {
            setFieldError("deployUrl", "유효한 배포 URL을 입력해주세요.");
          }
        }
        break;
      case "techStacks":
        setFieldError(
          "techStacks",
          techStacks.length > 0 ? null : "기술 스택을 최소 1개 입력해주세요.",
        );
        break;
      default:
        break;
    }
  };

  const markTouched = (field: string) => {
    setTouchedFields((prev) => ({ ...prev, [field]: true }));
    validateField(field);
  };

  const markDirty = (field: string) => {
    setDirtyFields((prev) => ({ ...prev, [field]: true }));
  };

  const shouldShowError = (field: string) =>
    !!fieldErrors[field] && (dirtyFields[field] || submitAttempted);

  const addTechStacks = (rawValue: string) => {
    const parsed = rawValue
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    if (parsed.length === 0) return;

    setTechStacks((prev) => {
      const next = new Set(prev);
      parsed.forEach((item) => next.add(item));
      return Array.from(next);
    });
    if (touchedFields.techStacks) {
      validateField("techStacks");
    }
  };

  const handleTechKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addTechStacks(techInput);
      setTechInput("");
    }
  };

  const handleTechBlur = () => {
    if (techInput.trim()) {
      addTechStacks(techInput);
      setTechInput("");
    }
    markTouched("techStacks");
  };

  const removeTech = (tech: string) => {
    setTechStacks((prev) => prev.filter((item) => item !== tech));
    if (touchedFields.techStacks) {
      validateField("techStacks");
    }
  };

  const addMember = () => {
    setMembers((prev) => [
      ...prev,
      {
        id: createMemberId(),
        userId: null,
        name: "",
        trackId: null,
        position: "",
      },
    ]);
  };

  const updateMember = (
    index: number,
    field: keyof MemberDraft,
    value: string | number | null,
  ) => {
    setMembers((prev) =>
      prev.map((member, idx) =>
        idx === index ? { ...member, [field]: value } : member,
      ),
    );
  };

  const removeMember = (index: number) => {
    setMembers((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitAttempted(true);
    setFormError(null);
    setFieldErrors({});

    const nextFieldErrors: Record<string, string> = {};

    if (!title.trim()) nextFieldErrors.title = "프로젝트 제목은 필수입니다.";
    if (!description.trim()) {
      nextFieldErrors.description = "프로젝트 설명은 필수입니다.";
    }
    if (!githubPath.trim()) {
      nextFieldErrors.githubUrl = "GitHub URL은 필수입니다.";
    } else if (/\s/.test(githubPath)) {
      nextFieldErrors.githubUrl = "GitHub 경로에 공백이 포함될 수 없습니다.";
    }

    if (deployUrl.trim()) {
      try {
        new URL(deployUrl);
      } catch {
        nextFieldErrors.deployUrl = "유효한 배포 URL을 입력해주세요.";
      }
    }

    if (techStacks.length === 0) {
      nextFieldErrors.techStacks = "기술 스택을 최소 1개 입력해주세요.";
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      setFormError("필수 입력값을 확인해주세요.");
      return;
    }

    setIsSubmitting(true);

    try {
      const filteredMembers = members
        .filter((member) => member.userId && member.position.trim())
        .map((member) => ({
          userId: member.userId,
          position: member.position.trim(),
        }));

      const payload = {
        title,
        description,
        githubUrl: `https://github.com/${githubPath.trim()}`,
        deployUrl: deployUrl.trim() || null,
        techStacks,
        members: filteredMembers,
      };

      // 항상 multipart로 전송 (백엔드가 multipart만 받음)
      const formData = new FormData();
      formData.append(
        "data",
        new Blob([JSON.stringify(payload)], { type: "application/json" }),
      );

      // 썸네일이 변경된 경우에만 추가
      if (thumbnail) {
        formData.append("thumbnailImage", thumbnail);
      }

      await api.upload(`/projects/${projectId}`, formData, "PATCH");

      // 캐시 무효화 - 수정 후 즐시 반영
      queryClient.invalidateQueries({
        queryKey: ["project", projectId],
      });
      queryClient.invalidateQueries({
        queryKey: ["projects"],
      });

      // localStorage 클리어
      clearDraft();

      router.push(`/projects/${projectId}`);
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.errors && error.errors.length > 0) {
          const apiFieldErrors: Record<string, string> = {};
          error.errors.forEach((item) => {
            if (item.field) {
              apiFieldErrors[item.field] = item.reason;
            }
          });
          setFieldErrors(apiFieldErrors);
        }
        setFormError(error.message || "요청 처리 중 오류가 발생했습니다.");
      } else {
        setFormError("요청 처리 중 오류가 발생했습니다.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <FolderEdit className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">로그인이 필요합니다</h2>
        <p className="text-muted-foreground mb-4">
          프로젝트를 수정하려면 로그인이 필요합니다.
        </p>
        <Button onClick={() => router.push("/signin")}>로그인하기</Button>
      </div>
    );
  }

  if (isLoadingProject) {
    return (
      <div className="mx-auto flex max-w-3xl items-center justify-center px-4 py-20">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">프로젝트를 찾을 수 없습니다</h1>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">프로젝트 수정</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          프로젝트 정보를 수정합니다.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-8">
        {formError && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {formError}
          </div>
        )}

        <section className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium">
              프로젝트 제목
            </label>
            <Input
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                if (touchedFields.title) validateField("title");
                markDirty("title");
              }}
              onBlur={() => markTouched("title")}
              placeholder="프로젝트명을 입력하세요"
              maxLength={100}
              required
            />
            {shouldShowError("title") && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.title}</p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              프로젝트 설명
            </label>
            <Textarea
              value={description}
              onChange={(event) => {
                setDescription(event.target.value);
                if (touchedFields.description) validateField("description");
                markDirty("description");
              }}
              onBlur={() => markTouched("description")}
              placeholder="프로젝트를 간단히 소개해주세요"
              rows={4}
              required
            />
            {shouldShowError("description") && (
              <p className="mt-1 text-xs text-red-600">
                {fieldErrors.description}
              </p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">GitHub URL</label>
            <Input
              value={githubPath}
              onChange={(event) => {
                const nextValue = event.target.value.replace(
                  /^https?:\/\/github\.com\//i,
                  "",
                );
                setGithubPath(nextValue);
                if (touchedFields.githubUrl) validateField("githubUrl");
                markDirty("githubUrl");
              }}
              onBlur={() => markTouched("githubUrl")}
              placeholder="https://github.com/user/repo 또는 user/repo"
              required
            />
            <p className="mt-1 text-xs text-muted-foreground">
              전체 URL을 붙여넣거나 user/repo 형식으로 입력하세요
            </p>
            {shouldShowError("githubUrl") && (
              <p className="mt-1 text-xs text-red-600">
                {fieldErrors.githubUrl}
              </p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              배포 URL (선택)
            </label>
            <Input
              value={deployUrl}
              onChange={(event) => {
                setDeployUrl(event.target.value);
                if (touchedFields.deployUrl) validateField("deployUrl");
                markDirty("deployUrl");
              }}
              onBlur={() => markTouched("deployUrl")}
              placeholder="https://your-project.com"
              type="url"
            />
            {shouldShowError("deployUrl") && (
              <p className="mt-1 text-xs text-red-600">
                {fieldErrors.deployUrl}
              </p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              썸네일 이미지 (선택)
            </label>
            <Input
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                if (file) {
                  const maxSize = 5 * 1024 * 1024; // 5MB
                  if (file.size > maxSize) {
                    setFieldError(
                      "thumbnailImage",
                      "이미지 크기는 5M 이하로 업로드해주세요.",
                    );
                    setThumbnail(null);
                    event.target.value = "";
                    return;
                  }
                  setFieldError("thumbnailImage", null);
                }
                setThumbnail(file);
                markDirty("thumbnailImage");
              }}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              변경하지 않으면 기존 이미지가 유지됩니다 (최대 5M)
            </p>
            {shouldShowError("thumbnailImage") && (
              <p className="mt-1 text-xs text-red-600">
                {fieldErrors.thumbnailImage}
              </p>
            )}
            {thumbnailPreview && (
              <div className="mt-3 overflow-hidden rounded-lg border border-border">
                <img
                  src={thumbnailPreview}
                  alt="새 썸네일 미리보기"
                  className="h-48 w-full object-cover"
                />
              </div>
            )}
            {!thumbnailPreview && existingThumbnailUrl && (
              <div className="mt-3 overflow-hidden rounded-lg border border-border">
                <img
                  src={
                    existingThumbnailUrl.startsWith("http")
                      ? existingThumbnailUrl
                      : `http://${existingThumbnailUrl}`
                  }
                  alt="현재 썸네일"
                  className="h-48 w-full object-cover opacity-60"
                />
                <p className="p-2 text-center text-xs text-muted-foreground">
                  현재 썸네일
                </p>
              </div>
            )}
          </div>
        </section>

        <Separator />

        <section className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium">기술 스택</label>
            <Input
              value={techInput}
              onChange={(event) => {
                setTechInput(event.target.value);
                markDirty("techStacks");
              }}
              onKeyDown={handleTechKeyDown}
              onBlur={handleTechBlur}
              placeholder="쉼표(,) 또는 Enter로 태그 추가"
            />
            {shouldShowError("techStacks") && (
              <p className="mt-1 text-xs text-red-600">
                {fieldErrors.techStacks}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {techStacks.map((tech) => (
              <Badge
                key={tech}
                className="bg-gray-200 text-gray-700 hover:bg-gray-300"
              >
                {tech}
                <button
                  type="button"
                  onClick={() => removeTech(tech)}
                  className="ml-2 text-xs text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </Badge>
            ))}
          </div>
        </section>

        <Separator />

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">팀 멤버</h2>
            <Button type="button" variant="outline" onClick={addMember}>
              멤버 추가
            </Button>
          </div>

          {members.length === 0 && (
            <p className="text-sm text-muted-foreground">
              필요한 경우 멤버 정보를 추가해주세요.
            </p>
          )}

          <div className="space-y-6">
            {members.map((member, index) => (
              <div
                key={member.id}
                className="rounded-lg border border-border p-6"
              >
                <div className="grid gap-6 sm:grid-cols-3">
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      이름
                    </label>
                    <div className="relative">
                      <Input
                        value={member.name}
                        onChange={(event) => {
                          updateMember(index, "name", event.target.value);
                          updateMember(index, "userId", null);
                          setActiveMemberIndex(index);
                        }}
                        onFocus={() => setActiveMemberIndex(index)}
                        onBlur={() =>
                          setTimeout(() => {
                            setActiveMemberIndex((prev) =>
                              prev === index ? null : prev,
                            );
                          }, 200)
                        }
                        placeholder="멤버 이름 검색"
                      />
                      {activeMemberIndex === index &&
                        member.name.trim() &&
                        (mentionUsers ?? []).filter((u: UserSummary) =>
                          u.name
                            .toLowerCase()
                            .includes(member.name.trim().toLowerCase()),
                        ).length > 0 && (
                          <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-48 overflow-y-auto rounded-md border border-border bg-popover shadow-md">
                            {(mentionUsers ?? [])
                              .filter((u: UserSummary) =>
                                u.name
                                  .toLowerCase()
                                  .includes(member.name.trim().toLowerCase()),
                              )
                              .slice(0, 8)
                              .map((u: UserSummary) => (
                                <button
                                  key={u.userId}
                                  type="button"
                                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent"
                                  onMouseDown={(event) => {
                                    event.preventDefault();
                                    updateMember(index, "name", u.name);
                                    updateMember(index, "userId", u.userId);
                                    updateMember(
                                      index,
                                      "trackId",
                                      resolveTrackId(u.trackName),
                                    );
                                    setActiveMemberIndex(null);
                                  }}
                                >
                                  <span className="font-medium">
                                    {u.name}
                                    {u.trackName ? ` (${u.trackName})` : ""}
                                  </span>
                                </button>
                              ))}
                          </div>
                        )}
                    </div>
                    {member.name.trim() && !member.userId && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        목록에서 유저를 선택해주세요.
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      트랙
                    </label>
                    <select
                      value={member.trackId ?? ""}
                      onChange={(event) =>
                        updateMember(
                          index,
                          "trackId",
                          event.target.value
                            ? Number(event.target.value)
                            : null,
                        )
                      }
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                      required={!!member.userId}
                    >
                      <option value="">트랙 선택</option>
                      {tracks.map((track) => (
                        <option key={track.trackId} value={track.trackId}>
                          {track.trackName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      포지션
                    </label>
                    <select
                      value={member.position}
                      onChange={(event) =>
                        updateMember(index, "position", event.target.value)
                      }
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                      required={!!member.userId}
                    >
                      <option value="">포지션 선택</option>
                      {POSITION_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => removeMember(index)}
                  >
                    제거
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              clearDraft();
              router.back();
            }}
            disabled={isSubmitting}
          >
            취소
          </Button>
          <Button
            type="submit"
            className="bg-orange-400 text-white hover:bg-orange-500 hover:text-white"
            disabled={isSubmitting}
          >
            {isSubmitting ? "수정 중..." : "프로젝트 수정"}
          </Button>
        </div>
      </form>
    </div>
  );
}
