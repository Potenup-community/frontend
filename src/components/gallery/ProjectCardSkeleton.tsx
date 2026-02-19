import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ProjectCardSkeleton() {
  return (
    <Card className="h-full overflow-hidden">
      {/* 썸네일 스켈레톤 */}
      <Skeleton className="aspect-video w-full" />

      <CardContent className="p-4">
        {/* 프로젝트명 스켈레톤 */}
        <Skeleton className="mb-2 h-6 w-3/4" />

        {/* 배지들 스켈레톤 */}
        <div className="mb-3 flex gap-2">
          <Skeleton className="h-5 w-12" />
          <Skeleton className="h-5 w-16" />
        </div>

        {/* 설명 스켈레톤 (2줄) */}
        <div className="mb-3 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>

        {/* 기술 스택 스켈레톤 */}
        <div className="flex gap-1.5">
          <Skeleton className="h-5 w-14" />
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-12" />
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Skeleton className="h-4 w-16" />
      </CardFooter>
    </Card>
  );
}
