import { User, QueueSummary, QueueDetails, Token, AnalyticsData } from './types';

const rawApiUrl = ((import.meta.env.VITE_API_URL || (import.meta.env as any).API_URL) || '').trim().replace(/\/$/, '');
const API_BASE = rawApiUrl
  ? (rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl}/api`)
  : '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('queue_manager_token');
}

export function setAuthToken(token: string) {
  localStorage.setItem('queue_manager_token', token);
}

export function removeAuthToken() {
  localStorage.removeItem('queue_manager_token');
}

async function request<T>(endpoint: string, options: RequestInit = {}, retries = 1): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>)
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const isGet = !options.method || options.method.toUpperCase() === 'GET';

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      // If server returned a 5xx error (e.g. database cold start) on an idempotent GET, retry once
      if (isGet && retries > 0 && res.status >= 500) {
        await new Promise((r) => setTimeout(r, 600));
        return request<T>(endpoint, options, retries - 1);
      }
      throw new Error(data.error || `Server responded with error ${res.status}`);
    }

    return data as T;
  } catch (err: any) {
    if (isGet && retries > 0 && err.name === 'TypeError' && err.message?.toLowerCase().includes('fetch')) {
      await new Promise((r) => setTimeout(r, 600));
      return request<T>(endpoint, options, retries - 1);
    }
    if (err.name === 'TypeError' && err.message?.toLowerCase().includes('fetch')) {
      throw new Error('Connection lost: Unable to reach the queue server. Please check your network or backend service.');
    }
    throw err;
  }
}

// Authentication API
export const api = {
  async register(data: { name: string; email: string; password: string }): Promise<{ user: User; token: string }> {
    const res = await request<{ user: User; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    setAuthToken(res.token);
    return res;
  },

  async login(data: { email: string; password: string }): Promise<{ user: User; token: string }> {
    const res = await request<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    setAuthToken(res.token);
    return res;
  },

  async getMe(): Promise<{ user: User }> {
    return request<{ user: User }>('/auth/me');
  },

  logout() {
    removeAuthToken();
  },

  // Queues API
  async getQueues(): Promise<{ queues: QueueSummary[] }> {
    return request<{ queues: QueueSummary[] }>('/queues');
  },

  async createQueue(data: { name: string; description?: string; prefix?: string }): Promise<{ queue: QueueSummary }> {
    return request<{ queue: QueueSummary }>('/queues', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async getQueueDetails(id: string, page = 1, limit = 10): Promise<{ queue: QueueDetails }> {
    return request<{ queue: QueueDetails }>(`/queues/${id}?page=${page}&limit=${limit}`);
  },

  async deleteQueue(id: string): Promise<{ message: string }> {
    return request<{ message: string }>(`/queues/${id}`, {
      method: 'DELETE'
    });
  },

  // Assign top token to service (Requirement 6)
  async serveNext(queueId: string): Promise<{ message: string; token: Token }> {
    return request<{ message: string; token: Token }>(`/queues/${queueId}/serve-next`, {
      method: 'POST'
    });
  },

  // Tokens API (Requirement 3)
  async addToken(queueId: string, data: { customerName: string; customerPhone?: string; notes?: string; priority: string }): Promise<{ message: string; token: Token }> {
    return request<{ message: string; token: Token }>(`/queues/${queueId}/tokens`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // Move Token Up (Requirement 5)
  async moveTokenUp(tokenId: string): Promise<{ message: string; tokens: Token[] }> {
    return request<{ message: string; tokens: Token[] }>(`/tokens/${tokenId}/move-up`, {
      method: 'POST'
    });
  },

  // Move Token Down (Requirement 5)
  async moveTokenDown(tokenId: string): Promise<{ message: string; tokens: Token[] }> {
    return request<{ message: string; tokens: Token[] }>(`/tokens/${tokenId}/move-down`, {
      method: 'POST'
    });
  },

  // Cancel Token (Requirement 7)
  async cancelToken(tokenId: string, reason?: string): Promise<{ message: string; token: Token }> {
    return request<{ message: string; token: Token }>(`/tokens/${tokenId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  },

  // Complete Token Service
  async completeToken(tokenId: string): Promise<{ message: string; token: Token }> {
    return request<{ message: string; token: Token }>(`/tokens/${tokenId}/complete`, {
      method: 'POST'
    });
  },

  // Analytics API (Requirement 8) with Range Query support
  async getAnalytics(queueId?: string, range = 'today'): Promise<AnalyticsData> {
    const params = new URLSearchParams();
    if (queueId && queueId !== 'all') params.set('queueId', queueId);
    if (range) params.set('range', range);
    const query = params.toString() ? `?${params.toString()}` : '';
    return request<AnalyticsData>(`/analytics${query}`);
  }
};
