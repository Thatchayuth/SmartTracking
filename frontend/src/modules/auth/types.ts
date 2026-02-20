export interface LoginRequest {
  employeeCode: string;
  password: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  id: string;
  employeeCode: string;
  fullName: string;
  email: string;
  roles: string[];
}
