import React, { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Order, MenuItem, Ingredient } from '../types';
import { fetchOrdersWithItems } from '../services/supabaseClient';

interface DashboardProps {
  orders: Order[]; // Keep as fallback
  menu: MenuItem[];
  inventory: Ingredient[];
}

const Dashboard: React.FC<DashboardProps> = ({ orders, menu, inventory }) => {
  const [filterType, setFilterType] = useState<'today' | 'week' | 'month' | 'all' | 'custom'>('today');
  const [dbOrders, setDbOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch orders from database on component mount
  useEffect(() => {
    const loadOrdersFromDatabase = async () => {
      setLoading(true);
      try {
        const remoteOrders = await fetchOrdersWithItems(1000); // Fetch last 1000 orders for dashboard
        const formattedOrders: Order[] = remoteOrders.map((o: any) => ({
          id: o.id,
          items: (o.items || []).map((item: any) => {
            // Find the menu item to get category
            const menuItem = menu.find(m => m.id === item.menu_item_id);
            return {
              id: item.menu_item_id,
              name: menuItem?.name || '',
              category: menuItem?.category || 'Unknown',
              price: item.price_each,
              cost: 0,
              image: '',
              quantity: item.quantity,
              ingredients: menuItem?.ingredients || [],
              isReadyMade: menuItem?.isReadyMade || false,
              readyMadeStockId: menuItem?.readyMadeStockId || undefined
            };
          }),
          subtotal: o.subtotal,
          tax: o.tax,
          discount: o.discount,
          total: o.total,
          paymentMethod: o.payment_method,
          status: o.status,
          createdAt: o.created_at,
          cashierName: o.cashier_name
        }));
        setDbOrders(formattedOrders);
      } catch (error) {
        console.error('Failed to load orders from database:', error);
        setError('Failed to load orders. Please try again later.');
        // Fall back to local orders if database fails
        setDbOrders(orders);
      } finally {
        setLoading(false);
      }
    };

    loadOrdersFromDatabase();
  }, [orders, menu]);

  // Helper to get date ranges
  const getDateRange = (type: typeof filterType) => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    switch (type) {
      case 'today':
        return { start: todayStr, end: todayStr };
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
        return { start: weekStart.toISOString().split('T')[0], end: todayStr };
      case 'month':
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        return { start: monthStart.toISOString().split('T')[0], end: todayStr };
      case 'all':
        return { start: '2020-01-01', end: todayStr };
      default:
        return { start: todayStr, end: todayStr };
    }
  };

  // Default to today (daily filter)
  const [dateRange, setDateRange] = useState(getDateRange('today'));

  const handleFilterChange = (type: typeof filterType) => {
    setFilterType(type);
    if (type !== 'custom') {
      setDateRange(getDateRange(type));
    }
  };

  const filteredOrders = useMemo(() => {
    return dbOrders.filter(o => {
      const orderDate = new Date(o.createdAt).toISOString().split('T')[0];
      return orderDate >= dateRange.start && orderDate <= dateRange.end;
    });
  }, [dbOrders, dateRange]);

  // Accurate unit cost calculator (with ready-made support)
  const ingredientMap = useMemo(() => new Map(inventory.map(i => [i.id, i])), [inventory]);
  const computeUnitCost = (menuItem?: MenuItem): number => {
    if (!menuItem) return 0;
    if (menuItem.isReadyMade && menuItem.readyMadeStockId) {
      const ing = ingredientMap.get(menuItem.readyMadeStockId);
      return ing ? ing.costPerUnit : (menuItem.cost || 0);
    }
    // For non-ready-made items, fall back to menuItem.cost or ingredient aggregate if ingredient refs exist
    if ((menuItem.ingredients || []).length > 0) {
      return (menuItem.ingredients || []).reduce((sum, ref) => {
        const ing = ingredientMap.get(ref.ingredientId);
        return sum + (ing ? ing.costPerUnit * ref.quantity : 0);
      }, 0);
    }
    return menuItem.cost || 0;
  };

  // Aggregate sales by date based on filtered orders
  const salesData = useMemo(() => {
    const data = filteredOrders.reduce((acc: any[], order) => {
      let key: string;
      const orderDate = new Date(order.createdAt);

      // Group by hour if today, by date otherwise
      if (filterType === 'today') {
        const hour = orderDate.getHours();
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        key = `${displayHour}:00 ${ampm}`;
      } else {
        key = orderDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }

      const existing = acc.find(a => a.name === key);
      // Use more accurate profit: only ready-made items use precise cost; others fallback 40% cost
      const orderRevenue = order.total;
      const readyMadeCost = order.items.reduce((cost, it) => {
        const mi = menu.find(m => m.id === it.id);
        if (!mi) return cost;
        if (mi.isReadyMade) {
          const unitCost = computeUnitCost(mi);
          return cost + unitCost * it.quantity;
        }
        return cost;
      }, 0);
      const fallbackCost = (order.subtotal - order.items.filter(it => menu.find(m => m.id === it.id)?.isReadyMade).reduce((s, it) => s + it.price * it.quantity, 0)) * 0.4; // assume 40% for non-ready-made part
      const profit = orderRevenue - (readyMadeCost + Math.max(0, fallbackCost));

      if (existing) {
        existing.sales += orderRevenue;
        existing.profit += profit;
      } else {
        acc.push({
          name: key,
          sales: orderRevenue,
          profit: profit,
          sortKey: filterType === 'today' ? orderDate.getHours() : orderDate.getTime()
        });
      }
      return acc;
    }, []);

    // Sort by time
    return data.sort((a, b) => a.sortKey - b.sortKey);
  }, [filteredOrders, filterType, menu]);

  // Compute total revenue & cost & profit using filteredOrders
  const aggregatedCosts = useMemo(() => {
    let cost = 0;
    filteredOrders.forEach(order => {
      order.items.forEach(it => {
        const mi = menu.find(m => m.id === it.id);
        const unitCost = computeUnitCost(mi);
        cost += unitCost * it.quantity;
      });
    });
    return cost;
  }, [filteredOrders, menu, ingredientMap]);
  const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.total, 0);
  const totalOrders = filteredOrders.length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const netProfit = totalRevenue - aggregatedCosts;

  // Color mapping for categories - Different colors for each category
  const getCategoryColor = (index: number) => {
    const colors = [
      '#FF8042', '#0088FE', '#00C49F', '#FFBB28', '#FF6B6B', '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0', '#ffb347', '#87ceeb', '#dda0dd', '#98fb98'
    ];
    return colors[index % colors.length];
  };

  const formatCurrency = (val: number) => `${val.toLocaleString()} Ks`;

  // Aggregate Category Data
  const categoryData = useMemo(() => {
    const categories: Record<string, number> = {};
    filteredOrders.forEach(order => {
      order.items.forEach(item => {
        categories[item.category] = (categories[item.category] || 0) + (item.price * item.quantity);
      });
    });
    return Object.keys(categories).map(key => ({ name: key, value: categories[key] }));
  }, [filteredOrders]);

  // Top 20 products by total revenue with margin
  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string; totalQty: number; revenue: number; cost: number; isReady: boolean }>();
    filteredOrders.forEach(o => {
      o.items.forEach(it => {
        const mi = menu.find(m => m.id === it.id);
        const name = mi?.name || it.name || 'Unknown';
        const unitCost = computeUnitCost(mi);
        const prev = map.get(it.id) || { name, totalQty: 0, revenue: 0, cost: 0, isReady: !!mi?.isReadyMade };
        prev.totalQty += it.quantity;
        prev.revenue += it.quantity * it.price;
        // Only accumulate accurate cost for ready-made items. For others use menuItem.cost or unitCost already computed.
        prev.cost += unitCost * it.quantity;
        prev.isReady = !!mi?.isReadyMade;
        map.set(it.id, prev);
      });
    });
    return Array.from(map.entries())
      .map(([id, v]) => ({ id, ...v, profit: v.revenue - v.cost, margin: v.revenue > 0 ? ((v.revenue - v.cost) / v.revenue) * 100 : 0 }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 20);
  }, [filteredOrders, menu, ingredientMap]);

  return (
    <div className="p-4 md:p-8 h-full overflow-y-auto pb-20 md:pb-8 text-gray-900">
      {/* Error Banner */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3" role="alert">
          <i className="bi bi-exclamation-triangle text-red-500 text-xl flex-shrink-0 mt-0.5"></i>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-red-800 mb-1">Connection Error</h3>
            <p className="text-sm text-red-700 mb-3">{error}</p>
            <button
              onClick={() => {
                setError(null);
                const loadOrdersFromDatabase = async () => {
                  setLoading(true);
                  try {
                    const remoteOrders = await fetchOrdersWithItems(1000);
                    const formattedOrders: Order[] = remoteOrders.map((o: any) => ({
                      id: o.id,
                      items: (o.items || []).map((item: any) => {
                        const menuItem = menu.find(m => m.id === item.menu_item_id);
                        return {
                          id: item.menu_item_id,
                          name: menuItem?.name || '',
                          category: menuItem?.category || 'Unknown',
                          price: item.price_each,
                          cost: 0,
                          image: '',
                          quantity: item.quantity,
                          ingredients: menuItem?.ingredients || [],
                          isReadyMade: menuItem?.isReadyMade || false,
                          readyMadeStockId: menuItem?.readyMadeStockId || undefined
                        };
                      }),
                      subtotal: o.subtotal,
                      tax: o.tax,
                      discount: o.discount,
                      total: o.total,
                      paymentMethod: o.payment_method,
                      status: o.status,
                      createdAt: o.created_at,
                      cashierName: o.cashier_name
                    }));
                    setDbOrders(formattedOrders);
                    setError(null);
                  } catch (err) {
                    setError('Failed to reconnect. Please check your internet connection.');
                  } finally {
                    setLoading(false);
                  }
                };
                loadOrdersFromDatabase();
              }}
              className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
              aria-label="Retry loading dashboard data"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
             <h1 className="text-2xl font-bold text-gray-800">Business Overview</h1>
             <p className="text-sm text-gray-500">Performance metrics and insights</p>
          </div>
        </div>
        
        {/* Filter Buttons */}
        <div className="flex flex-wrap items-center gap-3" role="group" aria-label="Date range filters">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handleFilterChange('today')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all min-h-[44px] ${
                filterType === 'today'
                  ? 'bg-primary text-white shadow-lg shadow-primary/30'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-primary hover:text-primary'
              }`}
              aria-pressed={filterType === 'today'}
              aria-label="Filter by today"
            >
              <i className="bi bi-calendar-day mr-1.5"></i>
              Today
            </button>
            <button
              onClick={() => handleFilterChange('week')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all min-h-[44px] ${
                filterType === 'week'
                  ? 'bg-primary text-white shadow-lg shadow-primary/30'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-primary hover:text-primary'
              }`}
              aria-pressed={filterType === 'week'}
              aria-label="Filter by this week"
            >
              <i className="bi bi-calendar-week mr-1.5"></i>
              This Week
            </button>
            <button
              onClick={() => handleFilterChange('month')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all min-h-[44px] ${
                filterType === 'month'
                  ? 'bg-primary text-white shadow-lg shadow-primary/30'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-primary hover:text-primary'
              }`}
              aria-pressed={filterType === 'month'}
              aria-label="Filter by this month"
            >
              <i className="bi bi-calendar-month mr-1.5"></i>
              This Month
            </button>
            <button
              onClick={() => handleFilterChange('all')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all min-h-[44px] ${
                filterType === 'all'
                  ? 'bg-primary text-white shadow-lg shadow-primary/30'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-primary hover:text-primary'
              }`}
              aria-pressed={filterType === 'all'}
              aria-label="Filter by all time"
            >
              <i className="bi bi-infinity mr-1.5"></i>
              All Time
            </button>
          </div>

          {/* Custom Date Range */}
          <div className="bg-white border border-gray-200 p-2 rounded-xl shadow-sm flex flex-col sm:flex-row items-center gap-2">
             <div className="flex items-center gap-2 px-2">
               <i className="bi bi-calendar3 text-gray-400"></i>
               <span className="text-sm font-semibold text-gray-600">Custom:</span>
             </div>
             <div className="flex items-center gap-2">
               <input
                 type="date"
                 value={dateRange.start}
                 onChange={(e) => {
                   setDateRange(prev => ({...prev, start: e.target.value}));
                   setFilterType('custom');
                 }}
                 className="border border-gray-200 rounded-lg px-2 py-1 text-sm focus:ring-2 focus:ring-secondary/50 focus:border-secondary outline-none min-h-[44px] bg-white text-gray-600"
                 aria-label="Start date for custom range"
               />
               <span className="text-gray-400 font-medium">-</span>
               <input
                 type="date"
                 value={dateRange.end}
                 onChange={(e) => {
                   setDateRange(prev => ({...prev, end: e.target.value}));
                   setFilterType('custom');
                 }}
                 className="border border-gray-200 rounded-lg px-2 py-1 text-sm focus:ring-2 focus:ring-secondary/50 focus:border-secondary outline-none min-h-[44px] bg-white text-gray-600"
                 aria-label="End date for custom range"
               />
             </div>
          </div>
        </div>

        {/* Period Display */}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <i className="bi bi-info-circle"></i>
          <span>
            Showing data from <strong>{new Date(dateRange.start).toLocaleDateString()}</strong> to <strong>{new Date(dateRange.end).toLocaleDateString()}</strong>
            {filterType === 'today' && ' (hourly breakdown)'}
          </span>
        </div>
      </div>
      
      {/* Loading State */}
      {loading ? (
        <div className="space-y-6">
          {/* KPI Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white border border-gray-100 p-6 rounded-xl shadow-sm animate-pulse">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded"></div>
                  </div>
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <div className="w-6 h-6 bg-gray-300 rounded"></div>
                  </div>
                </div>
                <div className="h-3 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>

          {/* Charts Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-white border border-gray-100 p-4 md:p-6 rounded-xl shadow-sm h-72 sm:h-80 md:h-96 animate-pulse">
                <div className="h-6 bg-gray-200 rounded mb-4"></div>
                <div className="h-full bg-gray-100 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
            <div className="bg-white border border-gray-100 p-6 rounded-xl shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                  <h3 className="text-2xl font-bold mt-1 text-gray-900">{formatCurrency(totalRevenue)}</h3>
                </div>
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <i className="bi bi-currency-dollar text-xl"></i>
                </div>
              </div>
              <p className="text-xs font-medium flex items-center text-gray-400">
                For selected period
              </p>
            </div>

            <div className="bg-white border border-gray-100 p-6 rounded-xl shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Orders</p>
                  <h3 className="text-2xl font-bold mt-1 text-gray-900">{totalOrders}</h3>
                </div>
                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                  <i className="bi bi-bag-check text-xl"></i>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-100 p-6 rounded-xl shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Avg Order Value</p>
                  <h3 className="text-2xl font-bold mt-1 text-gray-900">{formatCurrency(avgOrderValue)}</h3>
                </div>
                <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                  <i className="bi bi-graph-up text-xl"></i>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-100 p-6 rounded-xl shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Net Profit</p>
                  <h3 className="text-2xl font-bold mt-1 text-gray-900">{formatCurrency(Math.max(0, netProfit))}</h3>
                </div>
                <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                  <i className="bi bi-wallet2 text-xl"></i>
                </div>
              </div>
              <p className="text-xs font-medium flex items-center text-gray-400">Costs include ready-made actual stock costs</p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-8">
            <div className="bg-white border border-gray-100 p-4 md:p-6 rounded-xl shadow-sm h-72 sm:h-80 md:h-96">
              <h3 className="text-base md:text-lg font-bold mb-2 md:mb-4 text-gray-800">Revenue Trends</h3>
              {salesData.length > 0 ? (
                <ResponsiveContainer width="100%" height="85%">
                  <BarChart data={salesData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(val) => `${(val/1000).toFixed(0)}k`}
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                    />
                    <Tooltip
                      cursor={{ fill: '#f3f4f6' }}
                      contentStyle={{
                        borderRadius: '8px',
                        border: 'none',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                        fontSize: '12px',
                        backgroundColor: '#ffffff',
                        color: '#111827'
                      }}
                      formatter={(value: number) => [`${value.toLocaleString()} Ks`, 'Amount']}
                    />
                    <Bar dataKey="sales" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Sales" />
                    <Bar dataKey="profit" fill="#10b981" radius={[4, 4, 0, 0]} name="Profit" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-300">
                   <i className="bi bi-bar-chart text-3xl md:text-4xl mb-2"></i>
                   <p className="text-sm">No data for selected period</p>
                </div>
              )}
            </div>

            <div className="bg-white border border-gray-100 p-4 md:p-6 rounded-xl shadow-sm h-72 sm:h-80 md:h-96">
              <h3 className="text-base md:text-lg font-bold mb-2 md:mb-4 text-gray-800">Sales by Category</h3>
              {categoryData.length > 0 ? (
                <div className="flex flex-col h-full">
                  <ResponsiveContainer width="100%" height="65%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        fill="#8884d8"
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getCategoryColor(index)} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => [`${value.toLocaleString()} Ks`, 'Sales']}
                        contentStyle={{
                          borderRadius: '8px',
                          border: 'none',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                          fontSize: '12px',
                          backgroundColor: '#ffffff',
                          color: '#111827'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Legend */}
                  <div className="flex-1 overflow-y-auto mt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {categoryData.map((entry, index) => (
                        <div key={`legend-${index}`} className="flex items-center gap-2 text-xs">
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: getCategoryColor(index) }}
                          ></div>
                          <span className="font-medium truncate text-gray-700">
                            {entry.name}
                          </span>
                          <span className="ml-auto text-gray-500">
                            {((entry.value / totalRevenue) * 100).toFixed(1)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                 <div className="h-full flex flex-col items-center justify-center text-gray-300">
                   <i className="bi bi-pie-chart text-3xl md:text-4xl mb-2"></i>
                   <p className="text-sm">No data for selected period</p>
                 </div>
              )}
            </div>
          </div>

          {/* Top 20 Products by Revenue */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-2">
              <i className="bi bi-trophy text-yellow-500"></i>
              <h3 className="font-bold text-gray-800">Top 20 Products by Total Revenue</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[700px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-gray-600 text-sm">Rank</th>
                    <th className="px-4 py-3 font-semibold text-gray-600 text-sm">Product Name</th>
                    <th className="px-4 py-3 font-semibold text-gray-600 text-sm text-right">Total Units Sold</th>
                    <th className="px-4 py-3 font-semibold text-gray-600 text-sm text-right">Total Revenue</th>
                    <th className="px-4 py-3 font-semibold text-gray-600 text-sm text-right">Cost (Ready)</th>
                    <th className="px-4 py-3 font-semibold text-gray-600 text-sm text-right">Profit</th>
                    <th className="px-4 py-3 font-semibold text-gray-600 text-sm text-right">Margin %</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((p, idx) => (
                    <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-bold text-gray-700">{idx + 1}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-800">{p.name}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-700">{p.totalQty}</td>
                      <td className="px-4 py-3 text-sm text-right font-bold text-gray-900">{formatCurrency(p.revenue)}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-600">{p.isReady ? formatCurrency(p.cost) : '-'}</td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-green-600">{p.isReady ? formatCurrency(p.profit) : '-'}</td>
                      <td className="px-4 py-3 text-sm text-right text-blue-600">{p.isReady ? p.margin.toFixed(1) + '%' : '-'}</td>
                    </tr>
                  ))}
                  {topProducts.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-gray-400">No sales data available.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
