import { API_BASE_URL } from './constants';

// API client with credentials included for cookie-based auth
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      credentials: 'include', // Required for cookie-based auth
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    const response = await fetch(url, config);

    // Handle 401 - redirect to login (except for auth check endpoints)
    if (response.status === 401) {
      // Don't redirect for auth check endpoints or if already on signin page
      const isAuthCheckEndpoint = endpoint === '/auth/me' || endpoint === '/auth/login';
      const isSigninPage = typeof window !== 'undefined' && window.location.pathname === '/signin';

      if (!isAuthCheckEndpoint && !isSigninPage) {
        window.location.href = '/signin';
      }
      throw new Error('Unauthorized');
    }

    // Handle 404 on login - user not registered
    if (response.status === 404 && endpoint === '/auth/login') {
      throw new ApiError('USER_NOT_FOUND', 404, '미가입 유저입니다.');
    }

    // Handle other errors
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.code || 'UNKNOWN_ERROR',
        response.status,
        errorData.message || '오류가 발생했습니다.',
        errorData.errors
      );
    }

    // Handle 204 No Content or empty body
    if (response.status === 204) {
      return {} as T;
    }

    const contentType = response.headers.get('Content-Type');
    if (!contentType || !contentType.includes('application/json')) {
      return {} as T;
    }

    const text = await response.text();
    return text ? JSON.parse(text) : ({} as T);
  }

  get<T>(endpoint: string, params?: Record<string, string | number | boolean | undefined>) {
    let url = endpoint;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }
    return this.request<T>(url, { method: 'GET' });
  }

  post<T>(endpoint: string, data?: unknown) {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  put<T>(endpoint: string, data?: unknown) {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  patch<T>(endpoint: string, data?: unknown) {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  delete<T>(endpoint: string, data?: unknown) {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // For file uploads (multipart/form-data)
  async upload<T>(endpoint: string, formData: FormData): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    // Handle 401 - redirect to login
    if (response.status === 401) {
      const isSigninPage = typeof window !== 'undefined' && window.location.pathname === '/signin';
      if (!isSigninPage) {
        window.location.href = '/signin';
      }
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.code || 'UPLOAD_ERROR',
        response.status,
        errorData.message || '업로드에 실패했습니다.',
        errorData.errors
      );
    }

    // Handle 204 No Content or empty body
    if (response.status === 204) {
      return {} as T;
    }

    const contentType = response.headers.get('Content-Type');
    if (!contentType || !contentType.includes('application/json')) {
      return {} as T;
    }

    const text = await response.text();
    return text ? JSON.parse(text) : ({} as T);
  }
}

// Custom API Error class
export class ApiError extends Error {
  code: string;
  status: number;
  errors?: Array<{ field: string; reason: string }>;

  constructor(
    code: string,
    status: number,
    message: string,
    errors?: Array<{ field: string; reason: string }>
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.errors = errors;
  }
}

export const api = new ApiClient(API_BASE_URL);

// Type definitions for API responses
export interface User {
  id: number;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  trackId?: number;
  trackName?: string;
  profileImageUrl?: string;
}

export interface Track {
  id: number;
  trackName: string;
  startDate: string;
  endDate: string;
}

export interface PostSummary {
  id: number;
  topic: string;
  title: string;
  preview: string;
  author: {
    id: number;
    name: string;
    profileImageUrl?: string;
  };
  reactionCount: number;
  commentCount: number;
  viewCount: number;
  isReacted: boolean;
  createdAt: string;
  highlightType?: string;
}

export interface Post {
  id: number;
  topic: string;
  title: string;
  content: string;
  preview: string;
  author: {
    id: number;
    name: string;
    trackName?: string;
    profileImageUrl?: string;
  };
  reactionCount: number;
  commentCount: number;
  viewCount: number;
  isReacted: boolean;
  isAuthor: boolean;
  createdAt: string;
  updatedAt: string;
  highlightType?: string;
}

export interface Comment {
  id: number;
  content: string;
  author: {
    id: number;
    name: string;
    profileImageUrl?: string;
  };
  parentId?: number;
  reactionCount: number;
  isReacted: boolean;
  isAuthor: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  mentionedUsers?: Array<{ id: number; name: string }>;
}

export interface Study {
  id: number;
  name: string;
  description: string;
  capacity: number;
  currentMemberCount: number;
  status: string;
  budget: string;
  chatUrl?: string;
  refUrl?: string;
  tags: string[];
  leader: {
    id: number;
    name: string;
    trackName?: string;
    profileImageUrl?: string;
  };
  schedule?: {
    id: number;
    month: string;
    recruitStartDate: string;
    recruitEndDate: string;
    studyEndDate: string;
  };
  isLeader: boolean;
  isRecruitmentClosed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: number;
  type: string;
  message: string;
  isRead: boolean;
  relatedId?: number;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  hasNext: boolean;
  totalElements?: number;
  totalPages?: number;
}

// Notification API 응답 타입
export interface NotificationResponse {
  id: number;
  type: string;
  title: string;
  content: string;
  actorId?: number;
  referenceType: 'POST' | 'STUDY';
  referenceId: number;
  status: 'READ' | 'UNREAD';
  createdAt: string;
}

export interface NotificationsResponse {
  notifications: NotificationResponse[];
  hasNext: boolean;
}

export interface UnreadCountResponse {
  count: number;
}

// 알림 타입 매핑 (백엔드 → 프론트엔드)
export const mapNotificationType = (type: string): string => {
  switch (type) {
    case 'POST_COMMENT':
    case 'COMMENT_REPLY':
    case 'COMMENT_MENTION':
      return 'COMMENT';
    case 'POST_REACTION':
    case 'COMMENT_REACTION':
      return 'LIKE';
    case 'ANNOUNCEMENT':
      return 'NOTICE';
    default:
      return type;
  }
};

// API 응답을 Notification 타입으로 변환
export const mapNotificationResponse = (item: NotificationResponse): Notification => ({
  id: item.id,
  type: mapNotificationType(item.type),
  message: item.content,
  isRead: item.status === 'READ',
  relatedId: item.referenceId,
  createdAt: item.createdAt,
});
