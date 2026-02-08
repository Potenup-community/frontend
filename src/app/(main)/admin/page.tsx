'use client';

import { useState } from 'react';
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
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, adminApi, studyApi, scheduleApi, AdminTrack, Study, Schedule, ScheduleCreateRequest, ScheduleUpdateRequest, ScheduleQueryResponse } from '@/lib/api';
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
          <p className="text-muted-foreground">유저, 트랙, 스터디 관리</p>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={mainTab} onValueChange={setMainTab}>
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="user-track" className="gap-2">
            <Users className="h-4 w-4" />
            유저 / 트랙 관리
          </TabsTrigger>
          <TabsTrigger value="study" className="gap-2">
            <BookOpen className="h-4 w-4" />
            스터디 관리
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
                트랙 관리
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
              <TabsTrigger value="schedules" className="gap-2">
                <Calendar className="h-4 w-4" />
                일정 관리
              </TabsTrigger>
            </TabsList>
            <TabsContent value="approval" className="mt-4">
              <StudyApprovalTab />
            </TabsContent>
            <TabsContent value="schedules" className="mt-4">
              <ScheduleManagementTab />
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

  const { data: pendingUsers, isLoading: pendingLoading } = useQuery({
    queryKey: ['admin', 'users', 'PENDING', selectedTrack],
    queryFn: async () => {
      const res = await adminApi.getUsers({
        requestStatus: 'PENDING',
        trackId: selectedTrack || undefined,
        page: 0,
        size: 20
      });
      return res.content || [];
    },
  });

  const { data: approvedUsers, isLoading: approvedLoading } = useQuery({
    queryKey: ['admin', 'users', 'APPROVED', selectedTrack],
    queryFn: async () => {
      const res = await adminApi.getUsers({
        requestStatus: 'ACCEPTED',
        trackId: selectedTrack || undefined,
        page: 0,
        size: 20
      });
      return res.content || [];
    },
  });

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

  const pendingCount = pendingUsers?.length || 0;
  const approvedCount = approvedUsers?.length || 0;

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
                  <SelectValue placeholder="트랙 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">전체 트랙</SelectItem>
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
            ) : pendingUsers?.length === 0 ? (
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
                        전체 선택 ({pendingUsers?.length}명)
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
                  {pendingUsers?.map((adminUser) => (
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
              </div>
            )}
          </TabsContent>

          <TabsContent value="approved" className="mt-0">
            {approvedLoading ? (
              <UserListSkeleton />
            ) : approvedUsers?.length === 0 ? (
              <EmptyState
                icon={Users}
                title="승인된 유저가 없습니다"
                description="아직 승인된 유저가 없습니다."
              />
            ) : (
              <div className="grid gap-3 mt-4">
                {approvedUsers?.map((adminUser) => (
                  <UserCard key={adminUser.userId} user={adminUser} />
                ))}
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
  const [formData, setFormData] = useState({
    trackName: '',
    startDate: '',
    endDate: '',
  });

  const { data: tracks, isLoading } = useQuery({
    queryKey: ['admin', 'tracks'],
    queryFn: async () => {
      const res = await adminApi.getAllTracks();
      return res.content || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: { trackName: string; startDate: string; endDate: string }) =>
      adminApi.createTrack(data),
    onSuccess: () => {
      toast.success('트랙이 생성되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['admin', 'tracks'] });
      setIsCreateOpen(false);
      resetForm();
    },
    onError: () => {
      toast.error('트랙 생성에 실패했습니다.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { trackName?: string; startDate?: string; endDate?: string } }) =>
      adminApi.updateTrack(id, data),
    onSuccess: () => {
      toast.success('트랙이 수정되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['admin', 'tracks'] });
      setEditingTrack(null);
      resetForm();
    },
    onError: () => {
      toast.error('트랙 수정에 실패했습니다.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.deleteTrack(id),
    onSuccess: () => {
      toast.success('트랙이 삭제되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['admin', 'tracks'] });
      setDeleteTarget(null);
    },
    onError: () => {
      toast.error('트랙 삭제에 실패했습니다.');
    },
  });

  const resetForm = () => {
    setFormData({ trackName: '', startDate: '', endDate: '' });
  };

  const handleCreate = () => {
    if (!formData.trackName || !formData.startDate || !formData.endDate) {
      toast.error('모든 필드를 입력해주세요.');
      return;
    }
    createMutation.mutate(formData);
  };

  const handleUpdate = () => {
    if (!editingTrack) return;
    updateMutation.mutate({
      id: editingTrack.trackId,
      data: formData,
    });
  };

  const openEditDialog = (track: AdminTrack) => {
    setEditingTrack(track);
    setFormData({
      trackName: track.trackName,
      startDate: track.startDate,
      endDate: track.endDate,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">트랙 목록</h2>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          트랙 추가
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : tracks?.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="트랙이 없습니다"
          description="새로운 트랙을 추가해주세요."
        />
      ) : (
        <div className="space-y-3">
          {tracks?.map((track) => (
            <Card key={track.trackId}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{track.trackName}</p>
                  <p className="text-sm text-muted-foreground">
                    {track.startDate} ~ {track.endDate}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(track)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeleteTarget(track)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>트랙 추가</DialogTitle>
            <DialogDescription>새로운 트랙 정보를 입력해주세요.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="trackName">트랙 이름</Label>
              <Input
                id="trackName"
                value={formData.trackName}
                onChange={(e) => setFormData({ ...formData, trackName: e.target.value })}
                placeholder="예: Backend 5기"
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
            <DialogTitle>트랙 수정</DialogTitle>
            <DialogDescription>트랙 정보를 수정해주세요.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editTrackName">트랙 이름</Label>
              <Input
                id="editTrackName"
                value={formData.trackName}
                onChange={(e) => setFormData({ ...formData, trackName: e.target.value })}
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
            <AlertDialogTitle>트랙 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.trackName} 트랙을 삭제하시겠습니까?
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

  const { data: pendingStudies, isLoading } = useQuery({
    queryKey: ['admin', 'studies', 'pending'],
    queryFn: async () => {
      const res = await adminApi.getPendingStudies();
      return res.content || [];
    },
  });

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

  const confirmApprove = () => {
    if (!selectedStudy) return;
    approveMutation.mutate(selectedStudy.id);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">승인 대기 중인 스터디</h2>
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
          description="모든 스터디 신청이 처리되었습니다."
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
                    <Button size="sm" onClick={() => setSelectedStudy(study)}>
                      <CheckCircle className="h-4 w-4 mr-1" />
                      승인
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
              "{selectedStudy?.name}" 스터디를 승인하시겠습니까?
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
                '승인'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
  };

  const handleCreate = () => {
    if (!formData.trackId || !formData.month || !formData.recruitStartDate || !formData.recruitEndDate || !formData.studyEndDate) {
      toast.error('모든 필드를 입력해주세요.');
      return;
    }
    createMutation.mutate(formData);
  };

  const handleUpdate = () => {
    if (!editingSchedule) return;
    updateMutation.mutate({
      id: editingSchedule.id,
      data: {
        trackId: formData.trackId || undefined,
        months: formData.month || undefined,
        recruitStartDate: formData.recruitStartDate || undefined,
        recruitEndDate: formData.recruitEndDate || undefined,
        studyEndDate: formData.studyEndDate || undefined,
      },
    });
  };

  const openEditDialog = (schedule: ScheduleQueryResponse) => {
    setEditingSchedule(schedule);
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
              <SelectValue placeholder="트랙 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">전체 트랙</SelectItem>
              {tracks?.map((track) => (
                <SelectItem key={track.trackId} value={track.trackId.toString()}>
                  {track.trackName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => { resetForm(); setIsCreateOpen(true); }}>
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
                      <Badge variant="outline">{schedule.trackName || `트랙 ${schedule.trackId}`}</Badge>
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
          <ScheduleForm formData={formData} setFormData={setFormData} tracks={tracks} />
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
          <ScheduleForm formData={formData} setFormData={setFormData} tracks={tracks} />
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
  tracks,
}: {
  formData: ScheduleCreateRequest;
  setFormData: (data: ScheduleCreateRequest) => void;
  tracks?: AdminTrack[];
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>트랙 선택</Label>
        <Select
          value={formData.trackId ? formData.trackId.toString() : ''}
          onValueChange={(value) => setFormData({ ...formData, trackId: Number(value) })}
        >
          <SelectTrigger>
            <SelectValue placeholder="트랙을 선택하세요" />
          </SelectTrigger>
          <SelectContent>
            {tracks?.map((track) => (
              <SelectItem key={track.trackId} value={track.trackId.toString()}>
                {track.trackName}
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
          {!showActions && user.status === 'APPROVED' && (
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
