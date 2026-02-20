import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

export function ProjectDetailSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <Skeleton className="h-64 w-full md:h-[420px]" />

      {/* Main Content */}
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="relative -mt-16 mb-10 md:mb-12">
          <div className="rounded-lg border border-border bg-background p-6 shadow-lg md:p-8">
            <Skeleton className="mb-2 h-10 w-2/3" />
            <Skeleton className="mb-4 h-6 w-full" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16 rounded-md" />
              <Skeleton className="h-6 w-20 rounded-md" />
            </div>
          </div>
        </div>

        {/* Project Info Section */}
        <div className="mb-10 md:mb-12">
          <Skeleton className="mb-4 h-8 w-40" />
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>

        {/* Tech Stack Section */}
        <div className="mb-10 md:mb-12">
          <Skeleton className="mb-4 h-8 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20 rounded-md" />
            <Skeleton className="h-8 w-24 rounded-md" />
            <Skeleton className="h-8 w-16 rounded-md" />
          </div>
        </div>

        {/* Links Section */}
        <div className="mb-10 md:mb-12">
          <Skeleton className="mb-4 h-8 w-40" />
          <div className="flex gap-3">
            <Skeleton className="h-10 w-32 rounded-md" />
            <Skeleton className="h-10 w-24 rounded-md" />
            <Skeleton className="h-10 w-32 rounded-md" />
          </div>
        </div>

        {/* Team Members Section */}
        <div className="mb-10 md:mb-12">
          <Skeleton className="mb-6 h-8 w-32" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-lg border border-border p-4"
              >
                <Skeleton className="h-12 w-12 flex-shrink-0 rounded-full" />
                <div className="min-w-0 flex-grow">
                  <Skeleton className="mb-2 h-4 w-24" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator className="my-10 md:my-12" />

        {/* Back Navigation */}
        <div className="pb-10 md:pb-12">
          <Skeleton className="h-10 w-32 rounded-md" />
        </div>
      </div>
    </div>
  );
}
