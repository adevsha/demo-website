export type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  in_stock: boolean;
  stock: number;
};

export type ProductCreate = {
  name: string;
  description: string;
  price: number;
  in_stock: boolean;
  stock: number;
};

export type User = {
  id: number;
  name: string;
  email: string;
  age: number;
};

export type OrderItem = {
  product_id: number;
  product_name: string;
  quantity: number;
  price: number;
};

export type Order = {
  id: number;
  user_id: number;
  user_name: string;
  items: OrderItem[];
  total: number;
  created_at: string;
};

export type TopProduct = {
  product_id: number;
  product_name: string;
  total_quantity: number;
};

export type UserOrders = {
  user_id: number;
  user_name: string;
  order_count: number;
  total_spent: number;
  top_product: TopProduct | null;
  orders: Order[];
};

export type CheckoutRequest = {
  items: { product_id: number; quantity: number }[];
  discount_code?: string | null;
};

export type CheckoutResponse = {
  confirmation_number: string;
  status: string;
  order: Order;
  discount_applied: number;
};
