import { apiClient } from "./api-client";
import type { Cart, AddCartItemRequest, UpdateCartItemRequest } from "@/types/cart";

export const cartService = {
  get: () => apiClient.get<Cart>("/cart"),

  addItem: (body: AddCartItemRequest) =>
    apiClient.post<Cart>("/cart/items", body),

  updateItem: (productId: number, body: UpdateCartItemRequest) =>
    apiClient.patch<Cart>(`/cart/items/${productId}`, body),

  removeItem: (productId: number) =>
    apiClient.delete<Cart>(`/cart/items/${productId}`),

  clear: () => apiClient.delete<Cart>("/cart"),
};
