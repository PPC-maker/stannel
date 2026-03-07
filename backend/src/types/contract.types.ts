// Contract & Goal Types - STANNEL Platform

export enum ContractType {
  STANDARD = 'STANDARD',
  PREMIUM = 'PREMIUM',
  EXCLUSIVE = 'EXCLUSIVE',
}

export interface Contract {
  id: string;
  supplierId: string;
  type: ContractType;
  feePercent: number;
  validFrom: Date;
  validTo: Date;
  isActive: boolean;
  createdAt: Date;
}

export interface SupplierGoal {
  id: string;
  supplierId: string;
  targetAmount: number;
  bonusPoints: number;
  period: 'MONTHLY' | 'QUARTERLY';
  startDate: Date;
  endDate: Date;
  isActive: boolean;
}

export interface GoalBonus {
  id: string;
  architectId: string;
  goalId: string;
  bonusPoints: number;
  awardedAt: Date;
}

export interface CreateContractRequest {
  supplierId: string;
  type: ContractType;
  feePercent: number;
  validFrom: Date;
  validTo: Date;
}

export interface CreateGoalRequest {
  supplierId: string;
  targetAmount: number;
  bonusPoints: number;
  period: 'MONTHLY' | 'QUARTERLY';
  startDate: Date;
  endDate: Date;
}
