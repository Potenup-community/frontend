"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { api, ApiError, AdminTrack } from "@/lib/api";
import { Loader2, FolderPlus } from "lucide-react";

interface MemberDraft {
  id: string;
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

export default function ProjectCreatePage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [githubPath, setGithubPath] = useState("");
  const [deployUrl, setDeployUrl] = useState("");
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
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

  // Fetch available tracks
  const { data: tracksData } = useQuery({
    queryKey: ["tracks"],
    queryFn: () =>
      api
        .get<{ content: AdminTrack[] }>("/admin/tracks")
        .then((res) => res.content),
  });

  const tracks = tracksData ?? [];

  useEffect(() => {
    if (!thumbnail) {
      setThumbnailPreview(null);
      return;
    }

    const previewUrl = URL.createObjectURL(thumbnail);
    setThumbnailPreview(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [thumbnail]);

  useEffect(() => {
    if (user?.name && members.length === 0) {
      setMembers([
        {
          id: createMemberId(),
          name: user.name,
          trackId: user.trackId ?? null,
          position: "",
        },
      ]);
    }
  }, [user?.name, user?.trackId, members.length]);

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
      case "thumbnailImage":
        setFieldError(
          "thumbnailImage",
          thumbnail ? null : "썸네일 이미지를 업로드해주세요.",
        );
        break;
      case "techStacks":
        setFieldError(
          "techStacks",
          techStacks.length > 0 ? null : "기술 스택을 최소 1개 입력해주세요.",
        );
        break;
      case "myPosition":
        setFieldError(
          "myPosition",
          user?.name && !members[0]?.position
            ? "내 포지션을 선택해주세요."
            : null,
        );
        break;
      case "myTrack":
        setFieldError(
          "myTrack",
          user?.name && !members[0]?.trackId ? "트랙을 선택해주세요." : null,
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
      { id: createMemberId(), name: "", trackId: null, position: "" },
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

    if (!thumbnail) {
      nextFieldErrors.thumbnailImage = "썸네일 이미지를 업로드해주세요.";
    }

    if (techStacks.length === 0) {
      nextFieldErrors.techStacks = "기술 스택을 최소 1개 입력해주세요.";
    }

    if (user?.name && !members[0]?.position) {
      nextFieldErrors.myPosition = "내 포지션을 선택해주세요.";
    }

    if (user?.name && !members[0]?.trackId) {
      nextFieldErrors.myTrack = "트랙을 선택해주세요.";
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      setFormError("필수 입력값을 확인해주세요.");
      return;
    }

    setIsSubmitting(true);

    try {
      const filteredMembers = members
        .map((member) => ({
          name: member.name.trim(),
          trackId: member.trackId,
          position: member.position.trim(),
        }))
        .filter((member) => member.name && member.trackId && member.position);

      const payload = {
        title,
        description,
        githubUrl: `https://github.com/${githubPath.trim()}`,
        deployUrl: deployUrl.trim() || null,
        techStacks,
        members: filteredMembers,
      };

      const formData = new FormData();
      formData.append(
        "data",
        new Blob([JSON.stringify(payload)], { type: "application/json" }),
      );
      formData.append("thumbnailImage", thumbnail as File);

      const response = await api.upload<any>("/projects", formData);

      // 응답 전체 로깅 (디버깅용)
      console.log("Project creation response:", response);

      // 여러 필드 시도 (API 응답 구조에 따라)
      const projectId =
        response?.projectId ||
        response?.id ||
        response?.data?.projectId ||
        response?.data?.id;

      console.log("Extracted projectId:", projectId);

      if (projectId) {
        // 약간의 딜레이 후 이동 (서버 sync 보장)
        setTimeout(() => {
          router.push(`/projects/${projectId}`);
        }, 500);
        return;
      }

      console.error("Could not find projectId in response:", response);
      setFormError(
        "등록은 완료됐지만 프로젝트 정보를 찾을 수 없습니다. (응답 확인: " +
          JSON.stringify(response) +
          ")",
      );
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
        <FolderPlus className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">로그인이 필요합니다</h2>
        <p className="text-muted-foreground mb-4">
          프로젝트를 등록하려면 로그인이 필요합니다.
        </p>
        <Button onClick={() => router.push("/signin")}>로그인하기</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">프로젝트 추가</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          프로젝트 정보를 입력하면 갤러리에 등록됩니다.
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
              썸네일 이미지
            </label>
            <Input
              type="file"
              accept="image/*"
              onChange={(event) => {
                setThumbnail(event.target.files?.[0] ?? null);
                if (touchedFields.thumbnailImage) {
                  setTimeout(() => validateField("thumbnailImage"), 0);
                }
                markDirty("thumbnailImage");
              }}
              onBlur={() => markTouched("thumbnailImage")}
              required
            />
            {shouldShowError("thumbnailImage") && (
              <p className="mt-1 text-xs text-red-600">
                {fieldErrors.thumbnailImage}
              </p>
            )}
            {thumbnailPreview && (
              <div className="mt-3 overflow-hidden rounded-lg border border-border">
                <img
                  src={thumbnailPreview}
                  alt="썸네일 미리보기"
                  className="h-48 w-full object-cover"
                />
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
                    <div className="mb-2 flex items-center gap-2">
                      <label className="block text-sm font-medium">이름</label>
                      {index === 0 && user?.name && (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                          본인
                        </span>
                      )}
                    </div>
                    <Input
                      value={member.name}
                      onChange={(event) =>
                        updateMember(index, "name", event.target.value)
                      }
                      placeholder="멤버 이름"
                      readOnly={index === 0 && !!user?.name}
                      className={
                        index === 0 && user?.name
                          ? "bg-gray-50 text-gray-700"
                          : undefined
                      }
                      required={index === 0 && !!user?.name}
                    />
                    {index === 0 && user?.name && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        본인 이름은 자동 입력됩니다.
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
                      onBlur={() => markTouched("myTrack")}
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                      disabled={index === 0 && !!user?.trackId}
                      required={index === 0 || !!member.name.trim()}
                    >
                      <option value="">트랙 선택</option>
                      {tracks.map((track) => (
                        <option key={track.trackId} value={track.trackId}>
                          {track.trackName}
                        </option>
                      ))}
                    </select>
                    {index === 0 && shouldShowError("myTrack") && (
                      <p className="mt-1 text-xs text-red-600">
                        {fieldErrors.myTrack}
                      </p>
                    )}
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
                      onBlur={() => markTouched("myPosition")}
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                      required={index === 0 || !!member.name.trim()}
                    >
                      <option value="">포지션 선택</option>
                      {POSITION_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {index === 0 && shouldShowError("myPosition") && (
                      <p className="mt-1 text-xs text-red-600">
                        {fieldErrors.myPosition}
                      </p>
                    )}
                  </div>
                </div>
                {!(index === 0 && user?.name) && (
                  <div className="mt-3 flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => removeMember(index)}
                    >
                      제거
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <div className="flex justify-end gap-3">
          <Button
            type="submit"
            className="bg-orange-400 text-white hover:bg-orange-500 hover:text-white"
            disabled={isSubmitting}
          >
            {isSubmitting ? "등록 중..." : "프로젝트 등록"}
          </Button>
        </div>
      </form>
    </div>
  );
}
