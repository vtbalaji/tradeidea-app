import { getAuthInstance } from './firebase';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
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
    return null;
  }
  return await auth.currentUser.getIdToken();
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
    throw new ApiError(401, 'Not authenticated');
  }

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
    throw new ApiError(response.status, errorData.error || `HTTP ${response.status}`);
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
