// filepath: /Users/aunghtet/Desktop/projects/lonemalaypos/components/POS_NEW.tsx
import React, { useState, useMemo } from 'react';
import { MenuItem, CartItem, Order, Voucher, User, Ingredient, ActiveOrder } from '../types';

interface POSProps {
  menu: MenuItem[];
  inventory: Ingredient[];
  onProcessOrder: (order: Order) => void;
  currentUser: User;
}

// Define Myanmar language categories in order
const MENU_CATEGORIES = [
  'တရုတ်',
  'အထောင်း',
  'အသုပ်',
  'ရခိုင်',
  'ဟင်းရည်',
  'Snack & Drink',
  'Ready-made Drink',
  'သစ်သီးဖျော်ရည်',
  'Other'
];

// Define locations
const TABLES = Array.from({ length: 20 }, (_, i) => `Table ${i + 1}`);
const PARCELS = Array.from({ length: 10 }, (_, i) => `Parcel ${i + 1}`);

const POS: React.FC<POSProps> = ({ menu, inventory, onProcessOrder, currentUser }) => {
  // Multi-order management
  const [activeOrders, setActiveOrders] = useState<Map<string, ActiveOrder>>(new Map());
  const [currentLocation, setCurrentLocation] = useState<string | null>(null);
  const [showLocationSelector, setShowLocationSelector] = useState(false);

  // Current cart (derived from active order)
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<Voucher | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [showMobileCart, setShowMobileCart] = useState(false);

  // Payment States
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'KBZ_PAY'>('CASH');

  // Receipt States
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastCompletedOrder, setLastCompletedOrder] = useState<Order | null>(null);

  // Get current cart from active order
  const cart = currentLocation ? (activeOrders.get(currentLocation)?.cart || []) : [];

  // Set cart for current location
  const setCart = (updater: React.SetStateAction<CartItem[]>) => {
    if (!currentLocation) return;

    setActiveOrders(prev => {
      const newMap = new Map(prev);
      const currentOrder = newMap.get(currentLocation);

      const newCart = typeof updater === 'function'
        ? updater(currentOrder?.cart || [])
        : updater;

      if (newCart.length === 0) {
        // Remove empty orders
        newMap.delete(currentLocation);
      } else {
        newMap.set(currentLocation, {
          location: currentLocation,
          locationType: currentLocation.startsWith('Table') ? 'TABLE' : 'PARCEL',
          cart: newCart,
          createdAt: currentOrder?.createdAt || new Date().toISOString()
        });
      }

      return newMap;
    });
  };

  // Start new order for location
  const startOrder = (location: string) => {
    const locationType = location.startsWith('Table') ? 'TABLE' : 'PARCEL';

    // If location already has an order, just switch to it
    if (activeOrders.has(location)) {
      setCurrentLocation(location);
      setShowLocationSelector(false);
      return;
    }

    // Start new order
    setCurrentLocation(location);
    setShowLocationSelector(false);
  };

  // Switch to existing order
  const switchToOrder = (location: string) => {
    setCurrentLocation(location);
  };

  // Helper to get stock for ready-made items
  const getStockForItem = (item: MenuItem): number | null => {
    if (!item.isReadyMade || !item.readyMadeStockId) return null;

    let stockItem = inventory.find(inv => inv.id === item.readyMadeStockId);

    if (!stockItem) {
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
    if (!item.isReadyMade) return true;
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

  const categories = ['All', ...MENU_CATEGORIES];

  const filteredMenu = useMemo(() => {
    return menu
      .filter(item => {
        const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => a.name.localeCompare(b.name)); // Alphabetical order
  }, [menu, selectedCategory, searchQuery]);

  const addToCart = (item: MenuItem) => {
    if (!currentLocation) {
      setShowLocationSelector(true);
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

    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        if (item.isReadyMade) {
          const available = getAvailableQuantity(item);
          if (available === null || available <= 1) {
            alert(`Sorry, only ${existing.quantity} ${item.name} available in stock!`);
            return prev;
          }
        }
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === itemId) {
        return { ...item, quantity: Math.max(0, item.quantity + delta) };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const totals = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.0;

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
    if (!currentLocation) return;

    const order: Order = {
      id: Math.floor(100000 + Math.random() * 900000).toString(),
      items: [...cart],
      ...totals,
      paymentMethod,
      status: 'COMPLETED',
      createdAt: new Date().toISOString(),
      cashierName: currentUser.name,
      location: currentLocation,
      locationType: currentLocation.startsWith('Table') ? 'TABLE' : 'PARCEL'
    };

    onProcessOrder(order);

    // Show Receipt
    setLastCompletedOrder(order);
    setShowReceipt(true);

    // Clear this order
    setActiveOrders(prev => {
      const newMap = new Map(prev);
      newMap.delete(currentLocation);
      return newMap;
    });

    // Reset
    setCurrentLocation(null);
    setAppliedVoucher(null);
    setIsCheckingOut(false);
    setShowMobileCart(false);
  };

  const KBZ_PHONE = "09793143363";
  const KBZ_NAME = "Nwe Nwe Yee";

  const getCategoryIcon = (category: string) => {
    if (category.toLowerCase().includes('drink') || category.toLowerCase().includes('ဖျော်ရည်')) return 'bi-cup-hot';
    if (category.toLowerCase().includes('snack')) return 'bi-basket';
    return 'bi-egg-fried';
  };

  // Location Badge Component
  const LocationBadge = ({ location, isActive }: { location: string; isActive: boolean }) => {
    const hasOrder = activeOrders.has(location);
    const orderItemCount = hasOrder ? activeOrders.get(location)!.cart.reduce((sum, item) => sum + item.quantity, 0) : 0;

    return (
      <button
        onClick={() => startOrder(location)}
        className={`relative px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
          isActive
            ? 'bg-secondary text-white shadow-lg ring-2 ring-secondary/30'
            : hasOrder
            ? 'bg-orange-500 text-white shadow-md hover:bg-orange-600'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        {location}
        {hasOrder && !isActive && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-md">
            {orderItemCount}
          </span>
        )}
      </button>
    );
  };

  // Reusable Cart Content Component
  const CartContent = () => (
    <>
      <div className="p-5 border-b border-gray-100 bg-white sticky top-0 z-10">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black text-gray-800">Current Order</h2>
            {currentLocation && (
              <p className="text-xs text-gray-500 mt-0.5 font-medium">{currentLocation}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (confirm('Clear this order?')) {
                  setCart([]);
                }
              }}
              className="text-red-500 text-xs font-bold hover:bg-red-50 px-2 py-1 rounded transition-colors"
              disabled={cart.length === 0}
            >
              CLEAR
            </button>
            <button onClick={() => setShowMobileCart(false)} className="md:hidden text-gray-500 hover:bg-gray-100 p-2 rounded-full">
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/30">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-300 select-none min-h-[200px]">
            <i className="bi bi-cart-plus text-6xl mb-4"></i>
            <p className="font-medium">
              {currentLocation ? 'Start adding items' : 'Select a table/parcel to begin'}
            </p>
          </div>
        ) : (
          cart.map(item => (
            <div key={item.id} className="flex gap-3 bg-white p-3 rounded-xl shadow-sm border border-gray-100">
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-bold text-sm text-gray-800 leading-tight">{item.name}</h4>
                  <span className="font-bold text-sm text-gray-900 ml-2">{formatCurrency(item.price * item.quantity)}</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                   <p className="text-xs text-gray-400">@ {formatCurrency(item.price)}</p>
                   <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, -1); }}
                      className="w-7 h-7 rounded-md bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors shadow-sm active:scale-95"
                    >
                      <i className="bi bi-dash"></i>
                    </button>
                    <span className="text-sm font-bold w-4 text-center tabular-nums">{item.quantity}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, 1); }}
                      className="w-7 h-7 rounded-md bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-green-50 hover:text-green-500 hover:border-green-200 transition-colors shadow-sm active:scale-95"
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

      <div className="p-5 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] sticky bottom-0">
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Subtotal</span>
            <span className="font-mono">{formatCurrency(totals.subtotal)}</span>
          </div>
          {appliedVoucher && (
            <div className="flex justify-between text-sm text-secondary font-bold">
              <span>Discount ({appliedVoucher.code})</span>
              <span className="font-mono">-{formatCurrency(totals.discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-2xl font-black text-gray-900 pt-3 border-t border-dashed border-gray-200 mt-2">
            <span>Total</span>
            <span>{formatCurrency(totals.total)}</span>
          </div>
        </div>

        <button
          disabled={cart.length === 0 || !currentLocation}
          onClick={() => {
             setPaymentMethod('CASH');
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
    <div className="flex h-full bg-gray-100 relative">
      <div className="flex-1 flex flex-col h-full overflow-hidden w-full">
        {/* Location Selector Bar */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-3 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-white font-bold text-sm flex items-center gap-2">
              <i className="bi bi-geo-alt-fill"></i>
              Active Orders ({activeOrders.size})
            </h3>
            <button
              onClick={() => setShowLocationSelector(!showLocationSelector)}
              className="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <i className="bi bi-plus-circle"></i>
              New Order
            </button>
          </div>

          {/* Active Orders Quick Switch */}
          {activeOrders.size > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {Array.from(activeOrders.keys()).map(location => (
                <LocationBadge
                  key={location}
                  location={location}
                  isActive={location === currentLocation}
                />
              ))}
            </div>
          )}

          {activeOrders.size === 0 && !currentLocation && (
            <p className="text-white/70 text-xs text-center py-2">Click "New Order" to start</p>
          )}
        </div>

        {/* Category Bar */}
        <div className="bg-white p-3 md:p-4 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between z-10 sticky top-0 gap-3 border-b-2 border-gray-100">
          <div className="flex gap-2 overflow-x-auto pb-1 max-w-full w-full no-scrollbar">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all active:scale-95 flex-shrink-0 ${
                  selectedCategory === cat 
                  ? 'bg-secondary text-white shadow-lg shadow-secondary/30' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-auto">
            <i className="bi bi-search absolute left-3 top-2.5 text-gray-400"></i>
            <input
              type="text"
              placeholder="Search menu..."
              className="pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-secondary/50 text-sm w-full md:w-56"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Menu Grid */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50 pb-24 md:pb-6">
          {!currentLocation && activeOrders.size === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <i className="bi bi-table text-6xl mb-4"></i>
              <p className="font-semibold text-lg">Select a Table or Parcel to Begin</p>
              <button
                onClick={() => setShowLocationSelector(true)}
                className="mt-4 bg-primary text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-indigo-600 transition-colors"
              >
                Choose Location
              </button>
            </div>
          ) : (
            <div className="grid pos-grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
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
                    className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-2 md:p-3 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col group text-left w-full relative ${
                      !isAvailable ? 'opacity-50 cursor-not-allowed hover:shadow-sm hover:translate-y-0' : ''
                    }`}
                  >
                    <div className="relative aspect-square mb-3 overflow-hidden rounded-xl bg-slate-50 w-full flex items-center justify-center">
                      {!isAvailable && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-10">
                          <span className="bg-red-500 text-white px-3 py-1 rounded-lg font-bold text-xs">OUT OF STOCK</span>
                        </div>
                      )}

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

                      <i className={`bi ${getCategoryIcon(item.category)} text-5xl text-slate-300 group-hover:scale-110 group-hover:text-secondary/50 transition-all duration-300`}></i>

                      <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur px-2 py-1 rounded-lg text-xs font-bold text-white shadow-lg">
                        {formatCurrency(item.price)}
                      </div>
                      {cart.find(c => c.id === item.id) && (
                        <div className="absolute top-2 right-2 bg-secondary text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-md z-20">
                            {cart.find(c => c.id === item.id)?.quantity}
                        </div>
                      )}
                    </div>
                    <h3 className="font-bold text-gray-800 text-sm mb-1 leading-tight line-clamp-1">{item.name}</h3>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-400 line-clamp-1">{item.category}</p>
                      {item.isReadyMade && stock !== null && isAvailable && (
                        <span className={`text-[10px] font-bold ${
                          isLowStock ? 'text-orange-600' : 'text-gray-500'
                        }`}>
                          {availableQty} left
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Desktop Cart Sidebar */}
      <div className="hidden md:flex w-96 bg-white shadow-2xl flex-col h-full border-l border-gray-200 z-20">
        <CartContent />
      </div>

      {/* Mobile Cart Bottom Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-30 flex items-center gap-4">
        <div className="flex-1">
          <p className="text-xs text-gray-500 font-medium">
            {currentLocation || 'No location'} • {cart.reduce((acc, i) => acc + i.quantity, 0)} Items
          </p>
          <p className="text-xl font-black text-gray-900">{formatCurrency(totals.total)}</p>
        </div>
        <button
          onClick={() => setShowMobileCart(true)}
          className="bg-primary text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-primary/30 active:scale-95 transition-transform flex items-center gap-2"
        >
          <i className="bi bi-cart4"></i>
          View Order
        </button>
      </div>

      {/* Mobile Cart Full Screen */}
      {showMobileCart && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col bg-gray-100 animate-in slide-in-from-bottom-full duration-300">
          <CartContent />
        </div>
      )}

      {/* Location Selector Modal */}
      {showLocationSelector && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl p-6 relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowLocationSelector(false)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 transition-colors">
              <i className="bi bi-x-lg"></i>
            </button>

            <h2 className="text-2xl font-black text-gray-800 mb-6">Select Location</h2>

            {/* Tables */}
            <div className="mb-6">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                <i className="bi bi-table"></i>
                Tables (1-20)
              </h3>
              <div className="grid grid-cols-5 gap-2">
                {TABLES.map(location => (
                  <LocationBadge
                    key={location}
                    location={location}
                    isActive={location === currentLocation}
                  />
                ))}
              </div>
            </div>

            {/* Parcels */}
            <div>
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                <i className="bi bi-box-seam"></i>
                Takeaway Parcels (1-10)
              </h3>
              <div className="grid grid-cols-5 gap-2">
                {PARCELS.map(location => (
                  <LocationBadge
                    key={location}
                    location={location}
                    isActive={location === currentLocation}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {isCheckingOut && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <button onClick={() => setIsCheckingOut(false)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 transition-colors">
              <i className="bi bi-x-lg"></i>
            </button>

            <div className="text-center mb-6 mt-2">
              <p className="text-gray-500 font-medium mb-1">{currentLocation}</p>
              <p className="text-5xl font-black text-gray-900 tracking-tight">{formatCurrency(totals.total)}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                onClick={() => setPaymentMethod('CASH')}
                className={`py-6 px-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all active:scale-95 ${
                  paymentMethod === 'CASH' 
                  ? 'border-green-500 bg-green-50 text-green-600 ring-2 ring-green-200 ring-offset-2' 
                  : 'border-transparent bg-gray-50 text-gray-400 hover:bg-gray-100'
                }`}
              >
                <i className="bi bi-cash-coin text-3xl"></i>
                <span className="font-bold">CASH</span>
              </button>

              <button
                onClick={() => setPaymentMethod('KBZ_PAY')}
                className={`py-6 px-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all active:scale-95 ${
                  paymentMethod === 'KBZ_PAY' 
                  ? 'border-blue-500 bg-blue-50 text-blue-600 ring-2 ring-blue-200 ring-offset-2' 
                  : 'border-transparent bg-gray-50 text-gray-400 hover:bg-gray-100'
                }`}
              >
                <i className="bi bi-qr-code-scan text-3xl"></i>
                <span className="font-bold">KBZ PAY</span>
              </button>
            </div>

            {paymentMethod === 'KBZ_PAY' && (
              <div className="mb-6 bg-blue-50 rounded-2xl p-6 text-center animate-in slide-in-from-top-4 duration-300">
                <p className="text-blue-800 font-bold mb-3 text-sm uppercase tracking-wide">Scan with KBZ Pay</p>
                <div className="bg-white p-4 rounded-xl inline-block shadow-sm mb-3">
                  <div className="w-48 h-48 flex items-center justify-center">
                    <img
                      src="/kbzpay-qr.png"
                      alt="KBZ Pay QR"
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const errorDiv = e.currentTarget.parentElement?.querySelector('.qr-error');
                        if (errorDiv) {
                          (errorDiv as HTMLElement).style.display = 'flex';
                        }
                      }}
                    />
                    <div className="qr-error hidden flex-col items-center justify-center text-red-600 p-4" style={{ display: 'none' }}>
                      <i className="bi bi-exclamation-triangle text-4xl mb-2"></i>
                      <p className="text-sm font-semibold">QR Code Not Found</p>
                      <p className="text-xs mt-1">Please add kbzpay-qr.png</p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-1">
                    <span className="text-xs text-blue-400 font-medium uppercase">Phone Number</span>
                    <span className="font-mono text-xl font-black text-slate-800 tracking-wider">{KBZ_PHONE}</span>
                    <span className="text-xs text-gray-500 mt-1">{KBZ_NAME}</span>
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
           <div className="bg-white w-full max-w-[320px] shadow-2xl overflow-y-auto relative animate-in zoom-in-95 duration-300 print-area max-h-[90vh] print:overflow-visible print:max-h-none">
              <div className="bg-white p-6 relative">
                  <div className="absolute top-0 left-0 right-0 h-4 bg-gray-800 no-print" style={{ clipPath: 'polygon(0% 0%, 5% 100%, 10% 0%, 15% 100%, 20% 0%, 25% 100%, 30% 0%, 35% 100%, 40% 0%, 45% 100%, 50% 0%, 55% 100%, 60% 0%, 65% 100%, 70% 0%, 75% 100%, 80% 0%, 85% 100%, 90% 0%, 95% 100%, 100% 0%)'}}></div>

                  <div className="text-center mb-6 pt-4">
                    <h2 className="font-black text-xl uppercase tracking-wider mb-1">လုံမလေး</h2>
                    <p className="text-xs text-gray-400 font-mono">Receipt / Voucher</p>
                  </div>

                  <div className="space-y-1 mb-4 text-xs font-mono text-gray-500 border-b border-dashed border-gray-300 pb-4">
                    <div className="flex justify-between">
                        <span>Location:</span>
                        <span className="font-bold">{lastCompletedOrder.location}</span>
                    </div>
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
                                  <span className="text-gray-800 line-clamp-2 w-32">{item.name}</span>
                              </div>
                              <span className="font-mono">{formatCurrency(item.price * item.quantity)}</span>
                          </div>
                      ))}
                  </div>

                  <div className="border-t border-dashed border-gray-300 pt-4 space-y-1 text-sm">
                      <div className="flex justify-between text-gray-500">
                          <span>Subtotal</span>
                          <span className="font-mono">{formatCurrency(lastCompletedOrder.subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-gray-500">
                          <span>Discount</span>
                          <span className="font-mono">-{formatCurrency(lastCompletedOrder.discount)}</span>
                      </div>
                      <div className="flex justify-between font-black text-lg text-gray-900 mt-2 pt-2 border-t border-gray-100">
                          <span>TOTAL</span>
                          <span className="font-mono">{formatCurrency(lastCompletedOrder.total)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-400 mt-1 uppercase">
                          <span>Paid via</span>
                          <span>{lastCompletedOrder.paymentMethod.replace('_', ' ')}</span>
                      </div>
                  </div>

                  <div className="text-center mt-8">
                      <p className="text-gray-400 text-xs mb-2">*** Thank you! ***</p>
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=ORDER-${lastCompletedOrder.id}`}
                        alt="Order QR"
                        className="w-16 h-16 mx-auto opacity-50 mix-blend-multiply"
                      />
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 h-4 bg-gray-800 translate-y-full rotate-180 no-print" style={{ clipPath: 'polygon(0% 0%, 5% 100%, 10% 0%, 15% 100%, 20% 0%, 25% 100%, 30% 0%, 35% 100%, 40% 0%, 45% 100%, 50% 0%, 55% 100%, 60% 0%, 65% 100%, 70% 0%, 75% 100%, 80% 0%, 85% 100%, 90% 0%, 95% 100%, 100% 0%)'}}></div>
              </div>

              <div className="bg-gray-100 p-4 flex gap-3 no-print">
                  <button
                    onClick={() => setShowReceipt(false)}
                    className="flex-1 py-3 bg-white border border-gray-300 rounded-xl text-gray-700 font-bold hover:bg-gray-50 transition-colors"
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
    </div>
  );
};

export default POS;

