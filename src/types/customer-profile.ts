export interface CustomerProfile {
  id: number;
  userId: number;
  fullName?: string;
  phone?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertProfileRequest {
  fullName?: string;
  phone?: string;
  address?: string;
}
