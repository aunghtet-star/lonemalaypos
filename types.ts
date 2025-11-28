export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  CASHIER = 'CASHIER'
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
}

export interface Ingredient {
  id: string;
  name: string;
  unit: string;
  stock: number;
  minStockLevel: number; // For alerts
  costPerUnit: number;
}

export interface MenuItemVariant {
  id: string;
  name: string;
  priceModifier: number; // Amount to add/subtract from base price
}

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  cost: number; // For profit calculation
  image: string;
  description?: string;
  ingredients: { ingredientId: string; quantity: number }[];
  isReadyMade?: boolean; // True for ready-made drinks (canned/bottled)
  readyMadeStockId?: string; // Links to ingredient ID for stock tracking
  hasVariants?: boolean; // True if item has protein/size variants
  variants?: MenuItemVariant[]; // Available variants (e.g., chicken, pork, seafood)
  basePrice?: number; // Original price before variant modifier
}

export interface CartItem extends MenuItem {
  quantity: number;
  notes?: string;
  selectedVariant?: MenuItemVariant; // Selected variant for this cart item
  variantId?: string; // ID of selected variant
}

export interface Order {
  id: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  discount: number; // Amount
  total: number;
  paymentMethod: 'CASH' | 'KBZ_PAY';
  status: 'COMPLETED' | 'REFUNDED';
  createdAt: string; // ISO String
  cashierName: string;
  location?: string; // e.g., "Table 1", "Parcel 1"
  locationType?: 'TABLE' | 'PARCEL'; // Type of location
}

// Active order in progress (not yet completed)
export interface ActiveOrder {
  location: string;
  locationType: 'TABLE' | 'PARCEL';
  cart: CartItem[];
  createdAt: string;
}

export interface Voucher {
  id: string;
  code: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  minSpend: number;
  expiryDate: string;
  isActive: boolean;
}

export interface SalesReport {
  date: string;
  revenue: number;
  cost: number;
  profit: number;
  orderCount: number;
}