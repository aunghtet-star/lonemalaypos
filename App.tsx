import React, { useState, useEffect, useCallback } from 'react';
import Layout from './components/Layout';
import POS from './components/POS';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import MenuManager from './components/MenuManager';
import OrderHistory from './components/OrderHistory';
import SupabaseSync from './components/SupabaseSync';
import { INITIAL_MENU, INITIAL_INGREDIENTS, INITIAL_ORDERS } from './constants';
import { User, UserRole, MenuItem, Ingredient, Order } from './types';
import { supabase, createOrder } from './services/supabaseClient';

const FAMILY_USER: User = { 
  id: '1', 
  name: 'Restaurant Owner', 
  role: UserRole.ADMIN, // Admin sees everything
  email: 'owner@familyrestaurant.com' 
};

// Database Keys
const DB_KEYS = {
  MENU: 'pos_db_menu',
  INVENTORY: 'pos_db_inventory',
  ORDERS: 'pos_db_orders',
  AUTH: 'pos_authenticated' // Authentication flag
};

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('pos');

  // Authentication state
  const [passcode, setPasscode] = useState('');
  const [authError, setAuthError] = useState('');

  // Initialize state from Local Database (localStorage) or fall back to constants
  const [menu, setMenu] = useState<MenuItem[]>(() => {
    try {
      const saved = localStorage.getItem(DB_KEYS.MENU);
      return saved ? JSON.parse(saved) : INITIAL_MENU;
    } catch (e) {
      console.error("Failed to load menu from DB", e);
      return INITIAL_MENU;
    }
  });

  const [inventory, setInventory] = useState<Ingredient[]>(() => {
    try {
      const saved = localStorage.getItem(DB_KEYS.INVENTORY);
      return saved ? JSON.parse(saved) : INITIAL_INGREDIENTS;
    } catch (e) {
      console.error("Failed to load inventory from DB", e);
      return INITIAL_INGREDIENTS;
    }
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem(DB_KEYS.ORDERS);
      return saved ? JSON.parse(saved) : INITIAL_ORDERS;
    } catch (e) {
      console.error("Failed to load orders from DB", e);
      return INITIAL_ORDERS;
    }
  });

  // Sync state to Local Database whenever it changes
  useEffect(() => { localStorage.setItem(DB_KEYS.MENU, JSON.stringify(menu)); }, [menu]);
  useEffect(() => { localStorage.setItem(DB_KEYS.INVENTORY, JSON.stringify(inventory)); }, [inventory]);
  useEffect(() => { localStorage.setItem(DB_KEYS.ORDERS, JSON.stringify(orders)); }, [orders]);

  // Authentication Functions
  const handleLogin = () => {
    if (passcode === '7777') {
      localStorage.setItem(DB_KEYS.AUTH, 'true');
      setCurrentUser(FAMILY_USER);
      setAuthError('');
      setPasscode('');
    } else {
      setAuthError('❌ Invalid passcode. Please try again.');
      setPasscode('');
      // Clear error after 3 seconds
      setTimeout(() => setAuthError(''), 3000);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(DB_KEYS.AUTH);
    setCurrentUser(null);
    setPasscode('');
  };

  // Check for persistent authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);

      // Simulate loading for better UX (minimum 1.5 seconds)
      await new Promise(resolve => setTimeout(resolve, 1500));

      try {
        // Always require authentication on app start - no persistence
        // const isAuthenticated = localStorage.getItem(DB_KEYS.AUTH);
        // if (isAuthenticated === 'true') {
        //   setCurrentUser(FAMILY_USER);
        // }
      } catch (e) {
        console.error('Failed to check authentication', e);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Set up real-time sync from database
  useEffect(() => {
    if (!supabase || !currentUser) return;

    // Initial sync on login
    syncFromDatabase();

    // Set up real-time subscriptions for all tables
    const ingredientsChannel = supabase
      .channel('ingredients_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ingredients' },
        () => {
          console.log('📦 Ingredients changed in database, syncing...');
          syncFromDatabase();
        }
      )
      .subscribe();

    const menuChannel = supabase
      .channel('menu_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'menu_items' },
        () => {
          console.log('🍽️ Menu changed in database, syncing...');
          syncFromDatabase();
        }
      )
      .subscribe();

    const ordersChannel = supabase
      .channel('orders_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          console.log('📋 Orders changed in database, syncing...');
          syncFromDatabase();
        }
      )
      .subscribe();

    // Periodic sync every 30 seconds as a backup
    const syncInterval = setInterval(() => {
      syncFromDatabase();
    }, 30000);

    // Cleanup subscriptions on unmount
    return () => {
      ingredientsChannel.unsubscribe();
      menuChannel.unsubscribe();
      ordersChannel.unsubscribe();
      clearInterval(syncInterval);
    };
  }, [currentUser, supabase]);


  const handleProcessOrder = async (newOrder: Order) => {
    try {
      // 1. Calculate stock deductions
      const stockUpdates: Map<string, number> = new Map();

      newOrder.items.forEach(orderItem => {
        const menuItem = menu.find(m => m.id === orderItem.id);
        if (menuItem) {
          // Handle ready-made drinks (direct stock deduction)
          if (menuItem.isReadyMade && menuItem.readyMadeStockId) {
            const currentDeduction = stockUpdates.get(menuItem.readyMadeStockId) || 0;
            stockUpdates.set(menuItem.readyMadeStockId, currentDeduction + orderItem.quantity);
          } else {
            // Handle made-to-order items (ingredient-based deduction)
            menuItem.ingredients.forEach(ingRef => {
              const currentDeduction = stockUpdates.get(ingRef.ingredientId) || 0;
              stockUpdates.set(ingRef.ingredientId, currentDeduction + (ingRef.quantity * orderItem.quantity));
            });
          }
        }
      });

      // 2. Save order to database
      if (supabase) {
        const dbOrder = {
          subtotal: newOrder.subtotal,
          tax: newOrder.tax,
          discount: newOrder.discount,
          total: newOrder.total,
          payment_method: newOrder.paymentMethod,
          status: newOrder.status,
          cashier_name: newOrder.cashierName
        };

        const orderItems = newOrder.items.map(item => ({
          menu_item_id: item.id,
          quantity: item.quantity,
          price_each: item.price
        }));

        const savedOrder = await createOrder(dbOrder, orderItems);
        console.log('✅ Order saved to database:', savedOrder.id);

        // 3. Update inventory stock in database
        const stockUpdatePromises = Array.from(stockUpdates.entries()).map(async ([ingredientId, deduction]) => {
          const ingredient = inventory.find(i => i.id === ingredientId);
          if (!ingredient) {
            console.warn(`⚠️ Ingredient ${ingredientId} not found in local inventory`);
            return;
          }

          const newStock = Math.max(0, ingredient.stock - deduction);

          const { error } = await supabase
            .from('ingredients')
            .update({ stock: newStock })
            .eq('id', ingredientId);

          if (error) {
            console.error(`❌ Failed to update stock for ${ingredient.name}:`, error);
            throw error; // Re-throw to catch in Promise.all
          } else {
            console.log(`✅ Updated ${ingredient.name} stock: ${ingredient.stock} → ${newStock} (deducted: ${deduction})`);
          }
        });

        await Promise.all(stockUpdatePromises);
        console.log(`✅ All inventory stock updated in database (${stockUpdatePromises.length} items)`)

        // 4. Trigger sync to refresh all data from database
        await syncFromDatabase();
      } else {
        // Fallback: Update local state only if no database connection
        const updatedInventory = inventory.map(item => {
          const deduction = stockUpdates.get(item.id);
          if (deduction) {
            return {
              ...item,
              stock: Math.max(0, item.stock - deduction)
            };
          }
          return item;
        });
        setInventory(updatedInventory);
      }

      setOrders(prev => [newOrder, ...prev]);
    } catch (error) {
      console.error('❌ Failed to save order to database:', error);
      // Still process the order locally even if database save fails
      setOrders(prev => [newOrder, ...prev]);
    }
  };

  const handleUpdateStock = (id: string, amount: number) => {
    setInventory(prev => prev.map(item => item.id === id ? { ...item, stock: item.stock + amount } : item));
  };

  const handleAddIngredient = (newIngredient: Omit<Ingredient, 'id'>) => {
    const ingredient: Ingredient = {
      ...newIngredient,
      id: Math.random().toString(36).substr(2, 9)
    };
    setInventory(prev => [...prev, ingredient]);
  };

  const handleDeleteIngredient = (id: string) => {
    setInventory(prev => prev.filter(item => item.id !== id));
  };

  const handleUpdateIngredient = (id: string, updates: Partial<Ingredient>) => {
    setInventory(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  // Fetch and sync all data from database
  const syncFromDatabase = useCallback(async () => {
    if (!supabase) return;

    try {
      // Fetch ingredients
      const { data: ingredientsData, error: ingredientsError } = await supabase
        .from('ingredients')
        .select('*')
        .order('name');

      if (ingredientsError) throw ingredientsError;

      if (ingredientsData) {
        const formattedInventory: Ingredient[] = ingredientsData.map(item => ({
          id: item.id,
          name: item.name,
          unit: item.unit,
          stock: item.stock,
          minStockLevel: item.min_stock_level,
          costPerUnit: item.cost_per_unit
        }));

        // Only update if data has changed
        setInventory(prevInventory => {
          const currentInventoryStr = JSON.stringify(prevInventory);
          const newInventoryStr = JSON.stringify(formattedInventory);
          if (currentInventoryStr !== newInventoryStr) {
            localStorage.setItem(DB_KEYS.INVENTORY, newInventoryStr);
            return formattedInventory;
          }
          return prevInventory;
        });
      }

      // Fetch menu items
      const { data: menuData, error: menuError } = await supabase
        .from('menu_items')
        .select('*')
        .order('name');

      if (menuError) throw menuError;

      if (menuData) {
        const formattedMenu: MenuItem[] = menuData.map(item => ({
          id: item.id,
          name: item.name,
          category: item.category,
          price: item.price,
          cost: item.cost || (item.price * 0.3), // Default to 30% of price if not set
          description: item.description || '',
          ingredients: item.ingredients || [],
          isReadyMade: item.is_ready_made || false,
          readyMadeStockId: item.ready_made_stock_id || undefined,
          image: item.image
        }));

        // Only update if data has changed
        setMenu(prevMenu => {
          const currentMenuStr = JSON.stringify(prevMenu);
          const newMenuStr = JSON.stringify(formattedMenu);
          if (currentMenuStr !== newMenuStr) {
            localStorage.setItem(DB_KEYS.MENU, newMenuStr);
            return formattedMenu;
          }
          return prevMenu;
        });
      }

      // Fetch orders with items
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            menu_item_id,
            quantity,
            price_each
          )
        `)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      if (ordersData) {
        const formattedOrders: Order[] = ordersData.map(order => ({
          id: order.id,
          items: order.order_items.map((item: any) => {
            const menuItem = menuData?.find(m => m.id === item.menu_item_id);
            return {
              id: item.menu_item_id,
              name: menuItem?.name || 'Unknown Item',
              price: item.price_each,
              quantity: item.quantity,
              category: menuItem?.category || 'other',
              cost: menuItem?.cost || 0,
              image: menuItem?.image || '',
              ingredients: menuItem?.ingredients || []
            };
          }),
          subtotal: order.subtotal,
          tax: order.tax,
          discount: order.discount,
          total: order.total,
          paymentMethod: order.payment_method,
          status: order.status,
          createdAt: order.created_at,
          cashierName: order.cashier_name
        }));

        // Only update if data has changed
        setOrders(prevOrders => {
          const currentOrdersStr = JSON.stringify(prevOrders);
          const newOrdersStr = JSON.stringify(formattedOrders);
          if (currentOrdersStr !== newOrdersStr) {
            localStorage.setItem(DB_KEYS.ORDERS, newOrdersStr);
            return formattedOrders;
          }
          return prevOrders;
        });
      }
    } catch (err) {
      console.error('Error syncing from database:', err);
    }
  }, []);

  const handleRefreshInventory = async () => {
    await syncFromDatabase();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex items-center justify-center relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-secondary rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
        </div>

        {/* Loading Content */}
        <div className="relative z-10 text-center">
          {/* Logo */}
          <div className="w-32 h-32 bg-white rounded-3xl mx-auto flex items-center justify-center mb-8 shadow-2xl animate-bounce-slow">
            <i className="bi bi-shop text-6xl text-primary"></i>
          </div>

          {/* Spinner */}
          <div className="relative w-24 h-24 mx-auto mb-8">
            <div className="absolute inset-0 border-4 border-white/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-white rounded-full animate-spin"></div>
          </div>

          {/* Text */}
          <h2 className="text-3xl font-bold text-white mb-2 animate-pulse">Loading POS System</h2>
          <p className="text-white/60 text-sm">Please wait while we prepare everything...</p>

          {/* Progress Dots */}
          <div className="flex justify-center gap-2 mt-6">
            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>

        {/* Add CSS animations */}
        <style>{`
          @keyframes blob {
            0%, 100% { transform: translate(0, 0) scale(1); }
            33% { transform: translate(30px, -50px) scale(1.1); }
            66% { transform: translate(-20px, 20px) scale(0.9); }
          }
          .animate-blob {
            animation: blob 7s infinite;
          }
          .animation-delay-2000 {
            animation-delay: 2s;
          }
          .animation-delay-4000 {
            animation-delay: 4s;
          }
          .animate-bounce-slow {
            animation: bounce 2s infinite;
          }
        `}</style>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full relative z-10 text-center">
          <div className="w-24 h-24 bg-secondary rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-xl shadow-secondary/20">
            <i className="bi bi-shop text-4xl text-white"></i>
          </div>
          <h1 className="text-3xl font-black text-slate-800 mb-2">Welcome Back</h1>
          <p className="text-slate-500 mb-6">Family Restaurant POS System</p>

          <div className="space-y-3 mb-4">
            {/* Password Input - NO PLACEHOLDER */}
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={passcode}
              onChange={e => setPasscode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleLogin();
                }
              }}
              className="w-full py-3 px-4 bg-slate-50 text-slate-800 border border-slate-200 rounded-xl font-semibold text-center tracking-widest text-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
            />

            {/* Sign In Button */}
            <button
              onClick={handleLogin}
              className="w-full py-4 bg-gradient-to-r from-primary to-indigo-600 text-white rounded-xl font-bold text-lg hover:from-primary/90 hover:to-indigo-600/90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
            >
              <span>Sign In</span>
              <i className="bi bi-arrow-right"></i>
            </button>

            {authError && <p className="text-red-600 text-sm font-medium">{authError}</p>}
          </div>

          <p className="mt-6 text-xs text-slate-400">
            System ready • v1.0.0
          </p>
        </div>
      </div>
    );
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} currentUser={currentUser} onLogout={handleLogout}>
      {activeTab === 'pos' && (
        <>
          <SupabaseSync onLoad={(remoteMenu, remoteInventory, remoteOrders) => {
            if (menu.length === INITIAL_MENU.length) setMenu(remoteMenu);
            if (inventory.length === INITIAL_INGREDIENTS.length) setInventory(remoteInventory);
            if (orders.length === INITIAL_ORDERS.length) setOrders(remoteOrders);
          }} />
          <POS
            menu={menu}
            inventory={inventory}
            onProcessOrder={handleProcessOrder}
            currentUser={currentUser!}
          />
        </>
      )}
      {activeTab === 'dashboard' && <Dashboard orders={orders} menu={menu} inventory={inventory} />}
      {activeTab === 'menu' && <MenuManager menu={[...menu].sort((a, b) => a.name.localeCompare(b.name))} setMenu={setMenu} inventory={inventory} />}
      {activeTab === 'inventory' && (
        <Inventory
          ingredients={inventory}
          onUpdateStock={handleUpdateStock}
          onAddIngredient={handleAddIngredient}
          onDeleteIngredient={handleDeleteIngredient}
          onUpdateIngredient={handleUpdateIngredient}
          onRefresh={handleRefreshInventory}
        />
      )}
      {/* Align with Layout menu item id 'history' */}
      {activeTab === 'history' && <OrderHistory orders={orders} menu={menu} />}
    </Layout>
  );
};

export default App;
