export type UserRole = "customer" | "admin";

export interface User {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  role: UserRole;
  loyaltyBalance: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  success: boolean;
  user: User;
  token: string;
}
