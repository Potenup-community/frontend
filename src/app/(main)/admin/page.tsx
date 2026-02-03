'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Users, Clock, CheckCircle, XCircle, Loader2, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { UserAvatar } from '@/components/ui/UserAvatar';
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
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

interface AdminUser {
  id: number;
  name: string;
  email: string;
  trackId: number;
  trackName: string;
  profileImageUrl?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

interface AdminUsersResponse {
  content: AdminUser[];
  pageNumber: number;
  pageSize: number;
  hasNext: boolean;
  totalElements?: number;
}

type DecisionType = 'APPROVED' | 'REJECTED';

export default function AdminPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [decisionType, setDecisionType] = useState<DecisionType | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // 권한 체크
  if (authLoading) {
    return <AdminPageSkeleton />;
  }

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Shield className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">접근 권한이 없습니다</h2>
        <p className="text-muted-foreground mb-4">관리자만 접근할 수 있는 페이지입니다.</p>
        <Button onClick={() => router.push('/')}>홈으로 돌아가기</Button>
      </div>
    );
  }

  return <AdminContent />;
}

function AdminContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [decisionType, setDecisionType] = useState<DecisionType | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');

  // 유저 목록 조회
  const { data: pendingUsers, isLoading: pendingLoading } = useQuery({
    queryKey: ['admin', 'users', 'PENDING'],
    queryFn: async () => {
      const res = await api.get<AdminUsersResponse>('/admin/users', { status: 'PENDING' });
      return res.content || [];
    },
  });

  const { data: approvedUsers, isLoading: approvedLoading } = useQuery({
    queryKey: ['admin', 'users', 'APPROVED'],
    queryFn: async () => {
      const res = await api.get<AdminUsersResponse>('/admin/users', { status: 'APPROVED' });
      return res.content || [];
    },
  });

  // 유저 승인/거절 mutation
  const decisionMutation = useMutation({
    mutationFn: async ({ userId, decision }: { userId: number; decision: DecisionType }) => {
      await api.post(`/admin/users/${userId}/decision`, { decision });
    },
    onSuccess: (_, variables) => {
      const action = variables.decision === 'APPROVED' ? '승인' : '거절';
      toast.success(`유저가 ${action}되었습니다.`);
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setDialogOpen(false);
      setSelectedUser(null);
      setDecisionType(null);
    },
    onError: () => {
      toast.error('처리 중 오류가 발생했습니다.');
    },
  });

  const handleDecision = (user: AdminUser, decision: DecisionType) => {
    setSelectedUser(user);
    setDecisionType(decision);
    setDialogOpen(true);
  };

  const confirmDecision = () => {
    if (selectedUser && decisionType) {
      decisionMutation.mutate({ userId: selectedUser.id, decision: decisionType });
    }
  };

  const pendingCount = pendingUsers?.length || 0;
  const approvedCount = approvedUsers?.length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            관리자 페이지
          </h1>
          <p className="text-muted-foreground">유저 가입 승인 및 관리</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-amber-100 text-amber-600">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pendingCount}</p>
              <p className="text-sm text-muted-foreground">승인 대기</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{approvedCount}</p>
              <p className="text-sm text-muted-foreground">승인된 유저</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User List Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full">
          <TabsTrigger value="pending" className="flex-1 gap-2">
            <Clock className="h-4 w-4" />
            승인 대기
            {pendingCount > 0 && (
              <Badge variant="destructive" className="ml-1">
                {pendingCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex-1 gap-2">
            <CheckCircle className="h-4 w-4" />
            승인된 유저
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          {pendingLoading ? (
            <UserListSkeleton />
          ) : pendingUsers?.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="대기 중인 유저가 없습니다"
              description="모든 가입 요청이 처리되었습니다."
            />
          ) : (
            <div className="space-y-3">
              {pendingUsers?.map((adminUser) => (
                <UserCard
                  key={adminUser.id}
                  user={adminUser}
                  onApprove={() => handleDecision(adminUser, 'APPROVED')}
                  onReject={() => handleDecision(adminUser, 'REJECTED')}
                  showActions
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="approved" className="mt-4">
          {approvedLoading ? (
            <UserListSkeleton />
          ) : approvedUsers?.length === 0 ? (
            <EmptyState
              icon={Users}
              title="승인된 유저가 없습니다"
              description="아직 승인된 유저가 없습니다."
            />
          ) : (
            <div className="space-y-3">
              {approvedUsers?.map((adminUser) => (
                <UserCard key={adminUser.id} user={adminUser} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Confirmation Dialog */}
      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {decisionType === 'APPROVED' ? '유저 승인' : '유저 거절'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedUser?.name}님의 가입을{' '}
              {decisionType === 'APPROVED' ? '승인' : '거절'}하시겠습니까?
              {decisionType === 'REJECTED' && (
                <span className="block mt-2 text-destructive">
                  거절된 유저는 서비스를 이용할 수 없습니다.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDecision}
              disabled={decisionMutation.isPending}
              className={decisionType === 'REJECTED' ? 'bg-destructive hover:bg-destructive/90' : ''}
            >
              {decisionMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : decisionType === 'APPROVED' ? (
                '승인'
              ) : (
                '거절'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bottom padding for mobile nav */}
      <div className="h-20 lg:h-0" />
    </div>
  );
}

function UserCard({
  user,
  onApprove,
  onReject,
  showActions = false,
}: {
  user: AdminUser;
  onApprove?: () => void;
  onReject?: () => void;
  showActions?: boolean;
}) {
  const timeAgo = formatDistanceToNow(new Date(user.createdAt), {
    addSuffix: true,
    locale: ko,
  });

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <UserAvatar
            src={user.profileImageUrl}
            name={user.name}
            className="h-12 w-12"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium truncate">{user.name}</p>
              <Badge variant="outline" className="text-xs">
                {user.trackName}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground truncate">{user.email}</p>
            <p className="text-xs text-muted-foreground mt-1">{timeAgo} 가입 요청</p>
          </div>
          {showActions && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={onReject}
                className="text-destructive hover:text-destructive"
              >
                <XCircle className="h-4 w-4 mr-1" />
                거절
              </Button>
              <Button size="sm" onClick={onApprove}>
                <CheckCircle className="h-4 w-4 mr-1" />
                승인
              </Button>
            </div>
          )}
          {!showActions && user.status === 'APPROVED' && (
            <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
              승인됨
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center py-12">
      <Icon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="font-medium mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function UserListSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-5 w-32 mb-2" />
                <Skeleton className="h-4 w-48" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-9 w-16" />
                <Skeleton className="h-9 w-16" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function AdminPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10" />
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <Skeleton className="h-10 w-full" />
      <UserListSkeleton />
    </div>
  );
}
