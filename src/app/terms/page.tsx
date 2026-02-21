"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background py-12 sm:py-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold">이용약관</h1>
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              돌아가기
            </Button>
          </Link>
        </div>

        {/* Last Updated */}
        <p className="mb-8 text-sm text-muted-foreground">
          최종 수정일: 2026년 2월 21일
        </p>

        {/* Content */}
        <div className="prose prose-sm max-w-none space-y-6 dark:prose-invert">
          <section>
            <h2 className="text-xl font-semibold">제1조 목적</h2>
            <p>
              본 약관은 PotenUp 커뮤니티(이하 "회사")가 제공하는 서비스의 이용에
              관한 조건 및 절차, 그리고 회원의 권리와 의무를 규정함을 목적으로
              합니다.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">제2조 정의</h2>
            <ul className="list-inside list-disc space-y-2">
              <li>
                <strong>서비스</strong>: 회사가 제공하는 프로젝트 갤러리,
                커뮤니티 기능 등 모든 서비스
              </li>
              <li>
                <strong>회원</strong>: 본 약관을 동의하고 서비스를 이용하는 개인
              </li>
              <li>
                <strong>콘텐츠</strong>: 회원이 서비스에 업로드, 게시하는 모든
                정보
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">제3조 서비스 이용</h2>
            <p>
              회원은 본 약관을 동의함으로써 서비스를 이용할 권리를 갖습니다.
              회사는 서비스의 질 향상을 위해 서비스 내용을 변경할 수 있습니다.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">제4조 회원의 의무</h2>
            <p>회원은 다음 행위를 하지 않아야 합니다:</p>
            <ul className="list-inside list-disc space-y-2">
              <li>타인의 정보 도용 또는 부정 사용</li>
              <li>회사의 시스템에 부정 접근</li>
              <li>욕설, 명예훼손, 개인정보 침해 등의 위법 행위</li>
              <li>스팸, 광고성 정보 게시</li>
              <li>저작권 등 지적재산권 침해</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">제5조 서비스 중단</h2>
            <p>회사는 다음의 사유로 서비스를 중단할 수 있습니다:</p>
            <ul className="list-inside list-disc space-y-2">
              <li>서비스 점검 및 유지보수</li>
              <li>시스템 장애</li>
              <li>회원의 약관 위반</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">제6조 책임의 한계</h2>
            <p>회사는 다음에 대해 책임을 지지 않습니다:</p>
            <ul className="list-inside list-disc space-y-2">
              <li>외부 링크 사이트의 콘텐츠</li>
              <li>회원 간의 분쟁</li>
              <li>천재지변 또는 회사의 제어 범위 밖의 사유</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">제7조 약관 변경</h2>
            <p>
              회사는 필요시 약관을 변경할 수 있으며, 변경된 약관은 공지일로부터
              효력을 발생합니다.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">제8조 준거법</h2>
            <p>
              본 약관은 대한민국 법률에 따라 해석되며, 분쟁은 대한민국 법원의
              관할을 받습니다.
            </p>
          </section>

          <section className="border-t border-border pt-6">
            <p className="text-sm text-muted-foreground">
              본 약관에 대한 문의사항이 있으신 경우, 고객지원팀에 연락주시기
              바랍니다.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
