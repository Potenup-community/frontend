"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background py-12 sm:py-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold">개인정보처리방침</h1>
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
            <h2 className="text-xl font-semibold">1. 개인정보의 수집</h2>
            <p>
              PotenUp 커뮤니티(이하 "회사")는 서비스 제공을 위해 다음의
              개인정보를 수집합니다:
            </p>
            <ul className="list-inside list-disc space-y-2">
              <li>이메일 주소</li>
              <li>이름</li>
              <li>전화번호</li>
              <li>프로필 정보</li>
              <li>서비스 이용 기록</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">2. 개인정보 수집 방법</h2>
            <ul className="list-inside list-disc space-y-2">
              <li>회원 가입 시 직접 입력</li>
              <li>서비스 이용 중 자동 수집 (쿠키, 로그 기록 등)</li>
              <li>제3자 서비스 연동 (Google 계정 등)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">3. 개인정보의 이용</h2>
            <p>수집된 개인정보는 다음의 목적으로만 이용됩니다:</p>
            <ul className="list-inside list-disc space-y-2">
              <li>서비스 제공 및 계정 관리</li>
              <li>고객 지원 및 문의 응답</li>
              <li>서비스 개선 및 분석</li>
              <li>법적 의무 이행</li>
              <li>부정 행위 방지</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">
              4. 개인정보의 공개 및 제3자 제공
            </h2>
            <p>
              회사는 원칙적으로 개인정보를 제3자에게 제공하지 않습니다. 단,
              다음의 경우는 예외입니다:
            </p>
            <ul className="list-inside list-disc space-y-2">
              <li>법령에 의한 요청</li>
              <li>사용자의 명시적 동의</li>
              <li>서비스 제공에 필수적인 경우 (결제 처리 등)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">5. 개인정보 보안</h2>
            <p>
              회사는 개인정보 보호를 위해 다음과 같은 보안 조치를 실시합니다:
            </p>
            <ul className="list-inside list-disc space-y-2">
              <li>암호화된 통신 (HTTPS)</li>
              <li>접근 제어 및 권한 관리</li>
              <li>정기적인 보안 감시</li>
              <li>직원 교육</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">6. 개인정보 보유 기간</h2>
            <p>
              개인정보는 서비스 이용 기간 동안 보유되며, 탈퇴 요청 시 지체 없이
              삭제됩니다. 단, 법령에 따라 보유가 필요한 경우는 해당 기간만큼
              보유됩니다.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">7. 사용자의 권리</h2>
            <p>사용자는 다음의 권리를 행사할 수 있습니다:</p>
            <ul className="list-inside list-disc space-y-2">
              <li>개인정보 열람 요청</li>
              <li>개인정보 수정 요청</li>
              <li>개인정보 삭제 요청 (계정 탈퇴)</li>
              <li>개인정보 처리 정지 요청</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">8. 쿠키 및 추적 기술</h2>
            <p>
              회사는 서비스 개선을 위해 쿠키와 유사한 기술을 사용할 수 있습니다.
              사용자는 브라우저 설정을 통해 쿠키 사용을 제한할 수 있습니다.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">9. 정책 변경</h2>
            <p>
              회사는 필요시 개인정보처리방침을 변경할 수 있으며, 변경사항은 본
              페이지에 공지됩니다.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">10. 문의</h2>
            <p>
              개인정보 처리에 관한 문의 또는 불만사항이 있으신 경우, 아래로
              연락주시기 바랍니다:
            </p>
            <ul className="list-inside list-disc space-y-2">
              <li>이메일: potenup-community@gmail.com</li>
              <li>고객지원팀</li>
            </ul>
          </section>

          <section className="border-t border-border pt-6">
            <p className="text-sm text-muted-foreground">
              본 방침은 개인정보보호법 및 관련 법령을 따르고 있습니다.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
