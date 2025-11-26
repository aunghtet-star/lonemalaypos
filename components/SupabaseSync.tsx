import React, { useEffect, useState } from 'react';
import { supabase, fetchMenuWithIngredients, fetchInventory, fetchOrders } from '../services/supabaseClient';
import { MenuItem, Ingredient, Order } from '../types';
import { INITIAL_MENU, INITIAL_INGREDIENTS, INITIAL_ORDERS } from '../constants';

interface SupabaseSyncProps {
  onLoad: (menu: MenuItem[], inventory: Ingredient[], orders: Order[]) => void;
}

// LocalStorage keys (mirrors App.tsx usage)
const LOCAL_KEYS = {
  MENU: 'pos_db_menu',
  INVENTORY: 'pos_db_inventory',
  SYNC_LOADED: 'pos_sync_loaded', // Flag to prevent re-syncing
  BACKGROUND_SYNC: 'pos_background_sync',
  SYNC_INTERVAL: 'pos_sync_interval'
};

function loadLocal<T>(key: string): T | null {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch (e) {
    console.warn('Failed parsing localStorage for', key, e);
    return null;
  }
}

// Helper function to start background sync
function startBackgroundSyncIfEnabled() {
  const backgroundSyncEnabled = localStorage.getItem(LOCAL_KEYS.BACKGROUND_SYNC) === 'enabled';

  if (!backgroundSyncEnabled) {
    console.log('ℹ️ Background sync disabled');
    return;
  }

  const intervalMs = parseInt(localStorage.getItem(LOCAL_KEYS.SYNC_INTERVAL) || '30000');
  console.log(`🔄 Starting background sync (every ${intervalMs / 1000}s)`);

  const syncInterval = setInterval(async () => {
    try {
      console.log('🔄 Background sync running...');

      if (!supabase) return;

      const [menuRes, inventoryRes, ordersRes] = await Promise.all([
        fetchMenuWithIngredients(),
        fetchInventory(),
        fetchOrders()
      ]);

      const remoteMenu: MenuItem[] = (menuRes.menu || []).map((m: any) => ({
        id: m.id,
        name: m.name,
        category: m.category,
        price: m.price,
        cost: m.cost,
        image: m.image,
        description: m.description,
        isReadyMade: m.is_ready_made ?? false,
        readyMadeStockId: m.ready_made_stock_id ?? undefined,
        ingredients: []
      }));

      const remoteInventory: Ingredient[] = (inventoryRes || []).map((i: any) => ({
        id: i.id,
        name: i.name,
        unit: i.unit,
        stock: i.stock,
        minStockLevel: i.min_stock_level,
        costPerUnit: i.cost_per_unit
      }));

      const remoteOrders: Order[] = (ordersRes || []).map((o: any) => ({
        id: o.id,
        items: [], // We'll need to fetch order items separately
        subtotal: o.subtotal,
        tax: o.tax,
        discount: o.discount,
        total: o.total,
        paymentMethod: o.payment_method,
        status: o.status,
        createdAt: o.created_at,
        cashierName: o.cashier_name
      }));

      // Update cache silently
      localStorage.setItem(LOCAL_KEYS.MENU, JSON.stringify(remoteMenu));
      localStorage.setItem(LOCAL_KEYS.INVENTORY, JSON.stringify(remoteInventory));

      console.log('✅ Background sync complete');
    } catch (error) {
      console.warn('⚠️ Background sync failed:', error);
    }
  }, intervalMs);

  // Return cleanup function
  return () => clearInterval(syncInterval);
}

