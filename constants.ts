import { MenuItem, Ingredient, Voucher, Order } from './types';

// Scaled costs to Kyat (approx x1000 for demo realism)
export const INITIAL_INGREDIENTS: Ingredient[] = [
  { id: 'i1', name: 'Burger Bun', unit: 'pcs', stock: 100, minStockLevel: 20, costPerUnit: 500 },
  { id: 'i2', name: 'Beef Patty', unit: 'pcs', stock: 80, minStockLevel: 20, costPerUnit: 1500 },
  { id: 'i3', name: 'Cheese Slice', unit: 'pcs', stock: 200, minStockLevel: 50, costPerUnit: 200 },
  { id: 'i4', name: 'Lettuce', unit: 'g', stock: 5000, minStockLevel: 1000, costPerUnit: 10 },
  { id: 'i5', name: 'Coffee Beans', unit: 'g', stock: 2000, minStockLevel: 500, costPerUnit: 50 },
  { id: 'i6', name: 'Milk', unit: 'ml', stock: 10000, minStockLevel: 2000, costPerUnit: 2 },
  // Ready-made drinks inventory
  { id: 'i7', name: 'Coca-Cola Can', unit: 'cans', stock: 50, minStockLevel: 10, costPerUnit: 800 },
  { id: 'i8', name: 'Sprite Can', unit: 'cans', stock: 50, minStockLevel: 10, costPerUnit: 800 },
  { id: 'i9', name: 'Mineral Water Bottle', unit: 'bottles', stock: 100, minStockLevel: 20, costPerUnit: 500 },
  { id: 'i10', name: 'Orange Juice Box', unit: 'boxes', stock: 30, minStockLevel: 5, costPerUnit: 1200 },
];

export const INITIAL_MENU: MenuItem[] = [
  {
    id: 'm1',
    name: 'Classic Cheeseburger',
    category: 'Food',
    price: 9000,
    cost: 3500,
    image: 'https://picsum.photos/200/200?random=1',
    description: 'Juicy beef patty with cheddar cheese.',
    ingredients: [
      { ingredientId: 'i1', quantity: 1 },
      { ingredientId: 'i2', quantity: 1 },
      { ingredientId: 'i3', quantity: 1 },
      { ingredientId: 'i4', quantity: 20 }
    ]
  },
  {
    id: 'm2',
    name: 'Double Bacon Burger',
    category: 'Food',
    price: 13000,
    cost: 5500,
    image: 'https://picsum.photos/200/200?random=2',
    description: 'Double patty, crispy bacon.',
    ingredients: [
      { ingredientId: 'i1', quantity: 1 },
      { ingredientId: 'i2', quantity: 2 },
      { ingredientId: 'i3', quantity: 2 }
    ]
  },
  {
    id: 'm3',
    name: 'Latte',
    category: 'Drinks',
    price: 4500,
    cost: 1200,
    image: 'https://picsum.photos/200/200?random=3',
    description: 'Steamed milk with espresso.',
    isReadyMade: false, // Made to order
    ingredients: [
      { ingredientId: 'i5', quantity: 18 },
      { ingredientId: 'i6', quantity: 200 }
    ]
  },
  {
    id: 'm4',
    name: 'Cappuccino',
    category: 'Drinks',
    price: 4500,
    cost: 1200,
    image: 'https://picsum.photos/200/200?random=4',
    description: 'Espresso with frothy milk.',
    isReadyMade: false, // Made to order
    ingredients: [
      { ingredientId: 'i5', quantity: 18 },
      { ingredientId: 'i6', quantity: 150 }
    ]
  },
  {
    id: 'm5',
    name: 'Caesar Salad',
    category: 'Food',
    price: 9500,
    cost: 2500,
    image: 'https://picsum.photos/200/200?random=5',
    description: 'Fresh romaine with croutons.',
    ingredients: [
      { ingredientId: 'i4', quantity: 150 }
    ]
  },
  // Ready-made drinks
  {
    id: 'm6',
    name: 'Coca-Cola',
    category: 'Drinks',
    price: 1500,
    cost: 800,
    image: 'https://picsum.photos/200/200?random=6',
    description: 'Chilled Coca-Cola can.',
    isReadyMade: true,
    readyMadeStockId: 'i7',
    ingredients: []
  },
  {
    id: 'm7',
    name: 'Sprite',
    category: 'Drinks',
    price: 1500,
    cost: 800,
    image: 'https://picsum.photos/200/200?random=7',
    description: 'Chilled Sprite can.',
    isReadyMade: true,
    readyMadeStockId: 'i8',
    ingredients: []
  },
  {
    id: 'm8',
    name: 'Mineral Water',
    category: 'Drinks',
    price: 1000,
    cost: 500,
    image: 'https://picsum.photos/200/200?random=8',
    description: 'Pure mineral water bottle.',
    isReadyMade: true,
    readyMadeStockId: 'i9',
    ingredients: []
  },
  {
    id: 'm9',
    name: 'Orange Juice',
    category: 'Drinks',
    price: 2500,
    cost: 1200,
    image: 'https://picsum.photos/200/200?random=9',
    description: 'Fresh orange juice box.',
    isReadyMade: true,
    readyMadeStockId: 'i10',
    ingredients: []
  }
];

export const INITIAL_VOUCHERS: Voucher[] = [

];

export const INITIAL_ORDERS: Order[] = [
  // Mock history for charts (Values scaled to Kyat)
];