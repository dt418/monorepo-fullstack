import type {
  AuthTokens,
  AuthResponse,
  User,
  LoginInput,
  RegisterInput,
  Task,
  CreateTask,
  UpdateTask,
  TaskListResponse,
  FileListResponse,
  FileUploadResponse,
} from '@myorg/types';

const API_BASE = '/api';

/**
 * API client for making authenticated requests
 */
class ApiClient {
  private accessToken: string | null = null;

  setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.accessToken) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  // Auth endpoints
  async login(input: LoginInput): Promise<AuthResponse> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async register(input: RegisterInput): Promise<AuthResponse> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    return this.request('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  }

  async logout(refreshToken: string): Promise<void> {
    return this.request('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  }

  // User endpoints
  async getMe(): Promise<User> {
    return this.request('/users/me');
  }

  async getUsers(page = 1, limit = 20): Promise<{ users: User[]; total: number }> {
    return this.request(`/users?page=${page}&limit=${limit}`);
  }

  // Task endpoints
  async getTasks(params?: Record<string, string>): Promise<TaskListResponse> {
    const query = params ? new URLSearchParams(params).toString() : '';
    return this.request(`/tasks${query ? `?${query}` : ''}`);
  }

  async getTask(id: string): Promise<Task> {
    return this.request(`/tasks/${id}`);
  }

  async createTask(data: CreateTask): Promise<Task> {
    return this.request('/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTask(id: string, data: UpdateTask): Promise<Task> {
    return this.request(`/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteTask(id: string): Promise<void> {
    return this.request(`/tasks/${id}`, {
      method: 'DELETE',
    });
  }

  // File endpoints
  async getFiles(): Promise<FileListResponse> {
    return this.request('/files');
  }

  async uploadFile(file: globalThis.File): Promise<FileUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE}/files/upload`, {
      method: 'POST',
      headers: this.accessToken ? { Authorization: `Bearer ${this.accessToken}` } : {},
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(error.error || 'Upload failed');
    }

    return response.json();
  }

  async deleteFile(id: string): Promise<void> {
    return this.request(`/files/${id}`, {
      method: 'DELETE',
    });
  }
}

export const apiClient = new ApiClient();
