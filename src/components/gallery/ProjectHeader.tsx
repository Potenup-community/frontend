"use client";

import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";

interface ProjectHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function ProjectHeader({
  searchQuery,
  onSearchChange,
}: ProjectHeaderProps) {
  return (
    <div className="mb-8 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold leading-tight">
          <span className="text-gray-900">포텐업 그라운드,</span>
          <br />
          <span className="text-orange-500">프로젝트 홍보 게시판</span>
        </h1>
        <p className="text-base text-gray-600">
          우리 그라운드 구성원들이 만든 멋진 프로젝트들을 만나보세요!
        </p>
      </div>

      {/* 검색창 + 추가 버튼 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="프로젝트명 검색..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          asChild
          className="h-10 px-4 self-start sm:self-auto bg-orange-500 text-white font-semibold shadow-md hover:bg-orange-600 hover:text-white"
        >
          <Link
            href="/projects/create"
            aria-label="프로젝트 추가"
            className="inline-flex items-center justify-center gap-2"
          >
            <Plus className="h-4 w-4" />
            <span className="text-sm font-medium">프로젝트 추가</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}
