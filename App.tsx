import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import POS from './components/POS';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import MenuManager from './components/MenuManager';
import OrderHistory from './components/OrderHistory';
import { User, UserRole, Order, MenuItem, Ingredient } from './types';
import { INITIAL_MENU, INITIAL_INGREDIENTS, INITIAL_ORDERS } from './constants';

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
  ORDERS: 'pos_db_orders'
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('pos');
  
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
  useEffect(() => {
    localStorage.setItem(DB_KEYS.MENU, JSON.stringify(menu));
  }, [menu]);

  useEffect(() => {
    localStorage.setItem(DB_KEYS.INVENTORY, JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem(DB_KEYS.ORDERS, JSON.stringify(orders));
  }, [orders]);

  // Simplified "One Click" Login for Family usage
  const handleLogin = () => {
    setCurrentUser(FAMILY_USER);
    setActiveTab('pos');
  };

  const handleProcessOrder = (newOrder: Order) => {
    // 1. Deduct Stock immutably
    const updatedInventory = [...inventory];
    
    newOrder.items.forEach(orderItem => {
      const menuItem = menu.find(m => m.id === orderItem.id);
      if (menuItem) {
        menuItem.ingredients.forEach(ingRef => {
          const invIndex = updatedInventory.findIndex(i => i.id === ingRef.ingredientId);
          if (invIndex !== -1) {
            // Clone the specific inventory item before modifying to ensure React detects the change
            updatedInventory[invIndex] = {
              ...updatedInventory[invIndex],
              stock: Math.max(0, updatedInventory[invIndex].stock - (ingRef.quantity * orderItem.quantity))
            };
          }
        });
      }
    });

    setInventory(updatedInventory);
    setOrders(prev => [newOrder, ...prev]);
  };

  const handleUpdateStock = (id: string, amount: number) => {
    setInventory(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, stock: item.stock + amount };
      }
      return item;
    }));
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
        
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full relative z-10 text-center">
          <div className="w-24 h-24 bg-secondary rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-xl shadow-secondary/20">
            <i className="bi bi-shop text-4xl text-white"></i>
          </div>
          <h1 className="text-3xl font-black text-slate-800 mb-2">Welcome Back</h1>
          <p className="text-slate-500 mb-8">Family Restaurant POS System</p>
          
          <button 
            onClick={handleLogin}
            className="w-full py-4 bg-primary text-white rounded-xl font-bold text-lg shadow-lg shadow-primary/30 hover:bg-indigo-600 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            <span>Open Register</span>
            <i className="bi bi-arrow-right"></i>
          </button>
          
          <p className="mt-6 text-xs text-slate-400">
            System ready • v1.0.0
          </p>
        </div>
      </div>
    );
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} currentUser={currentUser} onLogout={() => setCurrentUser(null)}>
      {activeTab === 'pos' && (
        <POS 
          menu={menu} 
          onProcessOrder={handleProcessOrder} 
          currentUser={currentUser}
        />
      )}
      {activeTab === 'history' && (
        <OrderHistory orders={orders} />
      )}
      {activeTab === 'dashboard' && (
        <Dashboard orders={orders} />
      )}
      {activeTab === 'menu' && (
        <MenuManager menu={menu} setMenu={setMenu} />
      )}
      {activeTab === 'inventory' && (
        <Inventory ingredients={inventory} onUpdateStock={handleUpdateStock} />
      )}
    </Layout>
  );
};

export default App;