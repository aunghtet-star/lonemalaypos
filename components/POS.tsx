import React, { useState, useMemo, useEffect } from 'react';
import { MenuItem, CartItem, Order, Voucher, User, Ingredient, TableOrder } from '../types';
import { useTheme } from './ThemeContext';

interface POSProps {
  menu: MenuItem[];
  inventory: Ingredient[];
  onProcessOrder: (order: Order) => void;
  currentUser: User;
}

// Storage key for table orders
const TABLE_ORDERS_KEY = 'pos_table_orders';

const POS: React.FC<POSProps> = ({ menu, inventory, onProcessOrder, currentUser }) => {
  // Multi-table state management
  const [activeTableNumber, setActiveTableNumber] = useState<number>(0); // 0 = no location selected
  const [tableOrders, setTableOrders] = useState<TableOrder[]>(() => {
    try {
      const saved = localStorage.getItem(TABLE_ORDERS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<Voucher | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [showMobileCart, setShowMobileCart] = useState(false);
  const [showTableSelector, setShowTableSelector] = useState(false);

  // Payment States
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'KBZ_PAY'>('CASH');
  
  // Receipt States
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastCompletedOrder, setLastCompletedOrder] = useState<Order | null>(null);

  // Get current table's cart
  const currentTable = tableOrders.find(t => t.tableNumber === activeTableNumber);
  const cart = currentTable?.cart || [];

  // Save table orders to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(TABLE_ORDERS_KEY, JSON.stringify(tableOrders));
  }, [tableOrders]);

  // Switch to a table/parcel - create if doesn't exist
  const switchToTable = (tableNumber: number) => {
    setActiveTableNumber(tableNumber);
    setShowTableSelector(false);

    // Create table/parcel order if it doesn't exist
    if (tableNumber !== 0 && !tableOrders.find(t => t.tableNumber === tableNumber)) {
      const newTableOrder: TableOrder = {
        tableNumber,
        tableName: tableNumber < 0 ? `Parcel ${Math.abs(tableNumber)}` : `Table ${tableNumber}`,
        cart: [],
        startedAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };
      setTableOrders(prev => [...prev, newTableOrder]);
    }
  };

  // Update current table's cart
  const updateTableCart = (newCart: CartItem[]) => {
    if (activeTableNumber === 0) {
      // No location selected - this shouldn't happen if we block adding items
      return;
    } else {
      setTableOrders(prev => prev.map(t =>
        t.tableNumber === activeTableNumber
          ? { ...t, cart: newCart, lastUpdated: new Date().toISOString() }
          : t
      ));
    }
  };

  // Clear a table's order
  const clearTable = (tableNumber: number) => {
    setTableOrders(prev => prev.filter(t => t.tableNumber !== tableNumber));
    if (activeTableNumber === tableNumber) {
      setActiveTableNumber(0);
    }
  };

  // Get table with items count
  const getTableItemCount = (tableNumber: number): number => {
    const table = tableOrders.find(t => t.tableNumber === tableNumber);
    return table?.cart.reduce((sum, item) => sum + item.quantity, 0) || 0;
  };

  // Helper to get stock for ready-made items
  const getStockForItem = (item: MenuItem): number | null => {
    if (!item.isReadyMade || !item.readyMadeStockId) return null;

    // Try to find by ID first
    let stockItem = inventory.find(inv => inv.id === item.readyMadeStockId);

    // Fallback: Match by name if ID doesn't match (handles local vs Supabase ID mismatch)
    if (!stockItem) {
      // Map common ready-made item names to inventory names
      const nameMap: Record<string, string> = {
        'Coca-Cola': 'Coca-Cola Can',
        'Sprite': 'Sprite Can',
        'Mineral Water': 'Mineral Water Bottle',
        'Orange Juice': 'Orange Juice Box'
      };

      const inventoryName = nameMap[item.name] || item.name;
      stockItem = inventory.find(inv => inv.name === inventoryName);
    }

    return stockItem?.stock ?? 0;
  };

  // Helper to check if item is available
  const isItemAvailable = (item: MenuItem): boolean => {
    if (!item.isReadyMade) return true; // Non-ready-made items are always available
    const stock = getStockForItem(item);
    return stock !== null && stock > 0;
  };

  // Helper to get available quantity (considering cart)
  const getAvailableQuantity = (item: MenuItem): number | null => {
    if (!item.isReadyMade) return null;
    const stock = getStockForItem(item);
    if (stock === null) return null;
    const cartItem = cart.find(c => c.id === item.id);
    const cartQty = cartItem?.quantity ?? 0;
    return stock - cartQty;
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} Ks`;
  };

  const categories = ['All', ...Array.from(new Set(menu.map(item => item.category)))
    .sort((a, b) => {
      // Check if category contains Myanmar characters (Unicode range U+1000-U+109F)
      const isMyanmarA = /[\u1000-\u109F]/.test(a);
      const isMyanmarB = /[\u1000-\u109F]/.test(b);

      // Myanmar categories first
      if (isMyanmarA && !isMyanmarB) return -1;
      if (!isMyanmarA && isMyanmarB) return 1;

      // If both are Myanmar or both are not, sort alphabetically
      return a.localeCompare(b);
    })];

  const filteredMenu = useMemo(() => {
    return menu.filter(item => {
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [menu, selectedCategory, searchQuery]);

  const addToCart = (item: MenuItem) => {
    // Require location selection
    if (activeTableNumber === 0) {
      setShowTableSelector(true);
      return;
    }

    // Check stock availability for ready-made items
    if (item.isReadyMade) {
      const available = getAvailableQuantity(item);
      if (available === null || available <= 0) {
        alert(`Sorry, ${item.name} is out of stock!`);
        return;
      }
    }

    const newCart = [...cart];
    const existing = newCart.find(i => i.id === item.id);

    if (existing) {
      // Check if we can add more
      if (item.isReadyMade) {
        const available = getAvailableQuantity(item);
        if (available === null || available <= 1) {
          alert(`Sorry, only ${existing.quantity} ${item.name} available in stock!`);
          return;
        }
      }
      existing.quantity += 1;
    } else {
      newCart.push({ ...item, quantity: 1 });
    }

    updateTableCart(newCart);
  };

  const updateQuantity = (itemId: string, delta: number) => {
    const newCart = cart.map(item => {
      if (item.id === itemId) {
        return { ...item, quantity: Math.max(0, item.quantity + delta) };
      }
      return item;
    }).filter(item => item.quantity > 0);

    updateTableCart(newCart);
  };

  const totals = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.0; // 0% tax for family biz simplified
    
    let discount = 0;
    if (appliedVoucher) {
      if (appliedVoucher.type === 'PERCENTAGE') {
        discount = subtotal * (appliedVoucher.value / 100);
      } else {
        discount = appliedVoucher.value;
      }
    }

    const total = Math.max(0, subtotal + tax - discount);
    return { subtotal, tax, discount, total };
  }, [cart, appliedVoucher]);

  const handleCheckout = () => {
    const order: Order = {
      id: Math.floor(100000 + Math.random() * 900000).toString(), // 6 digit ID
      items: [...cart],
      ...totals,
      paymentMethod,
      status: 'COMPLETED',
      createdAt: new Date().toISOString(),
      cashierName: currentUser.name,
      tableNumber: activeTableNumber > 0 ? activeTableNumber : undefined
    };

    onProcessOrder(order);
    
    // Show Receipt immediately after
    setLastCompletedOrder(order);
    setShowReceipt(true);
    
    // Clear current table
    clearTable(activeTableNumber);

    // Reset states
    setAppliedVoucher(null);
    setIsCheckingOut(false);
    setShowMobileCart(false);
    setActiveTableNumber(0);
  };

  // KBZ Pay Phone Number
  const KBZ_PHONE = "09793143363";
  const KBZ_NAME = "Nwe Nwe Yee";


  // Helper for category icons
  const getCategoryIcon = (category: string) => {
    if (category.toLowerCase().includes('drink') || category.toLowerCase().includes('coffee')) return 'bi-cup-hot';
    if (category.toLowerCase().includes('burger') || category.toLowerCase().includes('food')) return 'bi-egg-fried';
    if (category.toLowerCase().includes('salad') || category.toLowerCase().includes('veg')) return 'bi-flower1';
    return 'bi-basket';
  };

  // Reusable Cart Content Component
  const CartContent = () => (
    <>
      <div className="p-5 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 sticky top-0 z-10">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-black text-gray-800 dark:text-gray-100 flex items-center gap-2">
            {activeTableNumber < 0 ? `Parcel ${Math.abs(activeTableNumber)}` : activeTableNumber > 0 ? `Table ${activeTableNumber}` : 'Select Location'}
          </h2>
          <div className="flex items-center gap-2">
            <button onClick={() => updateTableCart([])} className="text-red-500 text-xs font-bold hover:bg-red-50 dark:hover:bg-red-900/20 px-2 py-1 rounded transition-colors" disabled={cart.length === 0}>
              CLEAR
            </button>
            <button onClick={() => setShowMobileCart(false)} className="md:hidden text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-full">
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/30 dark:bg-gray-900/30">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-300 dark:text-gray-600 select-none min-h-[200px]">
            <i className="bi bi-cart-plus text-6xl mb-4"></i>
            <p className="font-medium">Start adding items</p>
          </div>
        ) : (
          cart.map(item => (
            <div key={item.id} className="flex gap-3 bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-bold text-sm text-gray-800 dark:text-gray-100 leading-tight">{item.name}</h4>
                  <span className="font-bold text-sm text-gray-900 dark:text-gray-100 ml-2">{formatCurrency(item.price * item.quantity)}</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                   <p className="text-xs text-gray-400 dark:text-gray-500">@ {formatCurrency(item.price)}</p>
                   <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700 rounded-lg p-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, -1); }}
                      className="w-7 h-7 rounded-md bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 hover:border-red-200 dark:hover:border-red-700 transition-colors shadow-sm active:scale-95 pos-touch-target"
                    >
                      <i className="bi bi-dash"></i>
                    </button>
                    <span className="text-sm font-bold w-4 text-center tabular-nums text-gray-800 dark:text-white">{item.quantity}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, 1); }}
                      className="w-7 h-7 rounded-md bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-500 hover:border-green-200 dark:hover:border-green-700 transition-colors shadow-sm active:scale-95 pos-touch-target"
                    >
                      <i className="bi bi-plus"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-5 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] sticky bottom-0">
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
            <span>Subtotal</span>
            <span className="font-mono">{formatCurrency(totals.subtotal)}</span>
          </div>
          {appliedVoucher && (
            <div className="flex justify-between text-sm text-secondary font-bold">
              <span>Discount ({appliedVoucher.code})</span>
              <span className="font-mono">-{formatCurrency(totals.discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-2xl font-black text-gray-900 dark:text-gray-100 pt-3 border-t border-dashed border-gray-200 dark:border-gray-600 mt-2">
            <span>Total</span>
            <span>{formatCurrency(totals.total)}</span>
          </div>
        </div>

        <button
          disabled={cart.length === 0}
          onClick={() => {
             setPaymentMethod('CASH'); // Default
             setIsCheckingOut(true);
          }}
          className="w-full py-4 bg-primary text-white rounded-xl font-bold text-lg shadow-xl shadow-primary/20 hover:bg-indigo-600 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transition-all flex justify-between px-6 items-center"
        >
          <span>Checkout</span>
          <i className="bi bi-arrow-right"></i>
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-full bg-gray-100 dark:bg-gray-900 relative">
      <div className="flex-1 flex flex-col h-full overflow-hidden w-full">
        {/* Header Bar */}
        <div className="bg-white dark:bg-gray-800 p-3 md:p-4 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between z-30 sticky top-0 gap-3 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={() => setShowTableSelector(true)}
              className="px-4 py-2 bg-primary text-white rounded-xl font-bold shadow-md hover:bg-indigo-600 transition-all flex items-center gap-2 flex-shrink-0"
            >
              <i className="bi bi-grid-3x3-gap"></i>
              <span className="hidden sm:inline">
                {activeTableNumber < 0
                  ? `Parcel ${Math.abs(activeTableNumber)}`
                  : activeTableNumber > 0
                  ? `Table ${activeTableNumber}`
                  : 'Select Location'
                }
              </span>
              <i className="bi bi-chevron-down"></i>
            </button>
            <div className="relative flex-1 max-w-xs">
              <i className="bi bi-search absolute left-3 top-2.5 text-gray-400 dark:text-gray-500"></i>
              <input
                type="text"
                placeholder="Search menu..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>
          </div>
        </div>

        {/* Category Bar */}
        <div className="bg-white dark:bg-gray-800/95 backdrop-blur-sm border-b border-gray-100 dark:border-gray-700 sticky top-[64px] md:top-[64px] z-20 shadow-sm">
          <div className="px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <i className="bi bi-tags-fill text-secondary"></i>
              <span className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Categories</span>
            </div>
            <span className="text-[10px] font-mono text-gray-400 dark:text-gray-500">{filteredMenu.length} items</span>
          </div>
          <div
            className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide pos-scroll-smooth px-4"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
          >
            {categories.map(cat => {
              const isSelected = selectedCategory === cat;
              const categoryIcon = getCategoryIcon(cat);
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`flex-shrink-0 min-w-[120px] px-4 py-3 rounded-2xl border-2 transition-all duration-200 active:scale-95 touch-manipulation group pos-category-button ${
                    isSelected
                      ? 'bg-secondary text-white border-secondary shadow-lg shadow-secondary/30 scale-105'
                      : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:shadow-md'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <i className={`bi ${categoryIcon} text-xl ${isSelected ? 'text-white' : 'text-gray-500 dark:text-gray-400 group-hover:text-secondary'}`}></i>
                    <span className="text-xs font-bold text-center leading-tight line-clamp-2">{cat}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Grid Content */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50 dark:bg-gray-900/50 pb-24 md:pb-6">
          {/* Quick Table Switcher Bar */}
          {tableOrders.length > 0 && (
            <div className="mb-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-3">
              <div className="flex items-center gap-2 mb-2">
                <i className="bi bi-lightning-charge-fill text-orange-500"></i>
                <span className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Active Tables</span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {tableOrders.map(table => (
                  <button
                    key={table.tableNumber}
                    onClick={() => switchToTable(table.tableNumber)}
                    className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-all flex items-center gap-2 flex-shrink-0 ${
                      activeTableNumber === table.tableNumber
                        ? 'bg-primary text-white shadow-lg'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <i className={`bi ${table.tableNumber < 0 ? 'bi-box-seam' : 'bi-table'}`}></i>
                    <span>{table.tableName}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      activeTableNumber === table.tableNumber
                        ? 'bg-white text-primary'
                        : 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                    }`}>
                      {table.cart.reduce((sum, item) => sum + item.quantity, 0)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 pos-grid">
            {filteredMenu.map(item => {
              const stock = getStockForItem(item);
              const isAvailable = isItemAvailable(item);
              const availableQty = getAvailableQuantity(item);
              const isLowStock = item.isReadyMade && stock !== null && stock <= 5;

              return (
                <button
                  key={item.id}
                  onClick={() => addToCart(item)}
                  disabled={!isAvailable}
                  className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-2 md:p-3 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col group text-left w-full relative pos-menu-item ${
                    !isAvailable ? 'opacity-50 cursor-not-allowed hover:shadow-sm hover:translate-y-0' : ''
                  }`}
                >
                  <div className="relative aspect-square mb-3 overflow-hidden rounded-xl bg-slate-50 dark:bg-gray-700 w-full flex items-center justify-center">
                    {/* Out of Stock Overlay */}
                    {!isAvailable && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-10">
                        <span className="bg-red-500 text-white px-3 py-1 rounded-lg font-bold text-xs">OUT OF STOCK</span>
                      </div>
                    )}

                    {/* Ready-Made Badge */}
                    {item.isReadyMade && isAvailable && (
                      <div className="absolute top-2 left-2 z-10">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isLowStock 
                            ? 'bg-orange-500 text-white' 
                            : 'bg-blue-500 text-white'
                        }`}>
                          {isLowStock ? '⚠️ LOW' : '🥤 READY'}
                        </span>
                      </div>
                    )}

                    {/* Replaced Image with Icon */}
                    <i className={`bi ${getCategoryIcon(item.category)} text-5xl text-slate-300 dark:text-gray-400 group-hover:scale-110 group-hover:text-secondary/50 transition-all duration-300`}></i>

                    <div className="absolute bottom-2 right-2 bg-black/70 dark:bg-black/80 backdrop-blur px-2 py-1 rounded-lg text-xs font-bold text-white shadow-lg">
                      {formatCurrency(item.price)}
                    </div>
                    {cart.find(c => c.id === item.id) && (
                      <div className="absolute top-2 right-2 bg-secondary text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-md z-30">
                          {cart.find(c => c.id === item.id)?.quantity}
                      </div>
                    )}
                  </div>
                  <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm mb-1 leading-tight line-clamp-1">{item.name}</h3>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-400 dark:text-gray-500 line-clamp-1">{item.category}</p>
                    {item.isReadyMade && stock !== null && isAvailable && (
                      <span className={`text-[10px] font-bold ${
                        isLowStock ? 'text-orange-600 dark:text-orange-400' : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {availableQty} left
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="hidden md:flex w-96 bg-white dark:bg-gray-800 shadow-2xl flex-col h-full border-l border-gray-200 dark:border-gray-700 z-20 pos-cart">
        <CartContent />
      </div>

      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-30 flex items-center gap-4">
        <div className="flex-1">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{cart.reduce((acc, i) => acc + i.quantity, 0)} Items</p>
          <p className="text-xl font-black text-gray-900 dark:text-gray-100">{formatCurrency(totals.total)}</p>
        </div>
        <button 
          onClick={() => setShowMobileCart(true)}
          className="bg-primary text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-primary/30 active:scale-95 transition-transform flex items-center gap-2"
        >
          <i className="bi bi-cart4"></i>
          View Order
        </button>
      </div>

      {showMobileCart && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col bg-gray-100 dark:bg-gray-900 animate-in slide-in-from-bottom-full duration-300">
          <CartContent />
        </div>
      )}

      {/* Payment Modal */}
      {isCheckingOut && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-sm p-6 relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <button onClick={() => setIsCheckingOut(false)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
              <i className="bi bi-x-lg"></i>
            </button>
            
            <div className="text-center mb-6 mt-2">
              <p className="text-gray-500 dark:text-gray-400 font-medium mb-1">Total Amount</p>
              <p className="text-5xl font-black text-gray-900 dark:text-gray-100 tracking-tight">{formatCurrency(totals.total)}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                onClick={() => setPaymentMethod('CASH')}
                className={`py-6 px-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all active:scale-95 ${
                  paymentMethod === 'CASH' 
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 ring-2 ring-green-200 dark:ring-green-800 ring-offset-2' 
                  : 'border-transparent bg-gray-50 dark:bg-gray-700 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
              >
                <i className="bi bi-cash-coin text-3xl"></i>
                <span className="font-bold">CASH</span>
              </button>

              <button
                onClick={() => setPaymentMethod('KBZ_PAY')}
                className={`py-6 px-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all active:scale-95 ${
                  paymentMethod === 'KBZ_PAY' 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 ring-2 ring-blue-200 dark:ring-blue-800 ring-offset-2' 
                  : 'border-transparent bg-gray-50 dark:bg-gray-700 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
              >
                <i className="bi bi-qr-code-scan text-3xl"></i>
                <span className="font-bold">KBZ PAY</span>
              </button>
            </div>

            {/* KBZ Pay QR Display */}
            {paymentMethod === 'KBZ_PAY' && (
              <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 text-center animate-in slide-in-from-top-4 duration-300">
                <p className="text-blue-800 dark:text-blue-200 font-bold mb-3 text-sm uppercase tracking-wide">Scan with KBZ Pay</p>
                <div className="bg-white dark:bg-gray-700 p-4 rounded-xl inline-block shadow-sm mb-3">
                  {/* Using your exact KBZ Pay QR image */}
                  <div className="w-48 h-48 flex items-center justify-center">
                    <img
                      src="/kbzpay-qr.png"
                      alt="KBZ Pay QR"
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        // Show error message if image not found
                        e.currentTarget.style.display = 'none';
                        const errorDiv = e.currentTarget.parentElement?.querySelector('.qr-error');
                        if (errorDiv) {
                          (errorDiv as HTMLElement).style.display = 'flex';
                        }
                      }}
                    />
                    <div className="qr-error hidden flex-col items-center justify-center text-red-600 dark:text-red-400 p-4" style={{ display: 'none' }}>
                      <i className="bi bi-exclamation-triangle text-4xl mb-2"></i>
                      <p className="text-sm font-semibold">QR Code Not Found</p>
                      <p className="text-xs mt-1">Please add kbzpay-qr.png</p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-1">
                    <span className="text-xs text-blue-400 dark:text-blue-300 font-medium uppercase">Phone Number</span>
                    <span className="font-mono text-xl font-black text-slate-800 dark:text-slate-200 tracking-wider">{KBZ_PHONE}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">{KBZ_NAME}</span>
                </div>
                <div className="mt-4 bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 rounded-lg p-3">
                  <p className="text-xs text-blue-900 dark:text-blue-200 font-semibold flex items-center justify-center gap-2">
                    <i className="bi bi-info-circle-fill"></i>
                    <span>Using your actual KBZ Pay QR code</span>
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={handleCheckout}
              className="w-full py-4 bg-secondary text-white rounded-xl font-bold text-lg shadow-lg shadow-secondary/30 hover:bg-emerald-600 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <i className="bi bi-check-circle-fill"></i>
              {paymentMethod === 'CASH' ? 'Confirm Payment' : 'I Have Scanned'}
            </button>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceipt && lastCompletedOrder && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 animate-in fade-in duration-300">
           <div className="bg-white dark:bg-gray-800 w-full max-w-[320px] shadow-2xl overflow-y-auto relative animate-in zoom-in-95 duration-300 print-area max-h-[90vh] print:overflow-visible print:max-h-none">
              {/* Receipt Paper Effect */}
              <div className="bg-white dark:bg-gray-800 p-6 relative">
                  {/* Serrated Edge Top */}
                  <div className="absolute top-0 left-0 right-0 h-4 bg-gray-800 dark:bg-gray-900 no-print" style={{ clipPath: 'polygon(0% 0%, 5% 100%, 10% 0%, 15% 100%, 20% 0%, 25% 100%, 30% 0%, 35% 100%, 40% 0%, 45% 100%, 50% 0%, 55% 100%, 60% 0%, 65% 100%, 70% 0%, 75% 100%, 80% 0%, 85% 100%, 90% 0%, 95% 100%, 100% 0%)'}}></div>

                  <div className="text-center mb-6 pt-4">
                    <h2 className="font-black text-xl uppercase tracking-wider mb-1 text-gray-900 dark:text-gray-100">လုံမလေး</h2>
                    <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">Receipt / Voucher</p>
                  </div>

                  <div className="space-y-1 mb-4 text-xs font-mono text-gray-500 dark:text-gray-400 border-b border-dashed border-gray-300 dark:border-gray-600 pb-4">
                    <div className="flex justify-between">
                        <span>Date:</span>
                        <span>{new Date(lastCompletedOrder.createdAt).toLocaleDateString()}</span>
                    </div>
                     <div className="flex justify-between">
                        <span>Time:</span>
                        <span>{new Date(lastCompletedOrder.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Order ID:</span>
                        <span>#{lastCompletedOrder.id}</span>
                    </div>
                     <div className="flex justify-between">
                        <span>Cashier:</span>
                        <span>{lastCompletedOrder.cashierName}</span>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6 min-h-[100px]">
                      {lastCompletedOrder.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                              <div className="flex gap-2">
                                  <span className="font-bold">{item.quantity}x</span>
                                  <span className="text-gray-800 dark:text-gray-200 line-clamp-2 w-32">{item.name}</span>
                              </div>
                              <span className="font-mono text-gray-900 dark:text-gray-100">{formatCurrency(item.price * item.quantity)}</span>
                          </div>
                      ))}
                  </div>

                  <div className="border-t border-dashed border-gray-300 dark:border-gray-600 pt-4 space-y-1 text-sm">
                      <div className="flex justify-between text-gray-500 dark:text-gray-400">
                          <span>Subtotal</span>
                          <span className="font-mono">{formatCurrency(lastCompletedOrder.subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-gray-500 dark:text-gray-400">
                          <span>Discount</span>
                          <span className="font-mono">-{formatCurrency(lastCompletedOrder.discount)}</span>
                      </div>
                      <div className="flex justify-between font-black text-lg text-gray-900 dark:text-gray-100 mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                          <span>TOTAL</span>
                          <span className="font-mono">{formatCurrency(lastCompletedOrder.total)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mt-1 uppercase">
                          <span>Paid via</span>
                          <span>{lastCompletedOrder.paymentMethod.replace('_', ' ')}</span>
                      </div>
                  </div>

                  <div className="text-center mt-8">
                      <p className="text-gray-400 dark:text-gray-500 text-xs mb-2">*** Thank you! ***</p>
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=ORDER-${lastCompletedOrder.id}`} 
                        alt="Order QR" 
                        className="w-16 h-16 mx-auto opacity-50 mix-blend-multiply" 
                      />
                  </div>
                  
                  {/* Serrated Edge Bottom */}
                  <div className="absolute bottom-0 left-0 right-0 h-4 bg-gray-800 dark:bg-gray-900 translate-y-full rotate-180 no-print" style={{ clipPath: 'polygon(0% 0%, 5% 100%, 10% 0%, 15% 100%, 20% 0%, 25% 100%, 30% 0%, 35% 100%, 40% 0%, 45% 100%, 50% 0%, 55% 100%, 60% 0%, 65% 100%, 70% 0%, 75% 100%, 80% 0%, 85% 100%, 90% 0%, 95% 100%, 100% 0%)'}}></div>
              </div>

              {/* Action Buttons - Hidden when printing */}
              <div className="bg-gray-100 dark:bg-gray-700 p-4 flex gap-3 no-print">
                  <button
                    onClick={() => setShowReceipt(false)}
                    className="flex-1 py-3 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-xl text-gray-700 dark:text-gray-200 font-bold hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors"
                  >
                      Close
                  </button>
                  <button 
                    onClick={() => window.print()}
                    className="flex-1 py-3 bg-primary text-white rounded-xl font-bold shadow-lg hover:bg-indigo-600 transition-colors flex items-center justify-center gap-2"
                  >
                      <i className="bi bi-printer"></i> Print
                  </button>
              </div>
           </div>
        </div>
      )}

      {/* Table Selector Modal */}
      {showTableSelector && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-2xl p-6 relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowTableSelector(false)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors z-10">
              <i className="bi bi-x-lg"></i>
            </button>

            <div className="mb-6">
              <h2 className="text-2xl font-black text-gray-800 dark:text-gray-100 mb-2">Select Location</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Choose a parcel (takeaway) or table (dine-in) to manage orders</p>
            </div>

            {/* Active Tables Summary */}
            {tableOrders.length > 0 && (
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-2">
                  <i className="bi bi-info-circle-fill text-blue-600 dark:text-blue-400"></i>
                  <span className="text-sm font-bold text-blue-900 dark:text-blue-200">Active Orders: {tableOrders.length}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tableOrders.map(table => (
                    <span key={table.tableNumber} className="px-2 py-1 bg-white dark:bg-gray-700 rounded-lg text-xs font-bold text-gray-700 dark:text-gray-300 border border-blue-300 dark:border-blue-600">
                      {table.tableName} ({table.cart.reduce((sum, item) => sum + item.quantity, 0)} items)
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Parcels Section */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <i className="bi bi-box-seam text-orange-500"></i>
                Parcel Orders (Takeaway)
              </h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {Array.from({ length: 10 }, (_, i) => i + 1).map(parcelNum => {
                  // Use negative numbers for parcels (-1 to -10)
                  const parcelId = -parcelNum;
                  const itemCount = getTableItemCount(parcelId);
                  const hasItems = itemCount > 0;
                  const isActive = activeTableNumber === parcelId;

                  return (
                    <button
                      key={`parcel-${parcelNum}`}
                      onClick={() => switchToTable(parcelId)}
                      className={`aspect-square rounded-xl border-2 transition-all hover:scale-105 active:scale-95 flex flex-col items-center justify-center gap-1 relative ${
                        isActive
                          ? 'border-orange-500 bg-orange-500/10 ring-2 ring-orange-500/30'
                          : hasItems
                          ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/20'
                          : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-orange-500/50'
                      }`}
                    >
                      {hasItems && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-secondary text-white rounded-full flex items-center justify-center text-xs font-bold shadow-lg">
                          {itemCount}
                        </div>
                      )}
                      <i className={`bi bi-box-seam text-2xl ${
                        isActive ? 'text-orange-500' : hasItems ? 'text-orange-600 dark:text-orange-400' : 'text-gray-400 dark:text-gray-500'
                      }`}></i>
                      <span className={`text-xs font-bold ${
                        isActive ? 'text-orange-500' : hasItems ? 'text-orange-900 dark:text-orange-300' : 'text-gray-600 dark:text-gray-400'
                      }`}>
                        P{parcelNum}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tables Section */}
            <div className="mb-4">
              <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <i className="bi bi-table text-primary"></i>
                Dine-In Tables
              </h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {Array.from({ length: 20 }, (_, i) => i + 1).map(tableNum => {
                  const itemCount = getTableItemCount(tableNum);
                  const hasItems = itemCount > 0;
                  const isActive = activeTableNumber === tableNum;

                  return (
                    <button
                      key={`table-${tableNum}`}
                      onClick={() => switchToTable(tableNum)}
                      className={`aspect-square rounded-xl border-2 transition-all hover:scale-105 active:scale-95 flex flex-col items-center justify-center gap-1 relative ${
                        isActive
                          ? 'border-primary bg-primary/10 ring-2 ring-primary/30'
                          : hasItems
                          ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-primary/50'
                      }`}
                    >
                      {hasItems && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-secondary text-white rounded-full flex items-center justify-center text-xs font-bold shadow-lg">
                          {itemCount}
                        </div>
                      )}
                      <i className={`bi bi-table text-2xl ${
                        isActive ? 'text-primary' : hasItems ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
                      }`}></i>
                      <span className={`text-xs font-bold ${
                        isActive ? 'text-primary' : hasItems ? 'text-blue-900 dark:text-blue-300' : 'text-gray-600 dark:text-gray-400'
                      }`}>
                        T{tableNum}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-600 flex gap-3">
              <button
                onClick={() => setShowTableSelector(false)}
                className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              {tableOrders.length > 0 && (
                <button
                  onClick={() => {
                    if (confirm(`Clear all ${tableOrders.length} table orders? This cannot be undone.`)) {
                      setTableOrders([]);
                      setActiveTableNumber(0);
                      setShowTableSelector(false);
                    }
                  }}
                  className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                >
                  <i className="bi bi-trash"></i>
                  Clear All
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POS;
