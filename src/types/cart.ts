export interface CartItem {
  id: number;
  cartId: number;
  productId: number;
  quantity: number;
  product: {
    id: number;
    name: string;
    price: string;
    stock: number;
    images: string[];
  };
}

export interface Cart {
  id: number;
  userId: number;
  status: "ACTIVE" | "ORDERED" | "ABANDONED";
  items: CartItem[];
  createdAt: string;
  updatedAt: string;
}

export interface AddCartItemRequest {
  productId: number;
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}
