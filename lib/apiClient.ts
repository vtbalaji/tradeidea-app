import { getAuthInstance } from './firebase';

export class ApiError extends Error {
  public status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

// Simple in-memory cache
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 30000; // 30 seconds

function getCached(key: string) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

function setCache(key: string, data: any) {
  cache.set(key, { data, timestamp: Date.now() });
}

function invalidateCache(pattern: string) {
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  }
}

async function getAuthToken(): Promise<string | null> {
  const auth = getAuthInstance();
  if (!auth || !auth.currentUser) {
    console.warn('No authenticated user found for API call');
    return null;
  }
  try {
    const token = await auth.currentUser.getIdToken();
    return token;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}

async function fetchWithAuth(url: string, options: RequestInit = {}, useCache = false) {
  const method = options.method || 'GET';
  const cacheKey = `${method}:${url}`;

  // Check cache for GET requests
  if (method === 'GET' && useCache) {
    const cached = getCached(cacheKey);
    if (cached) {
      return cached;
    }
  }

  const token = await getAuthToken();

  if (!token) {
    console.error('API call failed: No authentication token available');
    throw new ApiError(401, 'Not authenticated');
  }

  console.log(`API ${method} ${url} - Token: ${token.substring(0, 20)}...`);

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    const errorMessage = errorData.error || `HTTP ${response.status}`;
    console.error(`API Error [${response.status}] ${url}:`, errorMessage);
    throw new ApiError(response.status, errorMessage);
  }

  const data = await response.json();

  // Cache GET responses
  if (method === 'GET' && useCache) {
    setCache(cacheKey, data);
  }

  // Invalidate cache on mutations
  if (method !== 'GET') {
    const resource = url.split('/')[2]; // Extract resource (accounts/portfolio)
    invalidateCache(resource);
  }

  return data;
}

export const apiClient = {
  // Account operations
  accounts: {
    list: async () => {
      return fetchWithAuth('/api/accounts', {}, true); // Enable cache
    },
    create: async (data: { name: string; description?: string; color?: string }) => {
      return fetchWithAuth('/api/accounts', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    update: async (accountId: string, data: { name?: string; description?: string; color?: string }) => {
      return fetchWithAuth(`/api/accounts/${accountId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
    delete: async (accountId: string) => {
      return fetchWithAuth(`/api/accounts/${accountId}`, {
        method: 'DELETE',
      });
    },
    setDefault: async (accountId: string) => {
      return fetchWithAuth(`/api/accounts/${accountId}/set-default`, {
        method: 'POST',
      });
    },
  },

  // Ideas operations
  ideas: {
    list: async (filter?: string, status?: string, limit?: number) => {
      const params = new URLSearchParams();
      if (filter) params.set('filter', filter);
      if (status) params.set('status', status);
      if (limit) params.set('limit', limit.toString());
      const url = `/api/ideas${params.toString() ? '?' + params.toString() : ''}`;
      return fetchWithAuth(url, {}, true); // Enable cache
    },
    get: async (ideaId: string) => {
      return fetchWithAuth(`/api/ideas/${ideaId}`, {}, true);
    },
    create: async (data: {
      symbol: string;
      title: string;
      analysis: string;
      entryPrice: number;
      target1: number;
      target2?: number;
      stopLoss: number;
      timeframe?: string;
      riskLevel?: string;
      analysisType?: string;
      tradeType?: string;
      tags?: string[];
    }) => {
      return fetchWithAuth('/api/ideas', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    update: async (ideaId: string, data: {
      title?: string;
      analysis?: string;
      entryPrice?: number;
      target1?: number;
      target2?: number;
      stopLoss?: number;
      status?: string;
      timeframe?: string;
      riskLevel?: string;
      analysisType?: string;
    }) => {
      return fetchWithAuth(`/api/ideas/${ideaId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
    like: async (ideaId: string, like: boolean) => {
      return fetchWithAuth(`/api/ideas/${ideaId}`, {
        method: 'PATCH',
        body: JSON.stringify({ like }),
      });
    },
    follow: async (ideaId: string, follow: boolean) => {
      return fetchWithAuth(`/api/ideas/${ideaId}`, {
        method: 'PATCH',
        body: JSON.stringify({ follow }),
      });
    },
    delete: async (ideaId: string) => {
      return fetchWithAuth(`/api/ideas/${ideaId}`, {
        method: 'DELETE',
      });
    },
    comments: {
      list: async (ideaId: string) => {
        return fetchWithAuth(`/api/ideas/${ideaId}/comments`, {}, true);
      },
      create: async (ideaId: string, text: string) => {
        return fetchWithAuth(`/api/ideas/${ideaId}/comments`, {
          method: 'POST',
          body: JSON.stringify({ text }),
        });
      },
    },
  },

  // Notifications operations
  notifications: {
    list: async (unreadOnly?: boolean, limit?: number) => {
      const params = new URLSearchParams();
      if (unreadOnly) params.set('unreadOnly', 'true');
      if (limit) params.set('limit', limit.toString());
      const url = `/api/notifications${params.toString() ? '?' + params.toString() : ''}`;
      return fetchWithAuth(url, {}, true);
    },
    markAsRead: async (notificationId: string) => {
      return fetchWithAuth('/api/notifications', {
        method: 'PATCH',
        body: JSON.stringify({ notificationId }),
      });
    },
    markAllAsRead: async () => {
      return fetchWithAuth('/api/notifications', {
        method: 'PATCH',
        body: JSON.stringify({ markAllAsRead: true }),
      });
    },
  },

  // Portfolio operations
  portfolio: {
    list: async (accountId?: string) => {
      const url = accountId ? `/api/portfolio?accountId=${accountId}` : '/api/portfolio';
      return fetchWithAuth(url, {}, true); // Enable cache
    },
    create: async (data: {
      ideaId?: string;
      accountId?: string;
      symbol: string;
      direction: string;
      quantity: number;
      entryPrice: number;
      entryDate: string;
      stopLoss?: number;
      target?: number;
      notes?: string;
    }) => {
      return fetchWithAuth('/api/portfolio', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    update: async (positionId: string, data: {
      stopLoss?: number;
      target?: number;
      notes?: string;
      currentPrice?: number;
    }) => {
      return fetchWithAuth(`/api/portfolio/${positionId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
    delete: async (positionId: string) => {
      return fetchWithAuth(`/api/portfolio/${positionId}`, {
        method: 'DELETE',
      });
    },
    addTransaction: async (positionId: string, data: {
      type: 'buy' | 'sell';
      quantity: number;
      price: number;
      date: string;
    }) => {
      return fetchWithAuth(`/api/portfolio/${positionId}/transaction`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    close: async (positionId: string, data: {
      exitPrice: number;
      exitDate: string;
      exitReason?: string;
    }) => {
      return fetchWithAuth(`/api/portfolio/${positionId}/close`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
  },
};
