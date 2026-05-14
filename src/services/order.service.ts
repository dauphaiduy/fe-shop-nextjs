import { apiClient } from "./api-client";
import type { Order, OrderListQuery } from "@/types/order";
import type { PaginatedData } from "@/types/api";

export const orderService = {
  checkout: () => apiClient.post<Order>("/orders/checkout", {}),

  list: (query?: OrderListQuery) => {
    const params = new URLSearchParams(
      Object.entries(query ?? {})
        .filter(([, v]) => v !== undefined && v !== "")
        .map(([k, v]) => [k, String(v)]),
    ).toString();
    return apiClient.get<PaginatedData<Order>>(
      `/orders${params ? `?${params}` : ""}`,
    );
  },

  getById: (id: number) => apiClient.get<Order>(`/orders/${id}`),

  cancel: (id: number) =>
    apiClient.patch<Order>(`/orders/${id}/status`, { status: "CANCELLED" }),
};
