'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useMutation } from '@tanstack/react-query';
import { resumeReviewApi, CreateResumeReviewRequest } from '@/lib/api';
import { toast } from 'sonner';
import Link from 'next/link';

const SECTION_CONFIG: Array<{
  key: keyof Omit<CreateResumeReviewRequest, 'resumeReviewTitle' | 'jdUrl'>;
  label: string;
  placeholder: string;
  required: boolean;
}> = [
  {
    key: 'summary',
    label: '자기소개 / 요약',
    placeholder: '본인의 강점과 커리어 목표를 간략히 작성해주세요.',
    required: true,
  },
  {
    key: 'skills',
    label: '기술 스택',
    placeholder: 'Java, Spring Boot, React, TypeScript 등 보유 기술을 작성해주세요.',
    required: true,
  },
  {
    key: 'experience',
    label: '경력 사항',
    placeholder: '회사명, 직책, 기간, 주요 업무 및 성과를 작성해주세요.',
    required: true,
  },
  {
    key: 'education',
    label: '학력',
    placeholder: '학교명, 전공, 졸업년도를 작성해주세요.',
    required: true,
  },
  {
    key: 'projects',
    label: '프로젝트',
    placeholder: '프로젝트명, 기간, 사용 기술, 주요 기여 내용을 작성해주세요.',
    required: true,
  },
  {
    key: 'cert',
    label: '자격증 / 수상',
    placeholder: '보유 자격증이나 수상 경력을 작성해주세요.',
    required: true,
  },
];

export default function NewResumeReviewPage() {
  const router = useRouter();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [form, setForm] = useState<CreateResumeReviewRequest>({
    resumeReviewTitle: '',
    jdUrl: '',
    summary: '',
    skills: '',
    experience: '',
    education: '',
    projects: '',
    cert: '',
  });

  const mutation = useMutation({
    mutationFn: (data: CreateResumeReviewRequest) => resumeReviewApi.createReview(data),
    onSuccess: (result) => {
      toast.success('이력서 첨삭 요청이 접수되었습니다.');
      router.push(`/mypage/resume-review/${result.resumeReviewId}`);
    },
    onError: () => {
      toast.error('첨삭 요청에 실패했습니다. 다시 시도해주세요.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.resumeReviewTitle.trim()) {
      toast.error('제목을 입력해주세요.');
      return;
    }
    const requiredFields = SECTION_CONFIG.filter((s) => s.required);
    for (const field of requiredFields) {
      if (!form[field.key]?.trim()) {
        toast.error(`${field.label}을(를) 입력해주세요.`);
        return;
      }
    }
    const data: CreateResumeReviewRequest = {
      ...form,
      jdUrl: form.jdUrl?.trim() || undefined,
    };
    mutation.mutate(data);
  };

  const handleChange = (
    key: keyof CreateResumeReviewRequest,
    value: string,
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/mypage/resume-review">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h2 className="text-lg font-semibold">이력서 첨삭 요청</h2>
      </div>

      <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20">
        <CardContent className="p-4">
          <div className="flex gap-2">
            <Info className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
            <p className="text-sm text-blue-700 dark:text-blue-300">
              AI가 이력서 각 섹션을 분석하여 개선점을 제안합니다. 지원하는 공고 URL을 함께 입력하면 더욱 맞춤화된 피드백을 받을 수 있습니다.
            </p>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">기본 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">
                제목 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder="예: 2026 상반기 백엔드 개발자 지원용"
                value={form.resumeReviewTitle}
                onChange={(e) => handleChange('resumeReviewTitle', e.target.value)}
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jdUrl">채용 공고 URL (선택)</Label>
              <Input
                id="jdUrl"
                type="url"
                placeholder="https://..."
                value={form.jdUrl || ''}
                onChange={(e) => handleChange('jdUrl', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                지원하려는 직무의 JD를 입력하면 더욱 맞춤화된 피드백을 받을 수 있습니다.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">이력서 내용</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {SECTION_CONFIG.map((section) => (
              <div key={section.key} className="space-y-2">
                <Label htmlFor={section.key}>
                  {section.label}
                  {section.required && (
                    <span className="text-destructive ml-1">*</span>
                  )}
                </Label>
                <Textarea
                  id={section.key}
                  placeholder={section.placeholder}
                  value={form[section.key]}
                  onChange={(e) => handleChange(section.key, e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-end">
          <Button
            type="button"
            variant="secondary"
            className="font-semibold"
            onClick={() => setCancelDialogOpen(true)}
            disabled={mutation.isPending}
          >
            취소
          </Button>
          <Button
            type="submit"
            variant="secondary"
            disabled={mutation.isPending}
            className="font-semibold"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                요청 중...
              </>
            ) : (
              '첨삭 요청하기'
            )}
          </Button>
        </div>
      </form>

      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>작성 취소</AlertDialogTitle>
            <AlertDialogDescription>
              지금 취소하면 입력한 정보는 저장되지 않습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>계속 작성</AlertDialogCancel>
            <AlertDialogAction onClick={() => router.push('/')}>
              확인
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
