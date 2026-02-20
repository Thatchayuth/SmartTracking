import { api } from 'src/boot/axios';
import type { PaginationMeta } from 'src/modules/trip/types';

export interface UserItem {
  id: string;
  employeeCode: string;
  fullName: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  roles: string[];
  createdAt: string;
}

export interface CreateUserRequest {
  employeeCode: string;
  fullName: string;
  email: string;
  password: string;
  phone?: string;
}

export interface UpdateUserRequest {
  fullName?: string;
  email?: string;
  phone?: string;
  isActive?: boolean;
}

export const userApi = {
  getList(params: Record<string, string | number>) {
    return api.get<{ data: UserItem[]; meta: PaginationMeta }>('/api/users', { params });
  },

  getById(id: string) {
    return api.get<UserItem>(`/api/users/${id}`);
  },

  create(data: CreateUserRequest) {
    return api.post<UserItem>('/api/users', data);
  },

  update(id: string, data: UpdateUserRequest) {
    return api.patch<UserItem>(`/api/users/${id}`, data);
  },

  deactivate(id: string) {
    return api.delete(`/api/users/${id}`);
  },

  assignRoles(id: string, roleNames: string[]) {
    return api.patch<UserItem>(`/api/users/${id}/roles`, { roleNames });
  },
};
