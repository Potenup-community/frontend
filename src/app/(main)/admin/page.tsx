'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Shield,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  ArrowLeft,
  BookOpen,
  GraduationCap,
  Calendar,
  Plus,
  Pencil,
  Trash2,
  Phone,
  Filter,
  Store,
  Coins,
  Eye,
  EyeOff,
  Package,
  FileText,
  History,
  Undo2,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { UserAvatar } from '@/components/ui/UserAvatar';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { UserMentionPicker, type MentionableUser } from '@/components/ui/user-mention-picker';
import { useAuth } from '@/contexts/AuthContext';
import { useProfilePreview } from '@/contexts/ProfilePreviewContext';
import { cn } from '@/lib/utils';
import { useInfiniteQuery, useQuery, useQueries, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ApiError,
  adminApi,
  studyApi,
  scheduleApi,
  shopApi,
  userApi,
  AdminTrack,
  Study,
  StudyDetail,
  StudyReportListItem,
  StudyReportStatus,
  StudyReportApprovalHistoryItem,
  ScheduleCreateRequest,
  ScheduleUpdateRequest,
  ScheduleQueryResponse,
  ShopItemSummaryDto,
  ShopItemType,
  TrackType,
  TRACK_TYPE_FALLBACK_OPTIONS,
  UserSummary,
  resolveApiImageUrl
} from '@/lib/api';
import { toast } from 'sonner';
import { formatDistanceToNow, format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface AdminUser {
  userId: number;
  name: string;
  email: string;
  phoneNumber?: string;
  trackId: number;
  trackName: string;
  profileImageUrl?: string;
  requestStatus?: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  status?: 'ACTIVE' | 'EXPIRED' | 'BLOCKED';
  createdAt: string;
}

interface AdminUsersResponse {
  content: AdminUser[];
  pageNumber: number;
  pageSize: number;
  hasNext: boolean;
  totalElements?: number;
}

type DecisionType = 'ACCEPTED' | 'REJECTED';

export default function AdminPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

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
  const [mainTab, setMainTab] = useState('user-track');
  const [userSubTab, setUserSubTab] = useState('users');
  const [studySubTab, setStudySubTab] = useState('approval');

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
          <p className="text-muted-foreground">유저, 과정, 스터디, 상점 관리</p>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={mainTab} onValueChange={setMainTab}>
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="user-track" className="gap-2">
            <Users className="h-4 w-4" />
            유저 / 과정
          </TabsTrigger>
          <TabsTrigger value="study" className="gap-2">
            <BookOpen className="h-4 w-4" />
            스터디
          </TabsTrigger>
          <TabsTrigger value="shop" className="gap-2">
            <Store className="h-4 w-4" />
            상점
          </TabsTrigger>
        </TabsList>

        <TabsContent value="user-track" className="mt-6">
          <Tabs value={userSubTab} onValueChange={setUserSubTab}>
            <TabsList>
              <TabsTrigger value="users" className="gap-2">
                <Users className="h-4 w-4" />
                유저 관리
              </TabsTrigger>
              <TabsTrigger value="tracks" className="gap-2">
                <GraduationCap className="h-4 w-4" />
                과정 관리
              </TabsTrigger>
            </TabsList>
            <TabsContent value="users" className="mt-4">
              <UserManagementTab />
            </TabsContent>
            <TabsContent value="tracks" className="mt-4">
              <TrackManagementTab />
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="study" className="mt-6">
          <Tabs value={studySubTab} onValueChange={setStudySubTab}>
            <TabsList>
              <TabsTrigger value="approval" className="gap-2">
                <BookOpen className="h-4 w-4" />
                스터디 승인
              </TabsTrigger>
              <TabsTrigger value="reports" className="gap-2">
                <FileText className="h-4 w-4" />
                결과 보고 결재
              </TabsTrigger>
              <TabsTrigger value="schedules" className="gap-2">
                <Calendar className="h-4 w-4" />
                일정 관리
              </TabsTrigger>
            </TabsList>
            <TabsContent value="approval" className="mt-4">
              <StudyApprovalTab />
            </TabsContent>
            <TabsContent value="reports" className="mt-4">
              <StudyReportApprovalTab />
            </TabsContent>
            <TabsContent value="schedules" className="mt-4">
              <ScheduleManagementTab />
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="shop" className="mt-6">
          <Tabs defaultValue="items">
            <TabsList>
              <TabsTrigger value="items" className="gap-2">
                <Store className="h-4 w-4" />
                아이템 관리
              </TabsTrigger>
              <TabsTrigger value="points" className="gap-2">
                <Coins className="h-4 w-4" />
                포인트 지급
              </TabsTrigger>
            </TabsList>
            <TabsContent value="items" className="mt-4">
              <ShopManagementTab />
            </TabsContent>
            <TabsContent value="points" className="mt-4">
              <PointGiveTab />
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>

      {/* Bottom padding for mobile nav */}
      <div className="h-20 lg:h-0" />
    </div>
  );
}

