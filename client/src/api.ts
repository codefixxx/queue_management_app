import { User, QueueSummary, QueueDetails, Token, AnalyticsData } from './types';

const API_BASE = '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('queue_manager_token');
}

export function setAuthToken(token: string) {
  localStorage.setItem('queue_manager_token', token);
}

export function removeAuthToken() {
  localStorage.removeItem('queue_manager_token');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>)
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }

  return data as T;
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

  async getQueueDetails(id: string): Promise<{ queue: QueueDetails }> {
    return request<{ queue: QueueDetails }>(`/queues/${id}`);
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

  // Analytics API (Requirement 8)
  async getAnalytics(queueId?: string): Promise<AnalyticsData> {
    const query = queueId ? `?queueId=${encodeURIComponent(queueId)}` : '';
    return request<AnalyticsData>(`/analytics${query}`);
  }
};

