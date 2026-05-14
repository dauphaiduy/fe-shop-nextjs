import { publicClient } from "./api-client";
import type { Product, ProductListQuery } from "@/types/product";
import type { PaginatedData } from "@/types/api";

export const productService = {
  list: (query?: ProductListQuery) => {
    const params = new URLSearchParams(
      Object.entries(query ?? {})
        .filter(([, v]) => v !== undefined && v !== "")
        .map(([k, v]) => [k, String(v)]),
    ).toString();
    return publicClient.get<PaginatedData<Product>>(
      `/products${params ? `?${params}` : ""}`,
    );
  },

  getById: (id: number) => publicClient.get<Product>(`/products/${id}`),
};
