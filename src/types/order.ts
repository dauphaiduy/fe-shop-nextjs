export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED";

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  priceAtTime: string;
  product?: { id: number; name: string };
}

export interface Order {
  id: number;
  userId: number;
  status: OrderStatus;
  totalAmount: string;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderListQuery {
  status?: OrderStatus;
  page?: number;
  limit?: number;
}