// This component attempts to load remote data at mount, then calls onLoad
const SupabaseSync: React.FC<SupabaseSyncProps> = ({ onLoad }) => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('Initializing...');
  const [error, setError] = useState('');
  const hasLoadedRef = React.useRef(false); // Track if we've already loaded

  useEffect(() => {
    let active = true;

    // Check if sync has already been loaded in this session/browser
    const syncAlreadyLoaded = localStorage.getItem(LOCAL_KEYS.SYNC_LOADED) === 'true';

    if (syncAlreadyLoaded) {
      // Skip sync - load from local cache immediately
      console.log('✅ Sync already loaded - using cached data (no loading screen)');

      const localMenu = loadLocal<MenuItem[]>(LOCAL_KEYS.MENU);
      const localInventory = loadLocal<Ingredient[]>(LOCAL_KEYS.INVENTORY);

      onLoad(
        localMenu && localMenu.length > 0 ? localMenu : INITIAL_MENU,
        localInventory && localInventory.length > 0 ? localInventory : INITIAL_INGREDIENTS,
        INITIAL_ORDERS // Always use initial orders
      );

      hasLoadedRef.current = true;
      setStatus('loaded');

      // Start background sync if enabled
      startBackgroundSyncIfEnabled();
      return;
    }

    // Prevent re-running if already loaded
    if (hasLoadedRef.current) {
      return;
    }

    (async () => {
      try {
        setStatus('loading');
        setProgress(10);
        setLoadingMessage('Connecting to database...');

        let timeoutId: NodeJS.Timeout;

        // Add timeout to prevent hanging forever (10 seconds max)
        timeoutId = setTimeout(() => {
          if (active && status === 'loading' && !hasLoadedRef.current) {
            console.warn('Sync timeout - using local data');
            setProgress(100);
            setLoadingMessage('Using local data...');

            const localMenu = loadLocal<MenuItem[]>(LOCAL_KEYS.MENU);
            const localInventory = loadLocal<Ingredient[]>(LOCAL_KEYS.INVENTORY);

            onLoad(
              localMenu && localMenu.length > 0 ? localMenu : INITIAL_MENU,
              localInventory && localInventory.length > 0 ? localInventory : INITIAL_INGREDIENTS,
              INITIAL_ORDERS // Always use initial orders
            );
            hasLoadedRef.current = true; // Mark as loaded
            setStatus('loaded');
          }
        }, 10000);

        // Baseline from local or initial (used for metadata and first-run seed)
        const baselineMenu = loadLocal<MenuItem[]>(LOCAL_KEYS.MENU) || INITIAL_MENU;
        const baselineInventory = loadLocal<Ingredient[]>(LOCAL_KEYS.INVENTORY) || INITIAL_INGREDIENTS;

        setProgress(30);
        setLoadingMessage('Fetching menu data...');

        if (!supabase) {
          console.warn('Supabase not initialized. Using local or defaults.');
          onLoad(baselineMenu, baselineInventory, INITIAL_ORDERS);
          hasLoadedRef.current = true;
          setStatus('loaded');
          return;
        }

        // Load remote data
        const [menuRes, inventoryRes, ordersRes] = await Promise.all([
          fetchMenuWithIngredients(),
          fetchInventory(),
          fetchOrders()
        ]);

        clearTimeout(timeoutId);

        setProgress(60);
        setLoadingMessage('Processing data...');

        const remoteMenu: MenuItem[] = (menuRes.menu || []).map((m: any) => ({
          id: m.id,
          name: m.name,
          category: m.category,
          price: m.price,
          cost: m.cost,
          image: m.image,
          description: m.description,
          isReadyMade: m.is_ready_made ?? false,
          readyMadeStockId: m.ready_made_stock_id ?? undefined,
          ingredients: []
        }));

        const remoteInventory: Ingredient[] = (inventoryRes || []).map((i: any) => ({
          id: i.id,
          name: i.name,
          unit: i.unit,
          stock: i.stock,
          minStockLevel: i.min_stock_level,
          costPerUnit: i.cost_per_unit
        }));

        const remoteOrders: Order[] = (ordersRes || []).map((o: any) => ({
          id: o.id,
          items: [], // We'll need to fetch order items separately
          subtotal: o.subtotal,
          tax: o.tax,
          discount: o.discount,
          total: o.total,
          paymentMethod: o.payment_method,
          status: o.status,
          createdAt: o.created_at,
          cashierName: o.cashier_name
        }));

        // Cache for next time
        localStorage.setItem(LOCAL_KEYS.MENU, JSON.stringify(remoteMenu));
        localStorage.setItem(LOCAL_KEYS.INVENTORY, JSON.stringify(remoteInventory));

        const finalMenu = remoteMenu.length > 0 ? remoteMenu : baselineMenu;
        const finalInventory = remoteInventory.length > 0 ? remoteInventory : baselineInventory;

        setProgress(90);
        setLoadingMessage('Syncing data...');

        if (active) {
          onLoad(finalMenu, finalInventory, remoteOrders);
          setProgress(100);
          setLoadingMessage('Complete!');

          // Mark sync as loaded
          localStorage.setItem(LOCAL_KEYS.SYNC_LOADED, 'true');
          console.log('✅ Initial sync complete - future loads will be instant');

          hasLoadedRef.current = true;
          setStatus('loaded');

          // Start background sync if enabled
          startBackgroundSyncIfEnabled();
        }
      } catch (e: any) {
        console.warn('Supabase sync failed, using local/default fallbacks:', e.message);
        setProgress(100);
        setLoadingMessage('Using offline data...');

        const localMenu = loadLocal<MenuItem[]>(LOCAL_KEYS.MENU);
        const localInventory = loadLocal<Ingredient[]>(LOCAL_KEYS.INVENTORY);

        if (active) {
          onLoad(
            localMenu && localMenu.length > 0 ? localMenu : INITIAL_MENU,
            localInventory && localInventory.length > 0 ? localInventory : INITIAL_INGREDIENTS,
            INITIAL_ORDERS // Always use initial orders
          );
          hasLoadedRef.current = true; // Mark as loaded
          setTimeout(() => {
            setStatus('loaded');
          }, 500);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [onLoad]);

  if (status === 'loading') {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-indigo-600 rounded-2xl mx-auto flex items-center justify-center mb-4 animate-pulse">
              <i className="bi bi-cloud-download text-3xl text-white"></i>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Syncing Remote Data</h3>
            <p className="text-sm text-gray-500">{loadingMessage}</p>
          </div>

          {/* Progress Bar */}
          <div className="relative">
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-indigo-600 rounded-full transition-all duration-500 ease-out relative overflow-hidden"
                style={{ width: `${progress}%` }}
              >
                {/* Shimmer Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
              </div>
            </div>
            <div className="flex justify-between mt-2 text-xs font-semibold">
              <span className="text-gray-500">Progress</span>
              <span className="text-primary">{progress}%</span>
            </div>
          </div>

          {/* Loading Dots */}
          <div className="flex justify-center gap-1 mt-6">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>

        {/* Shimmer Animation */}
        <style>{`
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          .animate-shimmer {
            animation: shimmer 2s infinite;
          }
        `}</style>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="fixed bottom-4 right-4 bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg max-w-sm z-50">
        <div className="flex items-start gap-3">
          <i className="bi bi-exclamation-triangle-fill text-red-500 text-lg"></i>
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-800 mb-1">Sync Failed</p>
            <p className="text-xs text-red-600">{error}</p>
            <p className="text-xs text-gray-500 mt-1">Using local data</p>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default SupabaseSync;

