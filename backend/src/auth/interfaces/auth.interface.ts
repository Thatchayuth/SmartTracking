export interface JwtPayload {
  sub: string; // userId
  employeeCode: string;
  roles: string[];
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface AuthenticatedUser {
  id: string;
  employeeCode: string;
  fullName: string;
  email: string;
  roles: string[];
}
