import { apiClient } from "./api-client";
import type { CustomerProfile, UpsertProfileRequest } from "@/types/customer-profile";

export const profileService = {
  get: () => apiClient.get<CustomerProfile>("/customer/profile"),

  upsert: (body: UpsertProfileRequest) =>
    apiClient.put<CustomerProfile>("/customer/profile", body),
};
