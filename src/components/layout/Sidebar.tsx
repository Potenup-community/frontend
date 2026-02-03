'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Flame, Hash, Construction } from 'lucide-react';

export function Sidebar() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return <SidebarSkeleton />;
  }

  return (
    <aside className="w-72 flex-shrink-0 hidden lg:block">
      <div className="sticky top-24 space-y-4">
        {/* User Profile Card */}
        {isAuthenticated && user ? (
          <Card className="overflow-hidden border-border/50">
            <div className="h-20 bg-gradient-to-br from-primary/80 via-primary to-primary/60" />
            <CardContent className="pt-0 -mt-10">
              <div className="flex flex-col items-center text-center">
                <UserAvatar
                  src={user.profileImageUrl}
                  name={user.name}
                  className="h-16 w-16 border-4 border-card shadow-lg"
                />
                <h3 className="mt-3 font-semibold text-lg">{user.name}</h3>
                <p className="text-sm text-muted-foreground">{user.trackName}</p>

                <div className="grid grid-cols-3 gap-4 mt-4 w-full pt-4 border-t border-border">
                  <Link href="/mypage/post" className="text-center group">
                    <div className="text-lg font-bold text-muted-foreground group-hover:text-primary transition-colors">
                      -
                    </div>
                    <div className="text-xs text-muted-foreground">게시글</div>
                  </Link>
                  <Link href="/mypage/comment" className="text-center group">
                    <div className="text-lg font-bold text-muted-foreground group-hover:text-primary transition-colors">
                      -
                    </div>
                    <div className="text-xs text-muted-foreground">댓글</div>
                  </Link>
                  <Link href="/mypage/like" className="text-center group">
                    <div className="text-lg font-bold text-muted-foreground group-hover:text-primary transition-colors">
                      -
                    </div>
                    <div className="text-xs text-muted-foreground">좋아요</div>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold mb-1">로그인이 필요합니다</h3>
              <p className="text-sm text-muted-foreground mb-4">
                커뮤니티에 참여하고 다양한 기능을 이용해보세요
              </p>
              <Button onClick={() => router.push('/signin')} className="w-full">
                로그인
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Trending Posts - Coming Soon */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Flame className="h-4 w-4 text-rose-500 fill-rose-500" />
              지금 뜨는 이야기
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center py-4 text-center">
              <Construction className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">기능 추가예정</p>
            </div>
          </CardContent>
        </Card>

        {/* Popular Tags - Coming Soon */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Hash className="h-4 w-4 text-blue-500" />
              인기 키워드
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center py-4 text-center">
              <Construction className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">기능 추가예정</p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-xs text-muted-foreground text-center space-y-1 pt-2">
          <p>© 2025 Depth</p>
          <div className="flex justify-center gap-3">
            <Link href="/terms" className="hover:text-foreground transition-colors">이용약관</Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">개인정보처리방침</Link>
          </div>
        </div>
      </div>
    </aside>
  );
}

function SidebarSkeleton() {
  return (
    <aside className="w-72 flex-shrink-0 hidden lg:block">
      <div className="sticky top-24 space-y-4">
        <Card>
          <div className="h-16 skeleton rounded-t-lg rounded-b-none" />
          <CardContent className="pt-0 -mt-8">
            <div className="flex flex-col items-center">
              <Skeleton className="h-16 w-16 rounded-full" />
              <Skeleton className="h-5 w-24 mt-3" />
              <Skeleton className="h-4 w-32 mt-2" />
              <div className="grid grid-cols-3 gap-4 mt-4 w-full pt-4 border-t border-border">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="text-center">
                    <Skeleton className="h-6 w-8 mx-auto" />
                    <Skeleton className="h-3 w-12 mx-auto mt-1" />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-16 w-full" />
          </CardContent>
        </Card>
      </div>
    </aside>
  );
}