// ==================== User Management Tab ====================
function UserManagementTab() {
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [decisionType, setDecisionType] = useState<DecisionType | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedTrack, setSelectedTrack] = useState<number>(0);
  const [selectedRole, setSelectedRole] = useState<string>('MEMBER');
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);

  const { data: tracks } = useQuery({
    queryKey: ['admin', 'tracks', 'active'],
    queryFn: async () => {
      const res = await adminApi.getTracks();
      return res.content || [];
    },
  });

  const {
    data: pendingData,
    isLoading: pendingLoading,
    hasNextPage: pendingHasNextPage,
    fetchNextPage: fetchNextPendingPage,
    isFetchingNextPage: pendingFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['admin', 'users', 'PENDING', selectedTrack],
    queryFn: async ({ pageParam = 0 }) => {
      const page = typeof pageParam === 'number' ? pageParam : 0;
      const res = await adminApi.getUsers({
        requestStatus: 'PENDING',
        trackId: selectedTrack || undefined,
        page,
        size: 20,
      });
      return {
        content: (res.content || []) as AdminUser[],
        pageNumber: res.pageNumber ?? page,
        pageSize: res.pageSize ?? 20,
        hasNext: Boolean(res.hasNext),
        totalElements: res.totalElements,
      } as AdminUsersResponse;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.pageNumber + 1 : undefined),
  });

  const {
    data: approvedData,
    isLoading: approvedLoading,
    hasNextPage: approvedHasNextPage,
    fetchNextPage: fetchNextApprovedPage,
    isFetchingNextPage: approvedFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['admin', 'users', 'APPROVED', selectedTrack],
    queryFn: async ({ pageParam = 0 }) => {
      const page = typeof pageParam === 'number' ? pageParam : 0;
      const res = await adminApi.getUsers({
        requestStatus: 'ACCEPTED',
        trackId: selectedTrack || undefined,
        page,
        size: 20,
      });
      return {
        content: (res.content || []) as AdminUser[],
        pageNumber: res.pageNumber ?? page,
        pageSize: res.pageSize ?? 20,
        hasNext: Boolean(res.hasNext),
        totalElements: res.totalElements,
      } as AdminUsersResponse;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.pageNumber + 1 : undefined),
  });

  const pendingUsers = pendingData?.pages.flatMap((page) => page.content || []) || [];
  const approvedUsers = approvedData?.pages.flatMap((page) => page.content || []) || [];

  const decisionMutation = useMutation({
    mutationFn: async ({ userId, decision, role }: { userId: number; decision: DecisionType; role: string }) => {
      await adminApi.decideUser(userId, decision, role);
    },
    onSuccess: (_, variables) => {
      const action = variables.decision === 'ACCEPTED' ? '승인' : '거절';
      toast.success(`유저가 ${action}되었습니다.`);
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setDialogOpen(false);
      setSelectedUser(null);
      setDecisionType(null);
      setSelectedRole('MEMBER');
    },
    onError: () => {
      toast.error('처리 중 오류가 발생했습니다.');
    },
  });

  const bulkDecisionMutation = useMutation({
    mutationFn: async ({ ids, decision, role }: { ids: number[]; decision: DecisionType; role: string }) => {
      await adminApi.decideUsers(ids, decision, role);
    },
    onSuccess: (_, variables) => {
      const action = variables.decision === 'ACCEPTED' ? '승인' : '거절';
      toast.success(`${variables.ids.length}명의 유저가 ${action}되었습니다.`);
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setSelectedUserIds([]);
      setDialogOpen(false);
      setDecisionType(null);
      setSelectedRole('MEMBER');
    },
    onError: () => {
      toast.error('일괄 처리 중 오류가 발생했습니다.');
    },
  });

  const handleDecision = (user: AdminUser, decision: DecisionType) => {
    setSelectedUser(user);
    setDecisionType(decision);
    setDialogOpen(true);
    setSelectedRole('MEMBER');
  };

  const handleBulkDecision = (decision: DecisionType) => {
    if (selectedUserIds.length === 0) return;
    setDecisionType(decision);
    setDialogOpen(true);
    setSelectedRole('MEMBER');
  };

  const confirmDecision = () => {
    if (selectedUser && decisionType) {
      decisionMutation.mutate({
        userId: selectedUser.userId,
        decision: decisionType,
        role: selectedRole
      });
    } else if (selectedUserIds.length > 0 && decisionType) {
      bulkDecisionMutation.mutate({
        ids: selectedUserIds,
        decision: decisionType,
        role: selectedRole
      });
    }
  };

  const toggleSelectAll = (checked: boolean) => {
    if (checked && pendingUsers) {
      setSelectedUserIds(pendingUsers.map(u => u.userId));
    } else {
      setSelectedUserIds([]);
    }
  };

  const toggleSelectUser = (userId: number, checked: boolean) => {
    if (checked) {
      setSelectedUserIds(prev => [...prev, userId]);
    } else {
      setSelectedUserIds(prev => prev.filter(id => id !== userId));
    }
  };

  const pendingCount = pendingData?.pages?.[0]?.totalElements ?? pendingUsers.length;
  const approvedCount = approvedData?.pages?.[0]?.totalElements ?? approvedUsers.length;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
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

      {/* Main Content Area */}
      <div className="space-y-4">
        <Tabs value={activeTab} onValueChange={(val) => {
          setActiveTab(val);
          setSelectedUserIds([]);
        }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <TabsList>
              <TabsTrigger value="pending" className="gap-2">
                <Clock className="h-4 w-4" />
                승인 대기
                {pendingCount > 0 && (
                  <Badge variant="destructive" className="ml-1 h-5 min-w-5 px-1.5">
                    {pendingCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="approved" className="gap-2">
                <CheckCircle className="h-4 w-4" />
                승인된 유저
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select
                value={selectedTrack.toString()}
                onValueChange={(value) => setSelectedTrack(Number(value))}
              >
                <SelectTrigger className="w-[180px] h-9">
                  <SelectValue placeholder="과정 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">전체 과정</SelectItem>
                  {tracks?.map((track) => (
                    <SelectItem key={track.trackId} value={track.trackId.toString()}>
                      {track.trackName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <TabsContent value="pending" className="mt-0">
            {pendingLoading ? (
              <UserListSkeleton />
            ) : pendingUsers.length === 0 ? (
              <EmptyState
                icon={Clock}
                title="대기 중인 유저가 없습니다"
                description="모든 가입 요청이 처리되었습니다."
              />
            ) : (
              <div className="space-y-3">
                {/* Action Toolbar */}
                <Card className="border-muted bg-muted/30">
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={pendingUsers && selectedUserIds.length === pendingUsers.length && pendingUsers.length > 0}
                        onCheckedChange={(checked) => toggleSelectAll(checked as boolean)}
                        id="select-all"
                      />
                      <Label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                        전체 선택 ({pendingUsers.length}명)
                      </Label>
                    </div>

                    {selectedUserIds.length > 0 && (
                      <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-5 duration-200">
                        <span className="text-sm text-muted-foreground mr-2 border-r pr-4 border-border">
                          {selectedUserIds.length}명 선택됨
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
                          onClick={() => handleBulkDecision('REJECTED')}
                        >
                          일괄 거절
                        </Button>
                        <Button 
                          size="sm" 
                          className="h-8"
                          onClick={() => handleBulkDecision('ACCEPTED')}
                        >
                          일괄 승인
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="grid gap-3">
                  {pendingUsers.map((adminUser) => (
                    <UserCard
                      key={adminUser.userId}
                      user={adminUser}
                      onApprove={() => handleDecision(adminUser, 'ACCEPTED')}
                      onReject={() => handleDecision(adminUser, 'REJECTED')}
                      showActions
                      isChecked={selectedUserIds.includes(adminUser.userId)}
                      onToggleSelect={(checked) => toggleSelectUser(adminUser.userId, checked)}
                    />
                  ))}
                </div>

                {pendingHasNextPage && (
                  <div className="flex justify-center pt-2">
                    <Button
                      variant="outline"
                      onClick={() => fetchNextPendingPage()}
                      disabled={pendingFetchingNextPage}
                    >
                      {pendingFetchingNextPage ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          불러오는 중...
                        </>
                      ) : (
                        '더 보기'
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="approved" className="mt-0">
            {approvedLoading ? (
              <UserListSkeleton />
            ) : approvedUsers.length === 0 ? (
              <EmptyState
                icon={Users}
                title="승인된 유저가 없습니다"
                description="아직 승인된 유저가 없습니다."
              />
            ) : (
              <div className="space-y-3 mt-4">
                <div className="grid gap-3">
                  {approvedUsers.map((adminUser) => (
                    <UserCard key={adminUser.userId} user={adminUser} />
                  ))}
                </div>
                {approvedHasNextPage && (
                  <div className="flex justify-center pt-2">
                    <Button
                      variant="outline"
                      onClick={() => fetchNextApprovedPage()}
                      disabled={approvedFetchingNextPage}
                    >
                      {approvedFetchingNextPage ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          불러오는 중...
                        </>
                      ) : (
                        '더 보기'
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedUserIds.length > 0 && !selectedUser 
                ? `일괄 ${decisionType === 'ACCEPTED' ? '승인' : '거절'}`
                : decisionType === 'ACCEPTED' ? '유저 승인' : '유저 거절'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedUser 
                ? `${selectedUser.name}님의 가입을 `
                : `${selectedUserIds.length}명의 가입 요청을 `}
              {decisionType === 'ACCEPTED' ? '승인' : '거절'}하시겠습니까?
              {decisionType === 'REJECTED' && (
                <span className="block mt-2 text-destructive">
                  거절된 유저는 서비스를 이용할 수 없습니다.
                </span>
              )}
            </AlertDialogDescription>
            {decisionType === 'ACCEPTED' && (
              <div className="py-4">
                <Label htmlFor="role" className="mb-2 block">
                  부여할 권한
                </Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger id="role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MEMBER">일반 멤버</SelectItem>
                    <SelectItem value="ADMIN">관리자</SelectItem>
                    <SelectItem value="INSTRUCTOR">강사</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDecision}
              disabled={decisionMutation.isPending || bulkDecisionMutation.isPending}
              className={decisionType === 'REJECTED' ? 'bg-destructive hover:bg-destructive/90' : ''}
            >
              {decisionMutation.isPending || bulkDecisionMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : decisionType === 'ACCEPTED' ? (
                '승인'
              ) : (
                '거절'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ==================== Track Management Tab ====================
function TrackManagementTab() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTrack, setEditingTrack] = useState<AdminTrack | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminTrack | null>(null);
  const [selectedTrackTypeFilter, setSelectedTrackTypeFilter] = useState<TrackType | 'ALL'>('ALL');
  const [selectedTrackStatusFilter, setSelectedTrackStatusFilter] = useState<'ALL' | 'ENROLLED' | 'GRADUATED'>('ALL');
  const [trackTypeSelectOpen, setTrackTypeSelectOpen] = useState(false);
  const [formData, setFormData] = useState({
    trackType: '' as TrackType | '',
    cardinal: '',
    startDate: '',
    endDate: '',
  });

  const { data: tracks, isLoading } = useQuery({
    queryKey: ['admin', 'tracks', selectedTrackTypeFilter],
    queryFn: async () => {
      const res = await adminApi.getAllTracks(
        selectedTrackTypeFilter === 'ALL'
          ? undefined
          : { trackType: selectedTrackTypeFilter },
      );
      return res.content || [];
    },
  });

  const { data: trackTypes } = useQuery({
    queryKey: ['admin', 'track-types'],
    queryFn: async () => {
      const res: any = await adminApi.getTrackTypes();
      return Array.isArray(res) ? res : (res?.trackTypes ?? []);
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: { trackType: TrackType; cardinal?: number | null; startDate: string; endDate: string }) =>
      adminApi.createTrack(data),
    onSuccess: () => {
      toast.success('과정이 생성되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['admin', 'tracks'] });
      setIsCreateOpen(false);
      resetForm();
    },
    onError: () => {
      toast.error('과정 생성에 실패했습니다.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { trackType?: TrackType; cardinal?: number | null; startDate?: string; endDate?: string } }) =>
      adminApi.updateTrack(id, data),
    onSuccess: () => {
      toast.success('과정이 수정되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['admin', 'tracks'] });
      setEditingTrack(null);
      resetForm();
    },
    onError: () => {
      toast.error('과정 수정에 실패했습니다.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.deleteTrack(id),
    onSuccess: () => {
      toast.success('과정이 삭제되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['admin', 'tracks'] });
      setDeleteTarget(null);
    },
    onError: () => {
      toast.error('과정 삭제에 실패했습니다.');
    },
  });

  const resetForm = () => {
    setFormData({ trackType: '', cardinal: '', startDate: '', endDate: '' });
  };

  const selectedTrackTypeOption = trackTypes?.find(
    (type: { trackType: TrackType; label: string; requiresCardinal?: boolean }) =>
      type.trackType === formData.trackType,
  );
  const visibleTrackTypes = (trackTypes ?? []).filter(
    (type: { trackType: TrackType }) => type.trackType !== 'ADMIN',
  );
  const requiresCardinal =
    selectedTrackTypeOption?.requiresCardinal ?? (formData.trackType !== 'ADMIN');
  const trackTypeLabelMap = new Map<TrackType, string>(
    (visibleTrackTypes.length
      ? visibleTrackTypes
      : TRACK_TYPE_FALLBACK_OPTIONS.filter((type) => type.trackType !== 'ADMIN')
    ).map(
      (type: { trackType: TrackType; label: string }) => [type.trackType, type.label],
    ),
  );

  const formatTrackDisplay = (track: AdminTrack): string => {
    if (!track.trackType) return '과정 정보 없음';
    const label = trackTypeLabelMap.get(track.trackType) ?? track.trackType;
    if (track.cardinal !== undefined && track.cardinal !== null) {
      return `${label} ${track.cardinal}기`;
    }
    return label;
  };

  const handleCreate = () => {
    if (!formData.trackType || !formData.startDate || !formData.endDate) {
      toast.error('모든 필드를 입력해주세요.');
      return;
    }
    if (requiresCardinal && !formData.cardinal) {
      toast.error('기수를 입력해주세요.');
      return;
    }
    createMutation.mutate({
      trackType: formData.trackType,
      cardinal: requiresCardinal ? Number(formData.cardinal) : null,
      startDate: formData.startDate,
      endDate: formData.endDate,
    });
  };

  const handleUpdate = () => {
    if (!editingTrack) return;
    if (!formData.trackType || !formData.startDate || !formData.endDate) {
      toast.error('모든 필드를 입력해주세요.');
      return;
    }
    if (requiresCardinal && !formData.cardinal) {
      toast.error('기수를 입력해주세요.');
      return;
    }
    updateMutation.mutate({
      id: editingTrack.trackId,
      data: {
        trackType: formData.trackType,
        cardinal: requiresCardinal ? Number(formData.cardinal) : null,
        startDate: formData.startDate,
        endDate: formData.endDate,
      },
    });
  };

  const parseTrackNameToForm = (trackName: string): { trackType: TrackType | ''; cardinal: string } => {
    if (trackName.includes('운영자')) {
      return { trackType: 'ADMIN', cardinal: '' };
    }

    const exactMatch = trackName.match(/^(BE|FE|AI|UNREAL|GAME)\s*(\d+)기$/i);
    if (exactMatch) {
      return {
        trackType: exactMatch[1].toUpperCase() as TrackType,
        cardinal: exactMatch[2],
      };
    }

    const genericMatch = trackName.match(/^(.+?)\s*(\d+)기$/);
    if (!genericMatch) {
      return { trackType: '', cardinal: '' };
    }

    const rawType = genericMatch[1].trim().toUpperCase();
    const cardinal = genericMatch[2];
    const aliasToType: Record<string, TrackType> = {
      BE: 'BE',
      FE: 'FE',
      AI: 'AI',
      'AI AGENT': 'AI',
      UNREAL: 'UNREAL',
      GAME: 'GAME',
    };

    return {
      trackType: aliasToType[rawType] ?? '',
      cardinal,
    };
  };

  const openEditDialog = (track: AdminTrack) => {
    const parsed = parseTrackNameToForm(track.trackName);
    const resolvedTrackType = track.trackType ?? parsed.trackType;
    const resolvedCardinal =
      track.cardinal !== undefined && track.cardinal !== null
        ? String(track.cardinal)
        : parsed.cardinal;

    setEditingTrack(track);
    setFormData({
      trackType: resolvedTrackType,
      cardinal: resolvedCardinal,
      startDate: track.startDate,
      endDate: track.endDate,
    });
    if (!resolvedTrackType) {
      toast.info('기존 과정명을 자동 해석하지 못해 과정 유형/기수를 수동 선택해주세요.');
    }
  };
  const trackItems = tracks ?? [];
  const filteredTrackItems = trackItems
    .filter((track) => track.trackType !== 'ADMIN' && track.trackName !== '운영자')
    .filter((track) => {
    if (selectedTrackStatusFilter === 'ALL') return true;
    return track.trackStatus === selectedTrackStatusFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold">과정 목록</h2>
        <div className="flex gap-2">
          <div className="w-[150px]">
            <Select
              value={selectedTrackStatusFilter}
              onValueChange={(value) =>
                setSelectedTrackStatusFilter(value as 'ALL' | 'ENROLLED' | 'GRADUATED')
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="상태 필터" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">전체 상태</SelectItem>
                <SelectItem value="ENROLLED">운영중</SelectItem>
                <SelectItem value="GRADUATED">종료</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-[200px]">
            <Select
              value={selectedTrackTypeFilter}
              onValueChange={(value) => setSelectedTrackTypeFilter(value as TrackType | 'ALL')}
            >
              <SelectTrigger>
                <SelectValue placeholder="과정 유형 필터" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">전체</SelectItem>
                {visibleTrackTypes.map((type: { trackType: TrackType; label: string }) => (
                  <SelectItem key={type.trackType} value={type.trackType}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => setIsCreateOpen(true)} className="bg-orange-500 hover:bg-orange-600 text-white">
            <Plus className="h-4 w-4 mr-2" />
            과정 추가
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : filteredTrackItems.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="과정이 없습니다"
          description="선택한 조건에 맞는 과정이 없습니다."
        />
      ) : (
        <Card className="overflow-hidden border-border/80">
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-base">등록된 과정</CardTitle>
              <Badge variant="secondary">표시 {filteredTrackItems.length}개</Badge>
              <Badge variant="outline">
                운영중 {filteredTrackItems.filter((t) => t.trackStatus === 'ENROLLED').length}개
              </Badge>
              <Badge variant="outline">
                종료 {filteredTrackItems.filter((t) => t.trackStatus === 'GRADUATED').length}개
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="hidden md:grid grid-cols-[0.8fr_0.8fr_0.8fr_1.7fr_0.9fr] px-4 py-2 text-xs text-muted-foreground border-y bg-muted/30">
              <span className="justify-self-start">과정 유형</span>
              <span className="justify-self-center">기수</span>
              <span className="justify-self-center">상태</span>
              <span className="justify-self-start">기간</span>
              <span className="justify-self-end">관리</span>
            </div>
            <div className="divide-y">
              {filteredTrackItems.map((track) => (
                <div key={track.trackId} className="px-4 py-3 hover:bg-muted/30 transition-colors">
                  <div className="grid gap-3 md:grid-cols-[0.8fr_0.8fr_0.8fr_1.7fr_0.9fr] md:items-center">
                    <div className="justify-self-start">
                      {track.trackType ? (
                        <Badge variant="outline" className="rounded-md text-sm font-semibold px-2.5 py-1">
                          {trackTypeLabelMap.get(track.trackType) ?? track.trackType}
                        </Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </div>

                    <div className="justify-self-center">
                      {track.cardinal !== undefined && track.cardinal !== null ? (
                        <Badge variant="outline" className="rounded-md text-sm font-semibold px-2.5 py-1">
                          {track.cardinal}기
                        </Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </div>

                    <div className="justify-self-center">
                      <Badge variant={track.trackStatus === 'ENROLLED' ? 'default' : 'secondary'}>
                        {track.trackStatus === 'ENROLLED' ? '운영중' : '종료'}
                      </Badge>
                    </div>

                    <div className="justify-self-start text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{track.startDate} ~ {track.endDate}</span>
                    </div>

                    <div className="justify-self-end flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(track)}
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        수정
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(track)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        삭제
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>과정 추가</DialogTitle>
            <DialogDescription>새로운 과정 정보를 입력해주세요.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="trackType">과정 유형</Label>
              <Select
                open={trackTypeSelectOpen}
                onOpenChange={setTrackTypeSelectOpen}
                value={formData.trackType}
                onValueChange={(value) =>
                  setFormData({ ...formData, trackType: value as TrackType, cardinal: value === 'ADMIN' ? '' : formData.cardinal })
                }
              >
                <SelectTrigger id="trackType">
                  <SelectValue placeholder="과정 유형 선택" />
                </SelectTrigger>
                <SelectContent>
                  {visibleTrackTypes.map((type: { trackType: TrackType; label: string }) => (
                    <SelectItem key={type.trackType} value={type.trackType}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cardinal">기수</Label>
              <Input
                id="cardinal"
                type="number"
                min={1}
                value={formData.cardinal}
                onChange={(e) => setFormData({ ...formData, cardinal: e.target.value })}
                placeholder="예: 3"
                disabled={!requiresCardinal}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">시작일</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">종료일</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              취소
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : '추가'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingTrack} onOpenChange={(open) => !open && setEditingTrack(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>과정 수정</DialogTitle>
            <DialogDescription>과정 정보를 수정해주세요.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editTrackType">과정 유형</Label>
              <Select
                open={trackTypeSelectOpen}
                onOpenChange={setTrackTypeSelectOpen}
                value={formData.trackType}
                onValueChange={(value) =>
                  setFormData({ ...formData, trackType: value as TrackType, cardinal: value === 'ADMIN' ? '' : formData.cardinal })
                }
              >
                <SelectTrigger id="editTrackType">
                  <SelectValue placeholder="과정 유형 선택" />
                </SelectTrigger>
                <SelectContent>
                  {visibleTrackTypes.map((type: { trackType: TrackType; label: string }) => (
                    <SelectItem key={type.trackType} value={type.trackType}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editCardinal">기수</Label>
              <Input
                id="editCardinal"
                type="number"
                min={1}
                value={formData.cardinal}
                onChange={(e) => setFormData({ ...formData, cardinal: e.target.value })}
                disabled={!requiresCardinal}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editStartDate">시작일</Label>
                <Input
                  id="editStartDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editEndDate">종료일</Label>
                <Input
                  id="editEndDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTrack(null)}>
              취소
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : '저장'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>과정 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget ? formatTrackDisplay(deleteTarget) : ''} 과정을 삭제하시겠습니까?
              <span className="block mt-2 text-destructive">
                이 작업은 되돌릴 수 없습니다.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.trackId)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : '삭제'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ==================== Study Approval Tab ====================
function StudyApprovalTab() {
  const queryClient = useQueryClient();
  const [selectedStudy, setSelectedStudy] = useState<Study | null>(null);
  const [forceJoinStudy, setForceJoinStudy] = useState<Study | null>(null);
  const [forceJoinInput, setForceJoinInput] = useState('');
  const [forceJoinMentionQuery, setForceJoinMentionQuery] = useState('');
  const [forceJoinDebouncedQuery, setForceJoinDebouncedQuery] = useState('');
  const [selectedForceJoinUser, setSelectedForceJoinUser] = useState<MentionableUser | null>(null);

  const { data: pendingStudies, isLoading } = useQuery({
    queryKey: ['admin', 'studies', 'pending'],
    queryFn: async () => {
      const res = await adminApi.getPendingStudies();
      return res.content || [];
    },
  });

  const { data: forceJoinStudyDetail, isLoading: isForceJoinStudyLoading } = useQuery({
    queryKey: ['admin', 'studies', 'detail', forceJoinStudy?.id],
    queryFn: async () => {
      if (!forceJoinStudy) {
        throw new Error('선택된 스터디가 없습니다.');
      }

      return studyApi.getStudy(forceJoinStudy.id);
    },
    enabled: !!forceJoinStudy,
  });

  const forceJoinTrackId =
    forceJoinStudyDetail?.leader?.trackId ?? forceJoinStudy?.leader?.trackId;
  const forceJoinTrackName =
    forceJoinStudyDetail?.leader?.trackName ?? forceJoinStudy?.leader?.trackName;
  const isForceJoinClosedStudy = forceJoinStudy?.status === 'RECRUITING_CLOSED';
  const showForceJoinStatusError = !!forceJoinStudy && !isForceJoinClosedStudy;
  const showForceJoinTrackError =
    !!forceJoinStudy &&
    isForceJoinClosedStudy &&
    !isForceJoinStudyLoading &&
    !forceJoinTrackId;

  useEffect(() => {
    const timer = setTimeout(() => {
      setForceJoinDebouncedQuery(forceJoinMentionQuery.trim());
    }, 200);

    return () => clearTimeout(timer);
  }, [forceJoinMentionQuery]);

  type ForceJoinUsersPage = Awaited<ReturnType<typeof adminApi.getUsers>>;

  const {
    data: forceJoinTrackUserPages,
    isLoading: isForceJoinTrackUsersLoading,
    isFetchingNextPage: isForceJoinFetchingNextPage,
    hasNextPage: hasMoreForceJoinTrackUsers,
    fetchNextPage: fetchNextForceJoinTrackUsers,
  } = useInfiniteQuery({
    queryKey: ['admin', 'users', 'force-join', forceJoinTrackId, forceJoinDebouncedQuery],
    queryFn: async ({ pageParam }) => {
      const page = typeof pageParam === 'number' ? pageParam : 0;

      if (!forceJoinTrackId) {
        return {
          content: [],
          pageNumber: page,
          pageSize: 30,
          hasNext: false,
          totalElements: 0,
        } as ForceJoinUsersPage;
      }

      return adminApi.getUsers({
        trackId: forceJoinTrackId,
        requestStatus: 'ACCEPTED',
        role: 'MEMBER',
        status: 'ACTIVE',
        name: forceJoinDebouncedQuery || undefined,
        page,
        size: 30,
      });
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.hasNext ? lastPage.pageNumber + 1 : undefined,
    enabled:
      !!forceJoinStudy &&
      !!forceJoinTrackId &&
      forceJoinStudy.status === 'RECRUITING_CLOSED',
    staleTime: 60 * 1000,
  });

  const forceJoinTrackUsers = useMemo<AdminUser[]>(() => {
    const dedup = new Map<number, AdminUser>();

    for (const page of forceJoinTrackUserPages?.pages || []) {
      for (const user of page.content || []) {
        if (!dedup.has(user.userId)) {
          dedup.set(user.userId, user as AdminUser);
        }
      }
    }

    return Array.from(dedup.values());
  }, [forceJoinTrackUserPages]);

  const existingParticipantIds = useMemo(() => {
    const ids = new Set<number>();
    const leaderId = forceJoinStudyDetail?.leader?.id ?? forceJoinStudy?.leader?.id;

    if (leaderId) {
      ids.add(leaderId);
    }

    for (const participant of forceJoinStudyDetail?.participants || []) {
      ids.add(participant.id);
    }

    return ids;
  }, [forceJoinStudy, forceJoinStudyDetail]);

  const forceJoinCandidates = useMemo<MentionableUser[]>(
    () =>
      forceJoinTrackUsers
        .filter((user) => !existingParticipantIds.has(user.userId))
        .map((user) => ({
          userId: user.userId,
          name: user.name,
          profileImageUrl: user.profileImageUrl,
          trackId: user.trackId,
          trackName: user.trackName,
          email: user.email,
        })),
    [existingParticipantIds, forceJoinTrackUsers],
  );

  const applyOptimisticForceJoin = (
    detail: StudyDetail | undefined,
    selectedUser: MentionableUser | null,
  ): StudyDetail | undefined => {
    if (!detail || !selectedUser) {
      return detail;
    }

    const hasParticipant = (detail.participants || []).some(
      (participant) => participant.id === selectedUser.userId,
    );

    if (hasParticipant) {
      return detail;
    }

    return {
      ...detail,
      currentMemberCount: detail.currentMemberCount + 1,
      participants: [
        ...(detail.participants || []),
        {
          id: selectedUser.userId,
          name: selectedUser.name,
          trackId: selectedUser.trackId,
          trackName: selectedUser.trackName,
          profileImageUrl: selectedUser.profileImageUrl,
          joinedAt: new Date().toISOString(),
        },
      ],
    };
  };

  const handleLoadMoreForceJoinUsers = () => {
    if (!hasMoreForceJoinTrackUsers || isForceJoinFetchingNextPage) {
      return;
    }

    fetchNextForceJoinTrackUsers();
  };

  const approveMutation = useMutation({
    mutationFn: (studyId: number) => studyApi.approveStudy(studyId),
    onSuccess: () => {
      toast.success('스터디가 승인되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['admin', 'studies'] });
      setSelectedStudy(null);
    },
    onError: () => {
      toast.error('스터디 승인에 실패했습니다.');
    },
  });

  type ForceJoinMutationContext = {
    previousPendingStudies?: Study[];
    previousAdminStudyDetail?: StudyDetail;
    previousStudyDetail?: StudyDetail;
  };

  const forceJoinMutation = useMutation({
    mutationFn: ({ studyId, targetUserId }: { studyId: number; targetUserId: number }) =>
      studyApi.forceJoinStudy(studyId, targetUserId),
    onMutate: async ({ studyId, targetUserId }): Promise<ForceJoinMutationContext> => {
      await queryClient.cancelQueries({ queryKey: ['admin', 'studies', 'pending'] });
      await queryClient.cancelQueries({ queryKey: ['admin', 'studies', 'detail', studyId] });
      await queryClient.cancelQueries({ queryKey: ['study', studyId] });

      const previousPendingStudies = queryClient.getQueryData<Study[]>(['admin', 'studies', 'pending']);
      const previousAdminStudyDetail = queryClient.getQueryData<StudyDetail>([
        'admin',
        'studies',
        'detail',
        studyId,
      ]);
      const previousStudyDetail = queryClient.getQueryData<StudyDetail>(['study', studyId]);

      queryClient.setQueryData<Study[]>(['admin', 'studies', 'pending'], (old) =>
        (old || []).map((study) =>
          study.id === studyId
            ? {
                ...study,
                currentMemberCount: study.currentMemberCount + 1,
              }
            : study,
        ),
      );

      const optimisticUser =
        selectedForceJoinUser?.userId === targetUserId ? selectedForceJoinUser : null;

      queryClient.setQueryData<StudyDetail | undefined>(
        ['admin', 'studies', 'detail', studyId],
        (old) => applyOptimisticForceJoin(old, optimisticUser),
      );
      queryClient.setQueryData<StudyDetail | undefined>(['study', studyId], (old) =>
        applyOptimisticForceJoin(old, optimisticUser),
      );

      return {
        previousPendingStudies,
        previousAdminStudyDetail,
        previousStudyDetail,
      };
    },
    onSuccess: () => {
      toast.success(`${selectedForceJoinUser?.name || '사용자'}님을 추가 참여 처리했습니다.`);
      closeForceJoinDialog();
    },
    onError: (error, variables, context) => {
      if (context?.previousPendingStudies) {
        queryClient.setQueryData(['admin', 'studies', 'pending'], context.previousPendingStudies);
      }

      if (context?.previousAdminStudyDetail) {
        queryClient.setQueryData(
          ['admin', 'studies', 'detail', variables.studyId],
          context.previousAdminStudyDetail,
        );
      }

      if (context?.previousStudyDetail) {
        queryClient.setQueryData(['study', variables.studyId], context.previousStudyDetail);
      }

      if (error instanceof ApiError) {
        if (error.status === 400) {
          toast.error(error.message || '추가 참여 조건을 확인해주세요.');
          return;
        }

        if (error.status === 404) {
          toast.error('스터디 또는 유저를 찾을 수 없습니다.');
          return;
        }
      }

      toast.error('추가 참여 처리에 실패했습니다.');
    },
    onSettled: (_, __, variables) => {
      if (!variables) {
        return;
      }

      queryClient.invalidateQueries({ queryKey: ['admin', 'studies'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'studies', 'detail', variables.studyId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users', 'force-join'] });
      queryClient.invalidateQueries({ queryKey: ['study', variables.studyId] });
    },
  });

  const confirmApprove = () => {
    if (!selectedStudy) return;
    approveMutation.mutate(selectedStudy.id);
  };

  const closeForceJoinDialog = () => {
    if (forceJoinMutation.isPending) {
      return;
    }

    setForceJoinStudy(null);
    setForceJoinInput('');
    setForceJoinMentionQuery('');
    setForceJoinDebouncedQuery('');
    setSelectedForceJoinUser(null);
  };

  const openForceJoinDialog = (study: Study) => {
    setForceJoinStudy(study);
    setForceJoinInput('');
    setForceJoinMentionQuery('');
    setForceJoinDebouncedQuery('');
    setSelectedForceJoinUser(null);
  };

  const handleForceJoinInputChange = (nextValue: string) => {
    setForceJoinInput(nextValue);

    if (!selectedForceJoinUser) {
      return;
    }

    const normalizedValue = nextValue.trim();
    const selectedToken = `@${selectedForceJoinUser.name}`;

    if (normalizedValue !== selectedToken) {
      setSelectedForceJoinUser(null);
    }
  };

  const handleForceJoinMentionQueryChange = (query: string) => {
    setForceJoinMentionQuery(query);
  };

  const confirmForceJoin = () => {
    if (!forceJoinStudy || !selectedForceJoinUser) {
      return;
    }

    if (forceJoinStudy.status !== 'RECRUITING_CLOSED') {
      toast.error('모집 마감 상태의 스터디만 추가 참여가 가능합니다.');
      return;
    }

    forceJoinMutation.mutate({
      studyId: forceJoinStudy.id,
      targetUserId: selectedForceJoinUser.userId,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">진행 시작 대기 중인 스터디</h2>
        <Badge variant="secondary">{pendingStudies?.length || 0}개</Badge>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        ) : pendingStudies?.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="대기 중인 스터디가 없습니다"
            description="진행 시작 대기 스터디가 없습니다."
          />
        ) : (
        <div className="space-y-4">
          {pendingStudies?.map((study) => (
            <Card key={study.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold truncate">{study.name}</h3>
                      <Badge variant="outline">
                        {study.currentMemberCount}/{study.capacity}명
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {study.description}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <UserAvatar
                        src={study.leader?.profileImageUrl}
                        name={study.leader?.name || ''}
                        className="h-5 w-5"
                      />
                      <span>{study.leader?.name}</span>
                      <span>·</span>
                      <span>{formatDistanceToNow(new Date(study.createdAt), { addSuffix: true, locale: ko })}</span>
                    </div>
                    {study.tags && study.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {study.tags.slice(0, 5).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openForceJoinDialog(study)}
                      disabled={study.status !== 'RECRUITING_CLOSED'}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      추가 참여
                    </Button>
                    <Button size="sm" onClick={() => setSelectedStudy(study)}>
                      <CheckCircle className="h-4 w-4 mr-1" />
                      진행 시작
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog open={!!selectedStudy} onOpenChange={(open) => {
        if (!open) setSelectedStudy(null);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>스터디 승인</AlertDialogTitle>
            <AlertDialogDescription>
              "{selectedStudy?.name}" 스터디를 진행 시작 처리하시겠습니까?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmApprove}
              disabled={approveMutation.isPending}
            >
              {approveMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                '진행 시작'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={!!forceJoinStudy}
        onOpenChange={(open) => {
          if (!open) {
            closeForceJoinDialog();
          }
        }}
      >
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>스터디 추가 참여</DialogTitle>
            <DialogDescription>
              "{forceJoinStudy?.name}" 스터디에 과정 구성원을 추가로 참여시킵니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">
                {forceJoinTrackName ? `${forceJoinTrackName} 과정` : '과정 정보 없음'}
              </Badge>
              {forceJoinStudy && (
                <Badge variant="outline">
                  현재 인원 {forceJoinStudy.currentMemberCount}/{forceJoinStudy.capacity}
                </Badge>
              )}
            </div>

            {showForceJoinStatusError && (
              <p className="text-sm text-destructive">
                모집 마감 상태의 스터디만 추가 참여가 가능합니다.
              </p>
            )}

            {showForceJoinTrackError && (
              <p className="text-sm text-destructive">
                스터디 과정 정보를 찾을 수 없어 사용자 검색을 진행할 수 없습니다.
              </p>
            )}

            <div className="space-y-2">
              <Label htmlFor="force-join-user-input">추가 참여 사용자 (1명)</Label>
              <UserMentionPicker
                id="force-join-user-input"
                value={forceJoinInput}
                onChange={handleForceJoinInputChange}
                users={forceJoinCandidates}
                onSelectUser={setSelectedForceJoinUser}
                onMentionQueryChange={handleForceJoinMentionQueryChange}
                hasMore={!!hasMoreForceJoinTrackUsers}
                onLoadMore={handleLoadMoreForceJoinUsers}
                loadingMore={isForceJoinFetchingNextPage}
                placeholder="@이름으로 검색 후 한 명 선택"
                disabled={
                  forceJoinMutation.isPending ||
                  !forceJoinTrackId ||
                  forceJoinStudy?.status !== 'RECRUITING_CLOSED'
                }
                loading={isForceJoinStudyLoading || isForceJoinTrackUsersLoading}
                emptyMessage="선택 가능한 과정 구성원이 없습니다."
              />
              <p className="text-xs text-muted-foreground">
                한 명만 선택할 수 있으며, 다른 사용자를 선택하면 기존 선택이 대체됩니다.
              </p>
              <p className="text-xs text-muted-foreground">
                검색 풀은 해당 스터디 과정의 승인된 유저로 제한됩니다.
              </p>
            </div>

            {selectedForceJoinUser && (
              <div className="rounded-md border bg-muted/30 p-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <UserAvatar
                    src={selectedForceJoinUser.profileImageUrl}
                    name={selectedForceJoinUser.name}
                    className="h-8 w-8"
                  />
                  <div className="min-w-0">
                    <p className="text-[11px] text-muted-foreground">선택된 사용자 (1명)</p>
                    <p className="text-sm font-medium truncate">{selectedForceJoinUser.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {[selectedForceJoinUser.trackName, selectedForceJoinUser.email]
                        .filter(Boolean)
                        .join(' · ') || '과정 사용자'}
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={forceJoinMutation.isPending}
                  onClick={() => {
                    setSelectedForceJoinUser(null);
                    setForceJoinInput('');
                  }}
                >
                  선택 해제
                </Button>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={forceJoinMutation.isPending}
              onClick={closeForceJoinDialog}
            >
              취소
            </Button>
            <Button
              type="button"
              onClick={confirmForceJoin}
              disabled={
                forceJoinMutation.isPending ||
                !selectedForceJoinUser ||
                !forceJoinTrackId ||
                forceJoinStudy?.status !== 'RECRUITING_CLOSED'
              }
            >
              {forceJoinMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                '추가 참여'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ==================== Study Report Approval Tab ====================
function StudyReportApprovalTab() {
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState<'all' | StudyReportStatus>('all');
  const [selectedReport, setSelectedReport] = useState<StudyReportListItem | null>(null);
  const [actionType, setActionType] = useState<'REJECT' | 'CANCEL' | null>(null);
  const [actionReason, setActionReason] = useState('');

  const {
    data,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['admin', 'study-reports', selectedStatus],
    queryFn: ({ pageParam }) =>
      studyApi.getStudyReports({
        status: selectedStatus === 'all' ? undefined : selectedStatus,
        page: typeof pageParam === 'number' ? pageParam : 0,
        size: 20,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.hasNext ? lastPage.pageNumber + 1 : undefined,
  });

  const reports = data?.pages.flatMap((page) => page.content || []) || [];

  const historyPreviewQueries = useQueries({
    queries: reports.map((report) => ({
      queryKey: ['admin', 'study-report-history-preview', report.studyId],
      queryFn: () => studyApi.getStudyReportApprovalHistories(report.studyId),
      staleTime: 60 * 1000,
    })),
  });

  const reportReasonPreviewMap = useMemo(() => {
    const previewMap = new Map<number, string>();

    reports.forEach((report, index) => {
      const queryData = historyPreviewQueries[index]?.data;
      const histories = Array.isArray(queryData)
        ? queryData
        : queryData
          ? [queryData as unknown as StudyReportApprovalHistoryItem]
          : [];

      const reason = histories.find((history) => Boolean(history.reason?.trim()))?.reason?.trim();

      if (reason) {
        previewMap.set(report.studyId, reason);
      }
    });

    return previewMap;
  }, [historyPreviewQueries, reports]);

  const {
    data: reportDetail,
    isLoading: isReportDetailLoading,
    error: reportDetailError,
    refetch: refetchReportDetail,
  } = useQuery({
    queryKey: ['admin', 'study-report-detail', selectedReport?.studyId],
    queryFn: () => {
      if (!selectedReport) {
        throw new Error('선택된 결과 보고가 없습니다.');
      }

      return studyApi.getStudyReport(selectedReport.studyId);
    },
    enabled: !!selectedReport,
  });

  const {
    data: studyDetail,
    isLoading: isStudyDetailLoading,
    error: studyDetailError,
    refetch: refetchStudyDetail,
  } = useQuery({
    queryKey: ['admin', 'study-report-study-detail', selectedReport?.studyId],
    queryFn: () => {
      if (!selectedReport) {
        throw new Error('선택된 결과 보고가 없습니다.');
      }

      return studyApi.getStudy(selectedReport.studyId);
    },
    enabled: !!selectedReport,
  });

  const {
    data: reportHistoryRaw,
    isLoading: isReportHistoryLoading,
    error: reportHistoryError,
    refetch: refetchReportHistory,
  } = useQuery({
    queryKey: ['admin', 'study-report-history', selectedReport?.studyId],
    queryFn: () => {
      if (!selectedReport) {
        throw new Error('선택된 결과 보고가 없습니다.');
      }

      return studyApi.getStudyReportApprovalHistories(selectedReport.studyId);
    },
    enabled: !!selectedReport,
  });

  const reportHistory = useMemo<StudyReportApprovalHistoryItem[]>(() => {
    if (!reportHistoryRaw) {
      return [];
    }

    return Array.isArray(reportHistoryRaw)
      ? reportHistoryRaw
      : [reportHistoryRaw as unknown as StudyReportApprovalHistoryItem];
  }, [reportHistoryRaw]);

  const reportStatus = reportDetail?.status ?? selectedReport?.status;
  const canApproveOrReject =
    reportStatus === 'SUBMITTED' || reportStatus === 'RESUBMITTED';
  const canCancelDecision =
    reportStatus === 'APPROVED' || reportStatus === 'REJECTED';

  const reportStatusLabelMap: Record<StudyReportStatus, string> = {
    SUBMITTED: '상신됨',
    RESUBMITTED: '재상신됨',
    APPROVED: '승인됨',
    REJECTED: '반려됨',
  };

  const reportStatusBadgeClassMap: Record<StudyReportStatus, string> = {
    SUBMITTED: 'bg-blue-500 text-white',
    RESUBMITTED: 'bg-sky-600 text-white',
    APPROVED: 'bg-success text-success-foreground',
    REJECTED: 'bg-destructive text-destructive-foreground',
  };

  const reportActionLabelMap: Record<string, string> = {
    SUBMIT: '상신',
    RESUBMIT: '재상신',
    APPROVE: '승인',
    REJECT: '반려',
    CANCEL: '결재 취소',
  };

  const studyStatusLabelMap: Record<Study['status'], string> = {
    RECRUITING: '모집중',
    RECRUITING_CLOSED: '모집마감',
    IN_PROGRESS: '진행중',
    COMPLETED: '완료',
  };

  const studyBudgetLabelMap: Record<'BOOK' | 'MEAL', string> = {
    BOOK: '책',
    MEAL: '식비',
  };

  const invalidateReportQueries = (studyId: number) => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'study-reports'] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'study-report-detail', studyId] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'study-report-history', studyId] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'study-report-history-preview', studyId] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'study-report-study-detail', studyId] });
    queryClient.invalidateQueries({ queryKey: ['study-report-submission-status', studyId] });
    queryClient.invalidateQueries({ queryKey: ['study-report-detail', studyId] });
  };

  const handleReportActionError = (error: unknown, fallbackMessage: string) => {
    if (error instanceof ApiError) {
      if (error.code === 'STUDY_REPORT_STATUS_TRANSITION_INVALID') {
        toast.error('현재 결과 보고 상태에서는 이 작업을 수행할 수 없습니다.');
        return;
      }

      if (error.code === 'STUDY_REPORT_REJECT_REASON_REQUIRED') {
        toast.error('반려 사유를 입력해주세요.');
        return;
      }

      if (error.code === 'STUDY_REPORT_REASON_TOO_LONG') {
        toast.error('사유는 최대 1000자까지 입력할 수 있습니다.');
        return;
      }

      if (error.code === 'STUDY_REPORT_NOT_FOUND' || error.status === 404) {
        toast.error('결과 보고를 찾을 수 없습니다.');
        return;
      }

      toast.error(error.message || fallbackMessage);
      return;
    }

    toast.error(fallbackMessage);
  };

  const approveMutation = useMutation({
    mutationFn: (studyId: number) => studyApi.approveStudyReport(studyId),
    onSuccess: (_, studyId) => {
      toast.success('결과 보고가 승인되었습니다.');
      invalidateReportQueries(studyId);
    },
    onError: (error) => {
      handleReportActionError(error, '결과 보고 승인에 실패했습니다.');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ studyId, reason }: { studyId: number; reason: string }) =>
      studyApi.rejectStudyReport(studyId, { reason }),
    onSuccess: (_, variables) => {
      toast.success('결과 보고가 반려되었습니다.');
      invalidateReportQueries(variables.studyId);
      setActionType(null);
      setActionReason('');
    },
    onError: (error) => {
      handleReportActionError(error, '결과 보고 반려에 실패했습니다.');
    },
  });

  const cancelDecisionMutation = useMutation({
    mutationFn: ({ studyId, reason }: { studyId: number; reason?: string }) =>
      studyApi.cancelStudyReportDecision(studyId, { reason }),
    onSuccess: (_, variables) => {
      toast.success('결재 상태가 취소되었습니다.');
      invalidateReportQueries(variables.studyId);
      setActionType(null);
      setActionReason('');
    },
    onError: (error) => {
      handleReportActionError(error, '결재 취소에 실패했습니다.');
    },
  });

  const isActionPending =
    approveMutation.isPending || rejectMutation.isPending || cancelDecisionMutation.isPending;

  const closeDetailDialog = () => {
    if (isActionPending) {
      return;
    }

    setSelectedReport(null);
    setActionType(null);
    setActionReason('');
  };

  const copyStudyId = async (studyId: number) => {
    try {
      await navigator.clipboard.writeText(String(studyId));
      toast.success(`studyId ${studyId}를 복사했습니다.`);
    } catch {
      toast.error('studyId 복사에 실패했습니다.');
    }
  };

  const openActionDialog = (type: 'REJECT' | 'CANCEL') => {
    setActionType(type);
    setActionReason('');
  };

  const confirmApprove = () => {
    if (!selectedReport) {
      return;
    }

    if (!canApproveOrReject) {
      toast.error('현재 상태에서는 승인할 수 없습니다.');
      return;
    }

    approveMutation.mutate(selectedReport.studyId);
  };

  const confirmReasonAction = () => {
    if (!selectedReport || !actionType) {
      return;
    }

    const trimmedReason = actionReason.trim();

    if (trimmedReason.length > 1000) {
      toast.error('사유는 최대 1000자까지 입력할 수 있습니다.');
      return;
    }

    if (actionType === 'REJECT') {
      if (!canApproveOrReject) {
        toast.error('현재 상태에서는 반려할 수 없습니다.');
        return;
      }

      if (!trimmedReason) {
        toast.error('반려 사유를 입력해주세요.');
        return;
      }

      rejectMutation.mutate({
        studyId: selectedReport.studyId,
        reason: trimmedReason,
      });
      return;
    }

    if (!canCancelDecision) {
      toast.error('현재 상태에서는 결재 취소를 할 수 없습니다.');
      return;
    }

    cancelDecisionMutation.mutate({
      studyId: selectedReport.studyId,
      reason: trimmedReason || undefined,
    });
  };

  return (
    <div className='space-y-6'>
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <h2 className='text-lg font-semibold'>스터디 결과 보고 결재</h2>
        <div className='flex items-center gap-2'>
          <Filter className='h-4 w-4 text-muted-foreground' />
          <Select
            value={selectedStatus}
            onValueChange={(value) => setSelectedStatus(value as 'all' | StudyReportStatus)}
          >
            <SelectTrigger className='w-[180px] h-9'>
              <SelectValue placeholder='상태 선택' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>전체 상태</SelectItem>
              <SelectItem value='SUBMITTED'>상신됨</SelectItem>
              <SelectItem value='RESUBMITTED'>재상신됨</SelectItem>
              <SelectItem value='APPROVED'>승인됨</SelectItem>
              <SelectItem value='REJECTED'>반려됨</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className='space-y-3'>
          {[...Array(3)].map((_, index) => (
            <Skeleton key={index} className='h-28' />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <EmptyState
          icon={FileText}
          title='결과 보고가 없습니다'
          description='선택한 조건에 해당하는 결과 보고가 없습니다.'
        />
      ) : (
        <div className='space-y-3'>
          {reports.map((report) => (
            <Card key={report.reportId} className='border-border/70'>
              <CardContent className='p-4 flex items-start justify-between gap-4'>
                <div className='space-y-2 min-w-0'>
                  <div className='flex items-center gap-2'>
                    <h3 className='font-semibold truncate'>{report.studyName}</h3>
                    <Badge className={reportStatusBadgeClassMap[report.status]}>
                      {reportStatusLabelMap[report.status]}
                    </Badge>
                  </div>
                  <p className='text-sm text-muted-foreground'>
                    스터디장: {report.leaderName}
                  </p>
                  <p className='text-xs text-muted-foreground'>
                    상신일: {format(new Date(report.submittedAt), 'yyyy.MM.dd HH:mm', { locale: ko })}
                  </p>
                  <p className='text-xs text-muted-foreground'>
                    최종 수정일: {format(new Date(report.lastModifiedAt), 'yyyy.MM.dd HH:mm', { locale: ko })}
                  </p>
                  <p className='text-xs text-muted-foreground'>studyId: {report.studyId}</p>
                  {reportReasonPreviewMap.get(report.studyId) && (
                    <p className='text-xs text-muted-foreground truncate'>
                      최근 사유: {reportReasonPreviewMap.get(report.studyId)}
                    </p>
                  )}
                </div>
                <div className='flex items-center gap-2'>
                  <Button
                    type='button'
                    size='icon'
                    variant='outline'
                    className='h-8 w-8'
                    onClick={() => copyStudyId(report.studyId)}
                    aria-label={`studyId ${report.studyId} 복사`}
                    title='studyId 복사'
                  >
                    <Copy className='h-4 w-4' />
                  </Button>
                  <Button size='sm' variant='outline' asChild>
                    <Link href={`/studies/${report.studyId}`} target='_blank' rel='noopener noreferrer'>
                      <ExternalLink className='h-4 w-4 mr-1' />
                      바로가기
                    </Link>
                  </Button>
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={() => {
                      setSelectedReport(report);
                      setActionType(null);
                      setActionReason('');
                    }}
                  >
                    상세 보기
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {hasNextPage && (
            <div className='flex justify-center pt-2'>
              <Button
                variant='outline'
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? (
                  <>
                    <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                    불러오는 중...
                  </>
                ) : (
                  '더 보기'
                )}
              </Button>
            </div>
          )}
        </div>
      )}

      <Dialog
        open={!!selectedReport}
        onOpenChange={(open) => {
          if (!open) {
            closeDetailDialog();
          }
        }}
      >
        <DialogContent className='max-w-4xl max-h-[85vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>{selectedReport?.studyName} 결과 보고</DialogTitle>
            <DialogDescription>
              스터디장 {selectedReport?.leaderName}님의 결과 보고를 검토하고 결재합니다.
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-6'>
            <div className='flex items-center gap-2'>
              {reportStatus && (
                <Badge className={reportStatusBadgeClassMap[reportStatus]}>
                  {reportStatusLabelMap[reportStatus]}
                </Badge>
              )}
              {selectedReport?.submittedAt && (
                <p className='text-sm text-muted-foreground'>
                  상신일: {format(new Date(selectedReport.submittedAt), 'yyyy.MM.dd HH:mm', { locale: ko })}
                </p>
              )}
            </div>

            <Card>
              <CardHeader className='pb-3'>
                <CardTitle className='text-base'>스터디 상세 정보</CardTitle>
              </CardHeader>
              <CardContent>
                {isStudyDetailLoading ? (
                  <div className='space-y-3'>
                    <Skeleton className='h-10 w-full' />
                    <Skeleton className='h-16 w-full' />
                    <Skeleton className='h-20 w-full' />
                  </div>
                ) : studyDetailError || !studyDetail ? (
                  <div className='space-y-3'>
                    <p className='text-sm text-destructive'>
                      스터디 상세 정보를 불러오지 못했습니다.
                    </p>
                    <Button size='sm' variant='outline' onClick={() => refetchStudyDetail()}>
                      다시 시도
                    </Button>
                  </div>
                ) : (
                  <div className='space-y-4'>
                    <div className='flex items-center justify-between gap-3'>
                      <div className='flex items-center gap-3 min-w-0'>
                        <UserAvatar
                          src={studyDetail.leader?.profileImageUrl}
                          name={studyDetail.leader?.name || selectedReport?.leaderName || ''}
                          className='h-9 w-9'
                        />
                        <div className='min-w-0'>
                          <p className='text-sm font-medium truncate'>
                            {studyDetail.leader?.name || selectedReport?.leaderName}
                          </p>
                          <p className='text-xs text-muted-foreground truncate'>
                            {studyDetail.leader?.trackName || '과정 정보 없음'}
                          </p>
                        </div>
                      </div>
                      <Badge variant='outline'>
                        {studyStatusLabelMap[studyDetail.status] || studyDetail.status}
                      </Badge>
                    </div>

                    <div className='grid sm:grid-cols-2 gap-3 text-sm'>
                      <div className='rounded-md border p-3 sm:col-span-2'>
                        <p className='text-xs text-muted-foreground mb-1'>스터디 이름</p>
                        <p className='font-medium'>{studyDetail.name}</p>
                      </div>
                      <div className='rounded-md border p-3 sm:col-span-2'>
                        <p className='text-xs text-muted-foreground mb-1'>스터디 설명</p>
                        <p className='whitespace-pre-wrap'>{studyDetail.description}</p>
                      </div>
                      <div className='rounded-md border p-3'>
                        <p className='text-xs text-muted-foreground mb-1'>모집 인원</p>
                        <p className='font-medium'>
                          {studyDetail.currentMemberCount}/{studyDetail.capacity}명
                        </p>
                      </div>
                      <div className='rounded-md border p-3'>
                        <p className='text-xs text-muted-foreground mb-1'>지원 항목</p>
                        <p className='font-medium'>
                          {studyBudgetLabelMap[studyDetail.budget] || studyDetail.budget}
                        </p>
                      </div>
                      <div className='rounded-md border p-3 sm:col-span-2'>
                        <p className='text-xs text-muted-foreground mb-1'>희망 지원 항목 설명</p>
                        <p className='whitespace-pre-wrap'>{studyDetail.budgetExplain}</p>
                      </div>
                      <div className='rounded-md border p-3 sm:col-span-2'>
                        <p className='text-xs text-muted-foreground mb-1'>일정</p>
                        <p className='font-medium'>
                          {studyDetail.scheduleName || studyDetail.schedule?.month || '일정 정보 없음'}
                        </p>
                      </div>
                      <div className='rounded-md border p-3 sm:col-span-2'>
                        <p className='text-xs text-muted-foreground mb-2'>팀원 명단</p>
                        {(studyDetail.participants?.length ?? 0) === 0 ? (
                          <p className='text-xs text-muted-foreground'>팀원 정보가 없습니다.</p>
                        ) : (
                          <div className='flex flex-wrap gap-1.5'>
                            {studyDetail.participants?.map((participant) => (
                              <Badge key={participant.id} variant='secondary' className='text-xs'>
                                {participant.name}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className='space-y-3'>
                      <p className='text-sm font-medium text-muted-foreground'>스터디 주차별 계획</p>
                      {[
                        { title: '1주차 계획', value: studyDetail.week1Plan },
                        { title: '2주차 계획', value: studyDetail.week2Plan },
                        { title: '3주차 계획', value: studyDetail.week3Plan },
                        { title: '4주차 계획', value: studyDetail.week4Plan },
                      ].map((item, index) => (
                        <div key={item.title} className={index < 3 ? 'border-b pb-3' : ''}>
                          <p className='text-xs text-muted-foreground mb-1'>{item.title}</p>
                          <p className='text-sm whitespace-pre-wrap'>{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {isReportDetailLoading ? (
              <div className='space-y-3'>
                {[...Array(4)].map((_, index) => (
                  <Skeleton key={index} className='h-24' />
                ))}
              </div>
            ) : reportDetailError || !reportDetail ? (
              <Card>
                <CardContent className='pt-6 space-y-3'>
                  <p className='text-sm text-destructive'>
                    결과 보고 상세를 불러오지 못했습니다.
                  </p>
                  <Button size='sm' variant='outline' onClick={() => refetchReportDetail()}>
                    다시 시도
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card>
                  <CardHeader className='pb-3'>
                    <CardTitle className='text-base'>주차별 활동</CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    {[
                      { title: '1주차 활동', value: reportDetail.week1Activity },
                      { title: '2주차 활동', value: reportDetail.week2Activity },
                      { title: '3주차 활동', value: reportDetail.week3Activity },
                      { title: '4주차 활동', value: reportDetail.week4Activity },
                    ].map((item, index) => (
                      <div key={item.title} className={index < 3 ? 'border-b pb-4' : ''}>
                        <p className='text-sm font-medium text-muted-foreground mb-1'>{item.title}</p>
                        <p className='text-sm whitespace-pre-wrap'>{item.value}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className='pb-3'>
                    <CardTitle className='text-base'>팀 회고</CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    {[
                      { title: '잘한 점', value: reportDetail.retrospectiveGood },
                      { title: '아쉬운 점', value: reportDetail.retrospectiveImprove },
                      { title: '다음 액션', value: reportDetail.retrospectiveNextAction },
                    ].map((item, index) => (
                      <div key={item.title} className={index < 2 ? 'border-b pb-4' : ''}>
                        <p className='text-sm font-medium text-muted-foreground mb-1'>{item.title}</p>
                        <p className='text-sm whitespace-pre-wrap'>{item.value}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className='pb-3'>
                    <CardTitle className='text-base flex items-center gap-2'>
                      <History className='h-4 w-4' />
                      결재 이력
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isReportHistoryLoading ? (
                      <div className='space-y-2'>
                        {[...Array(3)].map((_, index) => (
                          <Skeleton key={index} className='h-10' />
                        ))}
                      </div>
                    ) : reportHistoryError ? (
                      <div className='space-y-3'>
                        <p className='text-sm text-destructive'>결재 이력을 불러오지 못했습니다.</p>
                        <Button size='sm' variant='outline' onClick={() => refetchReportHistory()}>
                          다시 시도
                        </Button>
                      </div>
                    ) : reportHistory.length === 0 ? (
                      <p className='text-sm text-muted-foreground'>결재 이력이 없습니다.</p>
                    ) : (
                      <div className='space-y-3'>
                        {reportHistory.map((history, index) => (
                          <div key={`${history.timestamp}-${index}`} className='rounded-md border p-3'>
                            <div className='flex items-center justify-between gap-2'>
                              <Badge variant='outline'>
                                {reportActionLabelMap[history.action] || history.action}
                              </Badge>
                              <p className='text-xs text-muted-foreground'>
                                {format(new Date(history.timestamp), 'yyyy.MM.dd HH:mm', { locale: ko })}
                              </p>
                            </div>
                            <p className='text-xs text-muted-foreground mt-1'>
                              처리자 ID: {history.actorId}
                            </p>
                            {history.reason && (
                              <p className='text-sm mt-2 whitespace-pre-wrap'>{history.reason}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={closeDetailDialog}
              disabled={isActionPending}
            >
              닫기
            </Button>
            {canCancelDecision && (
              <Button
                type='button'
                variant='outline'
                onClick={() => openActionDialog('CANCEL')}
                disabled={isActionPending}
              >
                <Undo2 className='h-4 w-4 mr-1' />
                결재 취소
              </Button>
            )}
            {canApproveOrReject && (
              <Button
                type='button'
                variant='outline'
                className='text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20'
                onClick={() => openActionDialog('REJECT')}
                disabled={isActionPending}
              >
                <XCircle className='h-4 w-4 mr-1' />
                반려
              </Button>
            )}
            {canApproveOrReject && (
              <Button
                type='button'
                onClick={confirmApprove}
                disabled={isActionPending}
              >
                {approveMutation.isPending ? (
                  <Loader2 className='h-4 w-4 animate-spin' />
                ) : (
                  <>
                    <CheckCircle className='h-4 w-4 mr-1' />
                    승인
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!actionType}
        onOpenChange={(open) => {
          if (!open && !isActionPending) {
            setActionType(null);
            setActionReason('');
          }
        }}
      >
        <DialogContent className='sm:max-w-[520px]'>
          <DialogHeader>
            <DialogTitle>{actionType === 'REJECT' ? '결과 보고 반려' : '결재 취소'}</DialogTitle>
            <DialogDescription>
              {actionType === 'REJECT'
                ? '반려 사유를 입력해주세요. 입력한 사유는 이력에 기록됩니다.'
                : '결재 취소 사유를 입력할 수 있습니다. 비워두어도 취소할 수 있습니다.'}
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-2'>
            <Label htmlFor='study-report-action-reason'>
              사유 {actionType === 'REJECT' ? <span className='text-destructive'>*</span> : '(선택)'}
            </Label>
            <Textarea
              id='study-report-action-reason'
              value={actionReason}
              onChange={(event) => setActionReason(event.target.value)}
              placeholder={actionType === 'REJECT' ? '반려 사유를 입력해주세요' : '결재 취소 사유를 입력해주세요'}
              rows={4}
              maxLength={1000}
              disabled={isActionPending}
            />
            <p className='text-xs text-muted-foreground'>{actionReason.length}/1000</p>
          </div>

          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              disabled={isActionPending}
              onClick={() => {
                setActionType(null);
                setActionReason('');
              }}
            >
              취소
            </Button>
            <Button
              type='button'
              onClick={confirmReasonAction}
              disabled={isActionPending}
            >
              {isActionPending ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : actionType === 'REJECT' ? (
                '반려 확정'
              ) : (
                '결재 취소 확정'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ==================== Schedule Management Tab ====================
const MONTH_LABELS: Record<string, string> = {
  FIRST: '1차', SECOND: '2차', THIRD: '3차',
  FOURTH: '4차', FIFTH: '5차', SIXTH: '6차',
};

function ScheduleManagementTab() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ScheduleQueryResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ScheduleQueryResponse | null>(null);
  const [selectedTrackFilter, setSelectedTrackFilter] = useState<number>(0);
  const [selectedScheduleTrackType, setSelectedScheduleTrackType] = useState<TrackType | ''>('');
  const [selectedScheduleCardinal, setSelectedScheduleCardinal] = useState<string>('');
  const [formData, setFormData] = useState<ScheduleCreateRequest>({
    trackId: 0,
    month: '',
    recruitStartDate: '',
    recruitEndDate: '',
    studyEndDate: '',
  });

  const { data: tracks } = useQuery({
    queryKey: ['admin', 'tracks'],
    queryFn: async () => {
      const res = await adminApi.getAllTracks();
      return res.content || [];
    },
  });

  const { data: enrolledTrackTypes } = useQuery({
    queryKey: ['admin', 'schedule', 'track-types'],
    queryFn: async () => {
      const res = await scheduleApi.getEnrolledTrackTypes();
      return res.trackTypes ?? [];
    },
  });

  const { data: enrolledCardinals } = useQuery({
    queryKey: ['admin', 'schedule', 'cardinals', selectedScheduleTrackType],
    enabled: !!selectedScheduleTrackType,
    queryFn: async () => {
      if (!selectedScheduleTrackType) return [];
      const res = await scheduleApi.getEnrolledTrackCardinals(selectedScheduleTrackType);
      return res.cardinals ?? [];
    },
  });

  const trackIds = selectedTrackFilter
    ? [selectedTrackFilter]
    : (tracks?.map((t) => t.trackId) || []);

  const { data: schedulesMap, isLoading } = useQuery({
    queryKey: ['admin', 'schedules', trackIds],
    queryFn: () => scheduleApi.getSchedules(trackIds),
    enabled: trackIds.length > 0,
  });

  const allSchedules: (ScheduleQueryResponse & { trackName?: string })[] = [];
  if (schedulesMap) {
    for (const [trackId, items] of Object.entries(schedulesMap)) {
      const track = tracks?.find((t) => t.trackId === Number(trackId));
      for (const item of items) {
        allSchedules.push({ ...item, trackName: track?.trackName });
      }
    }
  }
  allSchedules.sort((a, b) => a.trackId - b.trackId || a.months.localeCompare(b.months));

  const createMutation = useMutation({
    mutationFn: (data: ScheduleCreateRequest) => scheduleApi.createSchedule(data),
    onSuccess: () => {
      toast.success('스터디 일정이 생성되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['admin', 'schedules'] });
      setIsCreateOpen(false);
      resetForm();
    },
    onError: () => toast.error('스터디 일정 생성에 실패했습니다.'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ScheduleUpdateRequest }) =>
      scheduleApi.updateSchedule(id, data),
    onSuccess: () => {
      toast.success('스터디 일정이 수정되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['admin', 'schedules'] });
      setEditingSchedule(null);
      resetForm();
    },
    onError: () => toast.error('스터디 일정 수정에 실패했습니다.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => scheduleApi.deleteSchedule(id),
    onSuccess: () => {
      toast.success('스터디 일정이 삭제되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['admin', 'schedules'] });
      setDeleteTarget(null);
    },
    onError: () => toast.error('스터디 일정 삭제에 실패했습니다. 참조하는 스터디가 있을 수 있습니다.'),
  });

  const resetForm = () => {
    setFormData({ trackId: 0, month: '', recruitStartDate: '', recruitEndDate: '', studyEndDate: '' });
    setSelectedScheduleTrackType('');
    setSelectedScheduleCardinal('');
  };

  const resolveSelectedTrackId = async (): Promise<number | null> => {
    if (!selectedScheduleTrackType || !selectedScheduleCardinal) {
      toast.error('과정 유형과 기수를 선택해주세요.');
      return null;
    }

    try {
      const resolved = await scheduleApi.resolveEnrolledTrack(
        selectedScheduleTrackType,
        Number(selectedScheduleCardinal),
      );
      return resolved.trackId;
    } catch {
      toast.error('선택한 과정/기수에 해당하는 진행중 과정을 찾지 못했습니다.');
      return null;
    }
  };

  const handleCreate = async () => {
    if (!formData.month || !formData.recruitStartDate || !formData.recruitEndDate || !formData.studyEndDate) {
      toast.error('모든 필드를 입력해주세요.');
      return;
    }

    const trackId = await resolveSelectedTrackId();
    if (!trackId) return;

    createMutation.mutate({
      ...formData,
      trackId,
    });
  };

  const handleUpdate = async () => {
    if (!editingSchedule) return;

    const trackId = await resolveSelectedTrackId();
    if (!trackId) return;

    updateMutation.mutate({
      id: editingSchedule.id,
      data: {
        trackId,
        months: formData.month || undefined,
        recruitStartDate: formData.recruitStartDate || undefined,
        recruitEndDate: formData.recruitEndDate || undefined,
        studyEndDate: formData.studyEndDate || undefined,
      },
    });
  };

  const openEditDialog = (schedule: ScheduleQueryResponse) => {
    setEditingSchedule(schedule);
    const matchedTrack = tracks?.find((track) => track.trackId === schedule.trackId);
    setSelectedScheduleTrackType((matchedTrack?.trackType as TrackType) ?? '');
    setSelectedScheduleCardinal(
      typeof matchedTrack?.cardinal === 'number' ? String(matchedTrack.cardinal) : '',
    );
    setFormData({
      trackId: schedule.trackId,
      month: schedule.months,
      recruitStartDate: schedule.recruitStartDate.split('T')[0],
      recruitEndDate: schedule.recruitEndDate.split('T')[0],
      studyEndDate: schedule.studyEndDate.split('T')[0],
    });
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'yyyy-MM-dd');
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-lg font-semibold">스터디 일정(차수) 관리</h2>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select
            value={selectedTrackFilter.toString()}
            onValueChange={(value) => setSelectedTrackFilter(Number(value))}
          >
            <SelectTrigger className="w-[180px] h-9">
              <SelectValue placeholder="과정 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">전체 과정</SelectItem>
              {tracks?.map((track) => (
                <SelectItem key={track.trackId} value={track.trackId.toString()}>
                  {track.trackName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => { resetForm(); setIsCreateOpen(true); }} className="bg-orange-500 hover:bg-orange-600 text-white">
            <Plus className="h-4 w-4 mr-2" />
            일정 추가
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : allSchedules.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="등록된 일정이 없습니다"
          description="새로운 스터디 일정을 추가해주세요."
        />
      ) : (
        <div className="space-y-3">
          {allSchedules.map((schedule) => (
            <Card key={schedule.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline">{schedule.trackName || `과정 ${schedule.trackId}`}</Badge>
                      <span className="font-semibold">{MONTH_LABELS[schedule.months] || schedule.monthName || schedule.months}</span>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-0.5">
                      <p>모집: {formatDate(schedule.recruitStartDate)} ~ {formatDate(schedule.recruitEndDate)}</p>
                      <p>스터디 종료: {formatDate(schedule.studyEndDate)}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(schedule)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(schedule)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>스터디 일정 추가</DialogTitle>
            <DialogDescription>새로운 스터디 일정을 생성합니다.</DialogDescription>
          </DialogHeader>
          <ScheduleForm
            formData={formData}
            setFormData={setFormData}
            trackTypes={enrolledTrackTypes}
            cardinals={enrolledCardinals}
            selectedTrackType={selectedScheduleTrackType}
            selectedCardinal={selectedScheduleCardinal}
            setSelectedTrackType={setSelectedScheduleTrackType}
            setSelectedCardinal={setSelectedScheduleCardinal}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>취소</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : '생성'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingSchedule} onOpenChange={(open) => !open && setEditingSchedule(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>스터디 일정 수정</DialogTitle>
            <DialogDescription>스터디 일정 정보를 수정합니다.</DialogDescription>
          </DialogHeader>
          <ScheduleForm
            formData={formData}
            setFormData={setFormData}
            trackTypes={enrolledTrackTypes}
            cardinals={enrolledCardinals}
            selectedTrackType={selectedScheduleTrackType}
            selectedCardinal={selectedScheduleCardinal}
            setSelectedTrackType={setSelectedScheduleTrackType}
            setSelectedCardinal={setSelectedScheduleCardinal}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingSchedule(null)}>취소</Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : '저장'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>일정 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              이 스터디 일정을 삭제하시겠습니까?
              <span className="block mt-2 text-destructive">
                참조하는 스터디가 있으면 삭제할 수 없습니다.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : '삭제'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ScheduleForm({
  formData,
  setFormData,
  trackTypes,
  cardinals,
  selectedTrackType,
  selectedCardinal,
  setSelectedTrackType,
  setSelectedCardinal,
}: {
  formData: ScheduleCreateRequest;
  setFormData: (data: ScheduleCreateRequest) => void;
  trackTypes?: Array<{ trackType: TrackType; label: string; requiresCardinal?: boolean }>;
  cardinals?: number[];
  selectedTrackType: TrackType | '';
  selectedCardinal: string;
  setSelectedTrackType: (value: TrackType | '') => void;
  setSelectedCardinal: (value: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>과정 유형</Label>
        <Select
          value={selectedTrackType}
          onValueChange={(value) => {
            setSelectedTrackType(value as TrackType);
            setSelectedCardinal('');
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="과정 유형을 선택하세요" />
          </SelectTrigger>
          <SelectContent>
            {trackTypes?.map((trackType) => (
              <SelectItem key={trackType.trackType} value={trackType.trackType}>
                {trackType.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>기수</Label>
        <Select
          value={selectedCardinal}
          onValueChange={(value) => setSelectedCardinal(value)}
          disabled={!selectedTrackType}
        >
          <SelectTrigger>
            <SelectValue placeholder="기수를 선택하세요" />
          </SelectTrigger>
          <SelectContent>
            {cardinals?.map((cardinal) => (
              <SelectItem key={cardinal} value={String(cardinal)}>
                {cardinal}기
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>차수</Label>
        <Select value={formData.month} onValueChange={(value) => setFormData({ ...formData, month: value })}>
          <SelectTrigger>
            <SelectValue placeholder="차수 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="FIRST">1차</SelectItem>
            <SelectItem value="SECOND">2차</SelectItem>
            <SelectItem value="THIRD">3차</SelectItem>
            <SelectItem value="FOURTH">4차</SelectItem>
            <SelectItem value="FIFTH">5차</SelectItem>
            <SelectItem value="SIXTH">6차</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>모집 시작일</Label>
        <Input
          type="date"
          value={formData.recruitStartDate}
          onChange={(e) => setFormData({ ...formData, recruitStartDate: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label>모집 종료일</Label>
        <Input
          type="date"
          value={formData.recruitEndDate}
          onChange={(e) => setFormData({ ...formData, recruitEndDate: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label>스터디 종료일</Label>
        <Input
          type="date"
          value={formData.studyEndDate}
          onChange={(e) => setFormData({ ...formData, studyEndDate: e.target.value })}
        />
      </div>
    </div>
  );
}

// ==================== Shop Management Tab ====================
const ITEM_TYPE_LABEL: Record<ShopItemType, string> = {
  BADGE: '뱃지', PET: '펫', FRAME: '프레임',
};

const ITEM_TYPE_DEFAULT_PRICE: Record<ShopItemType, string> = {
  BADGE: '5000',
  FRAME: '12000',
  PET: '20000',
};

const ITEM_TYPE_ORDER: ShopItemType[] = ['PET', 'FRAME', 'BADGE'];

type ItemFilterType = 'ALL' | ShopItemType;

const ITEM_FILTER_TABS: { value: ItemFilterType; label: string }[] = [
  { value: 'ALL', label: '전체' },
  { value: 'PET', label: '펫' },
  { value: 'FRAME', label: '프레임' },
  { value: 'BADGE', label: '뱃지' },
];

function ShopManagementTab() {
  const queryClient = useQueryClient();
  const { previewItems, setPreviewItem, clearPreviewItem, clearPreview } = useProfilePreview();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [filter, setFilter] = useState<ItemFilterType>('ALL');
  const [formData, setFormData] = useState({
    name: '', description: '', price: '', itemType: '' as ShopItemType | '',
    consumable: false, durationDays: '', file: null as File | null,
  });

  const { data: groups, isLoading } = useQuery({
    queryKey: ['shop', 'items'],
    queryFn: () => shopApi.getItems(),
  });

  const sortedGroups = groups
    ? [...groups].sort((a, b) => ITEM_TYPE_ORDER.indexOf(a.itemType) - ITEM_TYPE_ORDER.indexOf(b.itemType))
    : [];

  const filteredGroups = sortedGroups.filter(
    (g) => filter === 'ALL' || g.itemType === filter
  );

  const allItems = filteredGroups.flatMap((g) => g.items);
  const activeFilterLabel = ITEM_FILTER_TABS.find((tab) => tab.value === filter)?.label ?? '전체';

  useEffect(() => () => clearPreview(), [clearPreview]);

  const resetForm = () => setFormData({
    name: '', description: '', price: '', itemType: '',
    consumable: false, durationDays: '', file: null,
  });

  const handleItemTypeChange = (itemType: ShopItemType) => {
    setFormData((prev) => ({
      ...prev,
      itemType,
      price: ITEM_TYPE_DEFAULT_PRICE[itemType],
    }));
  };

  const buildFormData = () => {
    const fd = new FormData();
    fd.append('name', formData.name);
    fd.append('description', formData.description);
    fd.append('price', formData.price);
    fd.append('itemType', formData.itemType);
    fd.append('consumable', String(formData.consumable));
    if (formData.durationDays) fd.append('durationDays', formData.durationDays);
    if (formData.file) fd.append('file', formData.file);
    return fd;
  };

  const createMutation = useMutation({
    mutationFn: () => adminApi.createShopItem(buildFormData()),
    onSuccess: () => {
      toast.success('아이템이 등록되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['shop', 'items'] });
      setIsCreateOpen(false);
      resetForm();
    },
    onError: () => toast.error('아이템 등록에 실패했습니다.'),
  });

  const hideMutation = useMutation({
    mutationFn: (itemId: number) => adminApi.hideShopItem(itemId),
    onSuccess: () => {
      toast.success('아이템이 숨김 처리되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['shop', 'items'] });
    },
    onError: () => toast.error('처리에 실패했습니다.'),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">상점 아이템 관리</h2>
          <p className="text-sm text-muted-foreground">상점과 동일한 카테고리 필터로 아이템을 관리합니다.</p>
        </div>
        <Button onClick={() => { resetForm(); setIsCreateOpen(true); }} className="bg-orange-500 hover:bg-orange-600 text-white">
          <Plus className="h-4 w-4 mr-2" />
          아이템 등록
        </Button>
      </div>

      <div className="flex">
        <nav className="flex gap-1 border-b-2 border-border">
          {ITEM_FILTER_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={cn(
                'px-4 py-2.5 text-sm font-medium -mb-0.5 border-b-2 transition-colors',
                filter === tab.value
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : allItems.length === 0 ? (
        <EmptyState icon={Store} title="표시할 아이템이 없습니다" description={`${activeFilterLabel} 카테고리에 등록된 아이템이 없습니다.`} />
      ) : filter === 'ALL' ? (
        <div className="space-y-6">
          {filteredGroups.map((group) => {
            if (!group.items.length) return null;

            return (
              <section key={group.itemType} className="space-y-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold">{ITEM_TYPE_LABEL[group.itemType]}</h3>
                  <Badge variant="secondary">{group.items.length}</Badge>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                  {group.items.map((item) => (
                    <AdminShopItemCard
                      key={item.id}
                      item={item}
                      isPreviewing={previewItems[item.itemType] === item.imageUrl}
                      onPreview={() => {
                        if (!item.imageUrl) return;
                        if (previewItems[item.itemType] === item.imageUrl) {
                          clearPreviewItem(item.itemType);
                          return;
                        }
                        setPreviewItem(item.itemType, item.imageUrl);
                      }}
                      onHide={() => hideMutation.mutate(item.id)}
                      isHiding={hideMutation.isPending}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
          {allItems.map((item) => (
            <AdminShopItemCard
              key={item.id}
              item={item}
              isPreviewing={previewItems[item.itemType] === item.imageUrl}
              onPreview={() => {
                if (!item.imageUrl) return;
                if (previewItems[item.itemType] === item.imageUrl) {
                  clearPreviewItem(item.itemType);
                  return;
                }
                setPreviewItem(item.itemType, item.imageUrl);
              }}
              onHide={() => hideMutation.mutate(item.id)}
              isHiding={hideMutation.isPending}
            />
          ))}
        </div>
      )}

      {/* 아이템 등록 다이얼로그 */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>아이템 등록</DialogTitle>
            <DialogDescription>새 상점 아이템을 등록합니다.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>이름</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="아이템 이름" />
            </div>
            <div className="space-y-2">
              <Label>설명</Label>
              <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="아이템 설명" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>가격 (P)</Label>
                <Input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} placeholder="100" />
              </div>
              <div className="space-y-2">
                <Label>타입</Label>
                <Select value={formData.itemType} onValueChange={(v) => handleItemTypeChange(v as ShopItemType)}>
                  <SelectTrigger><SelectValue placeholder="선택" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PET">펫</SelectItem>
                    <SelectItem value="FRAME">프레임</SelectItem>
                    <SelectItem value="BADGE">뱃지</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="consumable"
                checked={formData.consumable}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, consumable: !!checked, durationDays: checked ? formData.durationDays : '' })
                }
              />
              <Label htmlFor="consumable" className="cursor-pointer">기간제 아이템</Label>
            </div>
            {formData.consumable && (
              <div className="space-y-2">
                <Label>사용 가능 기간 (일)</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.durationDays}
                  onChange={(e) => setFormData({ ...formData, durationDays: e.target.value })}
                  placeholder="예: 30"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>이미지 파일</Label>
              <Input type="file" accept="image/*,.gif" onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] ?? null })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>취소</Button>
            <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending || !formData.name || !formData.price || !formData.itemType}>
              {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : '등록'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AdminShopItemCard({
  item,
  isPreviewing,
  onPreview,
  onHide,
  isHiding,
}: {
  item: ShopItemSummaryDto;
  isPreviewing: boolean;
  onPreview: () => void;
  onHide: () => void;
  isHiding: boolean;
}) {
  const durationText = item.durationDays == null ? '영구' : `${item.durationDays}일`;

  return (
    <Card className="border-border/80 hover:border-primary/40 transition-colors">
      <CardContent className="p-2 h-full flex flex-col gap-1.5">
        <div className="w-full aspect-square rounded-lg bg-muted flex items-center justify-center overflow-hidden">
          {item.imageUrl ? (
            <img src={resolveApiImageUrl(item.imageUrl)} alt={item.name} className="w-full h-full object-contain" style={{ imageRendering: 'pixelated' }} />
          ) : (
            <Package className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
        <div className="space-y-1">
          <p className="text-[11px] font-medium truncate">{item.name}</p>
          <div className="flex flex-wrap items-center gap-1">
            <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">{ITEM_TYPE_LABEL[item.itemType]}</Badge>
            <Badge variant={item.consumable ? 'secondary' : 'outline'} className="text-[10px] px-1.5 py-0.5">
              {durationText}
            </Badge>
          </div>
          <p className="text-[11px] text-primary font-semibold">{item.price.toLocaleString()} P</p>
        </div>
        <div className="mt-auto grid grid-cols-2 gap-1">
          <Button
            variant={isPreviewing ? 'default' : 'outline'}
            size="sm"
            className="h-6 px-1 text-[10px]"
            onClick={onPreview}
            disabled={!item.imageUrl}
          >
            <Eye className="h-3 w-3 mr-0.5" />
            미리보기
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-6 px-1 text-[10px] text-muted-foreground hover:text-destructive"
            onClick={onHide}
            disabled={isHiding}
          >
            <EyeOff className="h-3 w-3 mr-0.5" />
            숨김
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ==================== Point Give Tab ====================
function PointGiveTab() {
  const [query, setQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserSummary | null>(null);
  const [amount, setAmount] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const { data: users } = useQuery({
    queryKey: ['mention-users'],
    queryFn: () => userApi.getMentionUsers({ size: 100 }),
    staleTime: 60 * 1000,
  });

  const filtered = (Array.isArray(users) ? users : []).filter(
    (u) => u.name.toLowerCase().includes(query.toLowerCase())
  );

  const giveMutation = useMutation({
    mutationFn: () => adminApi.givePoints({ userId: selectedUser!.userId, amount: Number(amount) }),
    onSuccess: () => {
      toast.success(`${selectedUser?.name}님께 ${Number(amount).toLocaleString()}P가 지급되었습니다.`);
      setSelectedUser(null);
      setQuery('');
      setAmount('');
    },
    onError: () => toast.error('포인트 지급에 실패했습니다.'),
  });

  return (
    <div className="max-w-md space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-1">포인트 직접 지급</h2>
        <p className="text-sm text-muted-foreground">유저를 검색한 후 포인트를 지급합니다.</p>
      </div>
      <Card>
        <CardContent className="p-6 space-y-4">
          {/* 유저 검색 */}
          <div className="space-y-2">
            <Label>유저 검색</Label>
            {selectedUser ? (
              <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-primary bg-primary/5">
                <UserAvatar src={selectedUser.profileImageUrl} name={selectedUser.name} className="h-6 w-6" />
                <span className="text-sm font-medium flex-1">{selectedUser.name}</span>
                {selectedUser.trackName && (
                  <span className="text-xs text-muted-foreground">{selectedUser.trackName}</span>
                )}
                <button
                  onClick={() => { setSelectedUser(null); setQuery(''); }}
                  className="text-muted-foreground hover:text-foreground ml-1"
                >
                  <XCircle className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Input
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setShowDropdown(true); }}
                  onFocus={() => setShowDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                  placeholder="이름으로 검색..."
                />
                {showDropdown && query && filtered.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border border-border rounded-md shadow-md overflow-hidden max-h-48 overflow-y-auto">
                    {filtered.map((u) => (
                      <button
                        key={u.userId}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-muted text-left transition-colors"
                        onMouseDown={() => { setSelectedUser(u); setQuery(u.name); setShowDropdown(false); }}
                      >
                        <UserAvatar src={u.profileImageUrl} name={u.name} className="h-7 w-7" />
                        <div>
                          <p className="text-sm font-medium">{u.name}</p>
                          {u.trackName && <p className="text-xs text-muted-foreground">{u.trackName}</p>}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 포인트 입력 */}
          <div className="space-y-2">
            <Label>지급 포인트</Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="포인트 수량 입력"
              disabled={!selectedUser}
            />
          </div>

          <Button
            className="w-full"
            onClick={() => giveMutation.mutate()}
            disabled={giveMutation.isPending || !selectedUser || !amount || Number(amount) <= 0}
          >
            {giveMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Coins className="h-4 w-4 mr-2" />
                포인트 지급
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ==================== Shared Components ====================
function UserCard({
  user,
  onApprove,
  onReject,
  showActions = false,
  isChecked,
  onToggleSelect,
}: {
  user: AdminUser;
  onApprove?: () => void;
  onReject?: () => void;
  showActions?: boolean;
  isChecked?: boolean;
  onToggleSelect?: (checked: boolean) => void;
}) {
  const timeAgo = formatDistanceToNow(new Date(user.createdAt), {
    addSuffix: true,
    locale: ko,
  });

  return (
    <Card className="hover:bg-muted/30 transition-colors border-border/60">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {onToggleSelect && (
            <div className="pt-3">
              <Checkbox
                checked={isChecked}
                onCheckedChange={(checked) => onToggleSelect(checked as boolean)}
              />
            </div>
          )}
          <UserAvatar
            src={user.profileImageUrl}
            name={user.name}
            className="h-12 w-12 mt-1"
          />
          <div className="flex-1 min-w-0 py-1">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-semibold text-base truncate">{user.name}</p>
              <Badge variant="outline" className="text-xs font-normal bg-background">
                {user.trackName}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground space-y-0.5">
              <p className="truncate">{user.email}</p>
              {user.phoneNumber && (
                <div className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" />
                  <p className="truncate">{user.phoneNumber.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3')}</p>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground/70 mt-2 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {timeAgo} 가입 요청
            </p>
          </div>
          {showActions && (
            <div className="flex flex-col sm:flex-row gap-2 self-center">
              <Button
                size="sm"
                variant="outline"
                onClick={onReject}
                className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20 h-9"
              >
                <XCircle className="h-4 w-4 mr-1.5" />
                거절
              </Button>
              <Button size="sm" onClick={onApprove} className="h-9">
                <CheckCircle className="h-4 w-4 mr-1.5" />
                승인
              </Button>
            </div>
          )}
          {!showActions && user.requestStatus === 'ACCEPTED' && (
            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 self-center px-3 py-1">
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
      <Skeleton className="h-10 w-full" />
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <UserListSkeleton />
    </div>
  );
}
