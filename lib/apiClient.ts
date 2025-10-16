import { getAuthInstance } from './firebase';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function getAuthToken(): Promise<string | null> {
  const auth = getAuthInstance();
  if (!auth || !auth.currentUser) {
    return null;
  }
  return await auth.currentUser.getIdToken();
}

async function fetchWithAuth(url: string, options: RequestInit = {}) {
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

  return response.json();
}

export const apiClient = {
  // Account operations
  accounts: {
    list: async () => {
      return fetchWithAuth('/api/accounts');
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
      return fetchWithAuth(url);
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
