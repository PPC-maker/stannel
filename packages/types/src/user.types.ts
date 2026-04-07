// User Types - STANNEL Platform

export enum UserRole {
  ADMIN = 'ADMIN',
  ARCHITECT = 'ARCHITECT',
  SUPPLIER = 'SUPPLIER',
}

export enum UserRank {
  BRONZE = 'BRONZE',
  SILVER = 'SILVER',
  GOLD = 'GOLD',
  PLATINUM = 'PLATINUM',
}

export interface User {
  id: string;
  firebaseUid: string;
  email: string;
  name: string;
  phone?: string;
  company?: string;
  address?: string;
  role: UserRole;
  rank: UserRank;
  isActive: boolean;
  profileImage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ArchitectProfile {
  id: string;
  userId: string;
  pointsBalance: number;
  cashBalance: number;
  totalEarned: number;
  totalRedeemed: number;
  cardNumber: string;
  cardExpiry?: Date;
  monthlyGoal: number;
  monthlyProgress: number;
}

export interface SupplierProfile {
  id: string;
  userId: string;
  companyName: string;
  trustScore: number;
  qualityScore: number;
}

export interface AuthUser extends User {
  architectProfile?: ArchitectProfile;
  supplierProfile?: SupplierProfile;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password?: string;
  name: string;
  phone?: string;
  role: UserRole;
  companyName?: string; // For suppliers
  firebaseToken?: string; // For Firebase auth
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}
