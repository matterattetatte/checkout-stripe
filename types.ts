export interface Product {
  name: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface RequestBody {
  cart: CartItem[];
  order_id: string;
}
