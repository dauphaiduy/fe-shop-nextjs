import { publicClient } from "./api-client";
import type { Category } from "@/types/category";

export const categoryService = {
  list: () => publicClient.get<Category[]>("/categories"),

  getById: (id: number) => publicClient.get<Category>(`/categories/${id}`),
};
